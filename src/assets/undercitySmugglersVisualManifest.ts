const DEFAULT_ENEMY_PROVENANCE = "CDIdle ImageGen smugglers enemies v1";
const ESCORT_ENEMY_PROVENANCE = "CDIdle ImageGen CDI-146 escort approved 2026-10-01";

export const UNDERCITY_SMUGGLERS_BACKGROUND_VISUAL = {
  key: "undercity:smugglers:background",
  file: "smugglers-gallery-stage-v1.jpg",
  provenance: "CDIdle ImageGen smugglers gallery v1",
  anchor: { x: 0.5, y: 1 },
  scale: 1,
  fallbackGlyph: "",
} as const;

const enemyVisualTuples = [
  ["smuggler-escort", "a", "smuggler-guard-v1.png", 0.93, 1.39, "G", ESCORT_ENEMY_PROVENANCE],
  ["smuggler-escort", "b", "smuggler-crossbowman-v1.png", 0.93, 1.47, "A", ESCORT_ENEMY_PROVENANCE],
  ["smuggler-escort", "c", "tunnel-medic-v2.png", 0.93, 1.36, "M", ESCORT_ENEMY_PROVENANCE],
  ["goblin-scavengers", "a", "goblin-copper-scavenger-v1.png", 0.91, 1.24, "G"],
  ["goblin-scavengers", "b", "goblin-lookout-v1.png", 0.92, 1.2, "G"],
  ["hound-handler", "a", "chainbreaker-hound-v1.png", 0.9, 1.35, "M"],
  ["hound-handler", "b", "gallery-chainmaster-v1.png", 0.93, 1.32, "M", "CDIdle ImageGen CDI-146 chainmaster approved 2026-10-01"],
  ["tribute-cutthroat", "a", "tribute-cutthroat-v2.png", 0.93, 1.5, "C", "CDIdle ImageGen CDI-146 cutthroat approved 2026-10-01"],
  ["smuggler-captain", "a", "smuggler-sworn-blade-v2.png", 0.93, 1.36, "L", "CDIdle ImageGen CDI-146 sworn blade approved 2026-10-01"],
  ["smuggler-captain", "b", "smuggler-captain-v1.png", 0.94, 1.42, "C", "CDIdle ImageGen CDI-146 captain approved 2026-10-01"],
  ["smuggler-captain", "c", "smuggler-alchemist-v1.png", 0.93, 1.36, "A", "CDIdle ImageGen CDI-146 alchemist approved 2026-10-01"],
  ["tribute-collector", "a", "tribute-guard-v1.png", 0.93, 1.44, "G", "CDIdle ImageGen CDI-146 tribute guard approved 2026-10-01"],
  ["tribute-collector", "b", "tribute-collector-v1.png", 0.95, 1.45, "C", "CDIdle ImageGen CDI-146 collector approved 2026-10-01"],
  ["tribute-collector", "c", "tribute-apothecary-v1.png", 0.93, 1.36, "A", "CDIdle ImageGen CDI-146 apothecary approved 2026-10-01"],
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
  provenance,
  anchor: { x: 0.5, y: anchorY },
  scale,
  fallbackGlyph,
}));
