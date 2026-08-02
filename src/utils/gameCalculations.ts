import {
  ResourceRates,
  CitizenAllocation,
  Hero,
  HeroStats,
  CalculatedStats,
  ClassType,
  SkillInfo,
  WeaponItemInfo,
  OffHandItemInfo,
  ArmorItemInfo,
  Modifier,
  Rarity,
  EquippedItemRef,
  StoredItemInstance,
  ForgeMaterial,
  HeroEquipment,
  ItemInfo,
  DamageType,
  ElementalDamageType,
  Monster,
  ItemBlueprint
} from "../types.ts";
import {
  RACE_INFO_LIST,
  CLASS_INFO_LIST,
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  SKILLS_LIBRARY,
  getSkillsByIds,
  NOVICE_BASIC_ITEM_LIST,
  getItemById,
  WEAPON_INFO_LIST
} from "../data/gameData.ts";
import { BUILDINGS_LIST } from "../data/buildings.ts";
import type { Rng } from "../domain/random.ts";
import { systemRng } from "../domain/random.ts";
import { calculateHeroDerivedStats } from "../../shared/domain/hero-stats.ts";
import { applyItemRarityScaling as applyCanonicalItemRarityScaling } from "../../shared/domain/items/scaling.ts";
export {
  ITEM_RARITY_DAMAGE_MULTIPLIERS,
  ITEM_RARITY_FLAT_MODIFIER_MULTIPLIERS,
  ITEM_RARITY_PERCENT_MODIFIER_MULTIPLIERS,
  ITEM_RARITY_MODIFIER_COUNTS,
  scaleModifierByRarity,
  generateExtraModifiersForRarity,
} from "../../shared/domain/items/scaling.ts";

export const getHeroAttributes = (
  hero: Hero
): HeroStats => {
  const baseS = hero.baseStats || { str: 5, agi: 5, end: 5, int: 5, wiz: 5, dex: 5, luk: 5 };

  const str = baseS.str;
  const agi = baseS.agi;
  const end = baseS.end;
  const int = baseS.int;
  const wiz = baseS.wiz;
  const dex = baseS.dex;
  const luk = baseS.luk;

  return { str, agi, end, int, wiz, dex, luk };
};

