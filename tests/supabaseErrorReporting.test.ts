import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureErrorReporting,
  resetErrorReportingForTests,
} from "../src/lib/errorReporting";
import {
  callGameApi,
  GAME_API_REQUEST_TIMEOUT_MS,
  submitErrorReport,
  supabase,
} from "../src/lib/supabase";

describe("game-api error reporting integration", () => {
  afterEach(() => {
    resetErrorReportingForTests();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reports timeouts but not caller cancellations", async () => {
    vi.useFakeTimers();
    const transport = vi.fn(async () => undefined);
    configureErrorReporting(transport);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_input, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    })));

    const timedOut = callGameApi("/bootstrap", { method: "POST" });
    const timeoutRejection = expect(timedOut).rejects.toMatchObject({ message: "GAME_API_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(GAME_API_REQUEST_TIMEOUT_MS);
    await timeoutRejection;
    await vi.waitFor(() => expect(transport).toHaveBeenCalledWith(expect.objectContaining({ category: "timeout" })));

    transport.mockClear();
    const controller = new AbortController();
    const cancelled = callGameApi("/bootstrap", { method: "POST", signal: controller.signal });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    controller.abort(new DOMException("USER_ABORT", "AbortError"));
    await expect(cancelled).rejects.toMatchObject({ message: "USER_ABORT" });
    expect(transport).not.toHaveBeenCalled();
  });

  it("reports 5xx with requestId but ignores expected 409 conflicts", async () => {
    const transport = vi.fn(async () => undefined);
    configureErrorReporting(transport);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message: "service unavailable", requestId: "request-500" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "REVISION_CONFLICT", message: "revision conflict", requestId: "request-409" } }), { status: 409 }));
    vi.stubGlobal("fetch", fetcher);

    await expect(callGameApi("/bootstrap", { method: "POST" })).rejects.toMatchObject({ status: 503 });
    await vi.waitFor(() => expect(transport).toHaveBeenCalledWith(expect.objectContaining({
      category: "api_5xx",
      requestId: "request-500",
      errorCode: "SERVICE_UNAVAILABLE",
      httpStatus: 503,
    })));
    transport.mockClear();

    await expect(callGameApi("/commands", { method: "POST" })).rejects.toMatchObject({ status: 409 });
    expect(transport).not.toHaveBeenCalled();
  });

  it("uses an authenticated, isolated transport for the report route", async () => {
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 202 }));
    vi.stubGlobal("fetch", fetcher);

    await submitErrorReport({
      version: "local-dev",
      category: "react",
      message: "render failure",
      surface: "app",
    });

    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/game-api/errors"), expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ authorization: "Bearer token" }),
    }));
  });
});
