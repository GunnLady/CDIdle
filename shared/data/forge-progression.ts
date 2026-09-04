import type { Resources } from "../contracts/game.ts";

export type ForgeProgressionLevel = {
  level: number;
  itemLevelRange: { min: number; max: number };
  requiredFloor: number;
  upgradeCost: Resources;
};

export const FORGE_PROGRESSION_LEVELS = [
  { level: 1, itemLevelRange: { min: 1, max: 5 }, requiredFloor: 3, upgradeCost: { gold: 600, food: 150, wood: 450, stone: 300, ore: 250 } },
  { level: 2, itemLevelRange: { min: 6, max: 10 }, requiredFloor: 8, upgradeCost: { gold: 600, food: 150, wood: 450, stone: 300, ore: 250 } },
  { level: 3, itemLevelRange: { min: 11, max: 15 }, requiredFloor: 11, upgradeCost: { gold: 960, food: 240, wood: 720, stone: 480, ore: 400 } },
  { level: 4, itemLevelRange: { min: 16, max: 20 }, requiredFloor: 18, upgradeCost: { gold: 1_540, food: 385, wood: 1_155, stone: 770, ore: 645 } },
  { level: 5, itemLevelRange: { min: 21, max: 25 }, requiredFloor: 26, upgradeCost: { gold: 2_460, food: 615, wood: 1_845, stone: 1_230, ore: 1_025 } },
  { level: 6, itemLevelRange: { min: 26, max: 30 }, requiredFloor: 36, upgradeCost: { gold: 3_935, food: 985, wood: 2_950, stone: 1_970, ore: 1_640 } },
  { level: 7, itemLevelRange: { min: 31, max: 35 }, requiredFloor: 49, upgradeCost: { gold: 6_295, food: 1_575, wood: 4_720, stone: 3_150, ore: 2_625 } },
  { level: 8, itemLevelRange: { min: 36, max: 40 }, requiredFloor: 62, upgradeCost: { gold: 10_070, food: 2_520, wood: 7_550, stone: 5_035, ore: 4_195 } },
] as const satisfies readonly ForgeProgressionLevel[];

export const MAX_FORGE_LEVEL = FORGE_PROGRESSION_LEVELS.length;

export function getForgeProgressionLevel(level: number): ForgeProgressionLevel | undefined {
  return FORGE_PROGRESSION_LEVELS.find((entry) => entry.level === level);
}

export function getForgeLevelForItemLevel(itemLevel: number): number {
  return Math.ceil(itemLevel / 5);
}
