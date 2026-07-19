type JwtClaims = {
  sub?: unknown;
  exp?: unknown;
  iss?: unknown;
  aud?: unknown;
};

type AuthUser = { id: string; email?: string | null; deleted_at?: string | null };

export type SupabaseAuthOptions = {
  supabaseUrl: string;
  serviceRoleKey: string;
  jwtSecret: string;
  expectedIssuer?: string;
  expectedAudience?: string;
  fetcher?: typeof fetch;
  now?: () => number;
};

const encoder = new TextEncoder();

function decodePart(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodePart(value))) as T;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function verifyJwt(token: string, secret: string, options: Required<Pick<SupabaseAuthOptions, "expectedIssuer" | "expectedAudience">>, now: () => number): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = decodeJson<{ alg?: string; typ?: string }>(parts[0]);
    const claims = decodeJson<JwtClaims>(parts[1]);
    if (header.alg !== "HS256" || header.typ !== "JWT") return null;
    if (typeof claims.sub !== "string" || !claims.sub || typeof claims.exp !== "number" || claims.exp <= now()) return null;
    if (claims.iss !== options.expectedIssuer || claims.aud !== options.expectedAudience) return null;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, decodePart(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`));
    return valid ? claims.sub : null;
  } catch { return null; }
}

export function createSupabaseAuthenticator(options: SupabaseAuthOptions): (request: Request) => Promise<string | null> {
  const fetcher = options.fetcher ?? fetch;
  const expectedIssuer = options.expectedIssuer ?? `${options.supabaseUrl.replace(/\/$/, "")}/auth/v1`;
  const expectedAudience = options.expectedAudience ?? "authenticated";
  const now = options.now ?? (() => Math.floor(Date.now() / 1000));
  return async (request) => {
    const authorization = request.headers.get("authorization") ?? "";
    const token = /^Bearer\s+([^\s]+)$/i.exec(authorization)?.[1];
    if (!token) return null;
    const userId = await verifyJwt(token, options.jwtSecret, { expectedIssuer, expectedAudience }, now);
    if (!userId) return null;
    try {
      const userResponse = await fetcher(`${options.supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        headers: { apikey: options.serviceRoleKey, authorization: `Bearer ${options.serviceRoleKey}` },
      });
      if (!userResponse.ok) return null;
      const user = await userResponse.json() as AuthUser;
      if (user.id !== userId || user.deleted_at || !user.email) return null;
      const allowlistUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1/alpha_allowlist?select=email&email=eq.${encodeURIComponent(user.email.toLowerCase().trim())}&active=eq.true&limit=1`;
      const allowlistResponse = await fetcher(allowlistUrl, {
        headers: { apikey: options.serviceRoleKey, authorization: `Bearer ${options.serviceRoleKey}` },
      });
      if (!allowlistResponse.ok) return null;
      const entries = await allowlistResponse.json() as Array<{ email?: string }>;
      return entries.length === 1 ? userId : null;
    } catch { return null; }
  };
}

