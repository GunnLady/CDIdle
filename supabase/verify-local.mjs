import { access, readFile } from "node:fs/promises";

const required = [
  "supabase/config.toml",
  "supabase/seed.sql",
  "supabase/migrations/20260718000000_initial_game_socle.sql",
];

for (const file of required) await access(file);
const config = await readFile("supabase/config.toml", "utf8");
if (!config.includes("[db.migrations]") || !config.includes("[db.seed]")) {
  throw new Error("La configuration Supabase ne déclare pas migrations et seed");
}
if (!config.includes("[auth.external.google]") || !config.includes('client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"') || !config.includes("[auth.hook.before_user_created]") || !config.includes('uri = "pg-functions://postgres/public/before_user_created"')) {
  throw new Error("La configuration Supabase ne déclare pas Google OAuth et le hook before_user_created");
}
if (!config.includes("[auth.external.google]") || !config.includes('client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"') || !config.includes("[auth.hook.before_user_created]") || !config.includes('uri = "pg-functions://postgres/public/before_user_created"')) {
  throw new Error("La configuration Supabase ne déclare pas Google OAuth et le hook before_user_created");
}

console.log("Socle Supabase local présent : configuration, migration et seed.");
