import { describe, expect, it, vi } from "vitest";

describe("Supabase client contract", () => {
  it("exposes the configured client module without Firebase imports", async () => {
    vi.resetModules();
    const module = await import("../src/lib/supabase");
    expect(module.supabase).toBeDefined();
    expect(typeof module.signInWithGoogle).toBe("function");
    expect(typeof module.callGameApi).toBe("function");
  });

  it("preserves HTTP status and structured code for offline/conflict handling", async () => {
    vi.resetModules();
    const module = await import("../src/lib/supabase");
    vi.spyOn(module.supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "REVISION_CONFLICT", message: "revision conflict" } }), { status: 409 })));

    await expect(module.callGameApi("/commands", { method: "POST" })).rejects.toMatchObject({
      name: "GameApiError",
      status: 409,
      code: "REVISION_CONFLICT"
    });

    vi.unstubAllGlobals();
  });

  it("classifies an invalid canonical save separately from a network outage", async () => {
    vi.resetModules();
    const module = await import("../src/lib/supabase");
    const error = new module.GameApiError(
      "canonical game state is invalid",
      500,
      "INVALID_GAME_STATE",
      { error: { requestId: "request-rng-1" } },
    );

    expect(module.canonicalStateFailure(error)).toEqual({
      requestId: "request-rng-1",
    });
    expect(module.canonicalStateFailure(
      new module.GameApiError("service unavailable", 503, "SERVICE_UNAVAILABLE"),
    )).toBeNull();
  });

  it("aborts a game-api request after the transport timeout", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const module = await import("../src/lib/supabase");
    vi.spyOn(module.supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_input, init?: RequestInit) => new Promise((_resolve, reject) => {
      const signal = init?.signal;
      signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
    })));

    const request = module.callGameApi("/reset", { method: "POST" });
    const rejection = expect(request).rejects.toMatchObject({ name: "TimeoutError", message: "GAME_API_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(module.GAME_API_REQUEST_TIMEOUT_MS);

    await rejection;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
