import female1 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-01-combat-idle-v1.webp";
import female2 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-02-combat-idle-v1.webp";
import female3 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-03-combat-idle-v1.webp";
import female4 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-04-combat-idle-v1.webp";
import female5 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-05-combat-idle-v1.webp";
import female6 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-06-combat-idle-v1.webp";
import female7 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-07-combat-idle-v1.webp";
import female8 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-08-combat-idle-v1.webp";
import female9 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-09-combat-idle-v1.webp";
import female10 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/female/acolyte-female-10-combat-idle-v1.webp";
import male1 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-01-combat-idle-v1.webp";
import male2 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-02-combat-idle-v1.webp";
import male3 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-03-combat-idle-v1.webp";
import male4 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-04-combat-idle-v1.webp";
import male5 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-05-combat-idle-v1.webp";
import male6 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-06-combat-idle-v1.webp";
import male7 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-07-combat-idle-v1.webp";
import male8 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-08-combat-idle-v1.webp";
import male9 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-09-combat-idle-v1.webp";
import male10 from "../../assets/design/hero-sprites/cdi-153/runtime-webp-v1/male/acolyte-male-10-combat-idle-v1.webp";
import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT = 10;

const femaleScales = [0.665, 0.665, 0.735, 0.735, 0.7, 0.78, 0.75, 0.75, 0.65, 0.65];
const maleScales = [0.665, 0.7, 0.735, 0.8, 0.75, 0.9, 0.8, 0.7, 0.75, 0.66];

export function getCdi153AcolyteCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[variant % CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT] ?? 0.7;
}

// Explicit imports keep source-directory lookup keys out of the runtime bundle.
const combatIdleUrls = [female1, female2, female3, female4, female5, female6, female7, female8, female9, female10, male1, male2, male3, male4, male5, male6, male7, male8, male9, male10];

export function getCdi153AcolyteCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = (
    (variant % CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT)
    + CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT
  ) % CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT;
  return combatIdleUrls[(gender === "Female" ? 0 : CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT) + normalizedVariant] ?? null;
}
