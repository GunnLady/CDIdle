import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const WORKERS = 10;
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(root, "test-results", "undercity-product-integration");
await mkdir(outputDirectory, { recursive: true });
const workerBundle = join(outputDirectory, "worker.mjs");
await build({
  entryPoints: [join(root, "scripts", "undercity-product-integration-worker.ts")],
  outfile: workerBundle,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: false,
});

const reports = await Promise.all(Array.from({ length: WORKERS }, (_, index) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [workerBundle, `--worker=${index}`], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", (code) => {
    const match = stdout.match(/\[UNDERCITY_PRODUCT_RESULT\]([A-Za-z0-9+/=]+)/);
    if (code !== 0 || !match) return reject(new Error(`Processus ${index} en échec (${code}).\n${stdout}\n${stderr}`));
    resolve(JSON.parse(Buffer.from(match[1], "base64").toString("utf8")));
  });
})));
assert.equal(reports.length, WORKERS);
assert(reports.every((report) => Object.values(report.sizesByZone).every((sizes) => JSON.stringify(sizes) === "[1,2,3]")));
assert(reports.every((report) => report.aoeTargetEvents >= 5));
assert(reports.every((report) => report.wipe && report.kingCapped && report.farmEncounters === 275));
const summary = {
  scope: "local product-engine integration; excluded from quality CI",
  processes: WORKERS,
  runs: reports.length,
  encounters: reports.reduce((sum, report) => sum + 17 + report.farmEncounters, 0),
  aoeMultiTargetSamples: reports.reduce((sum, report) => sum + report.aoeTargetEvents, 0),
  wipesVerified: reports.filter((report) => report.wipe).length,
  ratKingCapsVerified: reports.filter((report) => report.kingCapped).length,
  farmLoopsVerified: reports.filter((report) => report.farmEncounters === 275).length,
  ordinaryItemRewards: reports.reduce((sum, report) => sum + report.ordinaryRewards, 0),
  farmLootEntries: reports.reduce((sum, report) => sum + report.farmLoot, 0),
};
await writeFile(join(outputDirectory, "latest.json"), JSON.stringify({ summary, reports }, null, 2));
console.log(JSON.stringify(summary, null, 2));