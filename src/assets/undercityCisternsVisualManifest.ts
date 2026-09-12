const DEFAULT_ENEMY_PROVENANCE = "CDIdle ImageGen forgotten cisterns enemies v1";

export const UNDERCITY_CISTERNS_BACKGROUND_VISUAL = {
  key: "undercity:cisterns:background",
  file: "forgotten-cisterns-stage-v1.jpg",
  width: 1536,
  height: 643,
  alpha: false,
  provenance: "CDIdle ImageGen forgotten cisterns v1",
  anchor: { x: 0.5, y: 1 },
  scale: 1,
  fallbackGlyph: "",
} as const;

const enemyVisualTuples = [
  ["water-parasites", "a", "mud-lamprey-v2.png", 0.91, 0.98, "L", "CDIdle ImageGen cistern creatures pixel v2"],
  ["water-parasites", "b", "valve-crab-v1.png", 0.9, 1.02, "C"],
  ["water-parasites", "c", "black-pit-eel-v2.png", 0.92, 0.94, "A", "CDIdle ImageGen cistern creatures pixel v2"],
  ["reservoir-slime", "a", "dead-water-slime-v2.png", 0.93, 1.04, "S", "CDIdle ImageGen sewer slime adaptation v2"],
  ["refuge-warden", "a", "drowned-refuge-warden-v2.png", 0.9, 1.43, "V", "CDIdle ImageGen cross-referenced drowned warden v2"],
  ["cistern-leeches", "a", "pale-cistern-leech-v2.png", 0.91, 0.86, "S", "CDIdle ImageGen valve crab style leeches v2"],
  ["cistern-leeches", "b", "armored-cistern-leech-v2.png", 0.9, 0.9, "S", "CDIdle ImageGen valve crab style leeches v2"],
  ["valve-sentinel", "a", "water-sentinel-v1.png", 0.95, 1.62, "S"],
  ["valve-sentinel", "b", "valve-crab-v1.png", 0.9, 1.02, "C", "CDIdle ImageGen forgotten cisterns enemies v1 shared crab family"],
  ["dead-water-warden", "a", "dead-water-warden-v2.png", 0.94, 2.05, "G", "CDIdle ImageGen submerged armor references v2"],
] as const;

export const UNDERCITY_CISTERNS_ENEMY_VISUALS = enemyVisualTuples.map(([
  blueprintId,
  memberKey,
  file,
  anchorY,
  scale,
  fallbackGlyph,
  provenance = DEFAULT_ENEMY_PROVENANCE,
]) => ({
  blueprintId,
  memberKey,
  file,
  width: 384,
  height: 384,
  alpha: true,
  provenance,
  anchor: { x: 0.5, y: anchorY },
  scale,
  fallbackGlyph,
}));
