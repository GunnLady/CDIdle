const DEFAULT_ENEMY_PROVENANCE = "CDIdle ImageGen Bastion des Exclus enemies v1";

export const UNDERCITY_BASTION_BACKGROUND_VISUAL = {
  key: "undercity:bastion:background",
  file: "bastion-exiles-stage-v1.jpg",
  provenance: "CDIdle ImageGen Bastion des Exclus stage v1",
  anchor: { x: 0.5, y: 1 },
  scale: 1,
  fallbackGlyph: "",
} as const;

const enemyVisualTuples = [
  ["banished-sentinel", "a", "banished-sentinel-v1.png", 0.93, 1.584, "V"],
  ["exile-patrol", "a", "palisade-lookout-v1.png", 0.93, 1.42, "G"],
  ["exile-patrol", "b", "exile-blackshot-v1.png", 0.93, 1.48, "T"],
  ["bastion-defenders", "a", "banished-bulwark-v1.png", 0.93, 1.48, "R"],
  ["bastion-defenders", "b", "rampart-eye-v1.png", 0.93, 1.46, "O"],
  ["bastion-defenders", "c", "outcast-surgeon-v1.png", 0.93, 1.4, "C"],
  ["barricade-colossus", "a", "barricade-colossus-v1.png", 0.94, 2.2, "B"],
  ["barricade-warden", "a", "barricade-blade-v1.png", 0.93, 1.43, "L"],
  ["barricade-warden", "b", "barricade-warden-v1.png", 0.94, 2.0, "G"],
  ["barricade-warden", "c", "outcast-surgeon-v1.png", 0.93, 1.4, "C", "CDIdle ImageGen Bastion des Exclus shared surgeon v1"],
  ["outcast-standard-bearer", "a", "banished-bulwark-v1.png", 0.93, 1.5, "G", "CDIdle ImageGen Bastion des Exclus shared bulwark v1"],
  ["outcast-standard-bearer", "b", "outcast-standard-bearer-v1.png", 0.95, 2.2, "P"],
  ["outcast-standard-bearer", "c", "outcast-surgeon-v1.png", 0.93, 1.4, "C", "CDIdle ImageGen Bastion des Exclus shared surgeon v1"],
] as const;

export const UNDERCITY_BASTION_ENEMY_VISUALS = enemyVisualTuples.map(([
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
  provenance,
  anchor: { x: 0.5, y: anchorY },
  scale,
  fallbackGlyph,
}));
