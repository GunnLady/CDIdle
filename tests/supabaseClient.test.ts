import { afterEach, describe, expect, it, vi } from "vitest";
import * as supabaseModule from "../src/lib/supabase";

describe("Supabase client contract", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exposes the configured client module without Firebase imports", async () => {
    const module = supabaseModule;
    expect(module.supabase).toBeDefined();
    expect(typeof module.signInWithGoogle).toBe("function");
    expect(typeof module.callGameApi).toBe("function");
  });

  it("keeps one Supabase and GoTrue client instance per module context", async () => {
    const first = supabaseModule;
    const second = await import("../src/lib/supabase");

    expect(second.supabase).toBe(first.supabase);
    expect(second.supabase.auth).toBe(first.supabase.auth);
  });

  it("preserves Google OAuth redirect and restores the session snapshot", async () => {
    const module = supabaseModule;
    const oauth = vi.spyOn(module.supabase.auth, "signInWithOAuth").mockResolvedValue({ data: { provider: "google", url: "https://auth.test" }, error: null });
    const session = { access_token: "token", user: { id: "user-1" } };
    vi.spyOn(module.supabase.auth, "getSession").mockResolvedValue({ data: { session }, error: null } as never);

    await module.signInWithGoogle();

    expect(oauth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    await expect(module.getAuthSnapshot()).resolves.toEqual({
      session,
      user: session.user,
    });
  });

  it("delegates email authentication and sign-out without changing SDK results", async () => {
    const module = supabaseModule;
    const passwordSignIn = vi.spyOn(module.supabase.auth, "signInWithPassword").mockResolvedValue({ data: { user: null, session: null }, error: null });
    const signUp = vi.spyOn(module.supabase.auth, "signUp").mockResolvedValue({ data: { user: null, session: null }, error: null });
    const signOut = vi.spyOn(module.supabase.auth, "signOut").mockResolvedValue({ error: null });

    await module.signInWithEmail("user@example.test", "password");
    await module.signUpWithEmail("user@example.test", "password");
    await expect(module.signOut()).resolves.toEqual({ error: null });

    expect(passwordSignIn).toHaveBeenCalledWith({ email: "user@example.test", password: "password" });
    expect(signUp).toHaveBeenCalledWith({ email: "user@example.test", password: "password" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("delegates email authentication and sign-out without changing SDK results", async () => {
    const module = supabaseModule;
    const passwordSignIn = vi.spyOn(module.supabase.auth, "signInWithPassword").mockResolvedValue({ data: { user: null, session: null }, error: null });
    const signUp = vi.spyOn(module.supabase.auth, "signUp").mockResolvedValue({ data: { user: null, session: null }, error: null });
    const signOut = vi.spyOn(module.supabase.auth, "signOut").mockResolvedValue({ error: null });

    await module.signInWithEmail("user@example.test", "password");
    await module.signUpWithEmail("user@example.test", "password");
    await expect(module.signOut()).resolves.toEqual({ error: null });

    expect(passwordSignIn).toHaveBeenCalledWith({ email: "user@example.test", password: "password" });
    expect(signUp).toHaveBeenCalledWith({ email: "user@example.test", password: "password" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("keeps onAuthStateChange callbacks synchronous and exposes the subscription", async () => {
    const module = supabaseModule;
    const subscription = { unsubscribe: vi.fn() };
    let sdkCallback: ((event: string, session: unknown) => void) | undefined;
    vi.spyOn(module.supabase.auth, "onAuthStateChange").mockImplementation((callback) => {
      sdkCallback = callback as never;
      return { data: { subscription } } as never;
    });
    const callback = vi.fn();

    const result = module.onAuthStateChange(callback);
    const session = { access_token: "token", user: { id: "user-1" } };
    sdkCallback?.("SIGNED_IN", session);

    expect(result).toEqual({ data: { subscription } });
    expect(callback).toHaveBeenCalledWith({ session, user: session.user });
  });

  it("preserves HTTP status and structured code for offline/conflict handling", async () => {
    const module = supabaseModule;
    vi.spyOn(module.supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "REVISION_CONFLICT", message: "revision conflict" } }), { status: 409 })));

    await expect(module.callGameApi("/commands", { method: "POST" })).rejects.toMatchObject({
      name: "GameApiError",
      status: 409,
      code: "REVISION_CONFLICT"
    });

  });

  it("classifies an invalid canonical save separately from a network outage", async () => {
    const module = supabaseModule;
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
    const module = supabaseModule;
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
  });

  it("preserves caller abort reasons and transient fetch failures", async () => {
    const module = supabaseModule;
    vi.spyOn(module.supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_input, init?: RequestInit) => new Promise((_resolve, reject) => {
      const signal = init?.signal;
      signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
    })));
    const controller = new AbortController();
    const request = module.callGameApi("/bootstrap", { signal: controller.signal });
    const reason = new DOMException("USER_ABORT", "AbortError");

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    controller.abort(reason);
    await expect(request).rejects.toBe(reason);

    const networkError = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));
    await expect(module.callGameApi("/bootstrap")).rejects.toBe(networkError);
    expect(module.canonicalStateFailure(networkError)).toBeNull();
  });
});
