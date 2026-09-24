import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT = 10;
// Indexes match the four identities shown on each of the five cinema review pages.
const femaleScales = [0.65, 0.72, 0.68, 0.7, 0.7, 0.7, 0.75, 0.75, 0.7, 0.7];
const maleScales = [0.65, 0.8, 0.68, 0.9, 0.75, 0.83, 0.75, 0.75, 0.75, 0.75];

export function getCdi152MageCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[variant % CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT] ?? 1;
}

const combatIdleUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/{male,female}/*.webp",
  { eager: true, import: "default" },
);

export function getCdi152MageCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = (
    (variant % CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT)
    + CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT
  ) % CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT;
  const filename = `mage-${gender.toLowerCase()}-${String(normalizedVariant + 1).padStart(2, "0")}-combat-idle-v1.webp`;
  return Object.entries(combatIdleUrls).find(([path]) => path.endsWith(filename))?.[1] ?? null;
}
