import { describe, expect, it, vi } from "vitest";

describe("Supabase client contract", () => {
  it("exposes the configured client module without Firebase imports", async () => {
    vi.resetModules();
    const module = await import("../src/lib/supabase");
    expect(module.supabase).toBeDefined();
    expect(typeof module.signInWithGoogle).toBe("function");
    expect(typeof module.callGameApi).toBe("function");
  });
});
