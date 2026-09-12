const DEFAULT_ENEMY_PROVENANCE = "CDIdle ImageGen sewers enemies v1";

export const UNDERCITY_SEWERS_BACKGROUND_VISUAL = {
  key: "undercity:sewers:background",
  file: "undercity-sewers-stage-v1.jpg",
  width: 1536,
  height: 643,
  alpha: false,
  provenance: "CDIdle ImageGen kit Egouts v1",
  anchor: { x: 0.5, y: 1 },
  scale: 1,
  fallbackGlyph: "",
} as const;

const enemyVisualTuples = [
  ["rat-pack", "a", "rat-pack-canal-rat-v1.png", 0.86, 0.84, "R", "CDIdle ImageGen rat-pack v1"],
  ["rat-pack", "b", "rat-pack-mangy-rat-v1.png", 0.88, 0.89, "R", "CDIdle ImageGen rat-pack v1"],
  ["rat-pack", "c", "rat-pack-plague-rat-v1.png", 0.87, 0.91, "R", "CDIdle ImageGen rat-pack v1"],
  ["beetle-swarm", "a", "beetle-swarm-carrion-cockroach-v1.png", 0.89, 0.86, "C"],
  ["beetle-swarm", "b", "beetle-swarm-black-sewer-cockroach-v1.png", 0.89, 0.88, "C"],
  ["beetle-swarm", "c", "beetle-swarm-pipe-cockroach-v1.png", 0.89, 0.83, "C"],
  ["pipe-slime", "a", "pipe-slime-v1.png", 0.9, 1.15, "S"],
  ["colossal-rat", "a", "colossal-rat-v1.png", 0.9, 1.32, "R"],
  ["sewer-warden", "a", "sewer-warden-lock-biter-v1.png", 0.9, 1.06, "R"],
  ["sewer-warden", "b", "sewer-warden-iron-gnawer-v1.png", 0.9, 1.22, "R"],
  ["vermin-mother", "a", "vermin-mother-v1.png", 0.93, 1.6, "M"],
] as const;

export const UNDERCITY_SEWERS_ENEMY_VISUALS = enemyVisualTuples.map(([
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
