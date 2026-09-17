import { describe, expect, it } from "vitest";
import { CANONICAL_HERO_CLASSES } from "../shared/domain/hero-classes";
import {
  HERO_PORTRAIT_VARIANT_COUNT,
  NOVICE_PORTRAIT_VARIANT_COUNT,
} from "../shared/domain/hero-portrait-identity";
import { applyTier1ClassTransition } from "../shared/domain/tier1-class-transition";
import { seededRng } from "../shared/domain/random";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { HERO_SPRITE_SHEETS } from "../src/assets/heroSpriteSheets";
import {
  CDI136_NOVICE_VARIANT_COUNT,
  getCdi136NovicePortraitUrl,
} from "../src/assets/noviceCdi136Portraits";
import {
  CDI137_WARRIOR_VARIANT_COUNT,
  getCdi137WarriorPortraitUrl,
} from "../src/assets/warriorCdi137Portraits";
import {
  CDI138_ROGUE_VARIANT_COUNT,
  getCdi138RoguePortraitUrl,
} from "../src/assets/rogueCdi138Portraits";
import {
  CDI139_ARCHER_VARIANT_COUNT,
  getCdi139ArcherPortraitUrl,
} from "../src/assets/archerCdi139Portraits";
import {
  CDI140_MAGE_VARIANT_COUNT,
  getCdi140MagePortraitUrl,
} from "../src/assets/mageCdi140Portraits";
import {
  HERO_SPRITE_SLICES,
  getHeroPortraitCacheKey,
  getHeroPortraitPoseVisualKey,
  parseHeroPortraitCacheKey,
  parseHeroPortraitPoseVisualKey,
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

  it("parses the compact encounter key without accepting unknown identities", () => {
    expect(parseHeroPortraitCacheKey("Aède_Female_19")).toEqual({ classType: "Aède", gender: "Female", variant: 19 });
    expect(parseHeroPortraitCacheKey("Mage_Male_20")).toBeNull();
    expect(parseHeroPortraitCacheKey("Unknown_Male_0")).toBeNull();
    expect(parseHeroPortraitCacheKey("Mage_Other_0")).toBeNull();
  });

  it("keeps pose separate from the stable hero identity", () => {
    expect(getHeroPortraitPoseVisualKey("Novice", "Female", 0, "neutral"))
      .toBe("Novice_Female_0");
    expect(getHeroPortraitPoseVisualKey("Novice", "Female", 0, "combat_idle"))
      .toBe("Novice_Female_0@combat_idle");
    expect(parseHeroPortraitPoseVisualKey("Novice_Female_0@combat_idle")).toEqual({
      classType: "Novice",
      gender: "Female",
      variant: 0,
      pose: "combat_idle",
    });
    expect(parseHeroPortraitPoseVisualKey("Novice_Female_0@attack")).toBeNull();
  });
});

describe("hero sprite sheet catalog", () => {
  it("keeps legacy sheets for Tier 1 classes not yet migrated to individual sprites", () => {
    const legacySheetClasses = CANONICAL_HERO_CLASSES.filter((classType) => (
      classType !== "Novice"
        && classType !== "Guerrier"
        && classType !== "Voleur"
        && classType !== "Archer"
        && classType !== "Mage"
    ));
    expect(Object.keys(HERO_SPRITE_SHEETS)).toEqual(legacySheetClasses);
    expect(HERO_SPRITE_SLICES).toHaveLength(HERO_PORTRAIT_VARIANT_COUNT);

    for (const classType of legacySheetClasses) {
      expect(HERO_SPRITE_SHEETS[classType].Male).toBeTruthy();
      expect(HERO_SPRITE_SHEETS[classType].Female).toBeTruthy();
    }
  });

  it("maps the Aede class to the correctly named assets", () => {
    expect(HERO_SPRITE_SHEETS["A\u00e8de"].Male).toContain("aede");
    expect(HERO_SPRITE_SHEETS["A\u00e8de"].Female).toContain("aede");
  });
});

