import {
  ResourceRates,
  CitizenAllocation,
  Hero,
  HeroStats,
  Resources,
  CalculatedStats,
  ClassType,
  SkillInfo,
  WeaponItemInfo,
  OffHandItemInfo,
  ArmorItemInfo,
  Modifier,
  Rarity,
  EquippedItemRef,
  StoredItemStack,
  ForgeMaterial,
  StoredForgeMaterialStack,
  HeroEquipment,
  ItemInfo,
  DamageType,
  ElementalDamageType,
  Monster,
  ForgeState,
  ItemBlueprint
} from "../types";
import {
  RACE_INFO_LIST,
  CLASS_INFO_LIST,
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  HERO_LAST_NAMES,
  SKILLS_LIBRARY,
  getSkillsByIds,
  NOVICE_BASIC_ITEM_LIST,
  getItemById,
  WEAPON_INFO_LIST
} from "../data/gameData";
import { BUILDINGS_LIST } from "../data/buildings";
import type { Rng } from "../domain/random";
import { systemRng } from "../domain/random";
import { calculateHeroDerivedStats } from "../../shared/domain/hero-stats";

export const getHeroAttributes = (
  hero: Hero
): HeroStats => {
  const baseS = hero.baseStats || { str: 5, agi: 5, end: 5, int: 5, wiz: 5, dex: 5, luk: 5 };

  let str = baseS.str;
  let agi = baseS.agi;
  let end = baseS.end;
  let int = baseS.int;
  let wiz = baseS.wiz;
  let dex = baseS.dex;
  let luk = baseS.luk;

  return { str, agi, end, int, wiz, dex, luk };
};

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
  const multiplier = modifier.type === "flat"
    ? ITEM_RARITY_FLAT_MODIFIER_MULTIPLIERS[rarity]
    : ITEM_RARITY_PERCENT_MODIFIER_MULTIPLIERS[rarity];

  const sign = Math.sign(modifier.value);
  const scaledValue = sign * Math.round(Math.abs(modifier.value) * multiplier);

  return {
    ...modifier,
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

export function applyItemRarityScaling<T extends ItemInfo>(item: T, rarity: Rarity, skipExtraModifiers: boolean = false): T {
  // 1. Clone the item to prevent mutation
  const cloned = {
    ...item,
    modifiers: item.modifiers ? item.modifiers.map(m => ({ ...m })) : undefined
  } as T;

  cloned.rarity = rarity;

  // 2. Damage range scaling if weapon
  if (cloned.itemType === "weapon") {
    const weapon = cloned as any;
    if (weapon.damageRange) {
      const multiplier = ITEM_RARITY_DAMAGE_MULTIPLIERS[rarity] ?? 1;
      const baseMin = weapon.damageRange.min;
      const baseMax = weapon.damageRange.max;
      const scaledMin = Math.max(1, Math.round(baseMin * multiplier));
      const scaledMax = Math.max(scaledMin, Math.round(baseMax * multiplier));
      weapon.damageRange = { min: scaledMin, max: scaledMax };
    }
  }

  // 3. Modifier scaling and extra modifier generation
  const baseModifiers = cloned.modifiers || [];
  const scaledBaseModifiers = baseModifiers.map(mod => scaleModifierByRarity(mod, rarity));

  const extraMods = skipExtraModifiers ? [] : generateExtraModifiersForRarity(item, rarity);

  cloned.modifiers = [...scaledBaseModifiers, ...extraMods];

  return cloned;
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

export const growHeroBaseStats = (baseStats: HeroStats, classType: ClassType, rng: Rng = systemRng): HeroStats => {
  const newStats = { ...baseStats };
  const keys: (keyof HeroStats)[] = ["str", "agi", "end", "int", "wiz", "dex", "luk"];

  const classInfo = CLASS_INFO_LIST.find((c) => c.type === classType);
  const tier = classInfo ? classInfo.tier : 0;

  if (tier === 0) {
    // Novice - gains 5 points
    const sortedKeys = [...keys].sort((a, b) => baseStats[b] - baseStats[a]);
    const prioritizedStats = sortedKeys.slice(0, 3); // Top 3
    const weakStats = sortedKeys.slice(3); // Bottom 4

    for (let i = 0; i < 5; i++) {
      if (rng.next() < 0.8) {
        // 80% chance to pick from prioritized stats
        const chosen = prioritizedStats[rng.nextInt(prioritizedStats.length)];
        newStats[chosen] = (newStats[chosen] || 0) + 1;
      } else {
        // 20% chance to pick from weak stats
        const chosen = weakStats[rng.nextInt(weakStats.length)];
        newStats[chosen] = (newStats[chosen] || 0) + 1;
      }
    }
  } else {
    // Tier 1 (or above) - gains 8 points
    const mainStats = classInfo ? classInfo.mainStats : [];
    if (mainStats && mainStats.length > 0) {
      const nonMainStats = keys.filter(k => !mainStats.includes(k));
      for (let i = 0; i < 8; i++) {
        if (rng.next() < 0.8) {
          // 80% chance to pick from main stats
          const chosen = mainStats[rng.nextInt(mainStats.length)];
          newStats[chosen] = (newStats[chosen] || 0) + 1;
        } else {
          // 20% chance to pick from non-main stats
          const chosen = nonMainStats[rng.nextInt(nonMainStats.length)];
          newStats[chosen] = (newStats[chosen] || 0) + 1;
        }
      }
    } else {
      // Fallback if mainStats is empty (just distribute evenly/randomly)
      for (let i = 0; i < 8; i++) {
        const chosen = keys[rng.nextInt(keys.length)];
        newStats[chosen] = (newStats[chosen] || 0) + 1;
      }
    }
  }

  return newStats;
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
  unlockedDistricts: { [key: string]: boolean },
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

  // Apply district upgrades bonuses
  if (unlockedDistricts["quartier_bois"]) woodRate *= 1.20;
  if (unlockedDistricts["quartier_ferme"]) foodRate *= 1.25;
  if (unlockedDistricts["quartier_mine"]) oreRate *= 1.20;

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

export const generateNoviceStarterEquipment = (rng: Rng = systemRng): HeroEquipment => {
  const weapon = getRandomNoviceWeapon(rng);
  const armor = getRandomNoviceArmor(rng);
  const rolledShield = rng.next() < 0.15 ? getNoviceWoodenShield() : null;

  return {
    mainHand: weapon ? { itemId: weapon.id, rarity: weapon.rarity } : null,
    offHand: rolledShield ? { itemId: rolledShield.id, rarity: rolledShield.rarity } : null,
    armor: armor ? { itemId: armor.id, rarity: armor.rarity } : null,
    accessory: null
  };
};

export function areModifiersEqual(modA?: Modifier[], modB?: Modifier[]): boolean {
  if (!modA && !modB) return true;
  if (!modA || !modB) return false;
  if (modA.length !== modB.length) return false;
  return modA.every((m, idx) => {
    const other = modB[idx];
    return other && m.stat === other.stat && m.type === other.type && m.value === other.value;
  });
}

export function getStoredItemStack(
  storedItems: StoredItemStack[],
  itemId: string,
  rarity: Rarity,
  modifiers?: Modifier[]
): StoredItemStack | undefined {
  return (storedItems || []).find(
    stack =>
      stack.itemId === itemId &&
      stack.rarity === rarity &&
      areModifiersEqual(stack.modifiers, modifiers)
  );
}

export function addItemToStorage(
  storedItems: StoredItemStack[],
  itemId: string,
  rarity: Rarity,
  count: number = 1,
  modifiers?: Modifier[]
): StoredItemStack[] {
  if (!itemId) return storedItems;
  const existing = getStoredItemStack(storedItems, itemId, rarity, modifiers);
  if (existing) {
    existing.count += count;
  } else {
    storedItems.push({ itemId, rarity, count, modifiers });
  }
  return storedItems;
}

export function removeItemFromStorage(
  storedItems: StoredItemStack[],
  itemId: string,
  rarity: Rarity,
  count: number = 1,
  modifiers?: Modifier[]
): StoredItemStack[] {
  const index = (storedItems || []).findIndex(
    stack =>
      stack.itemId === itemId &&
      stack.rarity === rarity &&
      areModifiersEqual(stack.modifiers, modifiers)
  );
  if (index !== -1) {
    const stack = storedItems[index];
    stack.count -= count;
    if (stack.count <= 0) {
      storedItems.splice(index, 1);
    }
  }
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
  storedItems: StoredItemStack[],
  slot: keyof HeroEquipment
): Hero {
  if (!hero.equipment) {
    hero.equipment = {};
    return hero;
  }
  const ref = hero.equipment[slot];
  if (!ref) return hero;

  // Retrieve item ID and rarity safely (supports both EquippedItemRef and full ItemInfo objects)
  const itemId = ref.itemId || (ref as any).id;
  const rarity = ref.rarity || (ref as any).rarity || "common";
  const modifiers = ref.modifiers;

  if (itemId) {
    // Add back to storage
    addItemToStorage(storedItems, itemId, rarity, 1, modifiers);
  }

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
  storedItems: StoredItemStack[],
  itemId: string,
  rarity: Rarity,
  modifiers?: Modifier[]
): Hero {
  if (!hero.equipment) {
    hero.equipment = {};
  }

  const resolvedItem = getItemById(itemId);
  if (!resolvedItem) return hero;

  if (hero.level < (resolvedItem.requiredLevel ?? 1)) {
    return hero;
  }

  // Check stack in storage
  const stack = getStoredItemStack(storedItems, itemId, rarity, modifiers);
  if (!stack || stack.count <= 0) {
    return hero;
  }

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
  removeItemFromStorage(storedItems, itemId, rarity, 1, modifiers);

  // Set the equipment reference
  tempHero.equipment[targetSlot] = { itemId, rarity, modifiers };

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

  const starterEquipment = generateNoviceStarterEquipment(rng);

  const initialHeroStub: Omit<Hero, "calculatedStats"> = {
    id: `hero-${Math.floor(rng.next() * 0x1_0000_0000).toString(16)}`,
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

// Automatic Tier 1 Class Choice Logic
export function getNoviceClassDecisionPolicy(level: number): { minScore: number; gapThreshold: number } {
  if (level >= 13) return { minScore: 0, gapThreshold: 0 };
  if (level === 12) return { minScore: 30, gapThreshold: 2 };
  if (level === 11) return { minScore: 45, gapThreshold: 4 };
  return { minScore: 55, gapThreshold: 6 };
}

export const evaluateAutomaticClassChange = (
  hero: Hero,
  buildings: { [key: string]: number }
): { newClass: ClassType | null; reason: string } => {
  if (hero.classType !== "Novice") {
    return { newClass: null, reason: "N'est pas un Novice" };
  }

  if (hero.level < 10) {
    return { newClass: null, reason: `Niveau insuffisant (${hero.level}/10)` };
  }

  const candidates: { type: ClassType; score: number }[] = [];
  const attributes = getHeroAttributes(hero);
  const derived = getHeroStats(hero);

  // Identify Novice's strongest primary stats
  const sortedAttributes = Object.entries(attributes)
    .map(([key, val]) => ({ key: key as keyof HeroStats, val }))
    .sort((a, b) => b.val - a.val);

  const primaryStrongest = sortedAttributes[0].key;
  const secondaryStrongest = sortedAttributes[1].key;

  // Filter CLASS_INFO_LIST for Tier 1 classes with building requirement
  const tier1Classes = CLASS_INFO_LIST.filter(
    (c) => c.tier === 1 && c.jobChangeBuildingId && c.mainDerivedStats
  );

  for (const cond of tier1Classes) {
    const buildingId = cond.jobChangeBuildingId!;
    const derivedStats = cond.mainDerivedStats!;

    const bvl = buildings[buildingId] || 0;
    if (bvl < 1) {
      continue; // Ignore locked classes (building not built)
    }

    // Evaluate stats suitability
    let attrScore = 0;
    for (const stat of cond.mainStats) {
      attrScore += attributes[stat] || 0;
    }

    let derivedScore = 0;
    for (const stat of derivedStats) {
      const val = (derived as any)[stat] || 0;
      if (stat === "maxHp") {
        derivedScore += val * 0.05;
      } else if (stat === "maxMana") {
        derivedScore += val * 0.1;
      } else if (stat === "physicalDamage" || stat === "magicDamage") {
        derivedScore += val * 0.4;
      } else if (stat === "physicalDefense" || stat === "magicDefense") {
        derivedScore += val * 0.4;
      } else if (stat === "speed") {
        derivedScore += val * 0.5;
      } else if (stat === "criticalChance" || stat === "dodgeChance") {
        derivedScore += val * 0.5;
      }
    }

    let score = attrScore + derivedScore;

    // Give higher priority to classes matching the Novice's strongest stats
    if (cond.mainStats.includes(primaryStrongest)) {
      score += 15;
    }
    if (cond.mainStats.includes(secondaryStrongest)) {
      score += 8;
    }

    candidates.push({ type: cond.type, score });
  }

  if (candidates.length === 0) {
    return { newClass: null, reason: "Aucun bâtiment de métier débloqué dans la colonie" };
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const bestCandidate = candidates[0];

  // If no class fits well enough, the Novice stays Novice and can try again at the next level
  const policy = getNoviceClassDecisionPolicy(hero.level);
  const MIN_SCORE_THRESHOLD = policy.minScore;
  if (bestCandidate.score < policy.minScore) {
    return {
      newClass: null,
      reason: `Affinité trop incertaine pour une transition automatique (${bestCandidate.type} : ${bestCandidate.score.toFixed(1)}/seuil ${MIN_SCORE_THRESHOLD})`
    };
  }

  // If choices are too close, keep as Novice to resolve later
  if (candidates.length > 1) {
    const secondBest = candidates[1];
    const scoreGap = bestCandidate.score - secondBest.score;
    if (scoreGap < policy.gapThreshold) {
      return {
        newClass: null,
        reason: `Dilemme d'orientation entre ${bestCandidate.type} (${bestCandidate.score.toFixed(1)}) et ${secondBest.type} (${secondBest.score.toFixed(1)})`
      };
    }
  }

  return {
    newClass: bestCandidate.type,
    reason: `Forte prédisposition de profil (score d'affinité: ${bestCandidate.score.toFixed(1)})`
  };
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

export function calculateBasicAttackDamage(hero: Hero, monster: Monster, rng: Rng = systemRng): number {
  const weapon = getHeroMainHandWeapon(hero);
  const weaponDamageRoll = rollWeaponDamage(weapon, rng);
  const rawDamage = hero.calculatedStats.physicalDamage + weaponDamageRoll;

  // Crit Check
  const critChance = hero.calculatedStats.criticalChance / 100;
  const isCrit = rng.next() < critChance;
  let damageAfterCrit = rawDamage;
  if (isCrit) {
    // If no critical damage multiplier exists, use a simple default multiplier of 1.5
    damageAfterCrit = Math.floor(rawDamage * 1.5);
  }

  let damageTypes: DamageType[] = ["physical"];
  if (weapon) {
    const dTypes = getWeaponDamageTypes(weapon);
    if (dTypes && dTypes.length > 0) {
      damageTypes = dTypes;
    }
  }

  return applySplitDamageDefenseOrResistance(damageAfterCrit, damageTypes, monster);
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

export const SCRAP_REWARD_TABLE: Record<Rarity, StoredForgeMaterialStack[]> = {
  common: [
    { materialId: "metal_scrap", rarity: "common", count: 2 }
  ],

  uncommon: [
    { materialId: "metal_scrap", rarity: "common", count: 4 },
    { materialId: "refined_metal", rarity: "uncommon", count: 2 }
  ],

  rare: [
    { materialId: "metal_scrap", rarity: "common", count: 3 },
    { materialId: "refined_metal", rarity: "uncommon", count: 4 },
    { materialId: "enchanted_fragment", rarity: "rare", count: 2 }
  ],

  epic: [
    { materialId: "refined_metal", rarity: "uncommon", count: 4 },
    { materialId: "enchanted_fragment", rarity: "rare", count: 4 },
    { materialId: "arcane_core", rarity: "epic", count: 2 }
  ],

  legendary: [
    { materialId: "enchanted_fragment", rarity: "rare", count: 4 },
    { materialId: "arcane_core", rarity: "epic", count: 2 },
    { materialId: "legendary_essence", rarity: "legendary", count: 1 }
  ]
};

export function scrapItemFromStorage(
  storedItems: StoredItemStack[],
  forgeMaterials: StoredForgeMaterialStack[],
  itemId: string,
  rarity: Rarity,
  modifiers?: Modifier[]
): {
  storedItems: StoredItemStack[];
  forgeMaterials: StoredForgeMaterialStack[];
  rewards: StoredForgeMaterialStack[];
} {
  // Clone structures to avoid accidental mutation
  const updatedStoredItems = (storedItems || []).map(item => ({ ...item }));
  const updatedForgeMaterials = (forgeMaterials || []).map(mat => ({ ...mat }));

  // Find the matching item stack
  const itemIndex = updatedStoredItems.findIndex(
    stack =>
      stack.itemId === itemId &&
      stack.rarity === rarity &&
      areModifiersEqual(stack.modifiers, modifiers)
  );

  if (itemIndex === -1) {
    return {
      storedItems: storedItems || [],
      forgeMaterials: forgeMaterials || [],
      rewards: []
    };
  }

  const itemStack = updatedStoredItems[itemIndex];
  if (itemStack.count <= 0) {
    return {
      storedItems: storedItems || [],
      forgeMaterials: forgeMaterials || [],
      rewards: []
    };
  }

  // Decrease the item stack count by 1
  itemStack.count -= 1;
  if (itemStack.count <= 0) {
    updatedStoredItems.splice(itemIndex, 1);
  }

  // Generate scrap rewards
  const rewardTemplates = SCRAP_REWARD_TABLE[rarity] || [];
  const rewards: StoredForgeMaterialStack[] = rewardTemplates.map(template => ({
    materialId: template.materialId,
    rarity: template.rarity,
    count: template.count
  }));

  // Add rewards to forgeMaterials
  for (const reward of rewards) {
    const existingMatIndex = updatedForgeMaterials.findIndex(
      m => m.materialId === reward.materialId && m.rarity === reward.rarity
    );
    if (existingMatIndex !== -1) {
      updatedForgeMaterials[existingMatIndex].count += reward.count;
    } else {
      updatedForgeMaterials.push({
        materialId: reward.materialId,
        rarity: reward.rarity,
        count: reward.count
      });
    }
  }

  return {
    storedItems: updatedStoredItems,
    forgeMaterials: updatedForgeMaterials,
    rewards
  };
}

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

export const BASIC_FORGE_CRAFT_COST: StoredForgeMaterialStack[] = [
  { materialId: "metal_scrap", rarity: "common", count: 6 },
  { materialId: "refined_metal", rarity: "uncommon", count: 1 }
];

export const BASIC_FORGE_UPGRADE_PROC_WEIGHTS: Record<BasicForgeUpgradeProc, number> = {
  none: 85,
  uncommon: 13,
  rare: 2
};

export const BASIC_FORGE_UPGRADE_COSTS: Record<Exclude<BasicForgeUpgradeProc, "none">, StoredForgeMaterialStack[]> = {
  uncommon: [
    { materialId: "refined_metal", rarity: "uncommon", count: 2 }
  ],
  rare: [
    { materialId: "refined_metal", rarity: "uncommon", count: 4 },
    { materialId: "enchanted_fragment", rarity: "rare", count: 1 }
  ]
};

export const BASIC_FORGE_BONUS_MODIFIER_VALUES: Record<string, Modifier> = {
  physicalDamage: { stat: "physicalDamage", type: "flat", value: 1 },
  magicDamage: { stat: "magicDamage", type: "flat", value: 1 },
  critChance: { stat: "critChance", type: "flat", value: 1 },
  speed: { stat: "speed", type: "percent", value: 2 },

  maxHp: { stat: "maxHp", type: "percent", value: 3 },
  maxMana: { stat: "maxMana", type: "percent", value: 3 },
  physicalDefense: { stat: "physicalDefense", type: "flat", value: 1 },
  magicDefense: { stat: "magicDefense", type: "flat", value: 1 },
  dodgeChance: { stat: "dodgeChance", type: "flat", value: 1 },

  fireResistance: { stat: "fireResistance", type: "flat", value: 2 },
  iceResistance: { stat: "iceResistance", type: "flat", value: 2 },
  waterResistance: { stat: "waterResistance", type: "flat", value: 2 },
  earthResistance: { stat: "earthResistance", type: "flat", value: 2 },
  windResistance: { stat: "windResistance", type: "flat", value: 2 },
  lightningResistance: { stat: "lightningResistance", type: "flat", value: 2 },
  holyResistance: { stat: "holyResistance", type: "flat", value: 2 },
  darkResistance: { stat: "darkResistance", type: "flat", value: 2 },
  natureResistance: { stat: "natureResistance", type: "flat", value: 2 },
  arcaneResistance: { stat: "arcaneResistance", type: "flat", value: 2 },
  poisonResistance: { stat: "poisonResistance", type: "flat", value: 2 },
  bloodResistance: { stat: "bloodResistance", type: "flat", value: 2 },
  soundResistance: { stat: "soundResistance", type: "flat", value: 2 },
  radiantResistance: { stat: "radiantResistance", type: "flat", value: 2 }
};

export function rollBasicForgeUpgradeProc(rng: Rng = systemRng): BasicForgeUpgradeProc {
  const rand = rng.next() * 100;
  if (rand < 85) return "none";
  if (rand < 98) return "uncommon";
  return "rare";
}

export function startBasicForgeCraftFromBlueprint(
  forge: ForgeState,
  forgeMaterials: StoredForgeMaterialStack[],
  itemBlueprints: ItemBlueprint[],
  itemId: string
): {
  forgeMaterials: StoredForgeMaterialStack[];
  craftedPreview: ItemInfo | null;
  upgradeProc: BasicForgeUpgradeProc;
  success: boolean;
  message: string;
} {
  // Check forge is unlocked
  if (!forge.unlocked) {
    return {
      forgeMaterials,
      craftedPreview: null,
      upgradeProc: "none",
      success: false,
      message: "La forge n'est pas encore déverrouillée."
    };
  }

  // Check blueprint is unlocked
  const blueprint = (itemBlueprints || []).find(b => b.itemId === itemId);
  if (!blueprint || !blueprint.unlocked) {
    return {
      forgeMaterials,
      craftedPreview: null,
      upgradeProc: "none",
      success: false,
      message: "Le plan de cet objet n'est pas déverrouillé."
    };
  }

  // Check the item is in NOVICE_BASIC_ITEM_LIST
  const baseItem = NOVICE_BASIC_ITEM_LIST.find(item => item.id === itemId);
  if (!baseItem) {
    return {
      forgeMaterials,
      craftedPreview: null,
      upgradeProc: "none",
      success: false,
      message: "Cet objet ne fait pas partie des objets de forge de base."
    };
  }

  // Check materials are available
  const updatedMaterials = forgeMaterials.map(m => ({ ...m }));
  for (const cost of BASIC_FORGE_CRAFT_COST) {
    const matched = updatedMaterials.find(m => m.materialId === cost.materialId && m.rarity === cost.rarity);
    if (!matched || matched.count < cost.count) {
      return {
        forgeMaterials,
        craftedPreview: null,
        upgradeProc: "none",
        success: false,
        message: "Matériaux de forge insuffisants."
      };
    }
  }

  // Consume materials
  for (const cost of BASIC_FORGE_CRAFT_COST) {
    const matched = updatedMaterials.find(m => m.materialId === cost.materialId && m.rarity === cost.rarity);
    if (matched) {
      matched.count -= cost.count;
    }
  }

  // Create common preview
  const craftedPreview = applyItemRarityScaling(baseItem, "common");

  // Roll upgrade proc
  const upgradeProc = rollBasicForgeUpgradeProc();

  return {
    forgeMaterials: updatedMaterials,
    craftedPreview,
    upgradeProc,
    success: true,
    message: "Artisanat démarré avec succès !"
  };
}

export function finalizeBasicForgeCraft(
  storedItems: StoredItemStack[],
  forgeMaterials: StoredForgeMaterialStack[],
  craftedPreview: ItemInfo,
  upgradeProc: BasicForgeUpgradeProc,
  upgrade: {
    accepted: boolean;
    chosenModifierStat?: string;
  }
): {
  storedItems: StoredItemStack[];
  forgeMaterials: StoredForgeMaterialStack[];
  finalItem: ItemInfo | null;
  success: boolean;
  message: string;
} {
  const updatedStoredItems = storedItems.map(item => ({ ...item }));
  let updatedMaterials = forgeMaterials.map(m => ({ ...m }));
  let finalRarity: Rarity = "common";

  // If upgrade accepted, consume cost and change rarity
  if (upgrade.accepted && upgradeProc !== "none") {
    const costs = BASIC_FORGE_UPGRADE_COSTS[upgradeProc];
    if (costs) {
      // Check materials
      for (const cost of costs) {
        const matched = updatedMaterials.find(m => m.materialId === cost.materialId && m.rarity === cost.rarity);
        if (!matched || matched.count < cost.count) {
          return {
            storedItems,
            forgeMaterials,
            finalItem: null,
            success: false,
            message: "Matériaux insuffisants pour l'amélioration."
          };
        }
      }

      // Consume cost
      for (const cost of costs) {
        const matched = updatedMaterials.find(m => m.materialId === cost.materialId && m.rarity === cost.rarity);
        if (matched) {
          matched.count -= cost.count;
        }
      }

      // Apply upgraded rarity
      if (upgradeProc === "uncommon") finalRarity = "uncommon";
      if (upgradeProc === "rare") finalRarity = "rare";
    }
  }

  // Build the final item (with skipExtraModifiers = true so that we only apply base modifiers and chosen custom modifiers without random extras)
  const finalItem = applyItemRarityScaling(craftedPreview, finalRarity, true);

  // If upgraded and bonus modifier is chosen, add it
  if (upgrade.accepted && upgradeProc !== "none" && upgrade.chosenModifierStat) {
    const modTemplate = BASIC_FORGE_BONUS_MODIFIER_VALUES[upgrade.chosenModifierStat];
    if (modTemplate) {
      // Check compatibility
      const isWeapon = finalItem.itemType === "weapon";
      const allowedWeaponMods = ["physicalDamage", "magicDamage", "critChance", "speed"];
      const allowedArmorMods = [
        "maxHp", "maxMana", "physicalDefense", "magicDefense", "dodgeChance",
        "fireResistance", "iceResistance", "waterResistance", "earthResistance", "windResistance",
        "lightningResistance", "holyResistance", "darkResistance", "natureResistance", "arcaneResistance",
        "poisonResistance", "bloodResistance", "soundResistance", "radiantResistance"
      ];

      const isAllowed = isWeapon
        ? allowedWeaponMods.includes(upgrade.chosenModifierStat)
        : allowedArmorMods.includes(upgrade.chosenModifierStat);

      if (isAllowed) {
        if (!finalItem.modifiers) {
          finalItem.modifiers = [];
        }
        const exists = finalItem.modifiers.some(m => m.stat === modTemplate.stat);
        if (!exists) {
          finalItem.modifiers.push({ ...modTemplate });
        }
      }
    }
  }

  // Add the final item to storage (stacking by itemId + rarity + modifiers)
  addItemToStorage(updatedStoredItems, finalItem.id, finalItem.rarity, 1, finalItem.modifiers);

  return {
    storedItems: updatedStoredItems,
    forgeMaterials: updatedMaterials,
    finalItem,
    success: true,
    message: `Objet '${finalItem.name}' fabriqué avec succès en qualité [${finalRarity}] !`
  };
}