/* Historical implementation retained as adapter context until CDI-079 prunes it.
export const ITEM_RARITY_DAMAGE_MULTIPLIERS: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.25,
  epic: 3.5,
  legendary: 5
};

export const ITEM_RARITY_FLAT_MODIFIER_MULTIPLIERS: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.5,
  epic: 4,
  legendary: 6
};

export const ITEM_RARITY_PERCENT_MODIFIER_MULTIPLIERS: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.25,
  rare: 1.75,
  epic: 2.5,
  legendary: 3.5
};

export const ITEM_RARITY_MODIFIER_COUNTS: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5
};

export function scaleModifierByRarity(modifier: Modifier, rarity: Rarity): Modifier {
  const type = modifier.type ?? "flat";
  const multiplier = type === "flat"
    ? ITEM_RARITY_FLAT_MODIFIER_MULTIPLIERS[rarity]
    : ITEM_RARITY_PERCENT_MODIFIER_MULTIPLIERS[rarity];

  const sign = Math.sign(modifier.value);
  const scaledValue = sign * Math.round(Math.abs(modifier.value) * multiplier);

  return {
    ...modifier,
    type,
    value: scaledValue
  };
}

const WEAPON_POOL = ["physicalDamage", "magicDamage", "criticalChance", "speed", "dodgeChance"];
const ARMOR_POOL = [
  "maxHp",
  "maxMana",
  "physicalDefense",
  "magicDefense",
  "dodgeChance",
  "fireResistance",
  "iceResistance",
  "waterResistance",
  "earthResistance",
  "windResistance",
  "lightningResistance",
  "holyResistance",
  "darkResistance",
  "natureResistance",
  "arcaneResistance",
  "poisonResistance",
  "bloodResistance",
  "soundResistance",
  "radiantResistance"
];
const OFFHAND_POOL = [...ARMOR_POOL];
const ACCESSORY_POOL = [
  "maxHp",
  "maxMana",
  "physicalDamage",
  "magicDamage",
  "criticalChance",
  "dodgeChance",
  "speed",
  "fireResistance",
  "iceResistance",
  "waterResistance",
  "earthResistance",
  "windResistance",
  "lightningResistance",
  "holyResistance",
  "darkResistance",
  "natureResistance",
  "arcaneResistance",
  "poisonResistance",
  "bloodResistance",
  "soundResistance",
  "radiantResistance"
];

const EXTRA_MODIFIER_TEMPLATES: Record<string, { type: "flat" | "percent"; baseValue: number }[]> = {
  physicalDamage: [
    { type: "flat", baseValue: 1 },
    { type: "percent", baseValue: 1.5 }
  ],
  magicDamage: [
    { type: "flat", baseValue: 1 },
    { type: "percent", baseValue: 1.5 }
  ],
  criticalChance: [
    { type: "flat", baseValue: 1 },
    { type: "percent", baseValue: 1.5 }
  ],
  speed: [
    { type: "flat", baseValue: 1 },
    { type: "percent", baseValue: 1.5 }
  ],
  maxHp: [
    { type: "flat", baseValue: 5 },
    { type: "percent", baseValue: 2 }
  ],
  maxMana: [
    { type: "flat", baseValue: 5 },
    { type: "percent", baseValue: 2 }
  ],
  physicalDefense: [
    { type: "flat", baseValue: 1 },
    { type: "percent", baseValue: 1.5 }
  ],
  magicDefense: [
    { type: "flat", baseValue: 1 },
    { type: "percent", baseValue: 1.5 }
  ],
  dodgeChance: [
    { type: "percent", baseValue: 1.5 }
  ],
  fireResistance: [{ type: "flat", baseValue: 3 }],
  iceResistance: [{ type: "flat", baseValue: 3 }],
  waterResistance: [{ type: "flat", baseValue: 3 }],
  earthResistance: [{ type: "flat", baseValue: 3 }],
  windResistance: [{ type: "flat", baseValue: 3 }],
  lightningResistance: [{ type: "flat", baseValue: 3 }],
  holyResistance: [{ type: "flat", baseValue: 3 }],
  darkResistance: [{ type: "flat", baseValue: 3 }],
  natureResistance: [{ type: "flat", baseValue: 3 }],
  arcaneResistance: [{ type: "flat", baseValue: 3 }],
  poisonResistance: [{ type: "flat", baseValue: 3 }],
  bloodResistance: [{ type: "flat", baseValue: 3 }],
  soundResistance: [{ type: "flat", baseValue: 3 }],
  radiantResistance: [{ type: "flat", baseValue: 3 }]
};

export function generateExtraModifiersForRarity(
  item: ItemInfo,
  rarity: Rarity
): Modifier[] {
  const targetCount = ITEM_RARITY_MODIFIER_COUNTS[rarity];
  const baseModifiers = item.modifiers || [];
  const currentCount = baseModifiers.length;

  if (currentCount >= targetCount) {
    return [];
  }

  const neededCount = targetCount - currentCount;
  let pool: string[] = [];
  if (item.itemType === "weapon") pool = WEAPON_POOL;
  else if (item.itemType === "armor") pool = ARMOR_POOL;
  else if (item.itemType === "offhand") pool = OFFHAND_POOL;
  else if (item.itemType === "accessory") pool = ACCESSORY_POOL;

  if (pool.length === 0) return [];

  const usedStats = new Set<string>(baseModifiers.map(m => m.stat));
  const extraModifiers: Modifier[] = [];

  // Seed the LCG using the stable itemId and rarity
  const seedStr = `${item.id}_${rarity}`;
  let seed = 0;
  for (let c = 0; c < seedStr.length; c++) {
    seed = (seed * 31 + seedStr.charCodeAt(c)) | 0;
  }
  // Simple LCG (Linear Congruential Generator) for deterministic PRNG
  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };

  for (let i = 0; i < neededCount; i++) {
    // Filter out stats already used
    let candidates = pool.filter(stat => !usedStats.has(stat));
    if (candidates.length === 0) {
      // If we used all stats, allow duplicates
      candidates = pool;
    }

    // Select random stat from candidates deterministically
    const chosenStat = candidates[Math.floor(nextRandom() * candidates.length)];
    usedStats.add(chosenStat);

    // Get templates for the chosen stat
    const templates = EXTRA_MODIFIER_TEMPLATES[chosenStat] || [{ type: "flat", baseValue: 1 }];
    // Choose template deterministically
    const template = templates[Math.floor(nextRandom() * templates.length)];

    // Create the base modifier
    const baseMod: Modifier = {
      stat: chosenStat,
      type: template.type,
      value: template.baseValue
    };

    // Scale it and add to extras
    const scaledMod = scaleModifierByRarity(baseMod, rarity);
    extraModifiers.push(scaledMod);
  }

  return extraModifiers;
}
*/

