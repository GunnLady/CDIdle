import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { UNDERCITY_ZONES } from "../shared/domain/undercity.ts";
import { UNDERCITY_ZONE_VISUAL_PACKS } from "../src/assets/undercityVisualManifest.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const undercityDirectory = join(projectRoot, "src", "assets", "images", "dungeon", "undercity");
const encounterDirectory = join(projectRoot, "src", "assets", "images", "dungeon", "encounters");
const sceneBudgetBytes = 2 * 1024 * 1024;

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
  let transparentPixelCount = 0;
  const cornerAlphas = [];
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
      const alpha = row[alphaIndex];
      if (alpha < 255) hasTransparentPixel = true;
      if (alpha === 0) transparentPixelCount += 1;
    }
    if (y === 0 || y === height - 1) cornerAlphas.push(row[3], row[rowLength - 1]);
    previous = row;
  }
  return {
    width,
    height,
    alpha: hasTransparentPixel,
    transparentPixelCount,
    cornerAlphas,
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

const measuredPacks = UNDERCITY_ZONE_VISUAL_PACKS.map((pack) => {
  const zone = UNDERCITY_ZONES.find((candidate) => candidate.id === pack.zoneId);
  assert(zone, `Canonical ${pack.zoneId} zone missing`);
  const blueprints = [...zone.encounters, zone.elite, zone.boss];
  const expectedMembers = blueprints
    .flatMap((blueprint) => blueprint.members.map((member) => `${blueprint.id}:${member.key}`))
    .sort();
  const catalogMembers = pack.enemies
    .map((visual) => `${visual.blueprintId}:${visual.memberKey}`)
    .sort();
  assert.deepEqual(
    catalogMembers,
    expectedMembers,
    `${pack.zoneId} visual catalog must cover every canonical blueprint member exactly once`,
  );
  assert.equal(
    new Set(catalogMembers).size,
    catalogMembers.length,
    `${pack.zoneId} visual catalog contains duplicate blueprint members`,
  );

  const enemyAssetsByFile = new Map();
  for (const visual of pack.enemies) {
    const existing = enemyAssetsByFile.get(visual.file);
    if (existing) {
      assert.deepEqual(
        { width: visual.width, height: visual.height, alpha: visual.alpha },
        { width: existing.width, height: existing.height, alpha: existing.alpha },
        `${pack.zoneId}/${visual.file} reused with conflicting format metadata`,
      );
    } else enemyAssetsByFile.set(visual.file, visual);
  }
  const assetManifest = [pack.background, ...enemyAssetsByFile.values()];
  const directory = join(undercityDirectory, pack.directory);
  const actualFiles = readdirSync(directory).sort();
  assert.deepEqual(
    actualFiles,
    assetManifest.map((entry) => entry.file).sort(),
    `${pack.zoneId} kit manifest differs from files`,
  );
  const assets = assetManifest.map((entry) => {
    const path = join(directory, entry.file);
    const dimensions = readImageInfo(path);
    assert.deepEqual(
      { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
      { width: entry.width, height: entry.height, alpha: entry.alpha },
      `${pack.zoneId}/${entry.file} format mismatch`,
    );
    if (entry.alpha) {
      assert(
        dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
        `${pack.zoneId}/${entry.file} must contain a substantial transparent background`,
      );
      assert(
        Math.max(...dimensions.cornerAlphas) <= 2,
        `${pack.zoneId}/${entry.file} must not contain an opaque or semi-opaque baked background`,
      );
    }
    return { ...entry, bytes: statSync(path).size };
  });
  const assetsByFile = new Map(assets.map((entry) => [entry.file, entry]));
  const backgroundBytes = assetsByFile.get(pack.background.file)?.bytes ?? 0;
  const sceneGroups = blueprints.map((blueprint) => {
    const files = [...new Set(pack.enemies
      .filter((visual) => visual.blueprintId === blueprint.id)
      .map((visual) => visual.file))];
    const bytes = backgroundBytes + files.reduce(
      (total, file) => total + (assetsByFile.get(file)?.bytes ?? 0),
      0,
    );
    assert(bytes <= sceneBudgetBytes, `${blueprint.id} scene exceeds ${sceneBudgetBytes} bytes`);
    return { blueprintId: blueprint.id, members: blueprint.members.length, files, bytes };
  });
  return {
    zoneId: pack.zoneId,
    blueprints: blueprints.length,
    members: expectedMembers.length,
    uniqueAssets: assets.length,
    kitBytes: assets.reduce((total, entry) => total + entry.bytes, 0),
    assets,
    sceneGroups,
  };
});

const actualEncounterFiles = readdirSync(encounterDirectory).sort();
assert.deepEqual(actualEncounterFiles, encounterManifest.map((entry) => entry.file).sort(), "Encounter asset manifest differs from files");
const measuredEncounters = encounterManifest.map((entry) => {
  const path = join(encounterDirectory, entry.file);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: entry.width, height: entry.height, alpha: entry.alpha },
    `${entry.file} format mismatch`,
  );
  return { ...entry, bytes: statSync(path).size };
});
const encounterBytes = measuredEncounters.reduce((total, entry) => total + entry.bytes, 0);
assert(encounterBytes <= sceneBudgetBytes, `Encounter assets exceed ${sceneBudgetBytes} bytes`);

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
  sceneBudgetBytes,
  undercityPacks: measuredPacks,
  encounterBytes,
  encounterAssets: measuredEncounters,
}, null, 2));
