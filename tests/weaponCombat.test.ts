import { describe, expect, it } from "vitest";
import { validateCanonicalHero } from "../shared/contracts/authoritative";
import { calculateHeroDerivedStats } from "../shared/domain/hero-stats";
import { createWeapon } from "../shared/domain/items/itemBuilders";
import { getItemHandedness, ITEM_LIBRARY, validateItemCatalog } from "../shared/domain/items/items";
import {
  calculateEstimatedDps,
  calculateExpectedStrikeCount,
  calculateWeaponBasePower,
  rollWeaponStrikeCount,
} from "../shared/domain/weapon-combat";
import { calculateAuthoritativeHeroStats } from "../supabase/functions/game-api/novice-stats-authority";
import { initialTownState, migrateTownState } from "../supabase/functions/game-api/town-authority";
import { asLegacyUnversionedState } from "./fixtures/stateMigrations";
import { makeHero } from "./fixtures/game";

const attributes = { str: 5, agi: 11, end: 5, int: 13, wiz: 17, dex: 19, luk: 7 };
const oneHandedProfile = { baseStrikes: 1, powerPerStrike: 1, maxStrikes: 3 } as const;
const twoHandedProfile = { baseStrikes: 1, powerPerStrike: 1.25, maxStrikes: 3 } as const;
const dualWieldProfile = { baseStrikes: 2, powerPerStrike: 0.65, maxStrikes: 3 } as const;

