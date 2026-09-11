import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kitDirectory = join(projectRoot, "src", "assets", "images", "dungeon", "undercity", "sewers");
const encounterDirectory = join(projectRoot, "src", "assets", "images", "dungeon", "encounters");
const kitBudgetBytes = 2 * 1024 * 1024;

const kitManifest = [
  { file: "undercity-sewers-stage-v1.jpg", width: 1536, height: 643, alpha: false },
  { file: "rat-pack-canal-rat-v1.png", width: 384, height: 384, alpha: true },
  { file: "rat-pack-mangy-rat-v1.png", width: 384, height: 384, alpha: true },
  { file: "rat-pack-plague-rat-v1.png", width: 384, height: 384, alpha: true },
];

const encounterManifest = [
  { file: "treasure-chest-open-v3.png", width: 640, height: 585, alpha: true },
  { file: "rest-camp-v2.png", width: 768, height: 512, alpha: true },
  { file: "treasure-vault-background-v2.jpg", width: 1536, height: 658, alpha: false },
  { file: "rest-chamber-background-v1.jpg", width: 1536, height: 658, alpha: false },
];

const tier1Sheets = [
  "acolyte", "aede", "archer", "artificer", "druid", "mage", "pugilist", "rogue", "warrior",
].flatMap((className) => ["female", "male"].map((gender) => (
  join("hero-sprites", "tier1", `human-tier1-${className}-${gender}-v1.png`)
)));
const heroSheets = ["human-novice-female.jpg", "human-novice-male.jpg", ...tier1Sheets];

function readPngInfo(buffer) {
  assert.deepEqual(
    [...buffer.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "PNG signature missing",
  );
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  assert.equal(bitDepth, 8, "Only 8-bit pilot PNG assets are supported");
  assert([2, 6].includes(colorType), "PNG assets must use RGB or RGBA pixels");
  if (colorType === 2) return { width, height, alpha: false };

  const idatChunks = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") idatChunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (type === "IEND") break;
  }
  assert(idatChunks.length > 0, "PNG image data missing");

  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const filtered = inflateSync(Buffer.concat(idatChunks));
  assert.equal(filtered.length, height * (rowLength + 1), "PNG scanline size mismatch");
  let previous = Buffer.alloc(rowLength);
  let hasTransparentPixel = false;
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[y * (rowLength + 1)];
    const source = filtered.subarray(y * (rowLength + 1) + 1, (y + 1) * (rowLength + 1));
    const row = Buffer.allocUnsafe(rowLength);
    for (let x = 0; x < rowLength; x += 1) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const above = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = above;
      else if (filter === 3) predictor = Math.floor((left + above) / 2);
      else if (filter === 4) {
        const estimate = left + above - upperLeft;
        const leftDistance = Math.abs(estimate - left);
        const aboveDistance = Math.abs(estimate - above);
        const upperLeftDistance = Math.abs(estimate - upperLeft);
        predictor = leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
          ? left
          : aboveDistance <= upperLeftDistance ? above : upperLeft;
      } else assert.equal(filter, 0, `Unsupported PNG filter ${filter}`);
      row[x] = (source[x] + predictor) & 0xff;
    }
    for (let alphaIndex = 3; alphaIndex < rowLength; alphaIndex += bytesPerPixel) {
      if (row[alphaIndex] < 255) {
        hasTransparentPixel = true;
        break;
      }
    }
    previous = row;
  }
  return {
    width,
    height,
    alpha: hasTransparentPixel,
  };
}

function readJpegInfo(buffer) {
  assert.equal(buffer[0], 0xff, "JPEG signature missing");
  assert.equal(buffer[1], 0xd8, "JPEG signature missing");
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (startOfFrameMarkers.has(marker)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5), alpha: false };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    assert(segmentLength >= 2, "JPEG segment length invalid");
    offset += segmentLength + 2;
  }
  throw new Error("JPEG dimensions not found");
}

function readImageInfo(path) {
  const buffer = readFileSync(path);
  return path.endsWith(".png") ? readPngInfo(buffer) : readJpegInfo(buffer);
}

const actualKitFiles = readdirSync(kitDirectory).sort();
assert.deepEqual(actualKitFiles, kitManifest.map((entry) => entry.file).sort(), "Sewer kit manifest differs from files");

const measuredKit = kitManifest.map((entry) => {
  const path = join(kitDirectory, entry.file);
  const dimensions = readImageInfo(path);
  assert.deepEqual(dimensions, { width: entry.width, height: entry.height, alpha: entry.alpha }, `${entry.file} format mismatch`);
  return { ...entry, bytes: statSync(path).size };
});
const kitBytes = measuredKit.reduce((total, entry) => total + entry.bytes, 0);
assert(kitBytes <= kitBudgetBytes, `Sewer kit exceeds ${kitBudgetBytes} bytes`);

const actualEncounterFiles = readdirSync(encounterDirectory).sort();
assert.deepEqual(actualEncounterFiles, encounterManifest.map((entry) => entry.file).sort(), "Encounter asset manifest differs from files");
const measuredEncounters = encounterManifest.map((entry) => {
  const path = join(encounterDirectory, entry.file);
  const dimensions = readImageInfo(path);
  assert.deepEqual(dimensions, { width: entry.width, height: entry.height, alpha: entry.alpha }, `${entry.file} format mismatch`);
  return { ...entry, bytes: statSync(path).size };
});
const encounterBytes = measuredEncounters.reduce((total, entry) => total + entry.bytes, 0);
assert(encounterBytes <= kitBudgetBytes, `Encounter assets exceed ${kitBudgetBytes} bytes`);

const heroImageDirectory = join(projectRoot, "src", "assets", "images");
for (const relativePath of heroSheets) {
  const dimensions = readImageInfo(join(heroImageDirectory, relativePath));
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height },
    { width: 1254, height: 1254 },
    `${relativePath} must remain a 5x4 canonical sheet`,
  );
}

console.log(JSON.stringify({
  heroSheets: heroSheets.length,
  heroIdentities: heroSheets.length * 20,
  kitBudgetBytes,
  kitBytes,
  assets: measuredKit,
  encounterBytes,
  encounterAssets: measuredEncounters,
}, null, 2));