export function applyItemRarityScaling<T extends ItemInfo>(item: T, rarity: Rarity, skipExtraModifiers: boolean = false): T {
  return applyCanonicalItemRarityScaling(item, rarity, skipExtraModifiers) as unknown as T;
}

export function resolveEquippedItem(equippedItemRef: EquippedItemRef | null | undefined): ItemInfo | null {
  if (!equippedItemRef || !equippedItemRef.itemId) return null;
  const baseItem = getItemById(equippedItemRef.itemId);
  if (!baseItem) return null;
  const scaled = applyItemRarityScaling(baseItem, equippedItemRef.rarity);
  if (equippedItemRef.modifiers && equippedItemRef.modifiers.length > 0) {
    scaled.modifiers = equippedItemRef.modifiers;
  }
  return scaled;
}

export function resolveWeaponDamageTypes(weaponItem: WeaponItemInfo | null | undefined): DamageType[] {
  if (!weaponItem) return ["physical"];
  if (weaponItem.damageTypes && weaponItem.damageTypes.length > 0) {
    return weaponItem.damageTypes;
  }
  const weaponType = WEAPON_INFO_LIST.find((w) => w.id === weaponItem.weaponTypeId);
  if (weaponType && weaponType.damageTypes && weaponType.damageTypes.length > 0) {
    return weaponType.damageTypes;
  }
  return ["physical"];
}

export function getEquippedItemModifiers(hero: Hero): Modifier[] {
  const mainHand = resolveEquippedItem(hero.equipment?.mainHand);
  const offHand = resolveEquippedItem(hero.equipment?.offHand);
  const armor = resolveEquippedItem(hero.equipment?.armor);
  const accessory = resolveEquippedItem(hero.equipment?.accessory);

  return [
    ...(mainHand?.modifiers ?? []),
    ...(offHand?.modifiers ?? []),
    ...(armor?.modifiers ?? []),
    ...(accessory?.modifiers ?? [])
  ];
}

export function getHeroEquipmentModifiers(hero: Hero): Modifier[] {
  return getEquippedItemModifiers(hero);
}

export const getHeroStats = (
  hero: Hero
): CalculatedStats => {
  const passiveModifiers = ((hero.passiveSkills) || [])
    .map(id => SKILLS_LIBRARY.find(s => s.id === id))
    .filter((s): s is SkillInfo => !!s && s.type === "passive")
    .flatMap(passive => ("modifiers" in passive.effect ? passive.effect.modifiers : []));

  const equipmentModifiers = getHeroEquipmentModifiers(hero);
  const allModifiers = [...passiveModifiers, ...equipmentModifiers];
  return calculateHeroDerivedStats(getHeroAttributes(hero), allModifiers) as CalculatedStats;
};

export const calculateXpNeeded = (nextLevel: number, classType: ClassType): number => {
  if (nextLevel < 2) return 100;

  const classInfo = CLASS_INFO_LIST.find((c) => c.type === classType);
  const tier: number = classInfo ? classInfo.tier : 0;

  let tierMultiplier = 1.00;
  if (tier === 1) {
    tierMultiplier = 1.25;
  } else if (tier === 2) {
    tierMultiplier = 1.60;
  } else if (tier === 3) {
    tierMultiplier = 2.00;
  }

  const baseExp = 100 * Math.pow(1.5, nextLevel - 2);
  return Math.ceil(baseExp * tierMultiplier);
};


export const refreshHeroDerivedStats = (hero: Hero): Hero => {
  const stats = getHeroStats(hero);
  const xpNeeded = calculateXpNeeded(hero.level + 1, hero.classType);
  return {
    ...hero,
    xpNeeded,
    currentMana: typeof hero.currentMana === "number" ? Math.min(stats.maxMana, hero.currentMana) : stats.maxMana,
    calculatedStats: stats
  };
};

