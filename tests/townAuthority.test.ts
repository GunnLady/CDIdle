import { describe, expect, it } from "vitest";
import { applyTownCommand, initialTownState } from "../supabase/functions/game-api/town-authority";
import { generateAuthoritativeNoviceEquipment } from "../supabase/functions/game-api/inventory-authority";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { refreshHeroDerivedStats } from "../src/utils/gameCalculations";
import type { Hero } from "../src/types";

const withoutIdentity = (hero: Record<string, unknown>) => {
  const { id: _id, name: _name, ...profile } = hero;
  return profile;
};

describe("authoritative town commands", () => {
  it("generates deterministic novice equipment from the server catalog", () => {
    const equipment = generateAuthoritativeNoviceEquipment("starter-seed");
    expect(equipment).toEqual(generateAuthoritativeNoviceEquipment("starter-seed"));
    expect(["starter_sword", "quick_dagger", "woodcutter_axe"]).toContain(equipment.mainHand?.itemId);
    expect(["traveler_clothes", "simple_leather_armor", "novice_mystic_robe"]).toContain(equipment.armor?.itemId);
    expect([null, "wooden_shield"]).toContain(equipment.offHand?.itemId ?? null);
    expect(equipment.accessory).toBeNull();
  });

  it("matches persisted server novice stats with the client derivation", () => {
    const weapons = new Set<string>();
    const armors = new Set<string>();
    const passives = new Set<string>();
    const offHands = new Set<string>();
    for (let index = 0; index < 256; index += 1) {
      const seed = `parity-${index}`;
      const novice = generateAuthoritativeNovice(seed, `candidate-${seed}`) as unknown as Hero;
      const refreshed = refreshHeroDerivedStats(novice);
      expect(novice.xpNeeded).toBe(100);
      expect(novice.calculatedStats).toEqual(refreshed.calculatedStats);
      expect(novice.currentHp).toBe(novice.calculatedStats.maxHp);
      expect(novice.currentMana).toBe(novice.calculatedStats.maxMana);
      weapons.add(String(novice.equipment?.mainHand?.itemId));
      armors.add(String(novice.equipment?.armor?.itemId));
      passives.add(String(novice.passiveSkills[0]));
      offHands.add(String(novice.equipment?.offHand?.itemId ?? "none"));
    }
    expect(weapons).toEqual(new Set(["starter_sword", "quick_dagger", "woodcutter_axe"]));
    expect(armors).toEqual(new Set(["traveler_clothes", "simple_leather_armor", "novice_mystic_robe"]));
    expect(passives).toEqual(new Set(["survival_instinct", "small_profit"]));
    expect(offHands).toEqual(new Set(["wooden_shield", "none"]));
  });

  it("preserves the historical elite novice roll", () => {
    const elite = generateAuthoritativeNovice("audit-141", "elite-audit") as Record<string, unknown> & {
      baseStats: Record<string, number>;
      isElite: boolean;
    };
    const replay = generateAuthoritativeNovice("audit-141", "elite-audit");
    const values = Object.values(elite.baseStats);
    expect(elite.isElite).toBe(true);
    expect(values.filter((value) => value >= 8)).toHaveLength(2);
    expect(values.reduce((sum, value) => sum + value, 0)).toBeGreaterThanOrEqual(16);
    expect(values.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(38);
    expect(replay).toEqual(elite);
  });

  it("persists authoritative onboarding candidates and promotes only offered ids", () => {
    const offered = applyTownCommand(initialTownState(), {
      type: "onboarding.offer",
      cityName: "Oakhaven",
      commandId: "onboarding-offer",
    });
    const candidates = offered.state.onboardingCandidates as Array<Record<string, any>>;
    expect(candidates).toHaveLength(5);
    expect(candidates[0]).toMatchObject({
      classType: "Novice",
      level: 1,
      race: "Humain",
      equipment: { mainHand: { rarity: "common" }, armor: { rarity: "common" }, accessory: null },
    });
    expect(candidates[0].activeSkills).toHaveLength(1);
    expect(candidates[0].passiveSkills).toHaveLength(1);
    expect(candidates[0].calculatedStats).toBeDefined();
    expect(candidates[0].xpNeeded).toBe(100);
    expect(Object.values(candidates[0].baseStats).reduce((sum: number, value) => sum + Number(value), 0)).toBeGreaterThanOrEqual(20);

    const result = applyTownCommand(offered.state, {
      type: "onboarding.start",
      cityName: "Oakhaven",
      starterHeroes: [
        { id: candidates[0].id, name: "Ada", equipment: { mainHand: { itemId: "client-forged-item", rarity: "legendary" } } },
        { id: candidates[1].id, name: "Borin" },
      ],
      commandId: "onboarding-start",
    });
    expect(result.state).toMatchObject({
      cityName: "Oakhaven",
      resources: { gold: 125, food: 75, wood: 40 },
      onboardingCandidates: [],
      pendingOnboardingCityName: "",
      heroes: [
        { name: "Ada", baseStats: candidates[0].baseStats, equipment: candidates[0].equipment, activeSkills: candidates[0].activeSkills },
        { name: "Borin", baseStats: candidates[1].baseStats, equipment: candidates[1].equipment, activeSkills: candidates[1].activeSkills },
      ],
    });
    expect(JSON.stringify(result.state.heroes)).not.toContain("client-forged-item");
    const createdHeroes = result.state.heroes as Array<Record<string, unknown>>;
    expect(withoutIdentity(createdHeroes[0])).toEqual(withoutIdentity(candidates[0]));
    expect(withoutIdentity(createdHeroes[1])).toEqual(withoutIdentity(candidates[1]));

    const replayedOffer = applyTownCommand(initialTownState(), {
      type: "onboarding.offer",
      cityName: "Oakhaven",
      commandId: "onboarding-offer",
    });
    expect(replayedOffer.state.onboardingCandidates).toEqual(offered.state.onboardingCandidates);
    expect(() => applyTownCommand(result.state, { type: "onboarding.start", cityName: "Again", starterHeroes: [] })).toThrow("onboarding is already complete");
    expect(() => applyTownCommand(offered.state, {
      type: "onboarding.start",
      cityName: "Oakhaven",
      starterHeroes: [
        { id: candidates[0].id, name: "Ada" },
        { id: candidates[0].id, name: "Borin" },
      ],
    })).toThrow("starter hero ids must be unique");
    expect(() => applyTownCommand(offered.state, {
      type: "onboarding.start",
      cityName: "Oakhaven",
      starterHeroes: [
        { id: candidates[0].id, name: "Ada" },
        { id: "candidate-client-injected", name: "Mallory" },
      ],
    })).toThrow("starter hero was not offered");
    expect(() => applyTownCommand({ ...initialTownState(), heroes: [{ id: "existing" }] }, {
      type: "onboarding.offer",
      cityName: "Again",
    })).toThrow("onboarding is already complete");
  });

  it("applies a building upgrade atomically", () => {
    const current = initialTownState();
    current.resources.gold = 100;
    current.resources.food = 100;
    const result = applyTownCommand(current, { type: "building.upgrade", buildingId: "ferme" });
    expect(result.state).toMatchObject({ buildings: { ferme: 1 }, resources: { gold: 90, food: 90 } });
    expect(result.events).toEqual([{ type: "building.upgraded", buildingId: "ferme", level: 1 }]);
  });

  it("gates authoritative cheats behind the runtime flag", () => {
    expect(() => applyTownCommand(initialTownState(), { type: "cheat.grant_resources", amounts: { gold: 10 } })).toThrow("cheats are disabled");
    const result = applyTownCommand(initialTownState(), { type: "cheat.grant_resources", amounts: { gold: 10 } }, { allowCheats: true });
    expect(result.state).toMatchObject({ resources: { gold: 85 } });
  });

  it("rejects allocation until its profession building exists", () => {
    expect(() => applyTownCommand(initialTownState(), { type: "citizens.allocate", role: "farmers", amount: 1 })).toThrow("profession building");
  });

  it("rejects a district without enough resources and preserves the state", () => {
    const current = initialTownState();
    expect(() => applyTownCommand(current, { type: "district.unlock", districtId: "quartier_ferme" })).toThrow("insufficient resources");
    expect(current.districts).toEqual({});
  });

  it("handles authoritative hero recruitment, dismissal and activity", () => {
    const current = initialTownState();
    current.buildings.guilde = 1;
    current.resources.gold = 500;
    const recruited = applyTownCommand(current, { type: "hero.recruit", commandId: "hero-command" });
    expect(recruited.state).toMatchObject({
      resources: { gold: 400 },
      heroes: [{
        id: "hero-hero-command",
        isActive: false,
        xpNeeded: 100,
        equipment: { mainHand: { rarity: "common" }, armor: { rarity: "common" } },
        calculatedStats: { maxHp: expect.any(Number), maxMana: expect.any(Number) },
      }],
    });
    expect((recruited.state.heroes as Array<Record<string, unknown>>)[0].activeSkills).toHaveLength(1);
    expect((recruited.state.heroes as Array<Record<string, unknown>>)[0].passiveSkills).toHaveLength(1);
    expect((recruited.state.heroes as Array<Record<string, unknown>>)[0]).toEqual(
      generateAuthoritativeNovice("recruit:hero-command", "hero-hero-command"),
    );
    const dismissed = applyTownCommand(recruited.state, { type: "hero.dismiss", heroId: "hero-hero-command" });
    expect(dismissed.state).toMatchObject({ heroes: [] });
  });

  it("persists a recruit offer before confirmation", () => {
    const current = initialTownState();
    current.buildings.guilde = 1;
    current.resources.gold = 500;
    const offered = applyTownCommand(current, { type: "hero.recruit_offer", commandId: "offer-command" });
    expect(offered.state).toMatchObject({
      pendingRecruit: {
        id: "candidate-offer-command",
        classType: "Novice",
        xpNeeded: 100,
        equipment: { mainHand: { rarity: "common" }, armor: { rarity: "common" } },
        calculatedStats: { maxHp: expect.any(Number), maxMana: expect.any(Number) },
      },
      heroes: [],
    });
    expect((offered.state.pendingRecruit as Record<string, unknown>).activeSkills).toHaveLength(1);
    expect((offered.state.pendingRecruit as Record<string, unknown>).passiveSkills).toHaveLength(1);
    const confirmed = applyTownCommand(offered.state, { type: "hero.recruit_confirm", name: "Ariane" });
    expect(confirmed.state).toMatchObject({ resources: { gold: 400 }, pendingRecruit: null, heroes: [{ id: "hero-offer-command", name: "Ariane", equipment: { mainHand: { rarity: "common" }, armor: { rarity: "common" } } }] });
    const offeredCandidate = offered.state.pendingRecruit as Record<string, unknown>;
    const confirmedHero = (confirmed.state.heroes as Array<Record<string, unknown>>)[0];
    expect(withoutIdentity(confirmedHero)).toEqual(withoutIdentity(offeredCandidate));
    const secondOffer = applyTownCommand({ ...confirmed.state, pendingRecruit: null }, { type: "hero.recruit_offer", commandId: "cancel-command" });
    const cancelled = applyTownCommand(secondOffer.state, { type: "hero.recruit_cancel" });
    expect(cancelled.state).toMatchObject({ pendingRecruit: null, heroes: [{ name: "Ariane" }] });
  });

  it("handles inventory stacks and atomic hero equipment", () => {
    const current = { ...initialTownState(), heroes: [{ id: "hero-1", level: 1, equipment: {} }] };
    const added = applyTownCommand(current, { type: "inventory.add", itemId: "starter_sword", rarity: "common", count: 2 });
    expect(added.state.storedItems).toEqual([{ itemId: "starter_sword", rarity: "common", count: 2 }]);
    const equipped = applyTownCommand(added.state, { type: "hero.equip", heroId: "hero-1", itemId: "starter_sword", rarity: "common" });
    expect(equipped.state).toMatchObject({ storedItems: [{ itemId: "starter_sword", rarity: "common", count: 1 }], heroes: [{ equipment: { mainHand: { itemId: "starter_sword" } } }] });
    const unequipped = applyTownCommand(equipped.state, { type: "hero.unequip", heroId: "hero-1", slot: "mainHand" });
    expect(unequipped.state).toMatchObject({ storedItems: [{ itemId: "starter_sword", rarity: "common", count: 2 }], heroes: [{ equipment: {} }] });
    expect(() => applyTownCommand(current, { type: "inventory.add", itemId: "unknown-item", rarity: "common" })).toThrow("unknown item");
  });

  it("recalculates authoritative novice stats after equipment mutations", () => {
    const novice = generateAuthoritativeNovice("equipment-recalculation", "hero-novice") as Record<string, any>;
    const initialStats = novice.calculatedStats;
    const initialWeapon = novice.equipment.mainHand;
    const unequipped = applyTownCommand(
      { ...initialTownState(), heroes: [novice] },
      { type: "hero.unequip", heroId: novice.id, slot: "mainHand" },
    );
    const withoutWeapon = (unequipped.state.heroes as Array<Record<string, any>>)[0];
    expect(withoutWeapon.calculatedStats).toEqual(
      refreshHeroDerivedStats(withoutWeapon as unknown as Hero).calculatedStats,
    );
    const equipped = applyTownCommand(unequipped.state, {
      type: "hero.equip",
      heroId: novice.id,
      itemId: initialWeapon.itemId,
      rarity: initialWeapon.rarity,
    });
    const restored = (equipped.state.heroes as Array<Record<string, any>>)[0];
    expect(restored.calculatedStats).toEqual(initialStats);
    expect(restored.calculatedStats).toEqual(
      refreshHeroDerivedStats(restored as unknown as Hero).calculatedStats,
    );
  });

  it("keeps forge preview and recycling atomic", () => {
    const current = { ...initialTownState(), buildings: { ...initialTownState().buildings, forge: 1 }, forgeMaterials: [
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 1 },
    ], storedItems: [{ itemId: "starter_sword", rarity: "common", count: 1 }] };
    const started = applyTownCommand(current, { type: "forge.start", recipeId: "starter_sword", commandId: "forge-command" });
    expect(started.state).toMatchObject({ forgeMaterials: [], pendingForge: { previewId: "preview-forge-command" } });
    const finalized = applyTownCommand(started.state, { type: "forge.finalize", previewId: "preview-forge-command" });
    expect(finalized.state).toMatchObject({ pendingForge: null, storedItems: [{ itemId: "starter_sword", rarity: "common", count: 2 }] });
    const recycled = applyTownCommand({ ...finalized.state, forgeMaterials: [] }, { type: "inventory.recycle", itemId: "starter_sword", rarity: "common" });
    expect(recycled.state).toMatchObject({ storedItems: [{ itemId: "starter_sword", count: 1 }], forgeMaterials: [{ materialId: "metal_scrap", count: 2 }] });
    expect(() => applyTownCommand(recycled.state, { type: "forge.finalize", previewId: "preview-forge-command" })).toThrow("forge preview not found");
    const rareRecycle = applyTownCommand({ ...recycled.state, storedItems: [{ itemId: "starter_sword", rarity: "rare", count: 1 }], forgeMaterials: [] }, { type: "inventory.recycle", itemId: "starter_sword", rarity: "rare" });
    expect(rareRecycle.state.forgeMaterials).toEqual([
      { materialId: "metal_scrap", rarity: "common", count: 3 },
      { materialId: "refined_metal", rarity: "uncommon", count: 4 },
      { materialId: "enchanted_fragment", rarity: "rare", count: 2 },
    ]);
    const secondPreview = applyTownCommand({ ...current, forgeMaterials: [
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 1 },
    ] }, { type: "forge.start", recipeId: "quick_dagger", commandId: "second-forge" });
    expect(() => applyTownCommand(secondPreview.state, { type: "forge.finalize", previewId: "preview-second-forge", chosenModifierStat: "maxHp" })).toThrow("modifier is incompatible");
  });
});