describe("weapon-specific scaling", () => {
  it("requires valid scaling and attack profiles on every catalog weapon", () => {
    expect(validateItemCatalog()).toEqual([]);
    expect(ITEM_LIBRARY.filter((item) => item.itemType === "weapon").every((item) => item.scaling)).toBe(true);
    expect(ITEM_LIBRARY.filter((item) => item.itemType === "weapon").every((item) => item.attackProfile)).toBe(true);
  });

  it("rejects a category and stat combination outside the canonical contract", () => {
    const weapon = ITEM_LIBRARY.find((item) => item.itemType === "weapon")!;
    expect(validateItemCatalog([{
      ...weapon,
      scaling: { category: "power", stat: "agi" },
    } as typeof weapon])).toContain(`${weapon.id}:INVALID_WEAPON_SCALING`);
  });

  it("rejects an invalid attack profile without affecting handedness", () => {
    const weapon = ITEM_LIBRARY.find((item) => item.itemType === "weapon")!;
    expect(validateItemCatalog([{
      ...weapon,
      attackProfile: { ...weapon.attackProfile, powerPerStrike: 0 },
    }])).toContain(`${weapon.id}:INVALID_WEAPON_ATTACK_PROFILE`);
  });

  it("rejects damage ranges and attack speeds that cannot support combat or DPS", () => {
    const weapon = ITEM_LIBRARY.find((item) => item.itemType === "weapon")!;
    expect(validateItemCatalog([{
      ...weapon,
      damageRange: { min: 4, max: 3 },
    }])).toContain(`${weapon.id}:INVALID_WEAPON_DAMAGE_RANGE`);
    expect(validateItemCatalog([{
      ...weapon,
      attackSpeed: 0,
    }])).toContain(`${weapon.id}:INVALID_WEAPON_ATTACK_SPEED`);
  });

  it("lets two spears use different scaling without changing their weapon type", () => {
    const finesseSpear = createWeapon(
      "test_finesse_spear",
      "Lance de finesse",
      "spear",
      "common",
      1,
      "Test",
      1,
      1,
      1,
      [],
      ["physical"],
      { category: "finesse", stat: "agi" },
    );
    const powerSpear = createWeapon(
      "test_power_spear",
      "Lance de puissance",
      "spear",
      "common",
      1,
      "Test",
      1,
      1,
      1,
      [],
    );

    expect(finesseSpear.weaponTypeId).toBe(powerSpear.weaponTypeId);
    expect(finesseSpear.scaling).toEqual({ category: "finesse", stat: "agi" });
    expect(powerSpear.scaling).toEqual({ category: "power", stat: "str" });
    expect(calculateWeaponBasePower(attributes, finesseSpear.scaling)).toBe(16);
    expect(calculateWeaponBasePower(attributes, powerSpear.scaling)).toBe(8);
  });

  it("keeps handedness for equipment while allowing an explicit combat profile", () => {
    const experimentalSpear = createWeapon(
      "test_profile_spear",
      "Lance expérimentale",
      "spear",
      "common",
      1,
      "Test",
      1,
      1,
      1,
      [],
      ["physical"],
      { category: "power", stat: "str" },
      dualWieldProfile,
    );

    expect(getItemHandedness(experimentalSpear)).toBe("two_handed");
    expect(experimentalSpear.attackProfile).toEqual(dualWieldProfile);
  });

  it("defines magical instruments as WIZ two-handed weapons", () => {
    for (const itemId of ["basic_lute", "resonant_harp"]) {
      const instrument = ITEM_LIBRARY.find((item) => item.id === itemId);

      expect(instrument).toMatchObject({
        itemType: "weapon",
        scaling: { category: "magic", stat: "wiz" },
        attackProfile: twoHandedProfile,
      });
      expect(getItemHandedness(instrument!)).toBe("two_handed");
    }
  });

  it("migrates a historical instrument off-hand back to storage", () => {
    const hero = makeHero({
      id: "legacy-aede",
      level: 10,
      equipment: {
        mainHand: { instanceId: "legacy-lute", itemId: "basic_lute", rarity: "common" },
        offHand: { instanceId: "legacy-shield", itemId: "wooden_shield", rarity: "common" },
      },
    });

    const migrated = migrateTownState(asLegacyUnversionedState({ ...initialTownState(), heroes: [hero] }));
    const migratedHero = migrated.heroes[0];

    expect(migratedHero.equipment?.mainHand?.itemId).toBe("basic_lute");
    expect(migratedHero.equipment?.offHand).toBeUndefined();
    expect(migrated.storedItems).toContainEqual(expect.objectContaining({
      instanceId: "legacy-shield",
      itemId: "wooden_shield",
    }));
    expect(migratedHero.calculatedStats).toEqual(calculateAuthoritativeHeroStats(
      migratedHero.baseStats,
      migratedHero.passiveSkills,
      migratedHero.equipment,
    ));
  });

  it("resolves physical and magical hero power from the equipped weapon", () => {
    const finesse = calculateAuthoritativeHeroStats(attributes, [], {
      mainHand: { itemId: "quick_dagger", rarity: "common" },
    });
    const ranged = calculateAuthoritativeHeroStats(attributes, [], {
      mainHand: { itemId: "basic_longbow", rarity: "common" },
    });
    const arcane = calculateAuthoritativeHeroStats(attributes, [], {
      mainHand: { itemId: "basic_staff", rarity: "common" },
    });
    const spiritual = calculateAuthoritativeHeroStats(attributes, [], {
      mainHand: { itemId: "basic_lute", rarity: "common" },
    });

    expect(finesse.physicalDamage).toBe(16);
    expect(ranged.physicalDamage).toBe(30);
    expect(arcane.magicDamage).toBe(22);
    expect(spiritual.magicDamage).toBe(27);
    expect(finesse.estimatedDps).not.toBe(ranged.estimatedDps);
  });

  it("falls back to strength for an unarmed physical attack", () => {
    const stats = calculateHeroDerivedStats(attributes, []);
    expect(stats.physicalDamage).toBe(8);
  });

  it("regenerates estimatedDps for a historical calculatedStats block", () => {
    const hero = makeHero();
    const legacyCalculatedStats = { ...hero.calculatedStats } as Partial<typeof hero.calculatedStats>;
    delete legacyCalculatedStats.estimatedDps;
    const migrated = migrateTownState(asLegacyUnversionedState({
      ...initialTownState(),
      heroes: [{ ...hero, calculatedStats: legacyCalculatedStats }],
    }));
    const migratedHero = migrated.heroes?.[0] as unknown as typeof hero;
    expect(migratedHero.calculatedStats.estimatedDps).toBeGreaterThan(0);
  });

  it("regenerates and rejects a non-positive persisted estimatedDps", () => {
    const hero = makeHero({
      calculatedStats: { ...makeHero().calculatedStats, estimatedDps: -1 },
    });
    expect(validateCanonicalHero(hero)).toContain("hero.calculatedStats.estimatedDps must be > 0");

    const migrated = migrateTownState(asLegacyUnversionedState({ ...initialTownState(), heroes: [hero] }));
    const migratedHero = migrated.heroes?.[0] as unknown as typeof hero;
    expect(migratedHero.calculatedStats.estimatedDps).toBeGreaterThan(0);
  });

  it("recalculates a finite but stale persisted estimatedDps after a formula change", () => {
    const hero = makeHero({
      calculatedStats: { ...makeHero().calculatedStats, estimatedDps: 999_999 },
    });
    const migrated = migrateTownState(asLegacyUnversionedState({ ...initialTownState(), heroes: [hero] }));
    const migratedHero = migrated.heroes?.[0] as unknown as typeof hero;

    expect(migratedHero.calculatedStats.estimatedDps).not.toBe(999_999);
    expect(migratedHero.calculatedStats.estimatedDps).toBeGreaterThan(0);
  });
});

