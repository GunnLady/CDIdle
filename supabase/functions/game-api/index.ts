export type ApiEnvelope = Record<string, unknown>;
export type ApiServices = {
  authenticate(request: Request): Promise<string | null>;
  bootstrap(userId: string): Promise<ApiEnvelope>;
  commands(userId: string, payload: Record<string, unknown>): Promise<ApiEnvelope>;
  reset(userId: string): Promise<ApiEnvelope>;
  deleteAccount(userId: string): Promise<void>;
};

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
        if (!payload || typeof payload.commandId !== "string" || typeof payload.clientVersion !== "string" || !Number.isInteger(payload.expectedRevision) || !payload.command || typeof payload.command !== "object") {
          return errorResponse("VALIDATION_FAILED", "command payload is invalid", id, 400, origin);
        }
        return response(await services.commands(userId, payload), 200, id, origin);
      }
      if (request.method === "POST" && route === "/reset") return response(await services.reset(userId), 200, id, origin);
      if (request.method === "DELETE" && route === "/account") { await services.deleteAccount(userId); return response({ ok: true }, 200, id, origin); }
      return errorResponse("NOT_FOUND", "route not found", id, 404, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : "service unavailable";
      return errorResponse("SERVICE_UNAVAILABLE", message, id, 503, origin);
    }
  };
}