export const generateNoviceStats = (rng: Rng = systemRng): { stats: HeroStats; isElite: boolean } => {
  const isElite = rng.next() < 0.005;

  const getRandomInt = (min: number, max: number) => {
    return rng.nextInt(max - min + 1) + min;
  };

  const statKeys: (keyof HeroStats)[] = ["str", "agi", "end", "int", "wiz", "dex", "luk"];

  if (isElite) {
    while (true) {
      // Pick 2 different stats
      const shuffled = [...statKeys].sort(() => rng.next() - 0.5);
      const highStatKeys = shuffled.slice(0, 2);
      
      const stats = {} as HeroStats;
      for (const key of statKeys) {
        if (highStatKeys.includes(key)) {
          stats[key] = getRandomInt(8, 10);
        } else {
          stats[key] = getRandomInt(1, 7);
        }
      }
      
      const total = stats.str + stats.agi + stats.end + stats.int + stats.wiz + stats.dex + stats.luk;
      if (total >= 16 && total <= 38) {
        return { stats, isElite: true };
      }
    }
  } else {
    while (true) {
      const stats = {} as HeroStats;
      for (const key of statKeys) {
        stats[key] = getRandomInt(1, 7);
      }
      
      const total = stats.str + stats.agi + stats.end + stats.int + stats.wiz + stats.dex + stats.luk;
      if (total >= 20 && total <= 33) {
        return { stats, isElite: false };
      }
    }
  }
};

export const calculateRates = (
  citizens: CitizenAllocation,
  buildings: { [key: string]: number },
  hasUser: boolean
): ResourceRates => {
  if (!hasUser) {
    return { wood: 0, food: 0, stone: 0, ore: 0 };
  }
  // Basic rates for allocated workers (only produce if at least one citizen is assigned)
  let woodRate = (citizens.woodcutters || 0) * (buildings["scierie"] || 0);
  let foodRate = (citizens.farmers || 0) * (buildings["ferme"] || 0);
  let stoneRate = (citizens.quarrymen || 0) * (buildings["carriere"] || 0);
  let oreRate = (citizens.miners || 0) * (buildings["mine"] || 0);

  // Apply Maison du chef global bonus from BUILDINGS_LIST
  const chefBuilding = BUILDINGS_LIST.find((b) => b.id === "maison_chef");
  const chefBonus = chefBuilding?.bonusPerLevel ?? 0.03;
  const chefLvl = buildings["maison_chef"] || 0;
  const globalMultiplier = 1 + chefLvl * chefBonus;

  woodRate *= globalMultiplier;
  foodRate *= globalMultiplier;
  stoneRate *= globalMultiplier;
  oreRate *= globalMultiplier;

  return { wood: woodRate, food: foodRate, stone: stoneRate, ore: oreRate };
};

export const getAvailableTier1Classes = (buildings: { [key: string]: number }): ClassType[] => {
  const available: ClassType[] = [];

  if (buildings["caserne"] && buildings["caserne"] >= 1) {
    available.push("Guerrier");
    available.push("Pugiliste");
  }
  if (buildings["poste_chasse"] && buildings["poste_chasse"] >= 1) {
    available.push("Archer");
  }
  if (buildings["academie"] && buildings["academie"] >= 1) {
    available.push("Mage");
    available.push("Aède");
  }
  if (buildings["cercle"] && buildings["cercle"] >= 1) {
    available.push("Druide");
  }
  if (buildings["lair"] && buildings["lair"] >= 1) {
    available.push("Voleur");
  }
  if (buildings["forge"] && buildings["forge"] >= 1) {
    available.push("Artificier");
  }
  if (buildings["temple"] && buildings["temple"] >= 1) {
    available.push("Acolyte");
  }

  return available;
};

export const getRandomNoviceWeapon = (rng: Rng = systemRng): WeaponItemInfo | null => {
  const weapons = (NOVICE_BASIC_ITEM_LIST || []).filter(item => item.itemType === "weapon");
  if (weapons.length === 0) return null;
  return weapons[rng.nextInt(weapons.length)] as WeaponItemInfo;
};

