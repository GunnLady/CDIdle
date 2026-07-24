import { promises as fs } from "node:fs";
import path from "node:path";

const domainRoot = path.resolve("src/domain");
const gameApiRoot = path.resolve("supabase/functions/game-api");
const forbidden = [/\bMath\.random\s*\(/, /\bDate\.now\s*\(/, /\bnew\s+Date\s*\(/];
const allowed = new Set([path.join(domainRoot, "random.ts")]);
const failures = [];

async function visit(directory, patterns = forbidden) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(file, patterns);
    else if (/\.(ts|tsx)$/.test(entry.name) && !allowed.has(file)) {
      const lines = (await fs.readFile(file, "utf8")).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (patterns.some((pattern) => pattern.test(line))) failures.push(`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
      });
    }
  }
}

await visit(domainRoot);
for (const entry of await fs.readdir(gameApiRoot, { withFileTypes: true })) {
  if (
    entry.isFile()
    && (entry.name.endsWith("-authority.ts") || entry.name === "authoritative-rng.ts")
  ) {
    const file = path.join(gameApiRoot, entry.name);
    const lines = (await fs.readFile(file, "utf8")).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\bMath\.random\s*\(/.test(line)) {
        failures.push(`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}
if (failures.length) {
  console.error("Forbidden non-deterministic access in canonical gameplay:");
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Determinism guard passed: domain and server authorities have no forbidden direct RNG access.");
}
