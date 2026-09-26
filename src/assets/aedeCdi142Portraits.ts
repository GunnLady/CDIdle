import female1 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-01-v1.png";
import female2 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-02-v1.png";
import female3 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-03-v1.png";
import female4 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-04-v1.png";
import female5 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-05-v1.png";
import female6 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-06-v1.png";
import female7 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-07-v1.png";
import female8 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-08-v1.png";
import female9 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-09-v1.png";
import female10 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/aede-female-10-v1.png";
import male1 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-01-v1.png";
import male2 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-02-v1.png";
import male3 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-03-v1.png";
import male4 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-04-v1.png";
import male5 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-05-v1.png";
import male6 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-06-v1.png";
import male7 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-07-v1.png";
import male8 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-08-v1.png";
import male9 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-09-v1.png";
import male10 from "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/aede-male-10-v1.png";
import type { HeroPortraitGender } from "./heroSpriteSheets";
export const CDI142_AEDE_VARIANT_COUNT = 10;
const portraitUrls = [female1, female2, female3, female4, female5, female6, female7, female8, female9, female10, male1, male2, male3, male4, male5, male6, male7, male8, male9, male10];
export function getCdi142AedePortraitUrl(gender: HeroPortraitGender, variant: number): string {
  const index = ((variant % CDI142_AEDE_VARIANT_COUNT) + CDI142_AEDE_VARIANT_COUNT) % CDI142_AEDE_VARIANT_COUNT;
  return portraitUrls[(gender === "Female" ? 0 : CDI142_AEDE_VARIANT_COUNT) + index];
}
