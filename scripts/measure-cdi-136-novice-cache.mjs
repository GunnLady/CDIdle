import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const projectRoot = resolve(import.meta.dirname, "..");
const assetDirectory = join(projectRoot, "dist", "assets");
const assetPattern = /^novice-(?:male|female)-\d{2}-v1-[\w-]+\.png$/;
const assetFiles = readdirSync(assetDirectory).filter((file) => assetPattern.test(file)).sort();
assert.equal(assetFiles.length, 20, "The production build must contain exactly 20 CDI-136 Novice sprites");

function readPngDimensions(path) {
  const header = readFileSync(path).subarray(0, 24);
  assert.deepEqual([...header.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

const assets = assetFiles.map((file) => {
  const path = join(assetDirectory, file);
  const dimensions = readPngDimensions(path);
  return {
    file,
    path,
    bytes: statSync(path).size,
    ...dimensions,
    decodedRgbaBytes: dimensions.width * dimensions.height * 4,
  };
});
const assetNames = new Set(assetFiles);
const html = `<!doctype html><html><body>${assetFiles
  .map((file) => `<img src="/assets/${file}" alt="">`)
  .join("")}</body></html>`;

const server = createServer((request, response) => {
  if (request.url === "/measure") {
    response.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
    response.end(html);
    return;
  }
  const requestedName = basename(request.url ?? "");
  if (!assetNames.has(requestedName)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  response.end(readFileSync(join(assetDirectory, requestedName)));
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const address = server.address();
assert(address && typeof address === "object");
const browser = await chromium.launch({ headless: true });

async function readTimings(page) {
  await page.waitForFunction(() => (
    [...document.images].length === 20 && [...document.images].every((image) => image.complete && image.naturalWidth > 0)
  ));
  return page.evaluate(() => performance.getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/assets/novice-"))
    .map((entry) => ({
      name: entry.name,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    })));
}

try {
  const page = await browser.newPage();
  const url = `http://127.0.0.1:${address.port}/measure`;
  await page.goto(url);
  const cold = await readTimings(page);
  await page.reload();
  const warm = await readTimings(page);
  assert.equal(cold.length, 20, "Cold load must observe all 20 sprites");
  assert.equal(warm.length, 20, "Warm load must observe all 20 sprites");
  assert.equal(warm.reduce((sum, entry) => sum + entry.transferSize, 0), 0, "Warm load must reuse browser cache");

  const byLargest = [...assets].sort((left, right) => right.bytes - left.bytes);
  console.log(JSON.stringify({
    assets: assets.length,
    dimensions: [...new Set(assets.map(({ width, height }) => `${width}x${height}`))],
    fileBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    largestFourFileBytes: byLargest.slice(0, 4).reduce((sum, asset) => sum + asset.bytes, 0),
    decodedRgbaBytes: assets.reduce((sum, asset) => sum + asset.decodedRgbaBytes, 0),
    decodedRgbaBytesPerSprite: assets[0].decodedRgbaBytes,
    coldTransferBytes: cold.reduce((sum, entry) => sum + entry.transferSize, 0),
    coldEncodedBodyBytes: cold.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
    warmTransferBytes: warm.reduce((sum, entry) => sum + entry.transferSize, 0),
    cachePolicy: "public, max-age=31536000, immutable",
  }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolveClose, rejectClose) => server.close((error) => (
    error ? rejectClose(error) : resolveClose()
  )));
}
