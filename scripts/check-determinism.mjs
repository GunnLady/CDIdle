import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.resolve("src/domain");
const forbidden = [/\bMath\.random\s*\(/, /\bDate\.now\s*\(/, /\bnew\s+Date\s*\(/];
const allowed = new Set([path.join(root, "random.ts")]);
const failures = [];

async function visit(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(file);
    else if (/\.(ts|tsx)$/.test(entry.name) && !allowed.has(file)) {
      const lines = (await fs.readFile(file, "utf8")).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (forbidden.some((pattern) => pattern.test(line))) failures.push(`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
      });
    }
  }
}

await visit(root);
if (failures.length) {
  console.error("Forbidden non-deterministic access in src/domain:");
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Determinism guard passed: src/domain has no direct clock/RNG access.");
}
