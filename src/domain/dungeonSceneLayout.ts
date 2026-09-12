import type { EncounterSceneTeam } from "./encounterSceneProjection";

export const DUNGEON_SCENE_HERO_LIMIT = 4;
export const DUNGEON_SCENE_ENEMY_LIMIT = 3;

export type DungeonSceneLayout = "standard" | "zoomed";
export type DungeonNonCombatSceneKind = "treasure" | "rest";

export interface DungeonSceneSlot {
  xPercent: number;
  yPercent: number;
  scale: number;
  layer: number;
}

const sceneSlots = {
  standard: {
    heroes: [
      { xPercent: 35, yPercent: 70, layer: 4, scale: 1.021 },
      { xPercent: 26, yPercent: 52, layer: 2, scale: 0.965 },
      { xPercent: 9, yPercent: 60, layer: 1, scale: 0.984 },
      { xPercent: 18, yPercent: 82, layer: 3, scale: 1.04 },
    ],
    enemies: [
      { xPercent: 69, yPercent: 74, layer: 4, scale: 1.034 },
      { xPercent: 79, yPercent: 64, layer: 2, scale: 1.002 },
      { xPercent: 87, yPercent: 83, layer: 5, scale: 1.04 },
    ],
  },
  zoomed: {
    heroes: [
      { xPercent: 14, yPercent: 76, layer: 4, scale: 0.94 },
      { xPercent: 38, yPercent: 83, layer: 5, scale: 0.94 },
      { xPercent: 62, yPercent: 76, layer: 4, scale: 0.94 },
      { xPercent: 87, yPercent: 83, layer: 5, scale: 0.94 },
    ],
    enemies: [
      { xPercent: 22, yPercent: 55, layer: 2, scale: 0.887 },
      { xPercent: 47, yPercent: 52, layer: 1, scale: 0.88 },
      { xPercent: 78, yPercent: 55, layer: 2, scale: 0.887 },
    ],
  },
} as const;

const depthScaleRanges = {
  standard: { backY: 44, frontY: 76, backScale: 0.94, frontScale: 1.04 },
  zoomed: { backY: 44, frontY: 76, backScale: 0.86, frontScale: 0.94 },
} as const;

const nonCombatSceneSlots = {
  standard: {
    treasure: [
      { xPercent: 39, yPercent: 84, layer: 5 },
      { xPercent: 28, yPercent: 73, layer: 2 },
      { xPercent: 72, yPercent: 73, layer: 1 },
      { xPercent: 61, yPercent: 84, layer: 4 },
    ],
    rest: [
      { xPercent: 41, yPercent: 78, layer: 5 },
      { xPercent: 32, yPercent: 62, layer: 2 },
      { xPercent: 67, yPercent: 64, layer: 1 },
      { xPercent: 60, yPercent: 79, layer: 4 },
    ],
  },
  zoomed: {
    treasure: [
      { xPercent: 34, yPercent: 82, layer: 5 },
      { xPercent: 12, yPercent: 72, layer: 2 },
      { xPercent: 88, yPercent: 72, layer: 1 },
      { xPercent: 66, yPercent: 82, layer: 4 },
    ],
    rest: [
      { xPercent: 40, yPercent: 79, layer: 5 },
      { xPercent: 25, yPercent: 63, layer: 2 },
      { xPercent: 74, yPercent: 66, layer: 1 },
      { xPercent: 60, yPercent: 80, layer: 4 },
    ],
  },
} as const;

export function getDungeonSceneDepthScale(
  yPercent: number,
  layout: DungeonSceneLayout,
): number {
  const range = depthScaleRanges[layout];
  const depth = Math.min(1, Math.max(0, (yPercent - range.backY) / (range.frontY - range.backY)));
  return Number((range.backScale + ((range.frontScale - range.backScale) * depth)).toFixed(3));
}

export function getDungeonSceneSlot(
  team: EncounterSceneTeam,
  slot: number,
  layout: DungeonSceneLayout,
): DungeonSceneSlot | null {
  return sceneSlots[layout][team][slot] ?? null;
}

export function getDungeonNonCombatSceneSlot(
  kind: DungeonNonCombatSceneKind,
  slot: number,
  layout: DungeonSceneLayout,
): DungeonSceneSlot | null {
  const position = nonCombatSceneSlots[layout][kind][slot];
  if (!position) return null;
  return {
    ...position,
    scale: getDungeonSceneDepthScale(position.yPercent, layout),
  };
}