export const getRandomNoviceArmor = (rng: Rng = systemRng): ArmorItemInfo | null => {
  const armors = (NOVICE_BASIC_ITEM_LIST || []).filter(item => item.itemType === "armor");
  if (armors.length === 0) return null;
  return armors[rng.nextInt(armors.length)] as ArmorItemInfo;
};

export const getNoviceWoodenShield = (): OffHandItemInfo | null => {
  const shield = (NOVICE_BASIC_ITEM_LIST || []).find(item => item.id === "wooden_shield");
  if (!shield || shield.itemType !== "offhand") return null;
  return shield as OffHandItemInfo;
};

export const generateNoviceStarterEquipment = (rng: Rng = systemRng, instanceScope = "local-preview"): HeroEquipment => {
  const weapon = getRandomNoviceWeapon(rng);
  const armor = getRandomNoviceArmor(rng);
  const rolledShield = rng.next() < 0.15 ? getNoviceWoodenShield() : null;

  return {
    mainHand: weapon ? { instanceId: `item:${instanceScope}:mainHand`, itemId: weapon.id, rarity: weapon.rarity } : null,
    offHand: rolledShield ? { instanceId: `item:${instanceScope}:offHand`, itemId: rolledShield.id, rarity: rolledShield.rarity } : null,
    armor: armor ? { instanceId: `item:${instanceScope}:armor`, itemId: armor.id, rarity: armor.rarity } : null,
    accessory: null
  };
};


export function getStoredItemInstance(
  storedItems: StoredItemInstance[],
  instanceId: string,
): StoredItemInstance | undefined {
  return (storedItems || []).find((instance) => instance.instanceId === instanceId);
}

export function addItemToStorage(
  storedItems: StoredItemInstance[],
  instance: StoredItemInstance,
): StoredItemInstance[] {
  if (!instance.instanceId || !instance.itemId) return storedItems;
  if (getStoredItemInstance(storedItems, instance.instanceId)) throw new Error("DUPLICATE_ITEM_INSTANCE");
  storedItems.push(instance);
  return storedItems;
}

export function removeItemFromStorage(
  storedItems: StoredItemInstance[],
  instanceId: string,
): StoredItemInstance[] {
  const index = (storedItems || []).findIndex((instance) => instance.instanceId === instanceId);
  if (index !== -1) storedItems.splice(index, 1);
  return storedItems;
}

export function isMainHandTwoHanded(hero: Hero): boolean {
  if (!hero.equipment?.mainHand) return false;
  const mainHandItem = getItemById(hero.equipment.mainHand.itemId);
  if (!mainHandItem || mainHandItem.itemType !== "weapon") return false;
  const weaponItem = mainHandItem as WeaponItemInfo;
  const weaponInfo = WEAPON_INFO_LIST.find(w => w.id === weaponItem.weaponTypeId);
  return !!weaponInfo && (weaponInfo.handedness === "two_handed" || weaponInfo.handedness === "dual_wield");
}

export function unequipItem(
  hero: Hero,
  storedItems: StoredItemInstance[],
  slot: keyof HeroEquipment
): Hero {
  if (!hero.equipment) {
    hero.equipment = {};
    return hero;
  }
  const ref = hero.equipment[slot];
  if (!ref) return hero;

  // Retrieve item ID and rarity safely (supports both EquippedItemRef and full ItemInfo objects)
  if (ref.instanceId && ref.itemId) addItemToStorage(storedItems, { ...ref });

  // Clear slot
  const newEquipment = { ...hero.equipment, [slot]: null };
  const newHero = {
    ...hero,
    equipment: newEquipment
  };

  return refreshHeroDerivedStats(newHero);
}

