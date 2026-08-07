import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  createLocalTestToken,
  LOCAL_TEST_USER_ID,
  parseEnvironment,
  requireLocalSupabaseRuntime,
} from "../scripts/local-supabase-test-runtime.mjs";

describe("local Supabase test runtime", () => {
  it("parses quoted and unquoted status values", () => {
    expect(parseEnvironment('API_URL="http://127.0.0.1:54321"\nJWT_SECRET=secret\nIGNORED')).toEqual({
      API_URL: "http://127.0.0.1:54321",
      JWT_SECRET: "secret",
    });
  });

  it("accepts local runtimes and rejects remote projects", () => {
    expect(requireLocalSupabaseRuntime({
      API_URL: "http://localhost:54321/",
      ANON_KEY: "anon",
      SERVICE_ROLE_KEY: "service-role",
      JWT_SECRET: "secret",
    })).toEqual({
      apiUrl: "http://localhost:54321",
      anonKey: "anon",
      serviceRoleKey: "service-role",
      jwtSecret: "secret",
      expectedIssuer: "http://localhost:54321/auth/v1",
    });
    expect(() => requireLocalSupabaseRuntime({
      API_URL: "https://project.supabase.co",
      ANON_KEY: "anon",
      SERVICE_ROLE_KEY: "service-role",
      JWT_SECRET: "secret",
    })).toThrow("refuses to run against a non-local Supabase project");
  });

  it("creates a short-lived signed token for the seeded technical user", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-07T08:00:00Z"));
    try {
      const token = createLocalTestToken("local-secret", "http://127.0.0.1:54321/auth/v1");
      const [header, payload, signature] = token.split(".");
      expect(JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))).toMatchObject({
        sub: LOCAL_TEST_USER_ID,
        aud: "authenticated",
        role: "authenticated",
        iss: "http://127.0.0.1:54321/auth/v1",
        exp: 1_786_090_200,
      });
      expect(signature).toBe(createHmac("sha256", "local-secret")
        .update(`${header}.${payload}`)
        .digest("base64url"));
    } finally {
      vi.useRealTimers();
    }
  });
});
