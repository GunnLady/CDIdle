import female1 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-01-combat-idle-v1.webp";
import female2 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-02-combat-idle-v1.webp";
import female3 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-03-combat-idle-v1.webp";
import female4 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-04-combat-idle-v1.webp";
import female5 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-05-combat-idle-v1.webp";
import female6 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-06-combat-idle-v1.webp";
import female7 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-07-combat-idle-v1.webp";
import female8 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-08-combat-idle-v1.webp";
import female9 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-09-combat-idle-v1.webp";
import female10 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/female/aede-female-10-combat-idle-v1.webp";
import male1 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-01-combat-idle-v1.webp";
import male2 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-02-combat-idle-v1.webp";
import male3 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-03-combat-idle-v1.webp";
import male4 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-04-combat-idle-v1.webp";
import male5 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-05-combat-idle-v1.webp";
import male6 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-06-combat-idle-v1.webp";
import male7 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-07-combat-idle-v1.webp";
import male8 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-08-combat-idle-v1.webp";
import male9 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-09-combat-idle-v1.webp";
import male10 from "../../assets/design/hero-sprites/cdi-154/runtime-webp-v1/male/aede-male-10-combat-idle-v1.webp";
import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI154_AEDE_COMBAT_IDLE_VARIANT_COUNT = 10;

// Per-identity scales adjusted and cinema-validated by the user on 2026-09-26.
const femaleScales = [0.75, 0.8, 0.7, 0.88, 0.7, 0.78, 0.78, 0.8, 0.75, 0.7];
const maleScales = [0.75, 0.75, 0.78, 0.88, 0.7, 0.8, 0.78, 0.75, 0.75, 0.75];
const femalePivots = [0.5, 0.55, 0.51, 0.52, 0.43, 0.49, 0.5, 0.48, 0.51, 0.57];
const malePivots = [0.48, 0.5, 0.54, 0.6, 0.51, 0.52, 0.54, 0.46, 0.62, 0.5];

function normalizeVariant(variant: number): number {
  return ((variant % CDI154_AEDE_COMBAT_IDLE_VARIANT_COUNT) + CDI154_AEDE_COMBAT_IDLE_VARIANT_COUNT) % CDI154_AEDE_COMBAT_IDLE_VARIANT_COUNT;
}

export function getCdi154AedeCombatIdlePivotX(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femalePivots : malePivots)[normalizeVariant(variant)];
}

export function getCdi154AedeCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[normalizeVariant(variant)];
}

const combatIdleUrls = [female1, female2, female3, female4, female5, female6, female7, female8, female9, female10, male1, male2, male3, male4, male5, male6, male7, male8, male9, male10];

export function getCdi154AedeCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string {
  const normalizedVariant = normalizeVariant(variant);
  return combatIdleUrls[(gender === "Female" ? 0 : CDI154_AEDE_COMBAT_IDLE_VARIANT_COUNT) + normalizedVariant];
}
