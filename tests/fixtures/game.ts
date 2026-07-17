import type { CitizenAllocation, DungeonEncounterType, Hero, Resources, StoredItemStack } from "../../src/types";

export const makeResources = (overrides: Partial<Resources> = {}): Resources => ({
  gold: 100,
  food: 50,
  wood: 50,
  stone: 50,
  ore: 50,
  ...overrides,
});

export const makeCitizens = (overrides: Partial<CitizenAllocation> = {}): CitizenAllocation => ({
  woodcutters: 0,
  farmers: 0,
  miners: 0,
  quarrymen: 0,
  unassigned: 0,
  ...overrides,
});

export const makeBuildings = (overrides: Record<string, number> = {}): Record<string, number> => ({
  scierie: 1,
  ferme: 1,
  carriere: 1,
  mine: 1,
  ...overrides,
});

export const makeEncounter = (type: DungeonEncounterType = "fight"): DungeonEncounterType => type;

export const makeStoredItem = (overrides: Partial<StoredItemStack> = {}): StoredItemStack => ({
  itemId: "wooden_sword",
  rarity: "common",
  count: 1,
  ...overrides,
});

export const makeHero = (overrides: Partial<Hero> = {}): Hero => ({
  id: "hero-fixture",
  name: "Héros fixture",
  race: "Humain",
  classType: "Novice",
  level: 1,
  xp: 0,
  xpNeeded: 100,
  currentHp: 20,
  currentMana: 10,
  baseStats: { str: 5, agi: 5, end: 5, int: 5, wiz: 5, dex: 5, luk: 5 },
  isActive: true,
  status: "idle",
  activeSkills: [],
  passiveSkills: [],
  calculatedStats: {
    maxHp: 20,
    hp: 20,
    maxMana: 10,
    mana: 10,
    physicalDamage: 5,
    magicDamage: 5,
    physicalDefense: 5,
    magicDefense: 5,
    speed: 5,
    criticalChance: 0,
    dodgeChance: 0,
    resistances: {
      arcane: 0, fire: 0, ice: 0, water: 0, earth: 0, wind: 0,
      lightning: 0, holy: 0, dark: 0, nature: 0, sound: 0, poison: 0,
      blood: 0, radiant: 0,
    },
  },
  equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
  ...overrides,
});
