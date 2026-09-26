import female1 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-01-combat-idle-v1.webp";
import female2 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-02-combat-idle-v1.webp";
import female3 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-03-combat-idle-v1.webp";
import female4 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-04-combat-idle-v1.webp";
import female5 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-05-combat-idle-v1.webp";
import female6 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-06-combat-idle-v1.webp";
import female7 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-07-combat-idle-v1.webp";
import female8 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-08-combat-idle-v1.webp";
import female9 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-09-combat-idle-v1.webp";
import female10 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/female/druid-female-10-combat-idle-v1.webp";
import male1 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-01-combat-idle-v1.webp";
import male2 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-02-combat-idle-v1.webp";
import male3 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-03-combat-idle-v2.webp";
import male4 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-04-combat-idle-v1.webp";
import male5 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-05-combat-idle-v1.webp";
import male6 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-06-combat-idle-v1.webp";
import male7 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-07-combat-idle-v1.webp";
import male8 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-08-combat-idle-v1.webp";
import male9 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-09-combat-idle-v1.webp";
import male10 from "../../assets/design/hero-sprites/cdi-155/runtime-webp-v1/male/druid-male-10-combat-idle-v1.webp";
import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI155_DRUID_COMBAT_IDLE_VARIANT_COUNT = 10;

// Scales calibrated and cinema-validated by the user on 2026-09-26.
const femaleScales = [0.75, 0.75, 0.75, 0.7, 0.83, 0.75, 0.83, 0.8, 0.75, 0.75];
const maleScales = [0.8, 0.8, 0.85, 0.85, 0.75, 0.8, 0.83, 0.75, 0.7, 0.83];

function normalizeVariant(variant: number): number {
  return ((variant % CDI155_DRUID_COMBAT_IDLE_VARIANT_COUNT) + CDI155_DRUID_COMBAT_IDLE_VARIANT_COUNT) % CDI155_DRUID_COMBAT_IDLE_VARIANT_COUNT;
}


export function getCdi155DruidCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[normalizeVariant(variant)];
}

const combatIdleUrls = [female1, female2, female3, female4, female5, female6, female7, female8, female9, female10, male1, male2, male3, male4, male5, male6, male7, male8, male9, male10];

export function getCdi155DruidCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string {
  const normalizedVariant = normalizeVariant(variant);
  return combatIdleUrls[(gender === "Female" ? 0 : CDI155_DRUID_COMBAT_IDLE_VARIANT_COUNT) + normalizedVariant];
}

// Keep the two long left-facing weapons inside the stage at desktop widths.
export function getCdi155DruidCombatIdlePivotX(gender: HeroPortraitGender, variant: number): number {
  const index = normalizeVariant(variant);
  return gender === "Female" ? (index === 3 ? 0.47 : index === 5 ? 0.4 : 0.5) : 0.5;
}
