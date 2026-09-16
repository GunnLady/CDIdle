import type { HeroPortraitGender } from "./heroSpriteSheets";
import { NOVICE_PORTRAIT_VARIANT_COUNT } from "../../shared/domain/hero-portrait-identity";

const combatIdleUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-148/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

const combatIdleByKey = new Map<string, string>();
for (const [path, url] of Object.entries(combatIdleUrls)) {
  const match = /novice-(male|female)-(\d{2})-combat-idle-v1\.png$/.exec(path);
  if (match) combatIdleByKey.set(`${match[1]}:${match[2]}`, url);
}

export function getCdi148NoviceCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = ((variant % NOVICE_PORTRAIT_VARIANT_COUNT) + NOVICE_PORTRAIT_VARIANT_COUNT)
    % NOVICE_PORTRAIT_VARIANT_COUNT;
  const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
  return combatIdleByKey.get(key) ?? null;
}
