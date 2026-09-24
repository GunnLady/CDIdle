import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI151_ARCHER_COMBAT_IDLE_VARIANT_COUNT = 10;
export const CDI151_ARCHER_COMBAT_IDLE_FRAME_HEIGHT = 920;
export const CDI151_ARCHER_COMBAT_IDLE_VISIBLE_BOTTOM = 900;
export const CDI151_ARCHER_NEUTRAL_FRAME_HEIGHT = 692;

// Indexes match the ten identities on the five cinema review pages.
const femaleScales = [1, 1.03, 1, 1.05, 1.08, 1.05, 1.03, 1.08, 1.07, 1.15];
const maleScales = [1.05, 1.03, 1, 1.05, 1, 1.08, 1.05, 1, 1, 1];

export function getCdi151ArcherCombatIdleScale(gender: HeroPortraitGender, variant: number): number {
  return (gender === "Female" ? femaleScales : maleScales)[variant % CDI151_ARCHER_COMBAT_IDLE_VARIANT_COUNT] ?? 1;
}

const combatIdleUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-151/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

const combatIdleByKey = new Map<string, string>();
for (const [path, url] of Object.entries(combatIdleUrls)) {
  const match = /archer-(male|female)-(\d{2})-combat-idle-v1\.png$/.exec(path);
  if (match) combatIdleByKey.set(`${match[1]}:${match[2]}`, url);
}

export function getCdi151ArcherCombatIdleUrl(
  gender: HeroPortraitGender,
  variant: number,
): string | null {
  const normalizedVariant = (
    (variant % CDI151_ARCHER_COMBAT_IDLE_VARIANT_COUNT)
    + CDI151_ARCHER_COMBAT_IDLE_VARIANT_COUNT
  ) % CDI151_ARCHER_COMBAT_IDLE_VARIANT_COUNT;
  const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
  return combatIdleByKey.get(key) ?? null;
}
