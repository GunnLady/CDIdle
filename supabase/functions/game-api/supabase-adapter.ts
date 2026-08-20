import type { ErrorReportPayload } from "../../../shared/contracts/error-report.ts";

export type SupabaseAdapterOptions = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetcher?: typeof fetch;
  now?: () => number;
  initialState: Record<string, unknown>;
  initialStateForUser?: (userId: string) => Record<string, unknown>;
  migrateState?: (state: Record<string, unknown>, userId: string) => Record<string, unknown>;
  applyCommand: (state: Record<string, unknown>, command: Record<string, unknown>) => Promise<{ state: Record<string, unknown>; events?: unknown[] }>;
  applyIdle?: (state: Record<string, unknown>, lastProcessedAt: string, now?: Date) => { state: Record<string, unknown>; lastProcessedAt: string; report: Record<string, unknown> };
};

export class SupabaseAdapterError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 503,
    public readonly reason?: string,
  ) { super(message); }
}
type GameRow = {
  schema_version: number;
  revision: number;
  state: Record<string, unknown>;
  last_processed_at: string;
  server_time?: string;
  migration_pending?: boolean;
};
type GameCommit = Pick<GameRow, "schema_version" | "revision" | "last_processed_at">;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createSupabaseGameApiServices(options: SupabaseAdapterOptions) {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => globalThis.performance?.now() ?? Date.now());
  const base = options.supabaseUrl.replace(/\/$/, "");
  const headers = { apikey: options.serviceRoleKey, authorization: `Bearer ${options.serviceRoleKey}`, "content-type": "application/json" };
  async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetcher(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const databaseError = body as { code?: string; message?: string } | null;
      const revisionConflict = response.status === 409
        || databaseError?.code === "P0002"
        || databaseError?.message === "STALE_REVISION"
        || databaseError?.message === "STALE_TEMPORAL_STATE";
      const rateLimited = response.status === 429
        || databaseError?.code === "P0004"
        || databaseError?.message === "RATE_LIMITED";
      const duplicateCommand = databaseError?.code === "P0001"
        || databaseError?.message === "COMMAND_ID_REUSE";
      const databaseReason = [databaseError?.code, databaseError?.message]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(":");
      throw new SupabaseAdapterError(
        revisionConflict ? "REVISION_CONFLICT" : rateLimited ? "RATE_LIMITED" : duplicateCommand ? "DUPLICATE_COMMAND" : "SUPABASE_UNAVAILABLE",
        revisionConflict ? "revision conflict" : rateLimited ? "command rate limit exceeded" : duplicateCommand ? "command id reuse" : "Supabase request failed",
        revisionConflict || duplicateCommand ? 409 : rateLimited ? 429 : response.status >= 500 ? 503 : response.status,
        databaseReason || `HTTP_${response.status}`,
      );
    }
    return body;
  }
  function row<T extends Record<string, unknown>>(value: unknown): T {
    const item = Array.isArray(value) ? value[0] : value;
    if (!item || typeof item !== "object") throw new SupabaseAdapterError("SUPABASE_INVALID_RESPONSE", "Supabase returned an invalid game");
    return item as T;
  }
  function commitRow(value: unknown): GameCommit {
    const commit = row<Record<string, unknown>>(value);
    if (!Number.isInteger(commit.schema_version) || Number(commit.schema_version) < 1
        || !Number.isInteger(commit.revision) || Number(commit.revision) < 0
        || typeof commit.last_processed_at !== "string" || commit.last_processed_at.length === 0) {
      throw new SupabaseAdapterError("SUPABASE_INVALID_RESPONSE", "Supabase returned invalid commit metadata");
    }
    return commit as GameCommit;
  }
  async function load(userId: string): Promise<GameRow | null> {
    const value = await request("/rest/v1/rpc/load_game_transition", {
      method: "POST",
      body: JSON.stringify({ p_user_id: userId }),
    });
    if (!Array.isArray(value) || !value.length) return null;
    const loaded = row<GameRow>(value);
    const migrated = options.migrateState?.(loaded.state, userId) ?? loaded.state;
    return {
      ...loaded,
      state: migrated,
      migration_pending: JSON.stringify(migrated) !== JSON.stringify(loaded.state),
    };
  }
  async function commitIdle(userId: string, current: GameRow, idle: ReturnType<NonNullable<SupabaseAdapterOptions["applyIdle"]>>): Promise<GameCommit> {
    return commitRow(await request("/rest/v1/rpc/commit_idle_transition_v2", {
      method: "POST",
      body: JSON.stringify({
        p_user_id: userId,
        p_expected_revision: current.revision,
        p_expected_last_processed_at: current.last_processed_at,
        p_state: idle.state,
        p_last_processed_at: idle.lastProcessedAt,
      }),
    }));
  }
  async function claimCommand(userId: string, commandId: string, requestHash: string): Promise<"claimed" | "replayed" | "in_progress"> {
    const value = await request("/rest/v1/rpc/claim_game_transition", {
      method: "POST",
      body: JSON.stringify({ p_user_id: userId, p_command_id: commandId, p_request_hash: requestHash }),
    });
    if (value !== "claimed" && value !== "replayed" && value !== "in_progress") {
      throw new SupabaseAdapterError("SUPABASE_INVALID_RESPONSE", "Supabase returned an invalid command claim");
    }
    return value;
  }
  async function releaseCommandClaim(userId: string, commandId: string, requestHash: string): Promise<void> {
    await request("/rest/v1/rpc/release_game_transition_claim", {
      method: "POST",
      body: JSON.stringify({ p_user_id: userId, p_command_id: commandId, p_request_hash: requestHash }),
    });
  }
  function temporalChange(current: GameRow, lastProcessedAt: string): boolean {
    return current.migration_pending === true || lastProcessedAt !== current.last_processed_at;
  }
  async function bootstrap(userId: string) {
    const startedAt = now();
    let loadMs = 0;
    let idleMs = 0;
    let commitMs = 0;
    const timedLoad = async () => {
      const phaseStartedAt = now();
      try {
        return await load(userId);
      } finally {
        loadMs += Math.max(0, now() - phaseStartedAt);
      }
    };
    const complete = <T extends Record<string, unknown>>(payload: T): T & { bootstrapTiming: { loadMs: number; idleMs: number; commitMs: number; totalMs: number } } => ({
      ...payload,
      bootstrapTiming: {
        loadMs,
        idleMs,
        commitMs,
        totalMs: Math.max(0, now() - startedAt),
      },
    });
    const existing = await timedLoad();
    if (existing) {
      if (!existing.server_time) throw new SupabaseAdapterError("SUPABASE_INVALID_RESPONSE", "Supabase omitted server time");
      const idleStartedAt = now();
      const idle = options.applyIdle?.(existing.state, existing.last_processed_at, new Date(existing.server_time));
      idleMs += Math.max(0, now() - idleStartedAt);
      if (idle && temporalChange(existing, idle.lastProcessedAt)) {
        try {
          const commitStartedAt = now();
          const committed = await commitIdle(userId, existing, idle).finally(() => {
            commitMs += Math.max(0, now() - commitStartedAt);
          });
          return complete({ schemaVersion: committed.schema_version, revision: committed.revision, serverTime: existing.server_time, lastProcessedAt: committed.last_processed_at, state: idle.state, idleReport: idle.report });
        } catch (error) {
          if (!(error instanceof SupabaseAdapterError) || error.code !== "REVISION_CONFLICT") throw error;
          // Concurrent bootstrap calls may race on the same idle timestamp.
          // If another request already committed it, return the fresh row.
          const refreshed = await timedLoad();
          if (refreshed && (refreshed.revision !== existing.revision
              || refreshed.last_processed_at !== existing.last_processed_at)) {
            return complete({ schemaVersion: refreshed.schema_version, revision: refreshed.revision, serverTime: refreshed.server_time, lastProcessedAt: refreshed.last_processed_at, state: refreshed.state });
          }
          throw error;
        }
      }
      return complete({ schemaVersion: existing.schema_version, revision: existing.revision, serverTime: existing.server_time, lastProcessedAt: existing.last_processed_at, state: existing.state, ...(idle ? { idleReport: idle.report } : {}) });
    }
    const initialState = options.initialStateForUser?.(userId)
      ?? options.migrateState?.(options.initialState, userId)
      ?? options.initialState;
    const created = await request("/rest/v1/rpc/create_game_transition", {
      method: "POST",
      body: JSON.stringify({ p_user_id: userId, p_state: initialState }),
    });
    row<GameRow>(created);
    const value = await timedLoad();
    if (!value) throw new SupabaseAdapterError("GAME_NOT_FOUND", "created game not found", 404);
    return complete({ schemaVersion: value.schema_version, revision: value.revision, serverTime: value.server_time, lastProcessedAt: value.last_processed_at, state: value.state });
  }
  async function commands(userId: string, payload: Record<string, unknown>) {
    if (typeof payload.commandId !== "string" || !UUID_PATTERN.test(payload.commandId)) return { ok: false, error: { code: "VALIDATION_FAILED", message: "commandId must be a UUID" }, commandId: payload.commandId };
    const canonical = JSON.stringify({ commandId: payload.commandId, idempotencyKey: payload.idempotencyKey, clientVersion: payload.clientVersion, expectedRevision: Number(payload.expectedRevision), command: payload.command });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const requestHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    let claim: "claimed" | "replayed" | "in_progress";
    try {
      claim = await claimCommand(userId, payload.commandId, requestHash);
    } catch (error) {
      if (error instanceof SupabaseAdapterError && error.code === "DUPLICATE_COMMAND") {
        return { ok: false, error: { code: "DUPLICATE_COMMAND", message: "command id was already used with a different request" }, commandId: payload.commandId };
      }
      throw error;
    }
    if (claim === "in_progress") {
      return { ok: false, error: { code: "COMMAND_IN_PROGRESS", message: "command is already in progress" }, commandId: payload.commandId };
    }
    if (claim === "replayed") {
      const replay = await load(userId);
      if (!replay) throw new SupabaseAdapterError("GAME_NOT_FOUND", "game not found", 404);
      if (!replay.server_time) throw new SupabaseAdapterError("SUPABASE_INVALID_RESPONSE", "Supabase omitted server time");
      const replayIdle = options.applyIdle?.(replay.state, replay.last_processed_at, new Date(replay.server_time));
      if (replayIdle && temporalChange(replay, replayIdle.lastProcessedAt)) {
        try {
          const committedReplayIdle = await commitIdle(userId, replay, replayIdle);
          return { ok: true, revision: committedReplayIdle.revision, serverTime: replay.server_time, lastProcessedAt: committedReplayIdle.last_processed_at, state: replayIdle.state, commandId: payload.commandId, replayed: true, idleReport: replayIdle.report };
        } catch (error) {
          if (!(error instanceof SupabaseAdapterError) || error.code !== "REVISION_CONFLICT") throw error;
          const refreshed = await load(userId);
          if (!refreshed) throw new SupabaseAdapterError("GAME_NOT_FOUND", "game not found", 404);
          return { ok: true, revision: refreshed.revision, serverTime: refreshed.server_time, lastProcessedAt: refreshed.last_processed_at, state: refreshed.state, commandId: payload.commandId, replayed: true };
        }
      }
      return { ok: true, revision: replay.revision, serverTime: replay.server_time, lastProcessedAt: replay.last_processed_at, state: replay.state, commandId: payload.commandId, replayed: true, ...(replayIdle ? { idleReport: replayIdle.report } : {}) };
    }
    const current = await load(userId);
    if (!current) throw new SupabaseAdapterError("GAME_NOT_FOUND", "game not found", 404);
    const expected = Number(payload.expectedRevision);
    if (current.revision !== expected) {
      await releaseCommandClaim(userId, payload.commandId, requestHash);
      return { ok: false, error: { code: "REVISION_CONFLICT", message: "revision conflict", currentRevision: current.revision }, commandId: payload.commandId };
    }
    if (!current.server_time) throw new SupabaseAdapterError("SUPABASE_INVALID_RESPONSE", "Supabase omitted server time");
    const idle = options.applyIdle?.(current.state, current.last_processed_at, new Date(current.server_time));
    const workingState = idle?.state ?? current.state;
    const nextLastProcessedAt = idle?.lastProcessedAt ?? current.last_processed_at;
    let transition: { state: Record<string, unknown>; events?: unknown[] };
    try {
      transition = await options.applyCommand(workingState, { ...(payload.command as Record<string, unknown>), commandId: payload.commandId });
    } catch (error) {
      await releaseCommandClaim(userId, payload.commandId, requestHash);
      const typed = error as { code?: string; message?: string };
      if (typed.code) return { ok: false, error: { code: typed.code, message: typed.message ?? "command rejected" }, commandId: payload.commandId };
      throw error;
    }
    let result: unknown;
    try {
      result = await request("/rest/v1/rpc/commit_game_transition_v2", { method: "POST", body: JSON.stringify({ p_user_id: userId, p_command_id: payload.commandId, p_request_hash: requestHash, p_expected_revision: expected, p_expected_last_processed_at: current.last_processed_at, p_state: transition.state, p_last_processed_at: nextLastProcessedAt, p_events: transition.events ?? [] }) });
    } catch (error) {
      await releaseCommandClaim(userId, payload.commandId, requestHash);
      if (error instanceof SupabaseAdapterError && error.code === "REVISION_CONFLICT") {
        const refreshed = await load(userId);
        return {
          ok: false,
          error: {
            code: "REVISION_CONFLICT",
            message: "revision conflict",
            ...(refreshed ? { currentRevision: refreshed.revision } : {}),
          },
          commandId: payload.commandId,
        };
      }
      if (error instanceof SupabaseAdapterError && error.code === "RATE_LIMITED") {
        return { ok: false, error: { code: "RATE_LIMITED", message: "command rate limit exceeded" }, commandId: payload.commandId };
      }
      throw error;
    }
    const value = commitRow(result);
    return { ok: true, revision: value.revision, serverTime: current.server_time, lastProcessedAt: value.last_processed_at, state: transition.state, events: transition.events ?? [], commandId: payload.commandId, replayed: false, ...(idle ? { idleReport: idle.report } : {}) };
  }
  async function reset(userId: string): Promise<Record<string, unknown>> {
    const initialState = options.initialStateForUser?.(userId)
      ?? options.migrateState?.(options.initialState, userId)
      ?? options.initialState;
    await request("/rest/v1/rpc/reset_game", { method: "POST", body: JSON.stringify({ p_user_id: userId, p_state: initialState }) });
    const value = await load(userId);
    if (!value) throw new SupabaseAdapterError("GAME_NOT_FOUND", "reset game not found", 404);
    return {
      schemaVersion: value.schema_version,
      revision: value.revision,
      serverTime: value.server_time,
      lastProcessedAt: value.last_processed_at,
      state: value.state,
    };
  }
  async function deleteAccount(userId: string) {
    await request(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      body: JSON.stringify({ should_soft_delete: false }),
    });
  }
  async function reportError(userId: string, payload: ErrorReportPayload): Promise<void> {
    await request("/rest/v1/rpc/submit_alpha_error_report", {
      method: "POST",
      body: JSON.stringify({
        p_user_id: userId,
        p_build_version: payload.version,
        p_category: payload.category,
        p_message: payload.message,
        p_stack: payload.stack ?? null,
        p_request_id: payload.requestId ?? null,
        p_error_code: payload.errorCode ?? null,
        p_http_status: payload.httpStatus ?? null,
        p_surface: payload.surface,
      }),
    });
  }
  return { bootstrap, commands, reportError, reset, deleteAccount };
}
