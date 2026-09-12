const DEFAULT_ENEMY_PROVENANCE = "CDIdle ImageGen smugglers enemies v1";

export const UNDERCITY_SMUGGLERS_BACKGROUND_VISUAL = {
  key: "undercity:smugglers:background",
  file: "smugglers-gallery-stage-v1.jpg",
  width: 1536,
  height: 643,
  alpha: false,
  provenance: "CDIdle ImageGen smugglers gallery v1",
  anchor: { x: 0.5, y: 1 },
  scale: 1,
  fallbackGlyph: "",
} as const;

const enemyVisualTuples = [
  ["smuggler-escort", "a", "smuggler-guard-v1.png", 0.93, 1.44, "G"],
  ["smuggler-escort", "b", "smuggler-crossbowman-v1.png", 0.93, 1.52, "A"],
  ["smuggler-escort", "c", "tunnel-medic-v2.png", 0.93, 1.41, "M", "CDIdle ImageGen smugglers diverse humans v2"],
  ["goblin-scavengers", "a", "goblin-copper-scavenger-v1.png", 0.91, 1.24, "G"],
  ["goblin-scavengers", "b", "goblin-lookout-v1.png", 0.92, 1.2, "G"],
  ["hound-handler", "a", "chainbreaker-hound-v1.png", 0.9, 1.35, "M"],
  ["hound-handler", "b", "gallery-chainmaster-v1.png", 0.93, 1.32, "M"],
  ["tribute-cutthroat", "a", "tribute-cutthroat-v2.png", 0.93, 1.5, "C", "CDIdle ImageGen smugglers diverse humans v2"],
  ["smuggler-captain", "a", "smuggler-sworn-blade-v2.png", 0.93, 1.36, "L", "CDIdle ImageGen smugglers diverse humans v2"],
  ["smuggler-captain", "b", "smuggler-captain-v1.png", 0.94, 1.42, "C"],
  ["smuggler-captain", "c", "smuggler-alchemist-v1.png", 0.93, 1.36, "A"],
  ["tribute-collector", "a", "tribute-guard-v1.png", 0.93, 1.44, "G", "CDIdle ImageGen tribute retinue v1"],
  ["tribute-collector", "b", "tribute-collector-v1.png", 0.95, 1.45, "C"],
  ["tribute-collector", "c", "tribute-apothecary-v1.png", 0.93, 1.36, "A", "CDIdle ImageGen tribute retinue v1"],
] as const;

export const UNDERCITY_SMUGGLERS_ENEMY_VISUALS = enemyVisualTuples.map(([
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
