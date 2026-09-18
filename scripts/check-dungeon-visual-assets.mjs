import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { UNDERCITY_ZONES } from "../shared/domain/undercity.ts";
import { UNDERCITY_ZONE_VISUAL_PACKS } from "../src/assets/undercityVisualManifest.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const undercityDirectory = join(projectRoot, "public", "assets", "images", "dungeon", "undercity");
const encounterDirectory = join(projectRoot, "src", "assets", "images", "dungeon", "encounters");
const sceneBudgetBytes = 2 * 1024 * 1024;
const combatHeroLimit = 4;

const encounterManifest = [
  { file: "challenge-trap-v1.png", width: 768, height: 512, alpha: true },
  { file: "challenge-enigma-v1.png", width: 768, height: 512, alpha: true },
  { file: "challenge-ambush-v1.png", width: 768, height: 512, alpha: true },
  { file: "challenge-ritual-v1.png", width: 768, height: 512, alpha: true },
  { file: "challenge-obstacle-v1.png", width: 768, height: 512, alpha: true },
  { file: "challenge-negotiation-v1.png", width: 768, height: 512, alpha: true },
  { file: "treasure-chest-open-v3.png", width: 640, height: 585, alpha: true },
  { file: "rest-camp-v2.png", width: 768, height: 512, alpha: true },
  { file: "treasure-vault-background-v2.jpg", width: 1536, height: 658, alpha: false },
  { file: "rest-chamber-background-v1.jpg", width: 1536, height: 658, alpha: false },
];

const encounterScenes = {
  treasure: ["treasure-vault-background-v2.jpg", "treasure-chest-open-v3.png"],
  rest: ["rest-chamber-background-v1.jpg", "rest-camp-v2.png"],
  trap: ["rest-chamber-background-v1.jpg", "challenge-trap-v1.png"],
  enigma: ["rest-chamber-background-v1.jpg", "challenge-enigma-v1.png"],
  ambush: ["rest-chamber-background-v1.jpg", "challenge-ambush-v1.png"],
  ritual: ["rest-chamber-background-v1.jpg", "challenge-ritual-v1.png"],
  obstacle: ["rest-chamber-background-v1.jpg", "challenge-obstacle-v1.png"],
  negotiation: ["rest-chamber-background-v1.jpg", "challenge-negotiation-v1.png"],
};

