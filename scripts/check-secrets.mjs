import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /^\s*(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET|GOOGLE_CLIENT_SECRET)\s*=\s*(?!$|#|["']?\$\{|["']?env\()/im,
  /\bsb_secret_[A-Za-z0-9_-]{12,}/,
];
const findings = [];
for (const file of files) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch { continue; }
  for (const pattern of patterns) if (pattern.test(text) && !file.endsWith(".example")) findings.push(file);
}
if (findings.length) {
  console.error(`Potential secrets found in tracked files: ${[...new Set(findings)].join(", ")}`);
  process.exit(1);
}
console.log(`Secret audit OK: ${files.length} tracked files scanned`);
