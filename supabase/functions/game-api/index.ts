export type ApiEnvelope = Record<string, unknown>;
import { createSupabaseAuthenticator } from "./auth.ts";
import { createSupabaseGameApiServices } from "./supabase-adapter.ts";
import { applyTownCommand, initialTownState } from "./town-authority.ts";
export { createSupabaseAuthenticator, type SupabaseAuthOptions } from "./auth.ts";
export { createSupabaseGameApiServices, SupabaseAdapterError, type SupabaseAdapterOptions } from "./supabase-adapter.ts";
export type ApiServices = {
  authenticate(request: Request): Promise<string | null>;
  bootstrap(userId: string): Promise<ApiEnvelope>;
  commands(userId: string, payload: Record<string, unknown>): Promise<ApiEnvelope>;
  reset(userId: string): Promise<ApiEnvelope>;
  deleteAccount(userId: string): Promise<void>;
};
export type SupabaseGameApiOptions = { allowedOrigins: string[]; initialState: Record<string, unknown>; applyCommand: (state: Record<string, unknown>, command: Record<string, unknown>) => Promise<{ state: Record<string, unknown>; events?: unknown[] }>; env?: Record<string, string | undefined> };

type HandlerOptions = { allowedOrigins: string[]; services: ApiServices };
const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function requestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function response(body: unknown, status: number, requestIdValue: string, origin?: string): Response {
  const headers = new Headers(jsonHeaders);
  headers.set("x-request-id", requestIdValue);
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-headers", "authorization, content-type, x-client-version");
    headers.set("access-control-allow-methods", "POST, DELETE, OPTIONS");
    headers.set("vary", "Origin");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(code: string, message: string, id: string, status: number, origin?: string): Response {
  return response({ error: { code, message, requestId: id } }, status, id, origin);
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export function createGameApiHandler({ allowedOrigins, services }: HandlerOptions): (request: Request) => Promise<Response> {
  return async (request) => {
    const id = requestId();
    const origin = request.headers.get("origin") ?? undefined;
    if (origin && !allowedOrigins.includes(origin)) return errorResponse("CORS_FORBIDDEN", "origin is not allowed", id, 403);
    if (request.method === "OPTIONS") return response(null, 204, id, origin);

    const userId = await services.authenticate(request);
    if (!userId) return errorResponse("UNAUTHENTICATED", "a valid bearer token is required", id, 401, origin);
    const marker = "/game-api";
    const route = new URL(request.url).pathname.split(marker)[1] || "/";
    try {
      if (request.method === "POST" && route === "/bootstrap") return response(await services.bootstrap(userId), 200, id, origin);
      if (request.method === "POST" && route === "/commands") {
        const payload = await readJson(request);
        if (!payload || typeof payload.commandId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.commandId) || typeof payload.idempotencyKey !== "string" || typeof payload.clientVersion !== "string" || !Number.isInteger(payload.expectedRevision) || !payload.command || typeof payload.command !== "object") {
          return errorResponse("VALIDATION_FAILED", "command payload is invalid", id, 400, origin);
        }
        const result = await services.commands(userId, payload);
        const code = (result.error as { code?: string } | undefined)?.code;
        const status = code === "REVISION_CONFLICT" ? 409 : code === "RATE_LIMITED" ? 429 : code ? 400 : 200;
        return response(result, status, id, origin);
      }
      if (request.method === "POST" && route === "/reset") return response(await services.reset(userId), 200, id, origin);
      if (request.method === "DELETE" && route === "/account") { await services.deleteAccount(userId); return response({ ok: true }, 200, id, origin); }
      return errorResponse("NOT_FOUND", "route not found", id, 404, origin);
    } catch (error) {
      const typed = error as { code?: string; status?: number };
      const status = typed.status === 409 || typed.code === "REVISION_CONFLICT" ? 409 : typed.status === 404 ? 404 : 503;
      const code = status === 409 ? "REVISION_CONFLICT" : status === 404 ? "NOT_FOUND" : "SERVICE_UNAVAILABLE";
      return errorResponse(code, status === 409 ? "revision conflict" : status === 404 ? "resource not found" : "service unavailable", id, status, origin);
    }
  };
}

/** Edge Runtime entrypoint. Production callers must provide the Supabase-backed services. */
export function serveGameApi(options: HandlerOptions): unknown {
  const deno = (globalThis as typeof globalThis & { Deno?: { serve(handler: (request: Request) => Promise<Response>): unknown } }).Deno;
  if (!deno?.serve) throw new Error("DENO_RUNTIME_REQUIRED");
  return deno.serve(createGameApiHandler(options));
}

export function serveSupabaseGameApi(options: SupabaseGameApiOptions): unknown {
  const deno = (globalThis as typeof globalThis & { Deno?: { env?: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): unknown } }).Deno;
  const env = options.env ?? { SUPABASE_URL: deno?.env?.get("SUPABASE_URL") ?? deno?.env?.get("GAME_API_SUPABASE_URL"), SUPABASE_SERVICE_ROLE_KEY: deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY") ?? deno?.env?.get("GAME_API_SERVICE_ROLE_KEY"), SUPABASE_JWT_SECRET: deno?.env?.get("SUPABASE_JWT_SECRET") ?? deno?.env?.get("GAME_API_JWT_SECRET"), SUPABASE_EXPECTED_ISSUER: deno?.env?.get("SUPABASE_EXPECTED_ISSUER") ?? deno?.env?.get("GAME_API_EXPECTED_ISSUER") };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_JWT_SECRET) throw new Error("SUPABASE_RUNTIME_CONFIGURATION_REQUIRED");
  const services = createSupabaseGameApiServices({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY, initialState: options.initialState, applyCommand: options.applyCommand });
  const authenticatedServices = { ...services, authenticate: createSupabaseAuthenticator({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY, jwtSecret: env.SUPABASE_JWT_SECRET, expectedIssuer: env.SUPABASE_EXPECTED_ISSUER }) };
  return serveGameApi({ allowedOrigins: options.allowedOrigins, services: authenticatedServices });
}

const runtimeDeno = (globalThis as typeof globalThis & { Deno?: { env?: { get(name: string): string | undefined; }; serve?: unknown } }).Deno;
if (runtimeDeno?.serve && (runtimeDeno.env?.get("SUPABASE_URL") ?? runtimeDeno.env?.get("GAME_API_SUPABASE_URL"))) {
  const allowedOrigins = (runtimeDeno.env.get("GAME_API_ALLOWED_ORIGINS") ?? "http://127.0.0.1:3000,http://localhost:3000").split(",").map((origin) => origin.trim()).filter(Boolean);
  serveSupabaseGameApi({ allowedOrigins, initialState: initialTownState(), applyCommand: async (state, command) => applyTownCommand(state, command) });
}
