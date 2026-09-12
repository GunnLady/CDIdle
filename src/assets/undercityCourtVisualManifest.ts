const DEFAULT_ENEMY_PROVENANCE = "CDIdle ImageGen Cour du Roi des Rats enemies v1";

export const UNDERCITY_COURT_BACKGROUND_VISUAL = {
  key: "undercity:court:background",
  file: "rat-king-court-stage-v1.jpg",
  provenance: "CDIdle ImageGen Cour du Roi des Rats stage v1",
  anchor: { x: 0.5, y: 1 },
  scale: 1,
  fallbackGlyph: "",
} as const;

const enemyVisualTuples = [
  ["court-guard", "a", "court-living-bulwark-v4.png", 0.93, 1.632, "P", "CDIdle ImageGen Cour guard green-screen left-lit v4"],
  ["court-guard", "b", "court-royal-crossbowman-v4.png", 0.93, 1.599, "A", "CDIdle ImageGen Cour guard green-screen left-lit v4"],
  ["court-guard", "c", "dungeon-medic-v4.png", 0.93, 1.565, "M", "CDIdle ImageGen distinct dungeon medic green-screen left-lit v4"],
  ["court-vermin", "a", "court-rat-v4.png", 0.91, 1.15, "R", "CDIdle ImageGen court hunting rat green-screen left-lit despill v4"],
  ["court-vermin", "b", "court-dungeon-devourer-v3.png", 0.93, 1.55, "D", "CDIdle ImageGen dungeon devourer green-screen left-lit despill v3"],
  ["chamberlain-escort", "a", "chamberlain-blade-v3.png", 0.93, 1.58, "L", "CDIdle ImageGen twin-axe chamberlain blade green-screen left-lit v3"],
  ["chamberlain-escort", "b", "deep-chamberlain-v3.png", 0.94, 1.5, "C", "CDIdle ImageGen weathered deep chamberlain green-screen left-lit v3"],
  ["chamberlain-escort", "c", "deep-alchemist-v2.png", 0.93, 1.42, "A", "CDIdle ImageGen chamberlain escort green-screen left-lit v2"],
  ["court-champion", "a", "court-champion-v3.png", 0.94, 2.24, "C", "CDIdle ImageGen Court Champion green-screen left-lit v3"],
  ["king-herald", "a", "herald-blade-bearer-v4.png", 0.93, 1.55, "P", "CDIdle ImageGen ash-blond Herald blade-bearer green-screen left-lit v4"],
  ["king-herald", "b", "rat-king-herald-v5.png", 0.94, 1.41, "H", "CDIdle ImageGen left-facing Rat King herald green-screen left-lit v5"],
  ["king-herald", "c", "dungeon-medic-v4.png", 0.93, 1.42, "M", "CDIdle ImageGen Cour du Roi des Rats shared dungeon medic v4"],
  ["rat-king", "a", "rat-king-left-blade-v2.png", 0.93, 1.55, "S", "CDIdle ImageGen Rat King left blade green-screen left-lit v2"],
  ["rat-king", "b", "rat-king-right-blade-v2.png", 0.93, 1.55, "D", "CDIdle ImageGen Rat King right blade green-screen left-lit v2"],
  ["rat-king", "c", "rat-king-v3.png", 0.95, 2.31, "R", "CDIdle ImageGen massive muscular Rat King royal axe green-screen left-lit v3"],
] as const;

export const UNDERCITY_COURT_ENEMY_VISUALS = enemyVisualTuples.map(([
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

export const UNDERCITY_COURT_ENEMY_VARIANT_VISUALS = [{
  blueprintId: "rat-king",
  memberKey: "c",
  variantKey: "monstrous",
  file: "rat-king-monster-form-v3.png",
  provenance: "CDIdle ImageGen large-canvas high-detail corrupted weaponless Rat King phase 2 green-screen left-lit v3",
  anchor: { x: 0.5, y: 0.95 },
  scale: 2.6,
  fallbackGlyph: "R",
}] as const;
