// Offline canvas encoding only: no application navigation or network requests.
// Rebuild the twenty selected exports and integrity hashes; retain calibration.
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const manifestPath = "assets/design/hero-sprites/cdi-157/manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const entry of manifest.entries) {
    const [source, neutral, png] = await Promise.all(
      [entry.approvedSource, entry.neutral, entry.normalized].map((path) => readFile(path)),
    );
    const uri = await page.evaluate(async (data) => {
      const image = new Image();
      image.src = data;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      return canvas.toDataURL("image/webp", 0.88);
    }, `data:image/png;base64,${png.toString("base64")}`);
    if (!uri.startsWith("data:image/webp;base64,")) throw new Error("WebP encoder unavailable");
    const runtime = Buffer.from(uri.split(",")[1], "base64");
    await mkdir(dirname(entry.runtime), { recursive: true });
    await writeFile(entry.runtime, runtime);
    Object.assign(entry, {
      sourceSha256: hash(source), neutralSha256: hash(neutral), normalizedSha256: hash(png),
      runtimeSha256: hash(runtime), runtimeBytes: runtime.length,
      frame: [png.readUInt32BE(16), png.readUInt32BE(20)],
    });
    console.log(`${entry.id}: ${runtime.length} bytes`);
  }
} finally {
  await browser.close();
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
