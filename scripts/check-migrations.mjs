import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const dir = "supabase/migrations";
const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
const destructive = /\b(drop\s+(table|column|schema)|truncate\s+table)\b/i;
const findings = [];
for (const file of files) {
  const text = await readFile(join(dir, file), "utf8");
  if (destructive.test(text)) findings.push(file);
}
if (findings.length) {
  console.error(`Destructive migration detected: ${findings.join(", ")}`);
  process.exit(1);
}
console.log(`Migration safety OK: ${files.length} additive migration files`);
