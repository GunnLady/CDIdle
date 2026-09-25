import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT = 10;

const femaleScales = [0.665, 0.665, 0.735, 0.735, 0.7, 0.78, 0.75, 0.75, 0.65, 0.65];
const maleScales = [0.665, 0.7, 0.735, 0.8, 0.75, 0.9, 0.8, 0.7, 0.75, 0.66];

export function getCdi153AcolyteCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[variant % CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT] ?? 0.7;
}

const combatIdleUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/{male,female}/*.webp",
  { eager: true, import: "default" },
);

export function getCdi153AcolyteCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = (
    (variant % CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT)
    + CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT
  ) % CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT;
  const filename = `acolyte-${gender.toLowerCase()}-${String(normalizedVariant + 1).padStart(2, "0")}-combat-idle-v1.webp`;
  return Object.entries(combatIdleUrls).find(([path]) => path.endsWith(filename))?.[1] ?? null;
}