export function equipItem(
  hero: Hero,
  storedItems: StoredItemInstance[],
  instanceId: string,
): Hero {
  if (!hero.equipment) {
    hero.equipment = {};
  }

  const instance = getStoredItemInstance(storedItems, instanceId);
  if (!instance) return hero;
  const resolvedItem = getItemById(instance.itemId);
  if (!resolvedItem) return hero;

  if (hero.level < (resolvedItem.requiredLevel ?? 1)) {
    return hero;
  }

  // Check stack in storage
  const itemType = resolvedItem.itemType;
  let targetSlot: keyof HeroEquipment;
  if (itemType === "weapon") {
    targetSlot = "mainHand";
  } else if (itemType === "offhand") {
    targetSlot = "offHand";
  } else if (itemType === "armor") {
    targetSlot = "armor";
  } else if (itemType === "accessory") {
    targetSlot = "accessory";
  } else {
    return hero;
  }

  // Handedness and block logic
  if (targetSlot === "offHand") {
    if (isMainHandTwoHanded(hero)) {
      return hero; // Blocked by 2-handed mainHand weapon
    }
  }

  // If slot is occupied, player must unequip manually (except for 2h/dual-wield weapon automatic offHand unequip)
  if (hero.equipment[targetSlot]) {
    return hero;
  }

  let tempHero: Hero = { ...hero, equipment: { ...hero.equipment } };

  if (targetSlot === "mainHand") {
    const weaponInfo = WEAPON_INFO_LIST.find(w => w.id === (resolvedItem as WeaponItemInfo).weaponTypeId);
    const isTwoHandedOrDualWield = !!weaponInfo && (weaponInfo.handedness === "two_handed" || weaponInfo.handedness === "dual_wield");
    if (isTwoHandedOrDualWield && tempHero.equipment.offHand) {
      // Unequip offhand and return it to storage
      tempHero = unequipItem(tempHero, storedItems, "offHand");
    }
  }

  // Now perform the equip
  // First remove the item from storage
  removeItemFromStorage(storedItems, instanceId);

  // Set the equipment reference
  tempHero.equipment[targetSlot] = { ...instance };

  return refreshHeroDerivedStats(tempHero);
}

export const generateSingleNoviceHero = (unlockedRaces: string[] = ["Humain"], rng: Rng = systemRng): Hero => {
  const availableRaceInfos = RACE_INFO_LIST.filter(r => unlockedRaces.includes(r.name));
  const chosenRace = availableRaceInfos.length > 0
    ? availableRaceInfos[rng.nextInt(availableRaceInfos.length)]
    : (RACE_INFO_LIST.find((r) => r.name === "Humain") || RACE_INFO_LIST[0]);
  const chosenClass = CLASS_INFO_LIST.find((c) => c.type === "Novice") || CLASS_INFO_LIST[0];

  const isMale = rng.nextInt(100) < 50;
  const gender = isMale ? "Male" : "Female";
  const firstNamePool = isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const fName = firstNamePool[rng.nextInt(firstNamePool.length)];
  const heroName = fName;

  const { stats: noviceRolledStats, isElite } = generateNoviceStats(rng);

  const activeSkillsFromClass = getSkillsByIds(chosenClass.activeSkills || []);
  const passiveSkillsFromClass = getSkillsByIds(chosenClass.passiveSkills || []);

  const activeSkills: string[] = [];
  if (activeSkillsFromClass.length > 0) {
    const randomActive = activeSkillsFromClass[rng.nextInt(activeSkillsFromClass.length)];
    activeSkills.push(randomActive.id);
  }

  const passiveSkills: string[] = [];
  if (passiveSkillsFromClass.length > 0) {
    const randomPassive = passiveSkillsFromClass[rng.nextInt(passiveSkillsFromClass.length)];
    passiveSkills.push(randomPassive.id);
  }

  const rolledStarterEquipment = generateNoviceStarterEquipment(rng);
  const generatedHeroId = `hero-${Math.floor(rng.next() * 0x1_0000_0000).toString(16)}`;
  const starterEquipment = Object.fromEntries(
    Object.entries(rolledStarterEquipment).map(([slot, item]) => [
      slot,
      item ? { ...item, instanceId: `item:${generatedHeroId}:${slot}` } : item,
    ]),
  ) as HeroEquipment;

  const initialHeroStub: Omit<Hero, "calculatedStats"> = {
    id: generatedHeroId,
    name: heroName,
    gender: gender,
    race: chosenRace.name,
    classType: chosenClass.type,
    level: 1,
    xp: 0,
    xpNeeded: 120,
    currentHp: 0,
    currentMana: 0,
    baseStats: noviceRolledStats,
    isElite: isElite,
    status: "idle",
    isActive: false,
    activeSkills: activeSkills,
    passiveSkills: passiveSkills,
    equipment: starterEquipment
  };

  const tempHero = refreshHeroDerivedStats(initialHeroStub as Hero);
  tempHero.currentHp = tempHero.calculatedStats.maxHp;
  tempHero.currentMana = tempHero.calculatedStats.maxMana;
  return tempHero as Hero;
};

