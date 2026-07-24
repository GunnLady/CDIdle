import { describe, expect, it } from "vitest";
import { createSupabaseGameApiServices } from "../supabase/functions/game-api/supabase-adapter";

describe("Supabase game-api adapter", () => {
  it("applies and commits idle before returning bootstrap", async () => {
    const calls: string[] = [];
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async (state) => ({ state }),
      applyIdle: (state, lastProcessedAt) => ({ state: { ...state, idleApplied: true }, lastProcessedAt: "2026-07-19T01:00:00.000Z", report: { appliedSeconds: 3600 } }),
      fetcher: async (url, init) => {
        calls.push(`${init?.method ?? "GET"} ${url}`);
        if (url.includes("/games?")) return new Response(JSON.stringify([{ schema_version: 1, revision: 0, state: {}, last_processed_at: "2026-07-19T00:00:00.000Z" }]), { status: 200 });
        if (url.includes("commit_idle_state")) return new Response(JSON.stringify([{ schema_version: 1, revision: 0, state: { idleApplied: true }, last_processed_at: "2026-07-19T01:00:00.000Z" }]), { status: 200 });
        return new Response("[]", { status: 200 });
      },
    });
    await expect(adapter.bootstrap("u1")).resolves.toMatchObject({ idleReport: { appliedSeconds: 3600 }, state: { idleApplied: true } });
    expect(calls.some((call) => call.includes("commit_idle_state"))).toBe(true);
  });

  it("loads, creates and commits through the real REST/RPC contract", async () => {
    const calls: string[] = [];
    let created = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async (state, command) => ({ state: { ...state, command }, events: [{ type: "applied" }] }), fetcher: async (url, init) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("/game_commands?")) return new Response("[]", { status: 200 });
      if (url.includes("/games?")) return new Response(created ? JSON.stringify([{ schema_version: 1, revision: 0, state: {}, last_processed_at: "2026-07-19T00:00:00Z" }]) : "[]", { status: 200 });
      if (url.endsWith("/games")) { created = true; return new Response(JSON.stringify([{ schema_version: 1, revision: 0, state: {}, last_processed_at: "2026-07-19T00:00:00Z" }]), { status: 201 }); }
      return new Response(JSON.stringify([{ revision: 1, state: { ok: true }, last_processed_at: "2026-07-19T00:00:00Z", schema_version: 1 }]), { status: 200 });
    } });
    expect((await adapter.bootstrap("u1"))).toMatchObject({ revision: 0 });
    expect((await adapter.commands("u1", { commandId: "11111111-1111-4111-8111-111111111111", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } }))).toMatchObject({ ok: true, revision: 1 });
    expect(calls.some((call) => call.includes("/rpc/commit_game_command"))).toBe(true);
  });
  it("replays an existing command without applying it again", async () => {
    let applied = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async () => { applied = true; return { state: {} }; }, fetcher: async (url) => {
      if (url.includes("/game_commands?")) return new Response(JSON.stringify([{ request_hash: "bad" }]), { status: 200 });
      return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: {}, last_processed_at: "2026-07-19T00:00:00Z" }]), { status: 200 });
    } });
    const result = await adapter.commands("u1", { commandId: "22222222-2222-4222-8222-222222222222", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    expect(result).toMatchObject({ ok: false, error: { code: "DUPLICATE_COMMAND" } });
    expect(applied).toBe(false);
  });
  it("returns the canonical state for a matching replay", async () => {
    const canonical = JSON.stringify({ commandId: "33333333-3333-4333-8333-333333333333", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    let applied = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async () => { applied = true; return { state: {} }; }, fetcher: async (url) => {
      if (url.includes("/game_commands?")) return new Response(JSON.stringify([{ request_hash: hash }]), { status: 200 });
      return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: { canonical: true }, last_processed_at: "2026-07-19T00:00:00Z" }]), { status: 200 });
    } });
    const result = await adapter.commands("u1", { commandId: "33333333-3333-4333-8333-333333333333", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    expect(result).toMatchObject({ ok: true, replayed: true, revision: 2, state: { canonical: true } });
    expect(applied).toBe(false);
  });

  it("processes idle on a replay without reapplying the command", async () => {
    const commandId = "44444444-4444-4444-8444-444444444444";
    const payload = { commandId, idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } };
    const canonical = JSON.stringify(payload);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    let applied = false;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async () => { applied = true; return { state: {} }; },
      applyIdle: (state) => ({ state: { ...state, idleApplied: true }, lastProcessedAt: "2026-07-19T01:00:00.000Z", report: { appliedSeconds: 3600 } }),
      fetcher: async (url) => {
        if (url.includes("/game_commands?")) return new Response(JSON.stringify([{ request_hash: hash }]), { status: 200 });
        if (url.includes("commit_idle_state")) return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: { idleApplied: true }, last_processed_at: "2026-07-19T01:00:00.000Z" }]), { status: 200 });
        return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: {}, last_processed_at: "2026-07-19T00:00:00.000Z" }]), { status: 200 });
      },
    });
    await expect(adapter.commands("u1", payload)).resolves.toMatchObject({ replayed: true, idleReport: { appliedSeconds: 3600 }, state: { idleApplied: true } });
    expect(applied).toBe(false);
  });

  it("requests permanent account deletion", async () => {
    let deleteRequest: { method?: string; body?: string } | undefined;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async (state) => ({ state }),
      fetcher: async (url, init) => {
        if (url.includes("/auth/v1/admin/users/")) {
          deleteRequest = { method: init?.method, body: init?.body as string };
        }
        return new Response("{}", { status: 200 });
      },
    });
    await adapter.deleteAccount("u1");
    expect(deleteRequest).toEqual({ method: "DELETE", body: JSON.stringify({ should_soft_delete: false }) });
  });

  it("migrates legacy state before bootstrap and command application", async () => {
    let appliedState: Record<string, unknown> | undefined;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db",
      serviceRoleKey: "server-only",
      initialState: {},
      migrateState: (state) => ({ ...state, rngState: { version: 1, draws: 0 } }),
      applyCommand: async (state) => {
        appliedState = state;
        return { state };
      },
      fetcher: async (url) => {
        if (url.includes("/game_commands?")) return new Response("[]", { status: 200 });
        if (url.includes("/games?")) {
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision: 0,
            state: { legacy: true },
            last_processed_at: "2026-07-19T00:00:00Z",
          }]), { status: 200 });
        }
        return new Response(JSON.stringify([{
          schema_version: 1,
          revision: 1,
          state: appliedState,
          last_processed_at: "2026-07-19T00:00:00Z",
        }]), { status: 200 });
      },
    });
    await expect(adapter.bootstrap("u1")).resolves.toMatchObject({
      state: { legacy: true, rngState: { version: 1, draws: 0 } },
    });
    await adapter.commands("u1", {
      commandId: "55555555-5555-4555-8555-555555555555",
      idempotencyKey: "k1",
      expectedRevision: 0,
      command: { type: "building.upgrade" },
    });
    expect(appliedState).toMatchObject({ legacy: true, rngState: { version: 1, draws: 0 } });
  });

  it("rejects revision conflicts before applying or consuming RNG", async () => {
    let applied = false;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db",
      serviceRoleKey: "server-only",
      initialState: {},
      applyCommand: async (state) => {
        applied = true;
        return { state };
      },
      fetcher: async (url) => {
        if (url.includes("/game_commands?")) return new Response("[]", { status: 200 });
        return new Response(JSON.stringify([{
          schema_version: 1,
          revision: 7,
          state: { rngState: { draws: 4 } },
          last_processed_at: "2026-07-19T00:00:00Z",
        }]), { status: 200 });
      },
    });
    await expect(adapter.commands("u1", {
      commandId: "66666666-6666-4666-8666-666666666666",
      idempotencyKey: "k1",
      expectedRevision: 6,
      command: { type: "dungeon.resolve" },
    })).resolves.toMatchObject({
      ok: false,
      error: { code: "REVISION_CONFLICT", currentRevision: 7 },
    });
    expect(applied).toBe(false);
  });

  it("maps a late PostgreSQL revision conflict and reloads the canonical revision", async () => {
    let gameLoads = 0;
    let applied = false;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db",
      serviceRoleKey: "server-only",
      initialState: {},
      applyCommand: async () => {
        applied = true;
        return { state: { rngState: { draws: 999 } } };
      },
      fetcher: async (url) => {
        if (url.includes("/game_commands?")) return new Response("[]", { status: 200 });
        if (url.includes("/rpc/commit_game_command")) {
          return new Response(JSON.stringify({ code: "P0002", message: "STALE_REVISION" }), { status: 400 });
        }
        if (url.includes("/games?")) {
          gameLoads += 1;
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision: gameLoads === 1 ? 0 : 1,
            state: { rngState: { draws: gameLoads === 1 ? 4 : 8 } },
            last_processed_at: "2026-07-19T00:00:00Z",
          }]), { status: 200 });
        }
        return new Response("[]", { status: 200 });
      },
    });
    await expect(adapter.commands("u1", {
      commandId: "77777777-7777-4777-8777-777777777777",
      idempotencyKey: "k1",
      expectedRevision: 0,
      command: { type: "dungeon.resolve" },
    })).resolves.toMatchObject({
      ok: false,
      error: { code: "REVISION_CONFLICT", currentRevision: 1 },
    });
    expect(applied).toBe(true);
    expect(gameLoads).toBe(2);
  });

  it("creates and resets with a user-scoped initial RNG state", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db",
      serviceRoleKey: "server-only",
      initialState: { rngState: { seed: 1 } },
      initialStateForUser: (userId) => ({ rngState: { seed: userId === "u1" ? 101 : 202 } }),
      applyCommand: async (state) => ({ state }),
      fetcher: async (url, init) => {
        if (url.includes("/games?")) return new Response("[]", { status: 200 });
        if (init?.body) bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify([{
          schema_version: 1,
          revision: 0,
          state: { rngState: { seed: 101 } },
          last_processed_at: "2026-07-19T00:00:00Z",
        }]), { status: 200 });
      },
    });
    await adapter.bootstrap("u1");
    await adapter.reset("u1");
    expect(bodies[0]).toMatchObject({ user_id: "u1", state: { rngState: { seed: 101 } } });
    expect(bodies[1]).toMatchObject({ p_user_id: "u1", p_state: { rngState: { seed: 101 } } });
  });

  it("returns the exact committed RNG snapshot on the next bootstrap", async () => {
    const initialRngState = {
      algorithm: "xorshift32",
      version: 1,
      seed: 101,
      state: 101,
      draws: 0,
    };
    const committedRngState = {
      algorithm: "xorshift32",
      version: 1,
      seed: 101,
      state: 26782723,
      draws: 1,
    };
    let revision = 0;
    let persistedState: Record<string, unknown> = { rngState: initialRngState };
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db",
      serviceRoleKey: "server-only",
      initialState: persistedState,
      applyCommand: async (state) => ({
        state: { ...state, rngState: committedRngState },
      }),
      fetcher: async (url, init) => {
        if (url.includes("/game_commands?")) return new Response("[]", { status: 200 });
        if (url.includes("/rpc/commit_game_command")) {
          const body = JSON.parse(String(init?.body)) as { p_state: Record<string, unknown> };
          persistedState = structuredClone(body.p_state);
          revision += 1;
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision,
            state: persistedState,
            last_processed_at: "2026-07-24T00:00:00Z",
          }]), { status: 200 });
        }
        if (url.includes("/games?")) {
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision,
            state: persistedState,
            last_processed_at: "2026-07-24T00:00:00Z",
          }]), { status: 200 });
        }
        return new Response("[]", { status: 200 });
      },
    });

    const mutation = await adapter.commands("u1", {
      commandId: "88888888-8888-4888-8888-888888888888",
      idempotencyKey: "rng-bootstrap",
      clientVersion: "cdi-050",
      expectedRevision: 0,
      command: { type: "dungeon.resolve" },
    });
    const bootstrap = await adapter.bootstrap("u1");

    expect(mutation).toMatchObject({
      ok: true,
      revision: 1,
      state: { rngState: committedRngState },
    });
    expect(bootstrap).toMatchObject({
      revision: 1,
      state: { rngState: committedRngState },
    });
    if (!("state" in mutation)) throw new Error("expected a successful mutation");
    expect((bootstrap.state as Record<string, unknown>).rngState)
      .toEqual((mutation.state as Record<string, unknown>).rngState);
  });
});
