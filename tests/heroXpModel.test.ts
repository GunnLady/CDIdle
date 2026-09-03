import { describe, expect, it } from "vitest";
import {
  CURRENT_HERO_PROGRESSION_MODEL,
  CURRENT_HERO_PROGRESSION_MODEL_ID,
  HERO_MAX_LEVEL,
  LEGACY_HERO_PROGRESSION_MODEL,
} from "../shared/data/hero-progression-models";
import { calculateXpNeeded, migrateHeroXpProgress } from "../shared/domain/hero-xp";
import { applyHeroExperienceLevels } from "../shared/domain/hero";
import { refreshHeroDerivedStats } from "../shared/domain/game-calculations";
import type { Rng } from "../shared/domain/random";
import { makeHero } from "./fixtures/game";

function countingRng() {
  let draws = 0;
  const rng: Rng = {
    next: () => { draws += 1; return 0.1; },
    nextInt: (max) => { draws += 1; return Math.min(max - 1, 0); },
  };
  return { rng, draws: () => draws };
}

describe("active hero XP model", () => {
  it("activates the harmonized T0/T1 anchors", () => {
    expect(CURRENT_HERO_PROGRESSION_MODEL_ID).toBe("harmonized-level-bands-v2");
    expect(calculateXpNeeded(2, "Novice")).toBe(100);
    expect(calculateXpNeeded(10, "Novice")).toBe(816);
    expect(calculateXpNeeded(11, "Guerrier")).toBe(1_061);
    expect(calculateXpNeeded(30, "Guerrier")).toBe(33_897);
    expect(calculateXpNeeded(35, "Guerrier")).toBe(84_347);
  });

  it("uses the same active curve at every class tier", () => {
    for (const destinationLevel of [2, 10, 11, 20, 21, 35, HERO_MAX_LEVEL]) {
      expect(calculateXpNeeded(destinationLevel, "Novice"))
        .toBe(calculateXpNeeded(destinationLevel, "Guerrier"));
      expect(calculateXpNeeded(destinationLevel, "Mage"))
        .toBe(calculateXpNeeded(destinationLevel, "Guerrier"));
    }
  });

  it("keeps costs monotonic and finite through level 99", () => {
    let previous = 0;
    for (let destinationLevel = 11; destinationLevel <= HERO_MAX_LEVEL; destinationLevel += 1) {
      const current = calculateXpNeeded(destinationLevel, "Guerrier");
      expect(Number.isSafeInteger(current)).toBe(true);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  it("preserves the current-level completion ratio when changing models", () => {
    const legacyThreshold = calculateXpNeeded(21, "Guerrier", LEGACY_HERO_PROGRESSION_MODEL.xpCurve);
    const hero = makeHero({ level: 20, classType: "Guerrier", xpNeeded: legacyThreshold, xp: Math.floor(legacyThreshold / 2) });
    const migrated = migrateHeroXpProgress(hero, CURRENT_HERO_PROGRESSION_MODEL);
    expect(migrated.xpNeeded).toBe(calculateXpNeeded(21, "Guerrier"));
    expect(Math.abs((migrated.xp / migrated.xpNeeded) - (hero.xp / hero.xpNeeded)))
      .toBeLessThanOrEqual(1 / migrated.xpNeeded);
    expect(migrated.xp).toBeLessThan(migrated.xpNeeded);
  });

  it("stops at level 99, discards terminal overflow and consumes no later growth RNG", () => {
    const hero = refreshHeroDerivedStats(makeHero({ level: 98, classType: "Guerrier", xp: 0 }));
    const firstRng = countingRng();
    const capped = applyHeroExperienceLevels(hero, hero.xpNeeded * 2, firstRng.rng).hero;
    expect(capped).toMatchObject({ level: HERO_MAX_LEVEL, xp: 0 });
    expect(firstRng.draws()).toBeGreaterThan(0);

    const secondRng = countingRng();
    const unchanged = applyHeroExperienceLevels(capped, 1_000_000, secondRng.rng).hero;
    expect(unchanged).toMatchObject({ level: HERO_MAX_LEVEL, xp: 0 });
    expect(secondRng.draws()).toBe(0);
  });
});