const tier1Sheets = ["pugilist"].flatMap((className) => ["female", "male"].map((gender) => (
  join("hero-sprites", "tier1", `human-tier1-${className}-${gender}-v1.png`)
)));
const heroSheets = tier1Sheets;
const noviceSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `novice-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const noviceCombatSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `novice-${gender}-${String(index + 1).padStart(2, "0")}-combat-idle-v1.png`,
  ))
));
const warriorSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `warrior-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const rogueSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `rogue-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const archerSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `archer-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const mageSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `mage-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const acolyteSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `acolyte-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const aedeSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `aede-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const druidSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `druid-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));
const artificerSprites = ["female", "male"].flatMap((gender) => (
  Array.from({ length: 10 }, (_, index) => join(
    gender,
    `artificer-${gender}-${String(index + 1).padStart(2, "0")}-v1.png`,
  ))
));

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
  const visibleBounds = { minX: width, minY: height, maxX: -1, maxY: -1 };
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
      if (alpha > 2) {
        const pixelX = (alphaIndex - 3) / bytesPerPixel;
        visibleBounds.minX = Math.min(visibleBounds.minX, pixelX);
        visibleBounds.minY = Math.min(visibleBounds.minY, y);
        visibleBounds.maxX = Math.max(visibleBounds.maxX, pixelX);
        visibleBounds.maxY = Math.max(visibleBounds.maxY, y);
      }
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
    visibleBounds: visibleBounds.maxX >= 0 ? visibleBounds : null,
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
  for (const visual of [...pack.enemies, ...pack.variants]) {
    if (!enemyAssetsByFile.has(visual.file)) enemyAssetsByFile.set(visual.file, visual);
  }
  const assetManifest = [
    { ...pack.background, width: 1536, height: 643, alpha: false },
    ...[...enemyAssetsByFile.values()].map((visual) => ({
      ...visual,
      width: 384,
      height: 384,
      alpha: true,
    })),
  ];
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
    const baseVisuals = pack.enemies.filter((visual) => visual.blueprintId === blueprint.id);
    const files = [...new Set(baseVisuals
      .filter((visual) => visual.blueprintId === blueprint.id)
      .map((visual) => visual.file))];
    const bytes = backgroundBytes + files.reduce(
      (total, file) => total + (assetsByFile.get(file)?.bytes ?? 0),
      0,
    );
    assert(bytes <= sceneBudgetBytes, `${blueprint.id} scene exceeds ${sceneBudgetBytes} bytes`);
    const variants = pack.variants
      .filter((variant) => variant.blueprintId === blueprint.id)
      .map((variant) => {
        const variantFiles = [...new Set([
          ...baseVisuals
            .filter((visual) => visual.memberKey !== variant.memberKey)
            .map((visual) => visual.file),
          variant.file,
        ])];
        const variantBytes = backgroundBytes + variantFiles.reduce(
          (total, file) => total + (assetsByFile.get(file)?.bytes ?? 0),
          0,
        );
        assert(
          variantBytes <= sceneBudgetBytes,
          `${blueprint.id}:${variant.variantKey} scene exceeds ${sceneBudgetBytes} bytes`,
        );
        return { variantKey: variant.variantKey, files: variantFiles, bytes: variantBytes };
      });
    return { blueprintId: blueprint.id, members: blueprint.members.length, files, bytes, variants };
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
  if (entry.alpha) {
    assert(
      dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
      `${entry.file} must contain a substantial transparent background`,
    );
    assert(
      Math.max(...dimensions.cornerAlphas) <= 2,
      `${entry.file} must not contain an opaque or semi-opaque baked background`,
    );
  }
  return { ...entry, bytes: statSync(path).size };
});
const encounterBytes = measuredEncounters.reduce((total, entry) => total + entry.bytes, 0);
const encounterAssetsByFile = new Map(measuredEncounters.map((entry) => [entry.file, entry]));
const measuredEncounterScenes = Object.entries(encounterScenes).map(([kind, files]) => {
  const bytes = files.reduce((total, file) => total + (encounterAssetsByFile.get(file)?.bytes ?? 0), 0);
  assert.equal(files.every((file) => encounterAssetsByFile.has(file)), true, `${kind} scene references a missing asset`);
  assert(bytes <= sceneBudgetBytes, `${kind} encounter scene exceeds ${sceneBudgetBytes} bytes`);
  return { kind, files, bytes };
});

const heroImageDirectory = join(projectRoot, "src", "assets", "images");
for (const relativePath of heroSheets) {
  const dimensions = readImageInfo(join(heroImageDirectory, relativePath));
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height },
    { width: 1254, height: 1254 },
    `${relativePath} must remain a 5x4 canonical sheet`,
  );
}

const noviceImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-136",
  "normalized-alpha-v1",
);
const measuredNoviceSprites = new Map(noviceSprites.map((relativePath) => {
  const dimensions = readImageInfo(join(noviceImageDirectory, relativePath));
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-136 alpha sprite`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);
  return [relativePath, dimensions];
}));

const warriorImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-137",
  "normalized-alpha-v1",
);
const measuredWarriorSprites = warriorSprites.map((relativePath) => {
  const path = join(warriorImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-137 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const noviceRelativePath = relativePath.replace("warrior-", "novice-");
  const noviceDimensions = measuredNoviceSprites.get(noviceRelativePath);
  assert(noviceDimensions?.visibleBounds, `Missing CDI-136 reference ${noviceRelativePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const noviceVisibleHeight = noviceDimensions.visibleBounds.maxY - noviceDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - noviceVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${noviceRelativePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    noviceDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${noviceRelativePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const warriorTotalBytes = measuredWarriorSprites.reduce((total, entry) => total + entry.bytes, 0);
const warriorSceneBytes = measuredWarriorSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const warriorDecodedBytesPerSprite = 341 * 692 * 4;
const warriorDecodedSceneBytes = warriorDecodedBytesPerSprite * combatHeroLimit;
assert(
  warriorSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-137 Warrior scene exceeds ${sceneBudgetBytes} bytes`,
);

const rogueImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-138",
  "normalized-alpha-v1",
);
const measuredRogueSprites = rogueSprites.map((relativePath) => {
  const path = join(rogueImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-138 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const noviceRelativePath = relativePath.replace("rogue-", "novice-");
  const noviceDimensions = measuredNoviceSprites.get(noviceRelativePath);
  assert(noviceDimensions?.visibleBounds, `Missing CDI-136 reference ${noviceRelativePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const noviceVisibleHeight = noviceDimensions.visibleBounds.maxY - noviceDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - noviceVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${noviceRelativePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    noviceDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${noviceRelativePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const rogueTotalBytes = measuredRogueSprites.reduce((total, entry) => total + entry.bytes, 0);
const rogueSceneBytes = measuredRogueSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const rogueDecodedBytesPerSprite = 341 * 692 * 4;
const rogueDecodedSceneBytes = rogueDecodedBytesPerSprite * combatHeroLimit;
assert(
  rogueSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-138 Rogue scene exceeds ${sceneBudgetBytes} bytes`,
);

const archerImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-139",
  "normalized-alpha-v1",
);
const measuredArcherSprites = archerSprites.map((relativePath) => {
  const path = join(archerImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-139 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const noviceRelativePath = relativePath.replace("archer-", "novice-");
  const noviceDimensions = measuredNoviceSprites.get(noviceRelativePath);
  assert(noviceDimensions?.visibleBounds, `Missing CDI-136 reference ${noviceRelativePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const noviceVisibleHeight = noviceDimensions.visibleBounds.maxY - noviceDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - noviceVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${noviceRelativePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    noviceDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${noviceRelativePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const archerTotalBytes = measuredArcherSprites.reduce((total, entry) => total + entry.bytes, 0);
const archerSceneBytes = measuredArcherSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const archerDecodedBytesPerSprite = 341 * 692 * 4;
const archerDecodedSceneBytes = archerDecodedBytesPerSprite * combatHeroLimit;
assert(
  archerSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-139 Archer scene exceeds ${sceneBudgetBytes} bytes`,
);

const mageImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-140",
  "normalized-alpha-v1",
);
const measuredMageSprites = mageSprites.map((relativePath) => {
  const path = join(mageImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-140 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const noviceRelativePath = relativePath.replace("mage-", "novice-");
  const noviceDimensions = measuredNoviceSprites.get(noviceRelativePath);
  assert(noviceDimensions?.visibleBounds, `Missing CDI-136 reference ${noviceRelativePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const noviceVisibleHeight = noviceDimensions.visibleBounds.maxY - noviceDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - noviceVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${noviceRelativePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    noviceDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${noviceRelativePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const mageTotalBytes = measuredMageSprites.reduce((total, entry) => total + entry.bytes, 0);
const mageSceneBytes = measuredMageSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const mageDecodedBytesPerSprite = 341 * 692 * 4;
const mageDecodedSceneBytes = mageDecodedBytesPerSprite * combatHeroLimit;
assert(
  mageSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-140 Mage scene exceeds ${sceneBudgetBytes} bytes`,
);

const acolyteImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-141",
  "normalized-alpha-v1",
);
const measuredAcolyteSprites = acolyteSprites.map((relativePath) => {
  const path = join(acolyteImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-141 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const noviceRelativePath = relativePath.replace("acolyte-", "novice-");
  const noviceDimensions = measuredNoviceSprites.get(noviceRelativePath);
  assert(noviceDimensions?.visibleBounds, `Missing CDI-136 reference ${noviceRelativePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const noviceVisibleHeight = noviceDimensions.visibleBounds.maxY - noviceDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - noviceVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${noviceRelativePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    noviceDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${noviceRelativePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const acolyteTotalBytes = measuredAcolyteSprites.reduce((total, entry) => total + entry.bytes, 0);
const acolyteSceneBytes = measuredAcolyteSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const acolyteDecodedBytesPerSprite = 341 * 692 * 4;
const acolyteDecodedSceneBytes = acolyteDecodedBytesPerSprite * combatHeroLimit;
assert(
  acolyteSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-141 Acolyte scene exceeds ${sceneBudgetBytes} bytes`,
);

const aedeImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-142",
  "normalized-alpha-v1",
);
const measuredAedeSprites = aedeSprites.map((relativePath) => {
  const path = join(aedeImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-142 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const noviceRelativePath = relativePath.replace("aede-", "novice-");
  const noviceDimensions = measuredNoviceSprites.get(noviceRelativePath);
  assert(noviceDimensions?.visibleBounds, `Missing CDI-136 reference ${noviceRelativePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const noviceVisibleHeight = noviceDimensions.visibleBounds.maxY - noviceDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - noviceVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${noviceRelativePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    noviceDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${noviceRelativePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const aedeTotalBytes = measuredAedeSprites.reduce((total, entry) => total + entry.bytes, 0);
const aedeSceneBytes = measuredAedeSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const aedeDecodedBytesPerSprite = 341 * 692 * 4;
const aedeDecodedSceneBytes = aedeDecodedBytesPerSprite * combatHeroLimit;
assert(
  aedeSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-142 Aede scene exceeds ${sceneBudgetBytes} bytes`,
);

const druidImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-143",
  "normalized-alpha-v1",
);
const measuredDruidSprites = druidSprites.map((relativePath) => {
  const path = join(druidImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-143 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const noviceRelativePath = relativePath.replace("druid-", "novice-");
  const noviceDimensions = measuredNoviceSprites.get(noviceRelativePath);
  assert(noviceDimensions?.visibleBounds, `Missing CDI-136 reference ${noviceRelativePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const noviceVisibleHeight = noviceDimensions.visibleBounds.maxY - noviceDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - noviceVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${noviceRelativePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    noviceDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${noviceRelativePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const druidTotalBytes = measuredDruidSprites.reduce((total, entry) => total + entry.bytes, 0);
const druidSceneBytes = measuredDruidSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const druidDecodedBytesPerSprite = 341 * 692 * 4;
const druidDecodedSceneBytes = druidDecodedBytesPerSprite * combatHeroLimit;
assert(
  druidSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-143 Druid scene exceeds ${sceneBudgetBytes} bytes`,
);

const artificerImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-144",
  "normalized-alpha-v1",
);
const measuredArtificerSprites = artificerSprites.map((relativePath) => {
  const path = join(artificerImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-144 alpha sprite`,
  );
  assert(
    dimensions.transparentPixelCount >= dimensions.width * dimensions.height * 0.1,
    `${relativePath} must contain a substantial transparent background`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  assert(dimensions.visibleBounds, `${relativePath} must contain visible pixels`);

  const gender = relativePath.includes("artificer-female-") ? "female" : "male";
  const referenceVariant = relativePath.includes("artificer-female-04-") ? "08" : "06";
  const mageReferencePath = join(gender, `mage-${gender}-${referenceVariant}-v1.png`);
  const mageDimensions = readImageInfo(join(mageImageDirectory, mageReferencePath));
  assert(mageDimensions.visibleBounds, `Missing CDI-140 reference ${mageReferencePath}`);
  const visibleHeight = dimensions.visibleBounds.maxY - dimensions.visibleBounds.minY + 1;
  const mageVisibleHeight = mageDimensions.visibleBounds.maxY - mageDimensions.visibleBounds.minY + 1;
  assert(
    Math.abs(visibleHeight - mageVisibleHeight) <= 1,
    `${relativePath} must keep the visible height of ${mageReferencePath}`,
  );
  assert.equal(
    dimensions.visibleBounds.maxY,
    mageDimensions.visibleBounds.maxY,
    `${relativePath} feet baseline must match ${mageReferencePath}`,
  );
  const centerX = (dimensions.visibleBounds.minX + dimensions.visibleBounds.maxX) / 2;
  assert(
    Math.abs(centerX - (dimensions.width - 1) / 2) <= 1.5,
    `${relativePath} visible pivot must remain centered`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const artificerTotalBytes = measuredArtificerSprites.reduce((total, entry) => total + entry.bytes, 0);
const artificerSceneBytes = measuredArtificerSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const artificerDecodedBytesPerSprite = 341 * 692 * 4;
const artificerDecodedSceneBytes = artificerDecodedBytesPerSprite * combatHeroLimit;
assert(
  artificerSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-144 Artificer scene exceeds ${sceneBudgetBytes} bytes`,
);

const noviceCombatImageDirectory = join(
  projectRoot,
  "assets",
  "design",
  "hero-sprites",
  "cdi-148",
  "normalized-alpha-v1",
);
const measuredNoviceCombatSprites = noviceCombatSprites.map((relativePath) => {
  const path = join(noviceCombatImageDirectory, relativePath);
  const dimensions = readImageInfo(path);
  assert.deepEqual(
    { width: dimensions.width, height: dimensions.height, alpha: dimensions.alpha },
    { width: 341, height: 692, alpha: true },
    `${relativePath} must remain a normalized CDI-148 combat-idle alpha sprite`,
  );
  assert(
    Math.max(...dimensions.cornerAlphas) <= 2,
    `${relativePath} must not contain an opaque or semi-opaque baked background`,
  );
  return { file: relativePath, bytes: statSync(path).size };
});
const noviceCombatTotalBytes = measuredNoviceCombatSprites.reduce(
  (total, entry) => total + entry.bytes,
  0,
);
const noviceCombatSceneBytes = measuredNoviceCombatSprites
  .map((entry) => entry.bytes)
  .sort((left, right) => right - left)
  .slice(0, combatHeroLimit)
  .reduce((total, bytes) => total + bytes, 0);
const noviceCombatDecodedBytesPerSprite = 341 * 692 * 4;
const noviceCombatDecodedSceneBytes = noviceCombatDecodedBytesPerSprite * combatHeroLimit;
assert(
  noviceCombatSceneBytes <= sceneBudgetBytes,
  `Four-hero CDI-148 combat-idle scene exceeds ${sceneBudgetBytes} bytes`,
);

console.log(JSON.stringify({
  heroSheets: heroSheets.length,
  noviceSprites: noviceSprites.length,
  warriorSprites: warriorSprites.length,
  warriorMetrics: {
    totalBytes: warriorTotalBytes,
    largestFourSceneBytes: warriorSceneBytes,
    decodedBytesPerSprite: warriorDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: warriorDecodedSceneBytes,
  },
  rogueSprites: rogueSprites.length,
  rogueMetrics: {
    totalBytes: rogueTotalBytes,
    largestFourSceneBytes: rogueSceneBytes,
    decodedBytesPerSprite: rogueDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: rogueDecodedSceneBytes,
  },
  archerSprites: archerSprites.length,
  archerMetrics: {
    totalBytes: archerTotalBytes,
    largestFourSceneBytes: archerSceneBytes,
    decodedBytesPerSprite: archerDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: archerDecodedSceneBytes,
  },
  mageSprites: mageSprites.length,
  mageMetrics: {
    totalBytes: mageTotalBytes,
    largestFourSceneBytes: mageSceneBytes,
    decodedBytesPerSprite: mageDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: mageDecodedSceneBytes,
  },
  acolyteSprites: acolyteSprites.length,
  acolyteMetrics: {
    totalBytes: acolyteTotalBytes,
    largestFourSceneBytes: acolyteSceneBytes,
    decodedBytesPerSprite: acolyteDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: acolyteDecodedSceneBytes,
  },
  aedeSprites: aedeSprites.length,
  aedeMetrics: {
    totalBytes: aedeTotalBytes,
    largestFourSceneBytes: aedeSceneBytes,
    decodedBytesPerSprite: aedeDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: aedeDecodedSceneBytes,
  },
  druidSprites: druidSprites.length,
  druidMetrics: {
    totalBytes: druidTotalBytes,
    largestFourSceneBytes: druidSceneBytes,
    decodedBytesPerSprite: druidDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: druidDecodedSceneBytes,
  },
  artificerSprites: artificerSprites.length,
  artificerMetrics: {
    totalBytes: artificerTotalBytes,
    largestFourSceneBytes: artificerSceneBytes,
    decodedBytesPerSprite: artificerDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: artificerDecodedSceneBytes,
  },
  noviceCombatSprites: noviceCombatSprites.length,
  noviceCombatMetrics: {
    totalBytes: noviceCombatTotalBytes,
    largestFourSceneBytes: noviceCombatSceneBytes,
    decodedBytesPerSprite: noviceCombatDecodedBytesPerSprite,
    decodedFourHeroSceneBytes: noviceCombatDecodedSceneBytes,
  },
  heroIdentities: heroSheets.length * 20
    + noviceSprites.length * 2
    + warriorSprites.length * 2
    + rogueSprites.length * 2
    + archerSprites.length * 2
    + mageSprites.length * 2
    + acolyteSprites.length * 2
    + aedeSprites.length * 2
    + druidSprites.length * 2
    + artificerSprites.length * 2,
  sceneBudgetBytes,
  undercityPacks: measuredPacks,
  encounterBytes,
  encounterAssets: measuredEncounters,
  encounterScenes: measuredEncounterScenes,
}, null, 2));
