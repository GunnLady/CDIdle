import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";

export const LOCAL_TEST_USER_ID = "46464646-4646-4646-8646-464646464646";

export function parseEnvironment(output) {
  return Object.fromEntries(output.split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z0-9_]+)=(?:"(.*)"|'(.*)'|(.*))$/.exec(line.trim());
    return match ? [[match[1], match[2] ?? match[3] ?? match[4] ?? ""]] : [];
  }));
}

export function readLocalSupabaseEnvironment() {
  try {
    const executable = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", "npm.cmd exec --offline -- supabase status -o env"]
      : ["exec", "--offline", "--", "supabase", "status", "-o", "env"];
    return parseEnvironment(execFileSync(executable, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }));
  } catch {
    throw new Error(
      "local Supabase status unavailable; run `npm.cmd exec --offline -- supabase start` before this test",
    );
  }
}

export function requireLocalSupabaseRuntime(environment = readLocalSupabaseEnvironment()) {
  const apiUrl = String(environment.API_URL ?? "").replace(/\/$/, "");
  const anonKey = environment.ANON_KEY ?? environment.PUBLISHABLE_KEY;
  const serviceRoleKey = environment.SERVICE_ROLE_KEY;
  const jwtSecret = environment.JWT_SECRET;
  if (!apiUrl || !anonKey || !serviceRoleKey || !jwtSecret) {
    throw new Error(
      "local Supabase API_URL, ANON_KEY/PUBLISHABLE_KEY, SERVICE_ROLE_KEY or JWT_SECRET is unavailable",
    );
  }
  const hostname = new URL(apiUrl).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error("browser smoke refuses to run against a non-local Supabase project");
  }
  return {
    apiUrl,
    anonKey,
    serviceRoleKey,
    jwtSecret,
    expectedIssuer: `${apiUrl}/auth/v1`,
  };
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

export function createLocalTestToken(jwtSecret, expectedIssuer, userId = LOCAL_TEST_USER_ID) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: userId,
    aud: "authenticated",
    role: "authenticated",
    iss: expectedIssuer,
    iat: Math.floor(Date.now() / 1_000),
    exp: Math.floor(Date.now() / 1_000) + 10 * 60,
  }));
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}
