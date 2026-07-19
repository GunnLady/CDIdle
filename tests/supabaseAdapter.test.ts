import { describe, expect, it } from "vitest";
import { createSupabaseGameApiServices } from "../supabase/functions/game-api/supabase-adapter";

describe("Supabase game-api adapter", () => {
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
    expect((await adapter.commands("u1", { commandId: "c1", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } }))).toMatchObject({ ok: true, revision: 1 });
    expect(calls.some((call) => call.includes("/rpc/commit_game_command"))).toBe(true);
  });
  it("replays an existing command without applying it again", async () => {
    let applied = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async () => { applied = true; return { state: {} }; }, fetcher: async (url) => {
      if (url.includes("/game_commands?")) return new Response(JSON.stringify([{ request_hash: "bad" }]), { status: 200 });
      return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: {}, last_processed_at: "2026-07-19T00:00:00Z" }]), { status: 200 });
    } });
    const result = await adapter.commands("u1", { commandId: "c1", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    expect(result).toMatchObject({ ok: false, error: { code: "DUPLICATE_COMMAND" } });
    expect(applied).toBe(false);
  });
  it("returns the canonical state for a matching replay", async () => {
    const canonical = JSON.stringify({ commandId: "c1", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    let applied = false;
    const adapter = createSupabaseGameApiServices({ supabaseUrl: "http://db", serviceRoleKey: "server-only", initialState: {}, applyCommand: async () => { applied = true; return { state: {} }; }, fetcher: async (url) => {
      if (url.includes("/game_commands?")) return new Response(JSON.stringify([{ request_hash: hash }]), { status: 200 });
      return new Response(JSON.stringify([{ schema_version: 1, revision: 2, state: { canonical: true }, last_processed_at: "2026-07-19T00:00:00Z" }]), { status: 200 });
    } });
    const result = await adapter.commands("u1", { commandId: "c1", idempotencyKey: "k1", expectedRevision: 0, command: { type: "onboarding.start" } });
    expect(result).toMatchObject({ ok: true, replayed: true, revision: 2, state: { canonical: true } });
    expect(applied).toBe(false);
  });
});
