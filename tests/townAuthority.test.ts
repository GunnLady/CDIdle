import { describe, expect, it } from "vitest";
import { applyTownCommand, initialTownState, migrateTownState } from "../supabase/functions/game-api/town-authority";
import { generateAuthoritativeNoviceEquipment } from "../supabase/functions/game-api/inventory-authority";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { calculateAuthoritativeHeroStats } from "../supabase/functions/game-api/novice-stats-authority";
import { calculateXpNeeded, getHeroStats, refreshHeroDerivedStats } from "../src/utils/gameCalculations";
import { CLASS_INFO_LIST } from "../src/data/heroes";
import type { Hero } from "../src/types";
import { makeHero } from "./fixtures/game";

const withoutIdentity = (hero: Record<string, unknown>) => {
  const { id: _id, name: _name, ...profile } = hero;
  return profile;
};

describe("authoritative town commands", () => {
  it("initializes and migrates the six historical novice blueprints", () => {
    expect(initialTownState().itemBlueprints).toHaveLength(6);
    expect(initialTownState().itemBlueprints).not.toContainEqual({ itemId: "novice_mystic_robe", unlocked: true });
    expect(migrateTownState({ ...initialTownState(), itemBlueprints: [] }).itemBlueprints).toEqual(initialTownState().itemBlueprints);
  });

  it("migrates a derived XP threshold without consuming gameplay RNG", () => {
    const current = {
      ...initialTownState(),
      heroes: [makeHero({ xpNeeded: 120 })],
      onboardingCandidates: [makeHero({ id: "candidate", xpNeeded: 120 })],
      pendingRecruit: makeHero({ id: "pending", xpNeeded: 120 }),
    };
    const migrated = migrateTownState(current);
    expect((migrated.heroes as unknown as Hero[])[0].xpNeeded).toBe(100);
    expect((migrated.onboardingCandidates as unknown as Hero[])[0].xpNeeded).toBe(100);
    expect((migrated.pendingRecruit as unknown as Hero).xpNeeded).toBe(100);
    expect(migrated.rngState).toEqual(current.rngState);
  });

  it("rejects excess persisted XP that would require random level growth to repair", () => {
    expect(() => migrateTownState({
      ...initialTownState(),
      heroes: [makeHero({ xp: 110, xpNeeded: 120 })],
    })).toThrow("canonical game state is invalid");
  });

  it("rejects a malformed persisted hero before applying any command", () => {
    const malformed = {
      ...makeHero(),
      calculatedStats: undefined,
    };
    expect(() => applyTownCommand(
      { ...initialTownState(), heroes: [malformed] },
      { type: "building.upgrade", buildingId: "ferme" },
    )).toThrow("canonical game state is invalid");
  });

  it("rejects an invalid skill before applying a command or advancing RNG", () => {
    const current = {
      ...initialTownState(),
      heroes: [makeHero({ activeSkills: ["missing_active"] })],
    };
    const before = structuredClone(current);
    let failure: unknown;
    try {
      applyTownCommand(current, { type: "building.upgrade", buildingId: "ferme" });
    } catch (error) {
      failure = error;
    }
    expect(failure).toMatchObject({
      code: "INVALID_GAME_STATE",
      reason: expect.stringContaining(
        "heroes[0].activeSkills contains unknown skill missing_active",
      ),
    });
    expect(current).toEqual(before);
  });

  it("generates deterministic novice equipment from the server catalog", () => {
    const equipment = generateAuthoritativeNoviceEquipment("starter-seed");
    expect(equipment).toEqual(generateAuthoritativeNoviceEquipment("starter-seed"));
    expect(["starter_sword", "quick_dagger", "woodcutter_axe"]).toContain(equipment.mainHand?.itemId);
    expect(["traveler_clothes", "simple_leather_armor", "novice_mystic_robe"]).toContain(equipment.armor?.itemId);
    expect([null, "wooden_shield"]).toContain(equipment.offHand?.itemId ?? null);
    expect(equipment.accessory).toBeNull();
    const firstOwner = generateAuthoritativeNoviceEquipment("shared-roll", "hero-one");
    const secondOwner = generateAuthoritativeNoviceEquipment("shared-roll", "hero-two");
    expect(firstOwner.mainHand?.itemId).toBe(secondOwner.mainHand?.itemId);
    expect(firstOwner.mainHand?.instanceId).not.toBe(secondOwner.mainHand?.instanceId);
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
    expect(candidates.every((candidate) => candidate.race === "Humain")).toBe(true);
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
    expect(() => applyTownCommand({ ...initialTownState(), heroes: [makeHero({ id: "existing" })] }, {
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

  it("condenses several building upgrades into one atomic command", () => {
    const current = initialTownState();
    current.resources.gold = 1_000;
    current.resources.food = 1_000;
    const result = applyTownCommand(current, { type: "building.upgrade", buildingId: "ferme", levels: 3 });
    expect(result.state).toMatchObject({ buildings: { ferme: 3 } });
    expect(result.events).toEqual([{ type: "building.upgraded", buildingId: "ferme", level: 3, levels: 3 }]);

    const poor = initialTownState();
    poor.resources.gold = 10;
    poor.resources.food = 10;
    expect(() => applyTownCommand(poor, { type: "building.upgrade", buildingId: "ferme", levels: 2 })).toThrow("insufficient resources");
    expect(poor.buildings.ferme).toBe(0);
    expect(poor.resources).toMatchObject({ gold: 10, food: 10 });
  });

  it("gates authoritative cheats behind the runtime flag", () => {
    expect(() => applyTownCommand(initialTownState(), { type: "cheat.grant_resources", amounts: { gold: 10 } })).toThrow("cheats are disabled");
    const result = applyTownCommand(initialTownState(), { type: "cheat.grant_resources", amounts: { gold: 10 } }, { allowCheats: true });
    expect(result.state).toMatchObject({ resources: { gold: 85 } });
  });

  it("rejects allocation until its profession building exists", () => {
    expect(() => applyTownCommand(initialTownState(), { type: "citizens.allocate", role: "farmers", amount: 1 })).toThrow("profession building");
  });

  it("rejects districts while their redesign is pending and preserves the state", () => {
    const current = initialTownState();
    expect(() => applyTownCommand(current, { type: "district.unlock", districtId: "quartier_ferme" })).toThrow("districts are disabled");
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
    const replayedRecruit = applyTownCommand(current, { type: "hero.recruit", commandId: "hero-command" });
    expect(replayedRecruit.state.heroes).toEqual(recruited.state.heroes);
    expect(replayedRecruit.state.rngState).toEqual(recruited.state.rngState);
    const dismissed = applyTownCommand(recruited.state, { type: "hero.dismiss", heroId: "hero-hero-command" });
    expect(dismissed.state).toMatchObject({ heroes: [] });
    const recruitedEquipment = Object.values(((recruited.state.heroes as Array<Record<string, any>>)[0].equipment as Record<string, { instanceId?: string } | null>));
    const expectedInstanceIds = recruitedEquipment.flatMap((item) => item?.instanceId ? [item.instanceId] : []);
    expect((dismissed.state.storedItems as Array<{ instanceId: string }>).map((item) => item.instanceId)).toEqual(expectedInstanceIds);
  });

  it("reconciles an existing level-10 Novice without consuming RNG and applies its chosen vocation", () => {
    const base = initialTownState();
    const novice = refreshHeroDerivedStats(makeHero({
      id: "hero-existing-vocation",
      level: 10,
      xp: 0,
      xpNeeded: calculateXpNeeded(11, "Novice"),
      baseStats: { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 },
      isActive: true,
      status: "idle",
      activeSkills: ["heavy_blow"],
      passiveSkills: ["survival_instinct"],
    }));
    const migrated = migrateTownState({
      ...base,
      heroes: [novice],
      buildings: { ...base.buildings, caserne: 1 },
    });

    expect(migrated.rngState).toEqual(base.rngState);
    expect(migrated.autoExplore).toBe(false);
    expect(migrated.heroes?.[0]).toMatchObject({ isActive: false, status: "resting" });
    expect(migrated.pendingClassTransitions).toHaveLength(1);
    expect(migrated.pendingClassTransitions[0]).toMatchObject({
      heroId: novice.id,
      candidates: [{ classType: "Guerrier" }],
      wasActive: true,
    });
    const reloaded = migrateTownState(structuredClone(migrated) as unknown as Record<string, unknown>);
    expect(reloaded.pendingClassTransitions).toEqual(migrated.pendingClassTransitions);
    expect(reloaded.rngState).toEqual(migrated.rngState);

    const chosen = applyTownCommand(migrated as unknown as Record<string, unknown>, {
      type: "hero.choose_vocation",
      heroId: novice.id,
      classType: "Guerrier",
    });
    const authoritativeReplay = applyTownCommand(reloaded as unknown as Record<string, unknown>, {
      type: "hero.choose_vocation",
      heroId: novice.id,
      classType: "Guerrier",
    });
    const evolved = (chosen.state.heroes as Array<Record<string, any>>)[0];
    expect(evolved).toMatchObject({ classType: "Guerrier", isActive: true, status: "idle" });
    expect(evolved.equipment.mainHand.instanceId).toBe(`item:${novice.id}:tier1:weapon`);
    expect(evolved.equipment.accessory.instanceId).toBe(`item:${novice.id}:tier1:accessory`);
    expect(chosen.state.pendingClassTransitions).toEqual([]);
    expect((chosen.state.rngState as { draws: number }).draws).toBe(base.rngState.draws + 1);
    expect(authoritativeReplay).toEqual(chosen);
    const instanceIds = (Object.values(evolved.equipment) as Array<{ instanceId?: string } | null>)
      .flatMap((item) => item?.instanceId ? [item.instanceId] : []);
    expect(new Set(instanceIds).size).toBe(instanceIds.length);
  });

  it("drops a stale pending vocation when the persisted hero already changed class", () => {
    const base = initialTownState();
    const warrior = refreshHeroDerivedStats(makeHero({
      id: "hero-already-evolved",
      level: 10,
      classType: "Guerrier",
      xpNeeded: calculateXpNeeded(11, "Guerrier"),
    }));
    const migrated = migrateTownState({
      ...base,
      heroes: [warrior],
      pendingClassTransitions: [{
        heroId: warrior.id,
        fromClass: "Novice",
        fromTier: 0,
        toTier: 1,
        originLevel: 10,
        wasActive: true,
        previousStatus: "idle",
        reason: "stale",
        candidates: [{ classType: "Guerrier", affinity: 0.9 }],
      }],
    });

    expect(migrated.pendingClassTransitions).toEqual([]);
    expect(migrated.heroes?.[0]).toMatchObject({ classType: "Guerrier" });
    expect(migrated.rngState).toEqual(base.rngState);
  });

  it("rejects an unoffered vocation and resolves several pending heroes independently", () => {
    const base = initialTownState();
    const warrior = refreshHeroDerivedStats(makeHero({
      id: "hero-prayer-warrior",
      level: 10,
      xpNeeded: calculateXpNeeded(11, "Novice"),
      baseStats: { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 },
      activeSkills: ["heavy_blow"],
      passiveSkills: ["survival_instinct"],
    }));
    const mage = refreshHeroDerivedStats(makeHero({
      id: "hero-prayer-mage",
      level: 10,
      xpNeeded: calculateXpNeeded(11, "Novice"),
      baseStats: { str: 1, agi: 1, end: 1, int: 50, wiz: 1, dex: 50, luk: 1 },
      activeSkills: ["heavy_blow"],
      passiveSkills: ["survival_instinct"],
    }));
    const migrated = migrateTownState({
      ...base,
      heroes: [warrior, mage],
      buildings: { ...base.buildings, caserne: 1, academie: 1 },
    });
    expect(migrated.pendingClassTransitions).toHaveLength(2);
    expect(() => applyTownCommand(migrated as unknown as Record<string, unknown>, {
      type: "hero.choose_vocation",
      heroId: warrior.id,
      classType: "Acolyte",
    })).toThrow("chosen vocation was not offered");

    const chosen = applyTownCommand(migrated as unknown as Record<string, unknown>, {
      type: "hero.choose_vocation",
      heroId: warrior.id,
      classType: "Guerrier",
    });
    expect(chosen.state.pendingClassTransitions).toHaveLength(1);
    expect((chosen.state.pendingClassTransitions as Array<{ heroId: string }>)[0].heroId).toBe(mage.id);
  });

  it("reserves an active party slot while a hero is waiting for a vocation", () => {
    const base = initialTownState();
    const pendingHero = refreshHeroDerivedStats(makeHero({
      id: "hero-reserved",
      level: 10,
      xpNeeded: calculateXpNeeded(11, "Novice"),
      baseStats: { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 },
      isActive: true,
      status: "idle",
    }));
    const migrated = migrateTownState({
      ...base,
      heroes: [
        pendingHero,
        makeHero({ id: "active-1", isActive: true }),
        makeHero({ id: "active-2", isActive: true }),
        makeHero({ id: "active-3", isActive: true }),
        makeHero({ id: "waiting", isActive: false, status: "resting" }),
      ],
      buildings: { ...base.buildings, caserne: 1 },
    });

    expect(() => applyTownCommand(migrated as unknown as Record<string, unknown>, {
      type: "hero.activity",
      heroId: "waiting",
      active: true,
    })).toThrow("active hero limit reached");

    const chosen = applyTownCommand(migrated as unknown as Record<string, unknown>, {
      type: "hero.choose_vocation",
      heroId: pendingHero.id,
      classType: "Guerrier",
    });
    expect((chosen.state.heroes as Array<Record<string, unknown>>)
      .filter((hero) => hero.isActive)).toHaveLength(4);
    expect((chosen.state.heroes as Array<Record<string, unknown>>)
      .find((hero) => hero.id === pendingHero.id)).toMatchObject({ isActive: true });
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
    expect(offeredCandidate.race).toBe("Humain");
    const confirmedHero = (confirmed.state.heroes as Array<Record<string, unknown>>)[0];
    expect(withoutIdentity(confirmedHero)).toEqual(withoutIdentity(offeredCandidate));
    const secondOffer = applyTownCommand({ ...confirmed.state, pendingRecruit: null }, { type: "hero.recruit_offer", commandId: "cancel-command" });
    const cancelled = applyTownCommand(secondOffer.state, { type: "hero.recruit_cancel" });
    expect(cancelled.state).toMatchObject({ pendingRecruit: null, heroes: [{ name: "Ariane" }] });
  });

  it("handles inventory stacks and atomic hero equipment", () => {
    const current = {
      ...initialTownState(),
      heroes: [makeHero({ id: "hero-1", level: 1, equipment: {} })],
      storedItems: [
        { instanceId: "item-one", itemId: "starter_sword", rarity: "common" },
        { instanceId: "item-two", itemId: "starter_sword", rarity: "common" },
      ],
    };
    const equipped = applyTownCommand(current, { type: "hero.equip", heroId: "hero-1", instanceId: "item-one" });
    expect(equipped.state).toMatchObject({ storedItems: [{ instanceId: "item-two" }], heroes: [{ equipment: { mainHand: { instanceId: "item-one", itemId: "starter_sword" } } }] });
    const unequipped = applyTownCommand(equipped.state, { type: "hero.unequip", heroId: "hero-1", slot: "mainHand" });
    expect(unequipped.state).toMatchObject({ storedItems: [{ instanceId: "item-two" }, { instanceId: "item-one" }], heroes: [{ equipment: {} }] });
    expect(() => applyTownCommand({ ...current, storedItems: [{ instanceId: "item-unknown", itemId: "unknown-item", rarity: "common" }] }, { type: "hero.equip", heroId: "hero-1", instanceId: "item-unknown" })).toThrow("unknown item");
  });

  it("preserves health and mana percentages across equipment mutations", () => {
    const baseline = refreshHeroDerivedStats(makeHero({
      id: "hero-resource-ratio",
      level: 10,
      equipment: {},
    }));
    const full = {
      ...baseline,
      currentHp: baseline.calculatedStats.maxHp,
      currentMana: baseline.calculatedStats.maxMana,
    };
    const withBelt = applyTownCommand({
      ...initialTownState(),
      heroes: [full],
      storedItems: [
        { instanceId: "ratio-belt", itemId: "sturdy_travel_belt", rarity: "common" },
        { instanceId: "ratio-robe", itemId: "novice_mystic_robe", rarity: "common" },
      ],
    }, { type: "hero.equip", heroId: full.id, instanceId: "ratio-belt" });
    const withBoth = applyTownCommand(withBelt.state, {
      type: "hero.equip",
      heroId: full.id,
      instanceId: "ratio-robe",
    });
    const equipped = (withBoth.state.heroes as Hero[])[0];
    expect(equipped.currentHp).toBe(equipped.calculatedStats.maxHp);
    expect(equipped.currentMana).toBe(equipped.calculatedStats.maxMana);

    const injured = {
      ...equipped,
      currentHp: Math.floor(equipped.calculatedStats.maxHp / 2),
      currentMana: Math.floor(equipped.calculatedStats.maxMana / 2),
    };
    const withoutBelt = applyTownCommand({ ...withBoth.state, heroes: [injured] }, {
      type: "hero.unequip",
      heroId: full.id,
      slot: "accessory",
    });
    const hpAdjusted = (withoutBelt.state.heroes as Hero[])[0];
    expect(hpAdjusted.currentHp).toBe(Math.floor(
      hpAdjusted.calculatedStats.maxHp * injured.currentHp / injured.calculatedStats.maxHp,
    ));
    const withoutRobe = applyTownCommand(withoutBelt.state, {
      type: "hero.unequip",
      heroId: full.id,
      slot: "armor",
    });
    const manaAdjusted = (withoutRobe.state.heroes as Hero[])[0];
    expect(manaAdjusted.currentMana).toBe(Math.floor(
      manaAdjusted.calculatedStats.maxMana * hpAdjusted.currentMana / hpAdjusted.calculatedStats.maxMana,
    ));
  });

  it("allows equipment independently from the vocation reward pools", () => {
    const mage = makeHero({ id: "hero-mage", level: 10, classType: "Mage", equipment: {} });
    const current = {
      ...initialTownState(),
      heroes: [mage],
      storedItems: [{ instanceId: "warrior-sword", itemId: "basic_sword", rarity: "common" }],
    };

    const equipped = applyTownCommand(current, {
      type: "hero.equip",
      heroId: mage.id,
      instanceId: "warrior-sword",
    });
    expect(equipped.state).toMatchObject({
      storedItems: [],
      heroes: [{ id: mage.id, equipment: { mainHand: { itemId: "basic_sword" } } }],
    });
  });

  it("returns the off-hand to storage when equipping an approved two-handed Tier 1 weapon", () => {
    const warrior = makeHero({
      id: "hero-warrior",
      level: 10,
      classType: "Guerrier",
      equipment: {
        offHand: { instanceId: "shield", itemId: "wooden_shield", rarity: "common" },
      },
    });
    const equipped = applyTownCommand({
      ...initialTownState(),
      heroes: [warrior],
      storedItems: [{ instanceId: "spear", itemId: "basic_spear", rarity: "common" }],
    }, {
      type: "hero.equip",
      heroId: warrior.id,
      instanceId: "spear",
    });

    expect(equipped.state).toMatchObject({
      storedItems: [{ instanceId: "shield", itemId: "wooden_shield" }],
      heroes: [{
        equipment: {
          mainHand: { instanceId: "spear", itemId: "basic_spear" },
        },
      }],
    });
    expect(((equipped.state.heroes as Array<Record<string, any>>)[0].equipment).offHand).toBeUndefined();
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
      instanceId: initialWeapon.instanceId,
    });
    const restored = (equipped.state.heroes as Array<Record<string, any>>)[0];
    expect(restored.calculatedStats).toEqual(initialStats);
    expect(restored.calculatedStats).toEqual(
      refreshHeroDerivedStats(restored as unknown as Hero).calculatedStats,
    );
  });

  it("recalculates Tier 1 stats with persisted rarity and forge modifiers", () => {
    const warrior = generateAuthoritativeNovice("tier-one-equipment", "hero-warrior") as Record<string, any>;
    warrior.classType = "Guerrier";
    warrior.passiveSkills = ["weapon_training"];
    warrior.equipment = {};
    const started = applyTownCommand({
      ...initialTownState(),
      buildings: { ...initialTownState().buildings, forge: 1 },
      heroes: [warrior],
      forgeMaterials: [
        { materialId: "metal_scrap", rarity: "common", count: 6 },
        { materialId: "refined_metal", rarity: "uncommon", count: 3 },
      ],
    }, { type: "forge.start", recipeId: "starter_sword", commandId: "tier-one-forge" });
    const finalized = applyTownCommand({
      ...started.state,
      pendingForge: { ...(started.state.pendingForge as Record<string, unknown>), upgradeProc: "uncommon" },
    }, {
      type: "forge.finalize",
      previewId: "preview-tier-one-forge",
      acceptUpgrade: true,
      chosenModifierStat: "criticalChance",
    });
    const stack = (finalized.state.storedItems as Array<Record<string, any>>)[0];
    const equipped = applyTownCommand(finalized.state, {
      type: "hero.equip",
      heroId: warrior.id,
      instanceId: stack.instanceId,
    });
    const updated = (equipped.state.heroes as Array<Record<string, any>>)[0];
    expect(updated.calculatedStats).toEqual(
      refreshHeroDerivedStats(updated as unknown as Hero).calculatedStats,
    );
    expect(updated.calculatedStats.physicalDamage).toBeGreaterThan(warrior.calculatedStats.physicalDamage);
    const unequipped = applyTownCommand(equipped.state, { type: "hero.unequip", heroId: warrior.id, slot: "mainHand" });
    const restored = (unequipped.state.heroes as Array<Record<string, any>>)[0];
    expect(restored.calculatedStats).toEqual(refreshHeroDerivedStats(restored as unknown as Hero).calculatedStats);
    expect(restored.calculatedStats.physicalDamage).toBeLessThan(updated.calculatedStats.physicalDamage);
  });

  it.each(CLASS_INFO_LIST.filter((entry) => entry.tier === 1))(
    "recalculates equipment stats for Tier 1 $type",
    (classInfo) => {
      const generated = generateAuthoritativeNovice(`tier-one-${classInfo.type}`, `hero-${classInfo.type}`) as unknown as Hero;
      const hero = refreshHeroDerivedStats({
        ...generated,
        classType: classInfo.type,
        passiveSkills: classInfo.passiveSkills.slice(0, 1),
        equipment: {},
        currentHp: 1,
        currentMana: 0,
      });
      const baseline = hero.calculatedStats;
      const current = {
        ...initialTownState(),
        heroes: [hero],
        storedItems: [{ instanceId: `item-${classInfo.type}`, itemId: "starter_sword", rarity: "common" }],
      };

      const equipped = applyTownCommand(current, {
        type: "hero.equip",
        heroId: hero.id,
        instanceId: `item-${classInfo.type}`,
      });
      const updated = (equipped.state.heroes as unknown as Hero[])[0];
      expect(updated.calculatedStats).toEqual(getHeroStats(updated));
      expect(updated.calculatedStats.physicalDamage).toBeGreaterThan(baseline.physicalDamage);

      const unequipped = applyTownCommand(equipped.state, {
        type: "hero.unequip",
        heroId: hero.id,
        slot: "mainHand",
      });
      const restored = (unequipped.state.heroes as unknown as Hero[])[0];
      expect(restored.calculatedStats).toEqual(baseline);
    },
  );

  it.each([
    ["mainHand", "starter_sword"],
    ["mainHand", "quick_dagger"],
    ["mainHand", "woodcutter_axe"],
    ["offHand", "wooden_shield"],
    ["armor", "traveler_clothes"],
    ["armor", "simple_leather_armor"],
    ["armor", "novice_mystic_robe"],
  ] as const)("keeps server and client novice effects aligned for %s %s", (slot, itemId) => {
    const hero = generateAuthoritativeNovice(`rarity-${itemId}`, `hero-${itemId}`) as unknown as Hero;
    const equipment = { [slot]: { itemId, rarity: "common" as const } };
    expect(calculateAuthoritativeHeroStats(hero.baseStats, hero.passiveSkills, equipment)).toEqual(
      getHeroStats({ ...hero, equipment }),
    );
  });

  it("keeps forge preview and recycling atomic", () => {
    const current = { ...initialTownState(), buildings: { ...initialTownState().buildings, forge: 1 }, forgeMaterials: [
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 1 },
    ], storedItems: [{ instanceId: "item-existing", itemId: "starter_sword", rarity: "common" }] };
    const started = applyTownCommand(current, { type: "forge.start", recipeId: "starter_sword", commandId: "forge-command" });
    expect(started.state).toMatchObject({ forgeMaterials: [], pendingForge: { previewId: "preview-forge-command" } });
    expect((started.state.rngState as { draws: number }).draws).toBe(current.rngState.draws + 1);
    const finalized = applyTownCommand(started.state, { type: "forge.finalize", previewId: "preview-forge-command", acceptUpgrade: false });
    expect(finalized.state).toMatchObject({ pendingForge: null, storedItems: [{ instanceId: "item-existing" }, { instanceId: "item:forge:preview-forge-command" }] });
    expect(finalized.state.rngState).toEqual(started.state.rngState);
    const recycled = applyTownCommand({ ...finalized.state, forgeMaterials: [] }, { type: "inventory.recycle", instanceId: "item-existing" });
    expect(recycled.state).toMatchObject({ storedItems: [{ instanceId: "item:forge:preview-forge-command" }], forgeMaterials: [{ materialId: "metal_scrap", count: 2 }] });
    expect(() => applyTownCommand(recycled.state, { type: "forge.finalize", previewId: "preview-forge-command" })).toThrow("forge preview not found");
    const rareRecycle = applyTownCommand({ ...recycled.state, storedItems: [{ instanceId: "item-rare", itemId: "starter_sword", rarity: "rare" }], forgeMaterials: [] }, { type: "inventory.recycle", instanceId: "item-rare" });
    expect(rareRecycle.state.forgeMaterials).toEqual([
      { materialId: "metal_scrap", rarity: "common", count: 3 },
      { materialId: "refined_metal", rarity: "uncommon", count: 4 },
      { materialId: "enchanted_fragment", rarity: "rare", count: 2 },
    ]);
    const tier1RewardRecycle = applyTownCommand({
      ...recycled.state,
      storedItems: [{ instanceId: "item:hero-aede:tier1:weapon", itemId: "basic_lute", rarity: "common" }],
      forgeMaterials: [],
    }, { type: "inventory.recycle", instanceId: "item:hero-aede:tier1:weapon" });
    expect(tier1RewardRecycle.state).toMatchObject({
      storedItems: [],
      forgeMaterials: [{ materialId: "metal_scrap", rarity: "common", count: 2 }],
    });
    const secondPreview = applyTownCommand({ ...current, forgeMaterials: [
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 1 },
    ] }, { type: "forge.start", recipeId: "quick_dagger", commandId: "second-forge" });
    expect(() => applyTownCommand({
      ...secondPreview.state,
      pendingForge: { ...(secondPreview.state.pendingForge as Record<string, unknown>), upgradeProc: "uncommon" },
      forgeMaterials: [{ materialId: "refined_metal", rarity: "uncommon", count: 2 }],
    }, { type: "forge.finalize", previewId: "preview-second-forge", acceptUpgrade: true, chosenModifierStat: "maxHp" })).toThrow("modifier is incompatible");
  });
});
