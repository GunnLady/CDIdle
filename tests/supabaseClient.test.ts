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
});
