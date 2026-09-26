import female1 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-01-combat-idle-v1.webp";
import female2 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-02-combat-idle-v1.webp";
import female3 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-03-combat-idle-v1.webp";
import female4 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-04-combat-idle-v1.webp";
import female5 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-05-combat-idle-v1.webp";
import female6 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-06-combat-idle-v1.webp";
import female7 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-07-combat-idle-v1.webp";
import female8 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-08-combat-idle-v1.webp";
import female9 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-09-combat-idle-v1.webp";
import female10 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/female/mage-female-10-combat-idle-v1.webp";
import male1 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-01-combat-idle-v1.webp";
import male2 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-02-combat-idle-v1.webp";
import male3 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-03-combat-idle-v1.webp";
import male4 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-04-combat-idle-v1.webp";
import male5 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-05-combat-idle-v1.webp";
import male6 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-06-combat-idle-v1.webp";
import male7 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-07-combat-idle-v1.webp";
import male8 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-08-combat-idle-v1.webp";
import male9 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-09-combat-idle-v1.webp";
import male10 from "../../assets/design/hero-sprites/cdi-152/runtime-webp-v1/male/mage-male-10-combat-idle-v1.webp";
import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT = 10;
// Indexes match the four identities shown on each of the five cinema review pages.
const femaleScales = [0.65, 0.72, 0.68, 0.7, 0.7, 0.7, 0.75, 0.75, 0.7, 0.7];
const maleScales = [0.65, 0.8, 0.68, 0.9, 0.75, 0.83, 0.75, 0.75, 0.75, 0.75];

export function getCdi152MageCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[variant % CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT] ?? 1;
}

// Explicit imports keep source-directory lookup keys out of the runtime bundle.
const combatIdleUrls = [female1, female2, female3, female4, female5, female6, female7, female8, female9, female10, male1, male2, male3, male4, male5, male6, male7, male8, male9, male10];

export function getCdi152MageCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = (
    (variant % CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT)
    + CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT
  ) % CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT;
  return combatIdleUrls[(gender === "Female" ? 0 : CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT) + normalizedVariant] ?? null;
}
