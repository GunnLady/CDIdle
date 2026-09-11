import type { EncounterSceneTeam } from "./encounterSceneProjection";

export const DUNGEON_SCENE_HERO_LIMIT = 4;
export const DUNGEON_SCENE_ENEMY_LIMIT = 3;

export type DungeonSceneLayout = "standard" | "zoomed";

export interface DungeonSceneSlot {
  xPercent: number;
  yPercent: number;
  scale: number;
  layer: number;
}

const sceneSlots = {
  standard: {
    heroes: [
      { xPercent: 35, yPercent: 70, layer: 4 },
      { xPercent: 25, yPercent: 52, layer: 2 },
      { xPercent: 10, yPercent: 58, layer: 1 },
      { xPercent: 18, yPercent: 82, layer: 3 },
    ],
    enemies: [
      { xPercent: 69, yPercent: 74, layer: 4 },
      { xPercent: 79, yPercent: 64, layer: 2 },
      { xPercent: 87, yPercent: 83, layer: 5 },
    ],
  },
  zoomed: {
    heroes: [
      { xPercent: 14, yPercent: 76, layer: 4 },
      { xPercent: 38, yPercent: 83, layer: 5 },
      { xPercent: 62, yPercent: 76, layer: 4 },
      { xPercent: 87, yPercent: 83, layer: 5 },
    ],
    enemies: [
      { xPercent: 22, yPercent: 55, layer: 2 },
      { xPercent: 47, yPercent: 52, layer: 1 },
      { xPercent: 78, yPercent: 55, layer: 2 },
    ],
  },
} as const;

const depthScaleRanges = {
  standard: { backY: 44, frontY: 76, backScale: 0.94, frontScale: 1.04 },
  zoomed: { backY: 44, frontY: 76, backScale: 0.86, frontScale: 0.94 },
} as const;

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
);

export function getDungeonSceneDepthScale(
  yPercent: number,
  layout: DungeonSceneLayout,
): number {
  const range = depthScaleRanges[layout];
  const depth = clamp((yPercent - range.backY) / (range.frontY - range.backY), 0, 1);
  return Number((range.backScale + ((range.frontScale - range.backScale) * depth)).toFixed(3));
}

export function getDungeonSceneSlot(
  team: EncounterSceneTeam,
  slot: number,
  layout: DungeonSceneLayout,
): DungeonSceneSlot | null {
  const placement = sceneSlots[layout][team][slot];
  return placement
    ? { ...placement, scale: getDungeonSceneDepthScale(placement.yPercent, layout) }
    : null;
}
