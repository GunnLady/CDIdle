import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { ErrorReportPayload } from "../../shared/contracts/error-report";
import { reportUnexpectedError } from "./errorReporting";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  if (!import.meta.env.DEV) throw new Error("Configuration Supabase manquante");
}

export const supabase: SupabaseClient = createClient(url ?? "http://127.0.0.1:54321", anonKey ?? "local-anon-key");

export type AuthSnapshot = { session: Session | null; user: User | null };

export class GameApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "GameApiError";
  }
}

export type CanonicalStateFailure = { requestId?: string };
export const GAME_API_REQUEST_TIMEOUT_MS = 10_000;
export const ERROR_REPORT_TIMEOUT_MS = 3_000;

function gameApiUrl(path: string): string {
  return `${url ?? "http://127.0.0.1:54321"}/functions/v1/game-api${path}`;
}

function responseRequestId(body: unknown, response: Response): string | undefined {
  const nested = body as { error?: { requestId?: unknown } } | null;
  const value = nested?.error?.requestId ?? response.headers.get("x-request-id");
  return typeof value === "string" && value ? value : undefined;
}

export function canonicalStateFailure(error: unknown): CanonicalStateFailure | null {
  if (!(error instanceof GameApiError) || error.code !== "INVALID_GAME_STATE") return null;
  const details = error.details as { error?: { requestId?: unknown } } | undefined;
  const requestId = details?.error?.requestId;
  return typeof requestId === "string" ? { requestId } : {};
}

export async function signInWithGoogle() {
  const result = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  if (result.error) throw result.error;
  return result;
}

export async function signOut() { return supabase.auth.signOut(); }
export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  const { data } = await supabase.auth.getSession();
  return { session: data.session, user: data.session?.user ?? null };
}
export function onAuthStateChange(callback: (snapshot: AuthSnapshot) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => callback({ session, user: session?.user ?? null }));
}

export async function submitErrorReport(payload: ErrorReportPayload): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), ERROR_REPORT_TIMEOUT_MS);
  try {
    await fetch(gameApiUrl("/errors"), {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function callGameApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("UNAUTHENTICATED");
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(init.signal?.reason);
  if (init.signal?.aborted) abortFromCaller();
  else init.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = globalThis.setTimeout(() => {
    controller.abort(new DOMException("GAME_API_TIMEOUT", "TimeoutError"));
  }, GAME_API_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(gameApiUrl(path), {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    });
  } catch (error) {
    if (controller.signal.aborted
        && controller.signal.reason instanceof DOMException
        && controller.signal.reason.message === "GAME_API_TIMEOUT") {
      void reportUnexpectedError({ category: "timeout", error: controller.signal.reason, surface: `game-api${path}` });
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abortFromCaller);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new GameApiError(
      body?.error?.message ?? `GAME_API_${response.status}`,
      response.status,
      body?.error?.code,
      body
    );
    const reportable4xx = response.status >= 400
      && response.status < 500
      && ![401, 403, 409, 429].includes(response.status);
    if (reportable4xx || response.status >= 500) {
      void reportUnexpectedError({
        category: reportable4xx ? "api_4xx" : "api_5xx",
        error,
        requestId: responseRequestId(body, response),
        ...(error.code ? { errorCode: error.code } : {}),
        httpStatus: response.status,
        surface: `game-api${path}`,
      });
    }
    throw error;
  }
  return body as T;
}
