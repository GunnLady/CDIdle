import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "src", "supabase/functions", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const unsafe = /console\.(?:log|info|warn|error)\s*\([^\n]*(?:email|token|authorization|password|secret|payload|credential)/i;
const findings = [];
let scanned = 0;
for (const file of files) {
  if (!existsSync(file)) continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  scanned += 1;
  lines.forEach((line, index) => { if (unsafe.test(line)) findings.push(`${file}:${index + 1}`); });
}
if (findings.length) {
  console.error(`Potential PII/secret log statements: ${findings.join(", ")}`);
  process.exit(1);
}
console.log(`Log safety audit OK: ${scanned} existing tracked source files scanned`);