export function getHeroMainHandWeapon(hero: Hero): WeaponItemInfo | null {
  const ref = hero.equipment?.mainHand;
  if (!ref) return null;
  const item = resolveEquippedItem(ref);
  if (item && item.itemType === "weapon") {
    return item as WeaponItemInfo;
  }
  return null;
}

export function getWeaponDamageTypes(weapon: WeaponItemInfo): DamageType[] {
  return resolveWeaponDamageTypes(weapon);
}

export function rollWeaponDamage(weapon: WeaponItemInfo | null, rng: Rng = systemRng): number {
  if (!weapon) {
    // unarmed damage range is 1 - 1
    return 1;
  }
  if (!weapon.damageRange) {
    return 0;
  }
  const { min, max } = weapon.damageRange;
  // Roll random value between min and max (inclusive)
  return rng.nextInt(max - min + 1) + min;
}

export function applyMonsterDefenseOrResistance(damage: number, damageType: DamageType, monster: Monster): number {
  if (damageType === "physical") {
    return Math.max(1, damage - monster.def);
  } else {
    const resPercent = monster.resistances?.[damageType as ElementalDamageType] ?? 0;
    return Math.max(1, Math.floor(damage * (1 - resPercent / 100)));
  }
}

export function applySplitDamageDefenseOrResistance(
  damage: number,
  damageTypes: DamageType[],
  monster: Monster
): number {
  if (damageTypes.length === 0) {
    return applyMonsterDefenseOrResistance(damage, "physical", monster);
  }
  if (damageTypes.length === 1) {
    return applyMonsterDefenseOrResistance(damage, damageTypes[0], monster);
  }

  const splitDamage = damage / damageTypes.length;
  const totalDamage = damageTypes.reduce(
    (total, damageType) => total + applyMonsterDefenseOrResistance(splitDamage, damageType, monster),
    0
  );
  return Math.max(1, Math.round(totalDamage));
}


export const FORGE_MATERIALS: ForgeMaterial[] = [
  {
    id: "metal_scrap",
    name: "Débris métalliques",
    rarity: "common",
    description: "Fragments de métal récupérés depuis des équipements basiques ou trouvés aux étages 1+ du donjon."
  },
  {
    id: "refined_metal",
    name: "Métal raffiné",
    rarity: "uncommon",
    description: "Métal de meilleure qualité, utile pour fabriquer de l’équipement fiable. Se trouve aux étages 1+ du donjon (plus fréquent dès l'étage 25)."
  },
  {
    id: "enchanted_fragment",
    name: "Fragment enchanté",
    rarity: "rare",
    description: "Fragment chargé d’une énergie magique subtile. Se trouve à partir de l'étage 25+ du donjon."
  },
  {
    id: "arcane_core",
    name: "Noyau arcanique",
    rarity: "epic",
    description: "Composant chargé de puissants influx arcaniques. Se trouve à partir de l'étage 50+ du donjon."
  },
  {
    id: "legendary_essence",
    name: "Essence légendaire",
    rarity: "legendary",
    description: "Essence divine extrêmement rare. Se trouve exclusivement à partir de l'étage 75+ du donjon."
  }
];



// First version of the forge crafting system
export type BasicForgeUpgradeProc = "none" | "uncommon" | "rare";

export const DEFAULT_UNLOCKED_ITEM_BLUEPRINTS: ItemBlueprint[] = [
  { itemId: "starter_sword", unlocked: true },
  { itemId: "quick_dagger", unlocked: true },
  { itemId: "woodcutter_axe", unlocked: true },
  { itemId: "wooden_shield", unlocked: true },
  { itemId: "traveler_clothes", unlocked: true },
  { itemId: "simple_leather_armor", unlocked: true }
];

export const BASIC_FORGE_CRAFTABLE_ITEMS = NOVICE_BASIC_ITEM_LIST;
