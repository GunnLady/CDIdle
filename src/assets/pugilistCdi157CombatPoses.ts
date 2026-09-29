import f01 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-01-combat-idle-v2.webp";
import f02 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-02-combat-idle-v1.webp";
import f03 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-03-combat-idle-v1.webp";
import f04 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-04-combat-idle-v1.webp";
import f05 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-05-combat-idle-v1.webp";
import f06 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-06-combat-idle-v1.webp";
import f07 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-07-combat-idle-v1.webp";
import f08 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-08-combat-idle-v1.webp";
import f09 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-09-combat-idle-v1.webp";
import f10 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/female/pugilist-female-10-combat-idle-v1.webp";
import m01 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-01-combat-idle-v2.webp";
import m02 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-02-combat-idle-v1.webp";
import m03 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-03-combat-idle-v3.webp";
import m04 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-04-combat-idle-v2.webp";
import m05 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-05-combat-idle-v2.webp";
import m06 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-06-combat-idle-v1.webp";
import m07 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-07-combat-idle-v1.webp";
import m08 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-08-combat-idle-v1.webp";
import m09 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-09-combat-idle-v1.webp";
import m10 from "../../assets/design/hero-sprites/cdi-157/runtime-webp-v1/male/pugilist-male-10-combat-idle-v1.webp";
import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI157_PUGILIST_COMBAT_IDLE_VARIANT_COUNT = 10;
// Initial estimates and user scaling adjustments recorded in cdi-157/manifest.json.
const urls = [f01, f02, f03, f04, f05, f06, f07, f08, f09, f10, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];
const scalePercentages = [74, 72, 78, 78, 79, 77, 77, 69, 74, 68, 80, 81, 76, 83, 74, 77, 67, 79, 73, 70];

function identityIndex(gender: HeroPortraitGender, variant: number): number {
  const count = CDI157_PUGILIST_COMBAT_IDLE_VARIANT_COUNT;
  return ((variant % count) + count) % count + (gender === "Female" ? 0 : count);
}

export function getCdi157PugilistCombatIdleUrl(gender: HeroPortraitGender, variant: number): string {
  return urls[identityIndex(gender, variant)];
}

export function getCdi157PugilistCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return scalePercentages[identityIndex(gender, variant)] / 100;
}

export function getCdi157PugilistCombatIdlePivotX(gender: HeroPortraitGender, variant: number): number {
  const index = identityIndex(gender, variant);
  return index === 7 ? 0.55 : index === 19 ? 0.38 : 0.5;
}
