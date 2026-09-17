import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const assetDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const files = (await readdir(assetDir)).filter((name) => name.endsWith(".js"));
const assets = await Promise.all(files.map(async (name) => [name, await readFile(join(assetDir, name))]));
const sizes = assets.map(([name, source]) => [name, gzipSync(source).byteLength]);
const total = sizes.reduce((sum, [, size]) => sum + size, 0);
const largest = Math.max(0, ...sizes.map(([, size]) => size));
// CDI-140 adds twenty stable Mage asset URLs to the eager hero portrait manifest.
// Shared resolver code is deduplicated; 251 KiB is the measured minimum whole-app
// budget that keeps those compatible portrait keys without hiding the added cost.
const maxInitial = 251 * 1024;
const maxChunk = 300 * 1024;
const privateCatalogMarker = "CDIDLE_PRIVATE_UI_CATALOG";
if (assets.some(([, source]) => source.includes(privateCatalogMarker))) {
  console.error("Private UI catalog leaked into the public bundle");
  process.exit(1);
}
if (total > maxInitial || largest > maxChunk) {
  console.error(`Bundle budget exceeded: total=${total}B (max ${maxInitial}B), largest=${largest}B (max ${maxChunk}B)`);
  process.exit(1);
}
console.log(`Bundle budget OK: ${total}B gzip JS, largest chunk ${largest}B`);
