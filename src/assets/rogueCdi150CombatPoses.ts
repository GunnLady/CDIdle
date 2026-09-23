import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI150_ROGUE_COMBAT_IDLE_VARIANT_COUNT = 10;
export const CDI150_ROGUE_COMBAT_IDLE_FRAME_HEIGHT = 920;
export const CDI150_ROGUE_COMBAT_IDLE_VISIBLE_BOTTOM = 900;
export const CDI150_ROGUE_NEUTRAL_FRAME_HEIGHT = 692;

// Indexes match the ten identities on the five cinema review pages.
const femaleScales = [1, 1.05, 1, 0.90, 1, 1.04, 1.03, 1, 1, 1.05];
const maleScales = [1, 1, 1.03, 1.03, 1, 1, 1, 1, 1.05, 1.05];

export function getCdi150RogueCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[variant % CDI150_ROGUE_COMBAT_IDLE_VARIANT_COUNT] ?? 1;
}

const combatIdleUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-150/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

const combatIdleByKey = new Map<string, string>();
for (const [path, url] of Object.entries(combatIdleUrls)) {
  const match = /rogue-(male|female)-(\d{2})-combat-idle-v1\.png$/.exec(path);
  if (match) combatIdleByKey.set(`${match[1]}:${match[2]}`, url);
}

export function getCdi150RogueCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = (
    (variant % CDI150_ROGUE_COMBAT_IDLE_VARIANT_COUNT)
    + CDI150_ROGUE_COMBAT_IDLE_VARIANT_COUNT
  ) % CDI150_ROGUE_COMBAT_IDLE_VARIANT_COUNT;
  const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
  return combatIdleByKey.get(key) ?? null;
}
