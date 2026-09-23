import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI149_WARRIOR_COMBAT_IDLE_VARIANT_COUNT = 10;
export const CDI149_WARRIOR_COMBAT_IDLE_FRAME_HEIGHT = 920;
export const CDI149_WARRIOR_COMBAT_IDLE_VISIBLE_BOTTOM = 900;
export const CDI149_WARRIOR_NEUTRAL_FRAME_HEIGHT = 692;

type WarriorCombatGender = Lowercase<HeroPortraitGender>;

// Manual readings on the normalized alpha exports. Each value is the middle
// of the empty interval between the two foot-support regions, in source pixels.
// Weapon extremities are deliberately excluded from this horizontal pivot.
const feetGapMidpointByGender: Readonly<Record<WarriorCombatGender, readonly number[]>> = {
  male: [358, 240, 265, 331.5, 257, 290, 296.5, 322.5, 197, 252.5],
  female: [213, 338.5, 335, 270, 221, 255, 254.5, 230, 244, 314.5],
};

const frameWidthByGender: Readonly<Record<WarriorCombatGender, readonly number[]>> = {
  male: [654, 626, 750, 832, 483, 900, 579, 992, 433, 555],
  female: [838, 776, 556, 666, 457, 739, 464, 495, 494, 776],
};

const combatIdleUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-149/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

const combatIdleByKey = new Map<string, string>();
for (const [path, url] of Object.entries(combatIdleUrls)) {
  const match = /warrior-(male|female)-(\d{2})-combat-idle-v1\.png$/.exec(path);
  if (match) combatIdleByKey.set(`${match[1]}:${match[2]}`, url);
}

function normalizeVariant(variant: number): number {
  return (
    (variant % CDI149_WARRIOR_COMBAT_IDLE_VARIANT_COUNT)
    + CDI149_WARRIOR_COMBAT_IDLE_VARIANT_COUNT
  ) % CDI149_WARRIOR_COMBAT_IDLE_VARIANT_COUNT;
}

export function getCdi149WarriorCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = normalizeVariant(variant);
  const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
  return combatIdleByKey.get(key) ?? null;
}

export function getCdi149WarriorCombatIdlePivotX(
  gender: HeroPortraitGender,
  variant: number,
): number {
  const normalizedGender = gender.toLowerCase() as WarriorCombatGender;
  const normalizedVariant = normalizeVariant(variant);
  return feetGapMidpointByGender[normalizedGender][normalizedVariant]
    / frameWidthByGender[normalizedGender][normalizedVariant];
}
