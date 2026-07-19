export type SupabaseAdapterOptions = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetcher?: typeof fetch;
  now?: () => string;
  initialState: Record<string, unknown>;
  applyCommand: (state: Record<string, unknown>, command: Record<string, unknown>) => Promise<{ state: Record<string, unknown>; events?: unknown[] }>;
};

export class SupabaseAdapterError extends Error { constructor(public readonly code: string, message: string, public readonly status = 503) { super(message); } }
type GameRow = { schema_version: number; revision: number; state: Record<string, unknown>; last_processed_at: string };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createSupabaseGameApiServices(options: SupabaseAdapterOptions) {
  const fetcher = options.fetcher ?? fetch;
  const base = options.supabaseUrl.replace(/\/$/, "");
  const headers = { apikey: options.serviceRoleKey, authorization: `Bearer ${options.serviceRoleKey}`, "content-type": "application/json" };
  async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetcher(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new SupabaseAdapterError(response.status === 409 ? "REVISION_CONFLICT" : "SUPABASE_UNAVAILABLE", "Supabase request failed", response.status >= 500 ? 503 : response.status);
    return body;
  }
  function row(value: unknown): GameRow {
    const item = Array.isArray(value) ? value[0] : value;
    if (!item || typeof item !== "object") throw new SupabaseAdapterError("SUPABASE_INVALID_RESPONSE", "Supabase returned an invalid game");
    return item as GameRow;
  }
  async function load(userId: string): Promise<GameRow | null> {
    const value = await request(`/rest/v1/games?select=schema_version,revision,state,last_processed_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
    return Array.isArray(value) && value.length ? row(value) : null;
  }
  async function bootstrap(userId: string) {
    const existing = await load(userId);
    if (existing) return { schemaVersion: existing.schema_version, revision: existing.revision, serverTime: options.now?.() ?? new Date().toISOString(), lastProcessedAt: existing.last_processed_at, state: existing.state };
    const created = await request("/rest/v1/games", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ user_id: userId, state: options.initialState, revision: 0 }) });
    const value = row(created);
    return { schemaVersion: value.schema_version, revision: value.revision, serverTime: options.now?.() ?? new Date().toISOString(), lastProcessedAt: value.last_processed_at, state: value.state };
  }
  async function commands(userId: string, payload: Record<string, unknown>) {
    if (typeof payload.commandId !== "string" || !UUID_PATTERN.test(payload.commandId)) return { ok: false, error: { code: "VALIDATION_FAILED", message: "commandId must be a UUID" }, commandId: payload.commandId };
    const canonical = JSON.stringify({ commandId: payload.commandId, idempotencyKey: payload.idempotencyKey, expectedRevision: Number(payload.expectedRevision), command: payload.command });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const requestHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const existing = await request(`/rest/v1/game_commands?select=request_hash&user_id=eq.${encodeURIComponent(userId)}&command_id=eq.${encodeURIComponent(String(payload.commandId))}&limit=1`);
    if (Array.isArray(existing) && existing.length) {
      if ((existing[0] as { request_hash?: string }).request_hash !== requestHash) return { ok: false, error: { code: "DUPLICATE_COMMAND", message: "command id was already used with a different request" }, commandId: payload.commandId };
      const replay = await load(userId);
      if (!replay) throw new SupabaseAdapterError("GAME_NOT_FOUND", "game not found", 404);
      return { ok: true, revision: replay.revision, state: replay.state, commandId: payload.commandId, replayed: true };
    }
    const current = await load(userId);
    if (!current) throw new SupabaseAdapterError("GAME_NOT_FOUND", "game not found", 404);
    const expected = Number(payload.expectedRevision);
    if (current.revision !== expected) return { ok: false, error: { code: "REVISION_CONFLICT", message: "revision conflict", currentRevision: current.revision }, commandId: payload.commandId };
    let transition: { state: Record<string, unknown>; events?: unknown[] };
    try {
      transition = await options.applyCommand(current.state, payload.command as Record<string, unknown>);
    } catch (error) {
      const typed = error as { code?: string; message?: string };
      if (typed.code) return { ok: false, error: { code: typed.code, message: typed.message ?? "command rejected" }, commandId: payload.commandId };
      throw error;
    }
    const result = await request("/rest/v1/rpc/commit_game_command", { method: "POST", body: JSON.stringify({ p_user_id: userId, p_command_id: payload.commandId, p_request_hash: requestHash, p_expected_revision: expected, p_state: transition.state, p_events: transition.events ?? [] }) });
    const value = row(result);
    return { ok: true, revision: value.revision, state: value.state, commandId: payload.commandId, replayed: false };
  }
  async function reset(userId: string): Promise<Record<string, unknown>> { return await request("/rest/v1/rpc/reset_game", { method: "POST", body: JSON.stringify({ p_user_id: userId, p_state: options.initialState }) }) as Record<string, unknown>; }
  async function deleteAccount(userId: string) { await request(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" }); }
  return { bootstrap, commands, reset, deleteAccount };
}
