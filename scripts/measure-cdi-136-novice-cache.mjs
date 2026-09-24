import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const projectRoot = resolve(import.meta.dirname, "..");
const assetDirectory = join(projectRoot, "dist", "assets");
const combatIdle = process.argv.includes("--combat-idle");
const warrior = process.argv.includes("--warrior");
const rogue = process.argv.includes("--rogue");
const rogueCombat = process.argv.includes("--rogue-combat");
const archer = process.argv.includes("--archer");
const archerCombat = process.argv.includes("--archer-combat");
const mage = process.argv.includes("--mage");
const mageCombat = process.argv.includes("--mage-combat");
assert(
  [combatIdle, warrior, rogue, rogueCombat, archer, archerCombat, mage, mageCombat].filter(Boolean).length <= 1,
  "Choose only one asset family flag",
);
const assetPattern = mageCombat
  ? /^mage-(?:male|female)-\d{2}-combat-idle-v1-[\w-]+\.webp$/
  : mage
  ? /^mage-(?:male|female)-\d{2}-v1-[\w-]+\.png$/
  : archerCombat
  ? /^archer-(?:male|female)-\d{2}-combat-idle-v1-[\w-]+\.png$/
  : archer
  ? /^archer-(?:male|female)-\d{2}-v1-[\w-]+\.png$/
  : rogue
  ? /^rogue-(?:male|female)-\d{2}-v1-[\w-]+\.png$/
  : rogueCombat
  ? /^rogue-(?:male|female)-\d{2}-combat-idle-v1-[\w-]+\.png$/
  : warrior
  ? /^warrior-(?:male|female)-\d{2}-v1-[\w-]+\.png$/
  : combatIdle
  ? /^novice-(?:male|female)-\d{2}-combat-idle-v1-[\w-]+\.png$/
  : /^novice-(?:male|female)-\d{2}-v1-[\w-]+\.png$/;
const assetLabel = mageCombat
  ? "CDI-152 combat-idle Mage"
  : mage
  ? "CDI-140 neutral Mage"
  : archerCombat
  ? "CDI-151 combat-idle Archer"
  : archer
  ? "CDI-139 neutral Archer"
  : rogue
  ? "CDI-138 neutral Rogue"
  : rogueCombat
  ? "CDI-150 combat-idle Rogue"
  : warrior
  ? "CDI-137 neutral Warrior"
  : combatIdle ? "CDI-148 combat-idle" : "CDI-136 neutral";
const resourcePrefix = mage || mageCombat ? "mage-" : archer || archerCombat ? "archer-" : rogue || rogueCombat ? "rogue-" : warrior ? "warrior-" : "novice-";
const assetFiles = readdirSync(assetDirectory).filter((file) => assetPattern.test(file)).sort();
assert.equal(
  assetFiles.length,
  20,
  `The production build must contain exactly 20 ${assetLabel} sprites`,
);

function readPngDimensions(path) {
  const header = readFileSync(path).subarray(0, 24);
  assert.deepEqual([...header.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function readWebpDimensions(path) {
  const header = readFileSync(path).subarray(0, 30);
  assert.equal(header.toString("ascii", 0, 4), "RIFF");
  assert.equal(header.toString("ascii", 8, 16), "WEBPVP8X");
  return {
    width: 1 + header.readUIntLE(24, 3),
    height: 1 + header.readUIntLE(27, 3),
  };
}

const assets = assetFiles.map((file) => {
  const path = join(assetDirectory, file);
  const dimensions = mageCombat ? readWebpDimensions(path) : readPngDimensions(path);
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
    "Content-Type": mageCombat ? "image/webp" : "image/png",
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
  return page.evaluate((prefix) => performance.getEntriesByType("resource")
    .filter((entry) => entry.name.includes(`/assets/${prefix}`))
    .map((entry) => ({
      name: entry.name,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    })), resourcePrefix);
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
    mode: mageCombat
      ? "mage_combat_idle"
      : mage
      ? "mage_neutral"
      : archerCombat
      ? "archer_combat_idle"
      : archer
      ? "archer_neutral"
      : rogue
        ? "rogue_neutral"
        : rogueCombat
          ? "rogue_combat_idle"
        : warrior
          ? "warrior_neutral"
          : combatIdle ? "combat_idle" : "novice_neutral",
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
