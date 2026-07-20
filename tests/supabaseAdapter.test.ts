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
});