describe("authoritative Warrior portrait", () => {
  it("maps the 20 persisted identity slots onto the 10 validated sprites per gender", () => {
    expect(CDI137_WARRIOR_VARIANT_COUNT).toBe(10);
    expect(getCdi137WarriorPortraitUrl("Male", 0)).toContain("warrior-male-01-v1");
    expect(getCdi137WarriorPortraitUrl("Female", 9)).toContain("warrior-female-10-v1");
    expect(getCdi137WarriorPortraitUrl("Male", 10)).toBe(getCdi137WarriorPortraitUrl("Male", 0));
    expect(getCdi137WarriorPortraitUrl("Female", 19)).toBe(getCdi137WarriorPortraitUrl("Female", 9));
  });
});

describe("authoritative Rogue portrait", () => {
  it("maps the 20 persisted identity slots onto the 10 validated sprites per gender", () => {
    expect(CDI138_ROGUE_VARIANT_COUNT).toBe(10);
    expect(getCdi138RoguePortraitUrl("Male", 0)).toContain("rogue-male-01-v1");
    expect(getCdi138RoguePortraitUrl("Female", 9)).toContain("rogue-female-10-v1");
    expect(getCdi138RoguePortraitUrl("Male", 10)).toBe(getCdi138RoguePortraitUrl("Male", 0));
    expect(getCdi138RoguePortraitUrl("Female", 19)).toBe(getCdi138RoguePortraitUrl("Female", 9));
  });
});

describe("authoritative Archer portrait", () => {
  it("maps the 20 persisted identity slots onto the 10 validated sprites per gender", () => {
    expect(CDI139_ARCHER_VARIANT_COUNT).toBe(10);
    expect(getCdi139ArcherPortraitUrl("Male", 0)).toContain("archer-male-01-v1");
    expect(getCdi139ArcherPortraitUrl("Female", 9)).toContain("archer-female-10-v1");
    expect(getCdi139ArcherPortraitUrl("Male", 10)).toBe(getCdi139ArcherPortraitUrl("Male", 0));
    expect(getCdi139ArcherPortraitUrl("Female", 19)).toBe(getCdi139ArcherPortraitUrl("Female", 9));
  });
});

describe("authoritative Mage portrait", () => {
  it("maps the 20 persisted identity slots onto the 10 validated sprites per gender", () => {
    expect(CDI140_MAGE_VARIANT_COUNT).toBe(10);
    expect(getCdi140MagePortraitUrl("Male", 0)).toContain("mage-male-01-v1");
    expect(getCdi140MagePortraitUrl("Female", 9)).toContain("mage-female-10-v1");
    expect(getCdi140MagePortraitUrl("Male", 10)).toBe(getCdi140MagePortraitUrl("Male", 0));
    expect(getCdi140MagePortraitUrl("Female", 19)).toBe(getCdi140MagePortraitUrl("Female", 9));
  });
});

describe("authoritative novice portrait", () => {
  it("maps the 20 persisted identity slots onto the 10 validated sprites per gender", () => {
    expect(CDI136_NOVICE_VARIANT_COUNT).toBe(10);
    expect(getCdi136NovicePortraitUrl("Male", 0)).toContain("novice-male-01-v1");
    expect(getCdi136NovicePortraitUrl("Female", 9)).toContain("novice-female-10-v1");
    expect(getCdi136NovicePortraitUrl("Male", 10)).toBe(getCdi136NovicePortraitUrl("Male", 0));
    expect(getCdi136NovicePortraitUrl("Female", 19)).toBe(getCdi136NovicePortraitUrl("Female", 9));
  });

  it("assigns a deterministic persisted variant among the 10 validated Novice sprites", () => {
    const first = generateAuthoritativeNovice("portrait-seed", "portrait-hero");
    const replay = generateAuthoritativeNovice("portrait-seed", "portrait-hero");

    expect(first.spriteIndex).toBe(replay.spriteIndex);
    expect(first.spriteIndex).toBeGreaterThanOrEqual(0);
    expect(first.spriteIndex).toBeLessThan(NOVICE_PORTRAIT_VARIANT_COUNT);
  });
});
