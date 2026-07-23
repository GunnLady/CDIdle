import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const assetDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const files = (await readdir(assetDir)).filter((name) => name.endsWith(".js"));
const sizes = await Promise.all(files.map(async (name) => [name, gzipSync(await readFile(join(assetDir, name))).byteLength]));
const total = sizes.reduce((sum, [, size]) => sum + size, 0);
const largest = Math.max(0, ...sizes.map(([, size]) => size));
const maxInitial = 250 * 1024;
const maxChunk = 300 * 1024;
if (total > maxInitial || largest > maxChunk) {
  console.error(`Bundle budget exceeded: total=${total}B (max ${maxInitial}B), largest=${largest}B (max ${maxChunk}B)`);
  process.exit(1);
}
console.log(`Bundle budget OK: ${total}B gzip JS, largest chunk ${largest}B`);
