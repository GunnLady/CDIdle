import { describe, expect, it } from "vitest";
import { CANONICAL_HERO_CLASSES } from "../shared/domain/hero-classes";
import { HERO_PORTRAIT_VARIANT_COUNT } from "../shared/domain/hero-portrait-identity";
import { applyTier1ClassTransition } from "../shared/domain/tier1-class-transition";
import { seededRng } from "../shared/domain/random";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { HERO_SPRITE_SHEETS } from "../src/assets/heroSpriteSheets";
import {
  HERO_SPRITE_SLICES,
  getHeroPortraitCacheKey,
  resolveHeroPortraitIdentity,
} from "../src/domain/heroPortrait";
import { makeHero } from "./fixtures/game";

describe("hero portrait identity", () => {
  it("keeps an explicit portrait variant stable across a real Tier 1 transition", () => {
    const novice = makeHero({
      id: "portrait-transition",
      classType: "Novice",
      gender: "Female",
      spriteIndex: 13,
      level: 10,
    });

    const transitioned = applyTier1ClassTransition(novice, "Mage", seededRng(42), []).hero;

    expect(transitioned).toMatchObject({ classType: "Mage", gender: "Female", spriteIndex: 13 });
    expect(resolveHeroPortraitIdentity(transitioned)).toEqual(resolveHeroPortraitIdentity(novice));
  });

  it("keeps legacy heroes without spriteIndex deterministic", () => {
    const legacyHero = { id: "legacy-portrait", gender: undefined, spriteIndex: undefined };

    expect(resolveHeroPortraitIdentity(legacyHero)).toEqual(resolveHeroPortraitIdentity(legacyHero));
    expect(resolveHeroPortraitIdentity(legacyHero).gender).toBe("Male");
    expect(resolveHeroPortraitIdentity(legacyHero).variant).toBeGreaterThanOrEqual(0);
    expect(resolveHeroPortraitIdentity(legacyHero).variant).toBeLessThan(HERO_PORTRAIT_VARIANT_COUNT);
  });

  it("normalizes persisted indices without changing their identity slot", () => {
    expect(resolveHeroPortraitIdentity({ id: "normalized", gender: "Female", spriteIndex: 27 }))
      .toEqual({ gender: "Female", variant: 7 });
  });

  it("separates cache entries by class, gender and variant", () => {
    expect(getHeroPortraitCacheKey("Novice", "Female", 7)).toBe("Novice_Female_7");
    expect(getHeroPortraitCacheKey("Mage", "Female", 7)).toBe("Mage_Female_7");
    expect(getHeroPortraitCacheKey("Mage", "Male", 7)).toBe("Mage_Male_7");
  });
});

describe("hero sprite sheet catalog", () => {
  it("covers all canonical classes, both genders and all 20 variants", () => {
    expect(Object.keys(HERO_SPRITE_SHEETS)).toEqual(CANONICAL_HERO_CLASSES);
    expect(HERO_SPRITE_SLICES).toHaveLength(HERO_PORTRAIT_VARIANT_COUNT);

    for (const classType of CANONICAL_HERO_CLASSES) {
      expect(HERO_SPRITE_SHEETS[classType].Male).toBeTruthy();
      expect(HERO_SPRITE_SHEETS[classType].Female).toBeTruthy();
    }
  });

  it("maps the Aede class to the correctly named assets", () => {
    expect(HERO_SPRITE_SHEETS["A\u00e8de"].Male).toContain("aede");
    expect(HERO_SPRITE_SHEETS["A\u00e8de"].Female).toContain("aede");
  });
});

describe("authoritative novice portrait", () => {
  it("assigns a deterministic persisted variant without leaving the 20-slot sheet", () => {
    const first = generateAuthoritativeNovice("portrait-seed", "portrait-hero");
    const replay = generateAuthoritativeNovice("portrait-seed", "portrait-hero");

    expect(first.spriteIndex).toBe(replay.spriteIndex);
    expect(first.spriteIndex).toBeGreaterThanOrEqual(0);
    expect(first.spriteIndex).toBeLessThan(HERO_PORTRAIT_VARIANT_COUNT);
  });
});
