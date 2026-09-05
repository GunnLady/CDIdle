import { describe, expect, it } from "vitest";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import {
  evaluateTier1ClassAffinities,
} from "../src/domain/classAffinity";
import { applyHeroExperienceLevels } from "../src/domain/hero";
import { seededRng } from "../src/domain/random";
import type { Hero } from "../src/types";

const ALL_CLASS_BUILDINGS = {
  caserne: 1,
  lair: 1,
  poste_chasse: 1,
  academie: 1,
  temple: 1,
  cercle: 1,
  forge: 1,
};

function levelTenNovice(index: number): Hero {
  let hero = generateAuthoritativeNovice(`affinity-${index}`, `hero-${index}`) as unknown as Hero;
  const rng = seededRng(0x51f15e + index * 7919);
  while (hero.level < 10) {
    hero = applyHeroExperienceLevels(hero, hero.xpNeeded, rng).hero;
  }
  return hero;
}

describe("Tier 1 class affinity", () => {

  it("only exposes vocations unlocked by the available buildings", () => {
    const hero = levelTenNovice(42);
    const candidates = evaluateTier1ClassAffinities(hero, { caserne: 1 });
    expect(candidates.map((candidate) => candidate.classType).sort()).toEqual([
      "Guerrier",
      "Pugiliste",
    ]);
  });

  it("does not let global calibration reverse clearly oriented profiles", () => {
    const warrior = levelTenNovice(44);
    warrior.baseStats = { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 };
    const mage = levelTenNovice(45);
    mage.baseStats = { str: 1, agi: 1, end: 1, int: 50, wiz: 1, dex: 50, luk: 1 };
    expect(evaluateTier1ClassAffinities(warrior, { caserne: 1 })[0].classType).toBe("Guerrier");
    expect(evaluateTier1ClassAffinities(mage, { academie: 1 })[0].classType).toBe("Mage");
  });

  it("returns no vocation before level 10 or without a class building", () => {
    const hero = levelTenNovice(43);
    expect(evaluateTier1ClassAffinities({ ...hero, level: 9 }, ALL_CLASS_BUILDINGS)).toEqual([]);
    expect(evaluateTier1ClassAffinities(hero, {})).toEqual([]);
  });
});
