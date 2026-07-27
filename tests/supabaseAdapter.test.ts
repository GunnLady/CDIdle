import { describe, expect, it } from "vitest";
import { createSupabaseGameApiServices } from "../supabase/functions/game-api/supabase-adapter";
import { applyTownCommand, initialTownState } from "../supabase/functions/game-api/town-authority";

describe("Supabase game-api adapter", () => {
  it("applies and commits idle before returning bootstrap", async () => {
    const calls: string[] = [];
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async (state) => ({ state }),
      applyIdle: (state, _lastProcessedAt) => ({ state: { ...state, idleApplied: true }, lastProcessedAt: "2026-07-19T01:00:00.000Z", report: { appliedSeconds: 3600 } }),
      fetcher: async (url, init) => {
        calls.push(`${init?.method ?? "GET"} ${url}`);
        if (url.includes("load_game_transition")) return new Response(JSON.stringify([{ schema_version: 1, revision: 0, state: {}, last_processed_at: "2026-07-19T00:00:00.000Z", server_time: "2026-07-19T01:00:00.000Z" }]), { status: 200 });
        if (url.includes("commit_idle_transition")) return new Response(JSON.stringify([{ schema_version: 1, revision: 1, state: { idleApplied: true }, last_processed_at: "2026-07-19T01:00:00.000Z" }]), { status: 200 });
        return new Response("[]", { status: 200 });
      },
    });
    await expect(adapter.bootstrap("u1")).resolves.toMatchObject({ revision: 1, idleReport: { appliedSeconds: 3600 }, state: { idleApplied: true } });
    expect(calls.some((call) => call.includes("commit_idle_transition"))).toBe(true);
  });

  it("reloads bootstrap when a concurrent command changes only the revision", async () => {
    let loads = 0;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async (state) => ({ state }),
      applyIdle: (state) => ({ state, lastProcessedAt: "2026-07-19T00:00:00.000Z", report: {} }),
      migrateState: (state) => ({ ...state, migrated: true }),
      fetcher: async (url) => {
        if (url.includes("commit_idle_transition")) {
          return new Response(JSON.stringify({ code: "P0002", message: "STALE_TEMPORAL_STATE" }), { status: 400 });
        }
        loads += 1;
        return new Response(JSON.stringify([{
          schema_version: 1,
          revision: loads === 1 ? 4 : 5,
          state: loads === 1 ? {} : { commandApplied: true, migrated: true },
          last_processed_at: "2026-07-19T00:00:00.000Z",
          server_time: "2026-07-19T00:00:00.500Z",
        }]), { status: 200 });
      },
    });

    await expect(adapter.bootstrap("u1")).resolves.toMatchObject({
      revision: 5,
      state: { commandApplied: true, migrated: true },
    });
  });

  it("commits idle and a command as one temporal transition", async () => {
    const calls: string[] = [];
    let committedBody: Record<string, unknown> | undefined;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyIdle: (state) => ({ state: { ...state, idleApplied: true }, lastProcessedAt: "2026-07-19T00:00:02.000Z", report: { appliedSeconds: 2 } }),
      applyCommand: async (state) => ({ state: { ...state, commandApplied: true } }),
      fetcher: async (url, init) => {
        calls.push(url.toString());
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
        if (url.includes("load_game_transition")) return new Response(JSON.stringify([{
          schema_version: 1, revision: 4, state: {},
          last_processed_at: "2026-07-19T00:00:00.000Z",
          server_time: "2026-07-19T00:00:02.750Z",
        }]), { status: 200 });
        if (url.includes("commit_game_transition")) {
          committedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
          return new Response(JSON.stringify([{
            schema_version: 1, revision: 5,
            state: { idleApplied: true, commandApplied: true },
            last_processed_at: "2026-07-19T00:00:02.000Z",
          }]), { status: 200 });
        }
        return new Response("[]", { status: 200 });
      },
    });

    await expect(adapter.commands("u1", {
      commandId: "10101010-1010-4010-8010-101010101010",
      idempotencyKey: "temporal",
      expectedRevision: 4,
      command: { type: "building.upgrade" },
    })).resolves.toMatchObject({
      ok: true,
      revision: 5,
      lastProcessedAt: "2026-07-19T00:00:02.000Z",
      state: { idleApplied: true, commandApplied: true },
    });
    expect(committedBody).toMatchObject({
      p_expected_revision: 4,
      p_expected_last_processed_at: "2026-07-19T00:00:00.000Z",
      p_last_processed_at: "2026-07-19T00:00:02.000Z",
      p_state: { idleApplied: true, commandApplied: true },
    });
    expect(calls.some((call) => call.includes("commit_idle_transition"))).toBe(false);
  });

  it("does not commit elapsed idle when the business command is rejected", async () => {
    const calls: string[] = [];
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyIdle: (state) => ({ state: { ...state, idleApplied: true }, lastProcessedAt: "2026-07-19T00:00:02.000Z", report: { appliedSeconds: 2 } }),
      applyCommand: async () => { throw Object.assign(new Error("rejected"), { code: "COMMAND_REJECTED" }); },
      fetcher: async (url) => {
        calls.push(url.toString());
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
        return new Response(JSON.stringify([{
          schema_version: 1, revision: 4, state: {},
          last_processed_at: "2026-07-19T00:00:00.000Z",
          server_time: "2026-07-19T00:00:02.000Z",
        }]), { status: 200 });
      },
    });

    await expect(adapter.commands("u1", {
      commandId: "20202020-2020-4020-8020-202020202020",
      idempotencyKey: "rejected",
      expectedRevision: 4,
      command: { type: "building.upgrade" },
    })).resolves.toMatchObject({ ok: false, error: { code: "COMMAND_REJECTED" } });
    expect(calls.some((call) => call.includes("commit_idle_transition") || call.includes("commit_game_transition"))).toBe(false);
    expect(calls.some((call) => call.includes("release_game_transition_claim"))).toBe(true);
  });

  it("maps the authoritative database command rate limit", async () => {
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async (state) => ({ state }),
      fetcher: async (url) => {
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
        if (url.includes("commit_game_transition")) {
          return new Response(JSON.stringify({ code: "P0004", message: "RATE_LIMITED" }), { status: 400 });
        }
        return new Response(JSON.stringify([{
          schema_version: 1, revision: 4, state: {},
          last_processed_at: "2026-07-19T00:00:00.000Z",
          server_time: "2026-07-19T00:00:00.000Z",
        }]), { status: 200 });
      },
    });

    await expect(adapter.commands("u1", {
      commandId: "30303030-3030-4030-8030-303030303030",
      idempotencyKey: "limited",
      expectedRevision: 4,
      command: { type: "building.upgrade" },
    })).resolves.toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
  });

  it("loads, creates and commits through the real REST/RPC contract", async () => {
    const calls: string[] = [];
    let created = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async (state, command) => ({ state: { ...state, command }, events: [{ type: "applied" }] }), fetcher: async (url, init) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
      if (url.includes("load_game_transition")) return new Response(created ? JSON.stringify([{ schema_version: 1, revision: 0, state: {}, last_processed_at: "2026-07-19T00:00:00Z", server_time: "2026-07-19T00:00:00Z" }]) : "[]", { status: 200 });
      if (url.includes("create_game_transition")) { created = true; return new Response(JSON.stringify([{ schema_version: 1, revision: 0, state: {}, last_processed_at: "2026-07-19T00:00:00Z" }]), { status: 200 }); }
      return new Response(JSON.stringify([{ revision: 1, state: { ok: true }, last_processed_at: "2026-07-19T00:00:00Z", schema_version: 1 }]), { status: 200 });
    } });
    expect((await adapter.bootstrap("u1"))).toMatchObject({ revision: 0 });
    expect((await adapter.commands("u1", { commandId: "11111111-1111-4111-8111-111111111111", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } }))).toMatchObject({ ok: true, revision: 1 });
    expect(calls.some((call) => call.includes("/rpc/commit_game_transition"))).toBe(true);
  });
  it("replays an existing command without applying it again", async () => {
    let applied = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async () => { applied = true; return { state: {} }; }, fetcher: async (url) => {
      if (url.includes("claim_game_transition")) return new Response(JSON.stringify({ code: "P0001", message: "COMMAND_ID_REUSE" }), { status: 400 });
      return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: {}, last_processed_at: "2026-07-19T00:00:00Z", server_time: "2026-07-19T00:00:00Z" }]), { status: 200 });
    } });
    const result = await adapter.commands("u1", { commandId: "22222222-2222-4222-8222-222222222222", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    expect(result).toMatchObject({ ok: false, error: { code: "DUPLICATE_COMMAND" } });
    expect(applied).toBe(false);
  });
  it("returns the canonical state for a matching replay", async () => {
    let applied = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async () => { applied = true; return { state: {} }; }, fetcher: async (url) => {
      if (url.includes("claim_game_transition")) return new Response(JSON.stringify("replayed"), { status: 200 });
      return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: { canonical: true }, last_processed_at: "2026-07-19T00:00:00Z", server_time: "2026-07-19T00:00:00Z" }]), { status: 200 });
    } });
    const result = await adapter.commands("u1", { commandId: "33333333-3333-4333-8333-333333333333", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    expect(result).toMatchObject({ ok: true, replayed: true, revision: 2, state: { canonical: true } });
    expect(applied).toBe(false);
  });

  it("does not execute a command while an identical request owns the claim", async () => {
    let applied = false;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async (state) => { applied = true; return { state }; },
      fetcher: async (url) => {
        if (url.includes("claim_game_transition")) {
          return new Response(JSON.stringify("in_progress"), { status: 200 });
        }
        throw new Error(`unexpected request: ${url}`);
      },
    });
    await expect(adapter.commands("u1", {
      commandId: "34343434-3434-4434-8434-343434343434",
      idempotencyKey: "in-progress",
      expectedRevision: 0,
      command: { type: "dungeon.auto_explore", enabled: false },
    })).resolves.toMatchObject({
      ok: false,
      error: { code: "COMMAND_IN_PROGRESS" },
    });
    expect(applied).toBe(false);
  });

  it("commits and replays a finalized item instance without duplication", async () => {
    const commandId = "99999999-9999-4999-8999-999999999999";
    const payload = {
      commandId,
      idempotencyKey: "forge-finalize-replay",
      clientVersion: "cdi-059",
      expectedRevision: 0,
      command: { type: "forge.finalize", previewId: "preview-existing", acceptUpgrade: false },
    };
    let revision = 0;
    let persistedState: Record<string, unknown> = {
      ...initialTownState(59),
      buildings: { ...initialTownState(59).buildings, forge: 1 },
      pendingForge: {
        previewId: "preview-existing",
        recipeId: "starter_sword",
        itemId: "starter_sword",
        itemType: "weapon",
        upgradeProc: "none",
      },
    };
    let committedHash: string | undefined;
    let applyCount = 0;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db",
      serviceRoleKey: "server-only",
      initialState: persistedState,
      applyCommand: async (state, command) => {
        applyCount += 1;
        return applyTownCommand(state, command);
      },
      fetcher: async (url, init) => {
        if (url.includes("claim_game_transition")) {
          return new Response(JSON.stringify(committedHash ? "replayed" : "claimed"), { status: 200 });
        }
        if (url.includes("/rpc/commit_game_transition")) {
          const body = JSON.parse(String(init?.body)) as {
            p_request_hash: string;
            p_state: Record<string, unknown>;
          };
          committedHash = body.p_request_hash;
          persistedState = structuredClone(body.p_state);
          revision += 1;
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision,
            state: persistedState,
            last_processed_at: "2026-07-26T00:00:00Z",
          }]), { status: 200 });
        }
        if (url.includes("load_game_transition")) {
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision,
            state: persistedState,
            last_processed_at: "2026-07-26T00:00:00Z",
            server_time: "2026-07-26T00:00:00Z",
          }]), { status: 200 });
        }
        return new Response("[]", { status: 200 });
      },
    });

    const first = await adapter.commands("u1", payload);
    const replay = await adapter.commands("u1", payload);

    expect(first).toMatchObject({
      ok: true,
      replayed: false,
      revision: 1,
      state: {
        pendingForge: null,
        storedItems: [{
          instanceId: "item:forge:preview-existing",
          itemId: "starter_sword",
          rarity: "common",
        }],
        rngState: { draws: 0 },
      },
    });
    expect(replay).toMatchObject({ ok: true, replayed: true, revision: 1 });
    if (!("state" in first) || !("state" in replay)) throw new Error("expected successful forge commands");
    expect(replay.state).toEqual(first.state);
    expect((replay.state.storedItems as Array<{ instanceId: string }>)).toHaveLength(1);
    expect(applyCount).toBe(1);
  });

  it("processes idle on a replay without reapplying the command", async () => {
    const commandId = "44444444-4444-4444-8444-444444444444";
    const payload = { commandId, idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } };
    let applied = false;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {},
      applyCommand: async () => { applied = true; return { state: {} }; },
      applyIdle: (state) => ({ state: { ...state, idleApplied: true }, lastProcessedAt: "2026-07-19T01:00:00.000Z", report: { appliedSeconds: 3600 } }),
      fetcher: async (url) => {
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("replayed"), { status: 200 });
        if (url.includes("commit_idle_transition")) return new Response(JSON.stringify([{ schema_version: 1, revision: 3, state: { idleApplied: true }, last_processed_at: "2026-07-19T01:00:00.000Z" }]), { status: 200 });
        return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: {}, last_processed_at: "2026-07-19T00:00:00.000Z", server_time: "2026-07-19T01:00:00.000Z" }]), { status: 200 });
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
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
        if (url.includes("load_game_transition")) {
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision: 0,
            state: { legacy: true },
            last_processed_at: "2026-07-19T00:00:00Z",
            server_time: "2026-07-19T00:00:00Z",
          }]), { status: 200 });
        }
        return new Response(JSON.stringify([{
          schema_version: 1,
          revision: 1,
          state: appliedState,
          last_processed_at: "2026-07-19T00:00:00Z",
          server_time: "2026-07-19T00:00:00Z",
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

  it("persists a semantic migration and increments revision during bootstrap", async () => {
    let committedBody: Record<string, unknown> | undefined;
    const adapter = createSupabaseGameApiServices({
      supabaseUrl: "http://db",
      serviceRoleKey: "server-only",
      initialState: {},
      migrateState: (state) => ({ ...state, migrated: true }),
      applyIdle: (state, lastProcessedAt) => ({ state, lastProcessedAt, report: { appliedSeconds: 0 } }),
      applyCommand: async (state) => ({ state }),
      fetcher: async (url, init) => {
        if (url.includes("commit_idle_transition")) {
          committedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision: 8,
            state: { legacy: true, migrated: true },
            last_processed_at: "2026-07-19T00:00:00Z",
          }]), { status: 200 });
        }
        return new Response(JSON.stringify([{
          schema_version: 1,
          revision: 7,
          state: { legacy: true },
          last_processed_at: "2026-07-19T00:00:00Z",
          server_time: "2026-07-19T00:00:00.500Z",
        }]), { status: 200 });
      },
    });

    await expect(adapter.bootstrap("u1")).resolves.toMatchObject({
      revision: 8,
      state: { legacy: true, migrated: true },
    });
    expect(committedBody).toMatchObject({
      p_expected_revision: 7,
      p_state: { legacy: true, migrated: true },
    });
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
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
        return new Response(JSON.stringify([{
          schema_version: 1,
          revision: 7,
          state: { rngState: { draws: 4 } },
          last_processed_at: "2026-07-19T00:00:00Z",
          server_time: "2026-07-19T00:00:00Z",
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
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
        if (url.includes("/rpc/commit_game_transition")) {
          return new Response(JSON.stringify({ code: "P0002", message: "STALE_REVISION" }), { status: 400 });
        }
        if (url.includes("load_game_transition")) {
          gameLoads += 1;
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision: gameLoads === 1 ? 0 : 1,
            state: { rngState: { draws: gameLoads === 1 ? 4 : 8 } },
            last_processed_at: "2026-07-19T00:00:00Z",
            server_time: "2026-07-19T00:00:00Z",
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
        if (url.includes("load_game_transition")) return new Response(bodies.length === 0 ? "[]" : JSON.stringify([{ schema_version: 1, revision: 0, state: { rngState: { seed: 101 } }, last_processed_at: "2026-07-19T00:00:00Z", server_time: "2026-07-19T00:00:00Z" }]), { status: 200 });
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
    expect(bodies[0]).toMatchObject({ p_user_id: "u1", p_state: { rngState: { seed: 101 } } });
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
        if (url.includes("claim_game_transition")) return new Response(JSON.stringify("claimed"), { status: 200 });
        if (url.includes("/rpc/commit_game_transition")) {
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
        if (url.includes("load_game_transition")) {
          return new Response(JSON.stringify([{
            schema_version: 1,
            revision,
            state: persistedState,
            last_processed_at: "2026-07-24T00:00:00Z",
            server_time: "2026-07-24T00:00:00Z",
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
