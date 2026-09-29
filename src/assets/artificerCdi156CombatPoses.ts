import female1 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-01-combat-idle-v1.webp";
import female2 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-02-combat-idle-v1.webp";
import female3 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-03-combat-idle-v1.webp";
import female4 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-04-combat-idle-v1.webp";
import female5 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-05-combat-idle-v1.webp";
import female6 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-06-combat-idle-v1.webp";
import female7 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-07-combat-idle-v1.webp";
import female8 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-08-combat-idle-v1.webp";
import female9 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-09-combat-idle-v1.webp";
import female10 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/female/artificer-female-10-combat-idle-v1.webp";
import male1 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-01-combat-idle-v1.webp";
import male2 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-02-combat-idle-v1.webp";
import male3 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-03-combat-idle-v1.webp";
import male4 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-04-combat-idle-v1.webp";
import male5 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-05-combat-idle-v1.webp";
import male6 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-06-combat-idle-v1.webp";
import male7 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-07-combat-idle-v1.webp";
import male8 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-08-combat-idle-v1.webp";
import male9 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-09-combat-idle-v1.webp";
import male10 from "../../assets/design/hero-sprites/cdi-156/runtime-webp-v1/male/artificer-male-10-combat-idle-v1.webp";
import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI156_ARTIFICER_COMBAT_IDLE_VARIANT_COUNT = 10;

// Face/head landmark calibration: cdi-156/face-calibration.json.
// Final scales cinema-validated by the user on 2026-09-27 after per-identity adjustments.
const femaleScales = [0.8, 0.83, 0.8, 0.88, 0.79, 0.83, 0.88, 0.56, 0.79, 0.8];
const maleScales = [0.79, 0.82, 0.77, 0.89, 0.82, 0.84, 0.82, 0.85, 0.75, 0.82];

function normalizeVariant(variant: number): number {
  return ((variant % CDI156_ARTIFICER_COMBAT_IDLE_VARIANT_COUNT) + CDI156_ARTIFICER_COMBAT_IDLE_VARIANT_COUNT) % CDI156_ARTIFICER_COMBAT_IDLE_VARIANT_COUNT;
}

export function getCdi156ArtificerCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[normalizeVariant(variant)];
}

const combatIdleUrls = [female1, female2, female3, female4, female5, female6, female7, female8, female9, female10, male1, male2, male3, male4, male5, male6, male7, male8, male9, male10];

export function getCdi156ArtificerCombatIdleUrl(gender: HeroPortraitGender, variant: number): string {
  const index = normalizeVariant(variant);
  return combatIdleUrls[(gender === "Female" ? 0 : CDI156_ARTIFICER_COMBAT_IDLE_VARIANT_COUNT) + index];
}

// Support pivots preserved in the user-validated cinema composition.
const femalePivots = [0.42, 0.5, 0.34, 0.5, 0.46, 0.43, 0.5, 0.42, 0.47, 0.5];
const malePivots = [0.5, 0.33, 0.5, 0.5, 0.36, 0.5, 0.44, 0.5, 0.5, 0.5];

export function getCdi156ArtificerCombatIdlePivotX(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femalePivots : malePivots)[normalizeVariant(variant)];
}
