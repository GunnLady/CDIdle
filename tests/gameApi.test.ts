import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGameApiHandler, serveGameApi, serveSupabaseGameApi, type ApiServices } from "../supabase/functions/game-api/index";

const reportError = vi.fn(async () => undefined);
const services: ApiServices = {
  authenticate: async (request) => request.headers.get("authorization") === "Bearer valid" ? "user-1" : null,
  bootstrap: async (userId) => ({ userId, revision: 0 }),
  commands: async (_userId, payload) => ({ revision: Number(payload.expectedRevision) + 1 }),
  reportError,
  reset: async (userId) => ({ userId, revision: 0 }),
  deleteAccount: async () => undefined,
};
const handler = createGameApiHandler({ allowedOrigins: ["https://app.example.test"], services });
const request = (path: string, init: RequestInit = {}) => new Request(`https://api.example.test/game-api${path}`, { ...init, headers: { authorization: "Bearer valid", origin: "https://app.example.test", ...init.headers } });

describe("game-api Edge handler", () => {
  beforeEach(() => reportError.mockClear());
  it("handles bootstrap and exposes a request id", async () => {
    const result = await handler(request("/bootstrap", { method: "POST" }));
    expect(result.status).toBe(200);
    expect(result.headers.get("x-request-id")).toBeTruthy();
    expect(result.headers.get("access-control-allow-origin")).toBe("https://app.example.test");
  });
  it("enforces auth, strict CORS and command validation", async () => {
    expect((await handler(new Request("https://api.example.test/game-api/bootstrap", { method: "POST" }))).status).toBe(401);
    expect((await handler(new Request("https://api.example.test/game-api/bootstrap", { method: "POST", headers: { origin: "https://evil.test" } }))).status).toBe(403);
    const invalid = await handler(request("/commands", { method: "POST", body: JSON.stringify({}) }));
    expect(invalid.status).toBe(400);
    const invalidId = await handler(request("/commands", { method: "POST", body: JSON.stringify({ commandId: "save-1", idempotencyKey: "idem", expectedRevision: 0, clientVersion: "test", command: { type: "building.upgrade", buildingId: "ferme" } }) }));
    expect(invalidId.status).toBe(400);
    const forbiddenMint = await handler(request("/commands", { method: "POST", body: JSON.stringify({ commandId: "33333333-3333-4333-8333-333333333333", idempotencyKey: "idem", expectedRevision: 0, clientVersion: "test", command: { type: "inventory.add", itemId: "starter_sword", rarity: "legendary", count: 1 } }) }));
    expect(forbiddenMint.status).toBe(400);
    const forbiddenRemoval = await handler(request("/commands", { method: "POST", body: JSON.stringify({ commandId: "55555555-5555-4555-8555-555555555555", idempotencyKey: "idem", expectedRevision: 0, clientVersion: "test", command: { type: "inventory.remove", itemId: "starter_sword", rarity: "common", count: 1 } }) }));
    expect(forbiddenRemoval.status).toBe(400);
    const validId = await handler(request("/commands", { method: "POST", body: JSON.stringify({ commandId: "44444444-4444-4444-8444-444444444444", idempotencyKey: "idem", expectedRevision: 0, clientVersion: "test", command: { type: "building.upgrade", buildingId: "ferme" } }) }));
    expect(validId.status).toBe(200);
  });
  it("routes reset, account deletion and unknown paths", async () => {
    expect((await handler(request("/reset", { method: "POST" }))).status).toBe(200);
    expect((await handler(request("/account", { method: "DELETE" }))).status).toBe(200);
    expect((await handler(request("/missing", { method: "POST" }))).status).toBe(404);
  });
  it("accepts only bounded, cleaned error reports", async () => {
    const result = await handler(request("/errors", {
      method: "POST",
      body: JSON.stringify({
        version: "git-0123456789abcdef",
        category: "api_5xx",
        message: "Failure for alpha@example.test Bearer secret-token",
        stack: "stack alpha@example.test",
        requestId: "request-1",
        errorCode: "SERVICE_UNAVAILABLE",
        httpStatus: 503,
        surface: "game-api/bootstrap",
      }),
    }));
    expect(result.status).toBe(202);
    expect(reportError).toHaveBeenCalledWith("user-1", expect.objectContaining({
      message: "Failure for [email-redacted] Bearer [redacted]",
      stack: "stack [email-redacted]",
      requestId: "request-1",
      errorCode: "SERVICE_UNAVAILABLE",
      httpStatus: 503,
    }));

    const forbidden = await handler(request("/errors", {
      method: "POST",
      body: JSON.stringify({
        version: "local-dev",
        category: "react",
        message: "failure",
        surface: "app",
        email: "forbidden@example.test",
      }),
    }));
    expect(forbidden.status).toBe(400);

    const oversized = await handler(request("/errors", {
      method: "POST",
      body: JSON.stringify({ message: "x".repeat(9 * 1024) }),
    }));
    expect(oversized.status).toBe(413);
  });
  it("returns 429 when error report collection is rate limited", async () => {
    const limitedHandler = createGameApiHandler({
      allowedOrigins: ["https://app.example.test"],
      services: {
        ...services,
        reportError: async () => { throw Object.assign(new Error("RATE_LIMITED"), { code: "RATE_LIMITED", status: 429 }); },
      },
    });
    const result = await limitedHandler(request("/errors", {
      method: "POST",
      body: JSON.stringify({ version: "local-dev", category: "react", message: "failure", surface: "app" }),
    }));
    expect(result.status).toBe(429);
    await expect(result.json()).resolves.toMatchObject({ error: { code: "RATE_LIMITED" } });
  });
  it("returns 409 while an identical command is already in progress", async () => {
    const inProgressHandler = createGameApiHandler({
      allowedOrigins: ["https://app.example.test"],
      services: {
        ...services,
        commands: async () => ({ ok: false, error: { code: "COMMAND_IN_PROGRESS", message: "command is already in progress" } }),
      },
    });
    const result = await inProgressHandler(request("/commands", {
      method: "POST",
      body: JSON.stringify({
        commandId: "45454545-4545-4454-8454-454545454545",
        idempotencyKey: "in-progress",
        expectedRevision: 0,
        clientVersion: "test",
        command: { type: "dungeon.auto_explore", enabled: false },
      }),
    }));
    expect(result.status).toBe(409);
    await expect(result.json()).resolves.toMatchObject({ error: { code: "COMMAND_IN_PROGRESS" } });
  });
  it("rejects oversized command payloads before dispatch", async () => {
    const oversized = JSON.stringify({ commandId: "44444444-4444-4444-8444-444444444444", idempotencyKey: "idem", expectedRevision: 0, clientVersion: "test", command: { type: "building.upgrade", buildingId: "ferme" }, padding: "x".repeat(128 * 1024) });
    const result = await handler(request("/commands", { method: "POST", body: oversized }));
    expect(result.status).toBe(413);
    await expect(result.json()).resolves.toMatchObject({ error: { code: "PAYLOAD_TOO_LARGE" } });
  });
  it("exposes an invalid canonical save without classifying it as an outage", async () => {
    const invalidStateHandler = createGameApiHandler({
      allowedOrigins: ["https://app.example.test"],
      services: {
        ...services,
        bootstrap: async () => {
          throw Object.assign(new Error("canonical RNG state is invalid"), {
            code: "INVALID_GAME_STATE",
            reason: "RNG_SEED_USER_MISMATCH",
          });
        },
      },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await invalidStateHandler(request("/bootstrap", { method: "POST" }));
    expect(result.status).toBe(500);
    await expect(result.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_GAME_STATE",
        message: "canonical game state is invalid",
      },
    });
    expect(consoleError).toHaveBeenCalledWith(
      "game-api request failed",
      expect.objectContaining({
        code: "INVALID_GAME_STATE",
        reason: "RNG_SEED_USER_MISMATCH",
        status: 500,
      }),
    );
    consoleError.mockRestore();
  });
  it("exposes a Deno.serve-compatible entrypoint", async () => {
    const previous = (globalThis as typeof globalThis & { Deno?: unknown }).Deno;
    let served = false;
    (globalThis as typeof globalThis & { Deno?: unknown }).Deno = { serve: () => { served = true; } };
    serveGameApi({ allowedOrigins: ["https://app.example.test"], services });
    expect(served).toBe(true);
    (globalThis as typeof globalThis & { Deno?: unknown }).Deno = previous;
  });

  it("starts the hosted ES256 runtime without a legacy JWT secret", () => {
    const runtime = globalThis as typeof globalThis & { Deno?: unknown };
    const previous = runtime.Deno;
    let served = false;
    runtime.Deno = { serve: () => { served = true; } };

    try {
      expect(() => serveSupabaseGameApi({
        allowedOrigins: ["https://app.example.test"],
        initialState: {},
        applyCommand: async (state) => ({ state }),
        env: {
          SUPABASE_URL: "https://project.supabase.co",
          SUPABASE_SERVICE_ROLE_KEY: "service-role-only",
        },
      })).not.toThrow();
      expect(served).toBe(true);
    } finally {
      runtime.Deno = previous;
    }
  });
});