describe("estimated normal-attack DPS", () => {
  it("matches the combat strike thresholds and three-strike cap", () => {
    expect(calculateExpectedStrikeCount(1, 0, oneHandedProfile)).toBe(1);
    expect(calculateExpectedStrikeCount(1.5, 0, oneHandedProfile)).toBe(1.5);
    expect(calculateExpectedStrikeCount(2, 50, dualWieldProfile)).toBe(2.5);
    expect(calculateExpectedStrikeCount(3, 999, dualWieldProfile)).toBe(3);
    expect(rollWeaponStrikeCount(1, 49, oneHandedProfile, () => 0.48)).toBe(2);
    expect(rollWeaponStrikeCount(1, 49, oneHandedProfile, () => 0.49)).toBe(1);
    expect(rollWeaponStrikeCount(2, 50, dualWieldProfile, () => 0.49)).toBe(3);
    expect(rollWeaponStrikeCount(3, 999, dualWieldProfile, () => 0)).toBe(3);
  });

  it("averages the full damage range and the real critical floor", () => {
    expect(calculateEstimatedDps({
      attackPower: 10,
      attackProfile: oneHandedProfile,
      damageRange: { min: 1, max: 2 },
      attackSpeed: 1,
      heroSpeed: 0,
      criticalChance: 100,
    })).toBe(17);
  });

  it("does not silently grant unarmed weapon damage to an incomplete weapon context", () => {
    expect(calculateEstimatedDps({
      attackPower: 10,
      attackProfile: oneHandedProfile,
      heroSpeed: 0,
      criticalChance: 0,
    })).toBe(10);
  });

  it("is deterministic and does not require an RNG", () => {
    const input = {
      attackPower: 23,
      attackProfile: oneHandedProfile,
      damageRange: { min: 4, max: 9 },
      attackSpeed: 1.2,
      heroSpeed: 37,
      criticalChance: 12.5,
    };
    expect(calculateEstimatedDps(input)).toBe(calculateEstimatedDps(input));
  });

  it("applies the validated power budget for every attack profile", () => {
    const input = {
      attackPower: 100,
      damageRange: { min: 0, max: 0 },
      attackSpeed: 0,
      heroSpeed: 0,
      criticalChance: 0,
    };
    expect(calculateEstimatedDps({ ...input, attackProfile: oneHandedProfile })).toBe(100);
    expect(calculateEstimatedDps({ ...input, attackProfile: twoHandedProfile })).toBe(125);
    expect(calculateEstimatedDps({ ...input, attackProfile: dualWieldProfile })).toBe(130);
  });
});
