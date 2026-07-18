import { describe, expect, it } from "vitest";
import { createGameApiHandler, serveGameApi, type ApiServices } from "../supabase/functions/game-api/index";

const services: ApiServices = {
  authenticate: async (request) => request.headers.get("authorization") === "Bearer valid" ? "user-1" : null,
  bootstrap: async (userId) => ({ userId, revision: 0 }),
  commands: async (_userId, payload) => ({ revision: Number(payload.expectedRevision) + 1 }),
  reset: async (userId) => ({ userId, revision: 0 }),
  deleteAccount: async () => undefined,
};
const handler = createGameApiHandler({ allowedOrigins: ["https://app.example.test"], services });
const request = (path: string, init: RequestInit = {}) => new Request(`https://api.example.test/game-api${path}`, { ...init, headers: { authorization: "Bearer valid", origin: "https://app.example.test", ...init.headers } });

describe("game-api Edge handler", () => {
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
  });
  it("routes reset, account deletion and unknown paths", async () => {
    expect((await handler(request("/reset", { method: "POST" }))).status).toBe(200);
    expect((await handler(request("/account", { method: "DELETE" }))).status).toBe(200);
    expect((await handler(request("/missing", { method: "POST" }))).status).toBe(404);
  });
  it("exposes a Deno.serve-compatible entrypoint", async () => {
    const previous = (globalThis as typeof globalThis & { Deno?: unknown }).Deno;
    let served = false;
    (globalThis as typeof globalThis & { Deno?: unknown }).Deno = { serve: () => { served = true; } };
    serveGameApi({ allowedOrigins: ["https://app.example.test"], services });
    expect(served).toBe(true);
    (globalThis as typeof globalThis & { Deno?: unknown }).Deno = previous;
  });
});
