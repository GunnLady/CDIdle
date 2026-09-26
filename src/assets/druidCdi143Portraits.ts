import female1 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-01-v1.png";
import female2 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-02-v1.png";
import female3 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-03-v1.png";
import female4 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-04-v1.png";
import female5 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-05-v1.png";
import female6 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-06-v1.png";
import female7 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-07-v1.png";
import female8 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-08-v1.png";
import female9 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-09-v1.png";
import female10 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/female/druid-female-10-v1.png";
import male1 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-01-v1.png";
import male2 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-02-v1.png";
import male3 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-03-v1.png";
import male4 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-04-v1.png";
import male5 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-05-v1.png";
import male6 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-06-v1.png";
import male7 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-07-v1.png";
import male8 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-08-v1.png";
import male9 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-09-v1.png";
import male10 from "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/male/druid-male-10-v1.png";
import type { HeroPortraitGender } from "./heroSpriteSheets";
export const CDI143_DRUID_VARIANT_COUNT = 10;
const portraitUrls = [female1, female2, female3, female4, female5, female6, female7, female8, female9, female10, male1, male2, male3, male4, male5, male6, male7, male8, male9, male10];
export function getCdi143DruidPortraitUrl(gender: HeroPortraitGender, variant: number): string {
  const index = ((variant % CDI143_DRUID_VARIANT_COUNT) + CDI143_DRUID_VARIANT_COUNT) % CDI143_DRUID_VARIANT_COUNT;
  return portraitUrls[(gender === "Female" ? 0 : CDI143_DRUID_VARIANT_COUNT) + index];
}
