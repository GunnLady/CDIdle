import { describe, expect, it } from "vitest";
import { createSupabaseAuthenticator } from "../supabase/functions/game-api/auth";

function base64url(value: string) { return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
async function token(claims: Record<string, unknown>, secret = "secret") {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(claims));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(String.fromCharCode(...new Uint8Array(signature)))}`;
}

const claims = { sub: "user-1", exp: 2000, iss: "http://supabase.test/auth/v1", aud: "authenticated" };
function authenticator(responses: unknown[], now = 1000) {
  let index = 0;
  return createSupabaseAuthenticator({ supabaseUrl: "http://supabase.test", serviceRoleKey: "service-only", jwtSecret: "secret", now: () => now, fetcher: async () => new Response(JSON.stringify(responses[index++]), { status: 200 }) });
}

describe("Supabase game-api authenticator", () => {
  it("accepts a valid, active allowlisted user", async () => {
    const auth = authenticator([{ id: "user-1", email: "Player@Example.test" }, [{ email: "player@example.test" }]]);
    expect(await auth(new Request("https://api.test", { headers: { authorization: `Bearer ${await token(claims)}` } }))).toBe("user-1");
  });
  it.each(["missing", "expired", "wrong issuer", "wrong audience", "bad signature"]) ("rejects %s tokens", async (kind) => {
    const altered = { ...claims, ...(kind === "expired" ? { exp: 999 } : {}), ...(kind === "wrong issuer" ? { iss: "other" } : {}), ...(kind === "wrong audience" ? { aud: "other" } : {}) };
    const bearer = kind === "missing" ? "" : `Bearer ${await token(altered, kind === "bad signature" ? "wrong" : "secret")}`;
    const auth = authenticator([]);
    expect(await auth(new Request("https://api.test", { headers: bearer ? { authorization: bearer } : {} }))).toBeNull();
  });
  it.each([[{ id: "user-1", email: "player@example.test", deleted_at: "2026-01-01" }, [{ email: "player@example.test" }]], [{ id: "user-1", email: "player@example.test" }, []]])("rejects deleted or non-allowlisted users", async (user, entries) => {
    const auth = authenticator([user, entries]);
    expect(await auth(new Request("https://api.test", { headers: { authorization: `Bearer ${await token(claims)}` } }))).toBeNull();
  });
});
