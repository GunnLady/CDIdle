import type { CanonicalItem as ItemInfo } from "./types.ts";
import { TIER1_ITEM_WPN_LIST } from "./items_weapons_tier1.ts";
import { TIER1_ITEM_ARMOR_LIST } from "./items_armors_tier1.ts";
import { TIER1_ITEM_OFFHAND_LIST } from "./items_offhands_tier1.ts";
import { TIER1_ITEM_ACC_LIST } from "./items_accessories_tier1.ts";
import { HIGH_TIER_ITEM_LIST } from "./items_high_tier.ts";
import { createWeapon, createOffhand, createArmor } from "./itemBuilders.ts";
import { WEAPON_INFO_LIST } from "./weapons.ts";
import { OFF_HAND_INFO_LIST } from "./offhands.ts";
import { ARMOR_INFO_LIST } from "./armors.ts";
import { ACCESSORY_INFO_LIST } from "./accessories.ts";
import { isVocationRewardItem } from "./vocation-rewards.ts";
import { isCanonicalItemModifierField } from "../hero-stats.ts";
import { isValidWeaponScaling } from "./weapon-scaling.ts";
import { isValidWeaponAttackProfile } from "./weapon-attack-profile.ts";
import type {
  CanonicalEquipmentSlot,
  CanonicalItemProvenance,
  CanonicalRarity,
  CanonicalWeaponHandedness,
} from "./types.ts";

export { TIER1_ITEM_WPN_LIST, TIER1_ITEM_ARMOR_LIST, TIER1_ITEM_OFFHAND_LIST, TIER1_ITEM_ACC_LIST, HIGH_TIER_ITEM_LIST };

export const NOVICE_BASIC_ITEM_LIST: ItemInfo[] = [
  createWeapon(
    "starter_sword",
    "Épée de départ",
    "sword",
    "common",
    1,
    "Une épée simple et fiable pour les premiers combats.",
    1, 3,
    1,
    [{ stat: "physicalDamage", value: 1 }]
  ),
  createWeapon(
    "quick_dagger",
    "Dague vive",
    "dagger",
    "common",
    1,
    "Une dague légère, facile à manier et rapide à dégainer.",
    1, 2,
    1.2,
    [{ stat: "criticalChance", type: "percent", value: 1 }]
  ),
  createWeapon(
    "woodcutter_axe",
    "Hache de bûcheron",
    "axe",
    "common",
    1,
    "Une hache simple, plus habituée au bois qu’aux monstres, mais assez solide pour se défendre.",
    2, 4,
    0.9,
    [{ stat: "physicalDamage", value: 2 }]
  ),
  createOffhand(
    "wooden_shield",
    "Bouclier en bois",
    "shield",
    "common",
    1,
    "Un bouclier simple offrant une protection de base.",
    [{ stat: "physicalDefense", value: 1 }]
  ),
  createArmor(
    "traveler_clothes",
    "Tenue de voyageur",
    "cloth_armor",
    "common",
    1,
    "Une tenue légère et pratique pour partir à l’aventure.",
    [{ stat: "maxMana", type: "percent", value: 3 }]
  ),
  createArmor(
    "simple_leather_armor",
    "Armure de cuir simple",
    "leather_armor",
    "common",
    1,
    "Une armure légère offrant une protection correcte sans gêner les mouvements.",
    [
      { stat: "physicalDefense", type: "percent", value: 5 },
      { stat: "dodgeChance", type: "percent", value: 3 }
    ]
  ),
  createArmor(
    "novice_mystic_robe",
    "Robe mystique de novice",
    "magic_robe",
    "common",
    1,
    "Une robe simple imprégnée d’une faible énergie mystique, offrant une légère protection contre les forces arcaniques et naturelles.",
    [
      { stat: "maxMana", type: "percent", value: 5 },
      { stat: "arcaneResistance", value: 5 },
      { stat: "natureResistance", value: 5 }
    ]
  )
];

const RAW_ITEM_LIBRARY: ItemInfo[] = [
  ...NOVICE_BASIC_ITEM_LIST,
  ...TIER1_ITEM_WPN_LIST,
  ...TIER1_ITEM_ARMOR_LIST,
  ...TIER1_ITEM_OFFHAND_LIST,
  ...TIER1_ITEM_ACC_LIST,
  ...HIGH_TIER_ITEM_LIST
];

const HIGH_TIER_IDS = new Set(HIGH_TIER_ITEM_LIST.map((item) => item.id));

export const LEGACY_ITEM_LIBRARY: ItemInfo[] = RAW_ITEM_LIBRARY.map((item) => ({
  ...item,
  catalogStatus: HIGH_TIER_IDS.has(item.id) ? 'active' : 'legacy',
  provenances: isVocationRewardItem(item.id)
    ? [...item.provenances, "vocation"]
    : item.provenances,
}));

const PROGRESSION_BASE_SPECS = [
  ['progression_sword', 'Épée évolutive', 'basic_sword'],
  ['progression_saber', 'Sabre évolutif', 'basic_saber'],
  ['progression_greatsword', 'Épée lourde évolutive', 'basic_greatsword'],
  ['progression_axe', 'Hache évolutive', 'basic_axe'],
  ['progression_greataxe', 'Grande hache évolutive', 'basic_greataxe'],
  ['progression_mace', 'Masse évolutive', 'basic_mace'],
  ['progression_greatmace', 'Grande masse évolutive', 'basic_greatmace'],
  ['progression_spear', 'Lance évolutive', 'basic_spear'],
  ['progression_dagger', 'Dague évolutive', 'basic_dagger'],
  ['progression_shortbow', 'Arc court évolutif', 'basic_shortbow'],
  ['progression_longbow', 'Arc long évolutif', 'basic_longbow'],
  ['progression_crossbow', 'Arbalète évolutive', 'basic_crossbow'],
  ['progression_rifle', 'Fusil évolutif', 'basic_rifle'],
  ['progression_staff', 'Bâton évolutif', 'basic_staff'],
  ['progression_wand', 'Baguette évolutive', 'basic_wand'],
  ['progression_spellbook', 'Grimoire évolutif', 'basic_spellbook'],
  ['progression_lute', 'Instrument évolutif', 'basic_lute'],
  ['progression_bo', 'Bô évolutif', 'basic_bo'],
  ['progression_gauntlets', 'Gantelets évolutifs', 'basic_gauntlets'],
  ['progression_knuckles', 'Poings évolutifs', 'basic_knuckles'],
  ['progression_gear_cannon', 'Canon à engrenages évolutif', 'basic_gear_cannon'],
  ['progression_dual_swords', 'Épées jumelles évolutives', 'twin_steel_swords'],
  ['progression_dual_sabers', 'Sabres jumeaux évolutifs', 'flowing_twin_sabers'],
  ['progression_dual_axes', 'Haches jumelles évolutives', 'twin_battle_axes'],
  ['progression_dual_daggers', 'Dagues jumelles évolutives', 'nightfang_daggers'],
  ['progression_cloth_armor', 'Tenue en tissu évolutive', 'quiet_prayer_vestment'],
  ['progression_leather_armor', 'Armure de cuir évolutive', 'supple_shadow_vest'],
  ['progression_chainmail', 'Cotte de mailles évolutive', 'ironbound_hauberk'],
  ['progression_plate_armor', 'Armure de plates évolutive', 'bulwark_plate'],
  ['progression_magic_robe', 'Robe magique évolutive', 'faded_rune_robe'],
  ['progression_shield', 'Bouclier évolutif', 'plain_round_shield'],
  ['progression_buckler', 'Rondache évolutive', 'light_buckler'],
  ['progression_tower_shield', 'Pavois évolutif', 'plain_tower_shield'],
  ['progression_arcane_orb', 'Orbe arcanique évolutif', 'dull_arcane_orb'],
  ['progression_crystal_focus', 'Cristal de focalisation évolutif', 'clear_focus_crystal'],
  ['progression_spell_lantern', 'Lanterne arcanique évolutive', 'dim_spell_lantern'],
  ['progression_prayer_beads', 'Chapelet évolutif', 'plain_prayer_beads'],
  ['progression_sanctified_censer', 'Encensoir évolutif', 'smoldering_censer'],
  ['progression_bible', 'Livre sacré évolutif', 'worn_sacred_book'],
  ['progression_living_branch', 'Branche vivante évolutive', 'fresh_living_branch'],
  ['progression_verdant_seed', 'Graine verdoyante évolutive', 'small_verdant_seed'],
  ['progression_moonlit_leaf', 'Feuille lunaire évolutive', 'pale_moonlit_leaf'],
  ['progression_ring', 'Anneau évolutif', 'silver_ring'],
  ['progression_amulet', 'Amulette évolutive', 'warm_ember_amulet'],
  ['progression_bracelet', 'Bracelet évolutif', 'knotted_leather_bracelet'],
  ['progression_belt', 'Ceinture évolutive', 'sturdy_travel_belt'],
  ['progression_cloak', 'Cape évolutive', 'dusty_travel_cloak'],
  ['progression_charm', 'Charme évolutif', 'lucky_charm'],
] as const;

const progressionIdByArchetype = new Map<string, string>();

function itemArchetype(item: ItemInfo): string {
  if (item.itemType === 'weapon') return `weapon:${item.weaponTypeId}`;
  if (item.itemType === 'offhand') return `offhand:${item.offHandTypeId}`;
  if (item.itemType === 'armor') return `armor:${item.armorTypeId}`;
  return `accessory:${item.accessoryTypeId}`;
}

for (const [progressionId, , sourceId] of PROGRESSION_BASE_SPECS) {
  const source = LEGACY_ITEM_LIBRARY.find((item) => item.id === sourceId);
  if (!source) throw new Error(`MISSING_PROGRESSION_ITEM_SOURCE:${sourceId}`);
  const archetype = itemArchetype(source);
  if (progressionIdByArchetype.has(archetype)) throw new Error(`DUPLICATE_PROGRESSION_ARCHETYPE:${archetype}`);
  progressionIdByArchetype.set(archetype, progressionId);
}

export const LEGACY_ITEM_EVOLUTION_TARGETS: Readonly<Record<string, string>> = Object.freeze(Object.fromEntries(
  LEGACY_ITEM_LIBRARY.map((item) => {
    const target = progressionIdByArchetype.get(itemArchetype(item));
    if (!target) throw new Error(`MISSING_LEGACY_EVOLUTION_TARGET:${item.id}`);
    return [item.id, target];
  }),
));

const INITIAL_PROGRESSION_BLUEPRINT_IDS = new Set([
  "progression_sword",
  "progression_dagger",
  "progression_axe",
  "progression_shield",
  "progression_cloth_armor",
  "progression_leather_armor",
]);

function mergeBaseModifiers(modifiers: ItemInfo['modifiers']): NonNullable<ItemInfo['modifiers']> {
  const merged = new Map<string, NonNullable<ItemInfo['modifiers']>[number]>();
  for (const modifier of modifiers ?? []) {
    const key = `${modifier.stat}:${modifier.type}`;
    const previous = merged.get(key);
    merged.set(key, previous
      ? { ...previous, value: previous.value + modifier.value }
      : { ...modifier });
  }
  return [...merged.values()];
}

export const PROGRESSION_ITEM_BASES: ItemInfo[] = PROGRESSION_BASE_SPECS.map(([id, name, sourceId]) => {
  const source = LEGACY_ITEM_LIBRARY.find((item) => item.id === sourceId);
  if (!source) throw new Error(`MISSING_PROGRESSION_ITEM_SOURCE:${sourceId}`);
  return {
    ...source,
    id,
    name,
    rarity: 'common',
    minimumRarity: 'common',
    requiredLevel: 1,
    levelRange: { min: 1, max: 40 },
    powerReferenceLevel: source.requiredLevel,
    powerModelId: 'level-bands-v1',
    catalogStatus: 'active',
    provenances: ['chest', 'boss', 'forge'],
    blueprintAvailable: true,
    blueprintDiscovery: INITIAL_PROGRESSION_BLUEPRINT_IDS.has(id)
      ? { kind: 'initial' }
      : { kind: 'random-drop', sources: ['boss', 'treasure'], floorMin: 1, floorMax: 62, weight: 1 },
    modifiers: mergeBaseModifiers(source.modifiers),
  };
});

export const ITEM_LIBRARY: ItemInfo[] = [
  ...LEGACY_ITEM_LIBRARY,
  ...PROGRESSION_ITEM_BASES,
];

export const ITEMS_BY_ID: Record<string, ItemInfo> = Object.fromEntries(
  ITEM_LIBRARY.map((item) => [item.id, item])
);

export function getItemById(itemId: string): ItemInfo | undefined {
  return ITEMS_BY_ID[itemId];
}


export function validateUniqueItemIds(items: ItemInfo[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.push(item.id);
    }

    seen.add(item.id);
  }

  return duplicates;
}

export const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"] as const;

export const CHEST_LOOT_BANDS = [
  { floorMin: 1, floorMax: 2, levelMin: 1, levelMax: 1, weights: { common: 78, uncommon: 19, rare: 3, epic: 0, legendary: 0 } },
  { floorMin: 3, floorMax: 7, levelMin: 1, levelMax: 5, weights: { common: 72, uncommon: 23, rare: 5, epic: 0, legendary: 0 } },
  { floorMin: 8, floorMax: 10, levelMin: 6, levelMax: 10, weights: { common: 62, uncommon: 29, rare: 8, epic: 1, legendary: 0 } },
  { floorMin: 11, floorMax: 17, levelMin: 11, levelMax: 15, weights: { common: 50, uncommon: 34, rare: 13, epic: 3, legendary: 0 } },
  { floorMin: 18, floorMax: 25, levelMin: 16, levelMax: 20, weights: { common: 38, uncommon: 38, rare: 19, epic: 5, legendary: 0 } },
  { floorMin: 26, floorMax: 35, levelMin: 21, levelMax: 25, weights: { common: 28, uncommon: 38, rare: 26, epic: 7, legendary: 1 } },
  { floorMin: 36, floorMax: 48, levelMin: 26, levelMax: 30, weights: { common: 18, uncommon: 34, rare: 35, epic: 11, legendary: 2 } },
  { floorMin: 49, floorMax: 61, levelMin: 31, levelMax: 35, weights: { common: 10, uncommon: 27, rare: 40, epic: 19, legendary: 4 } },
  { floorMin: 62, floorMax: Number.POSITIVE_INFINITY, levelMin: 36, levelMax: 40, weights: { common: 5, uncommon: 20, rare: 40, epic: 28, legendary: 7 } },
] as const;

export function rarityRank(rarity: CanonicalRarity): number {
  return RARITY_ORDER.indexOf(rarity);
}

export function getItemSlot(item: ItemInfo): CanonicalEquipmentSlot {
  if (item.itemType === "weapon") return "mainHand";
  if (item.itemType === "offhand") return "offHand";
  return item.itemType;
}

export function getItemHandedness(item: ItemInfo): CanonicalWeaponHandedness | null {
  if (item.itemType !== "weapon") return null;
  return WEAPON_INFO_LIST.find((entry) => entry.id === item.weaponTypeId)?.handedness ?? null;
}

export function getChestLootBand(floor: number) {
  return CHEST_LOOT_BANDS.find((band) => floor >= band.floorMin && floor <= band.floorMax)
    ?? CHEST_LOOT_BANDS[CHEST_LOOT_BANDS.length - 1];
}

export function rollWeightedRarity(
  weights: Record<CanonicalRarity, number>,
  roll: number,
): CanonicalRarity {
  const total = RARITY_ORDER.reduce((sum, rarity) => sum + weights[rarity], 0);
  if (total <= 0) throw new Error("INVALID_RARITY_WEIGHTS");
  let cursor = Math.max(0, Math.min(0.999999999, roll)) * total;
  for (const rarity of RARITY_ORDER) {
    cursor -= weights[rarity];
    if (cursor < 0) return rarity;
  }
  return "legendary";
}

export function eligibleCatalogItems(options: {
  rarity: CanonicalRarity;
  levelMin: number;
  levelMax: number;
  provenance: CanonicalItemProvenance;
  blueprintOnly?: boolean;
}): ItemInfo[] {
  const rolledRank = rarityRank(options.rarity);
  return ITEM_LIBRARY.filter((item) => (
    item.catalogStatus === 'active'
    && item.levelRange.max >= options.levelMin
    && item.levelRange.min <= options.levelMax
    && rarityRank(item.minimumRarity) <= rolledRank
    && item.provenances.includes(options.provenance)
    && (!options.blueprintOnly || item.blueprintAvailable)
  ));
}

export function resolveEligibleCatalogDrop(options: {
  rarity: CanonicalRarity;
  levelMin: number;
  levelMax: number;
  provenance: CanonicalItemProvenance;
  blueprintOnly?: boolean;
}): { rarity: CanonicalRarity; candidates: ItemInfo[] } | null {
  const initialRank = rarityRank(options.rarity);
  for (let rank = initialRank; rank < RARITY_ORDER.length; rank += 1) {
    const rarity = RARITY_ORDER[rank];
    const candidates = eligibleCatalogItems({ ...options, rarity });
    if (candidates.length > 0) return { rarity, candidates };
  }
  return null;
}

export function validateItemCatalog(items: ItemInfo[] = ITEM_LIBRARY): string[] {
  const errors = validateUniqueItemIds(items).map((id) => `${id}:DUPLICATE_ID`);
  const weapons = new Set(WEAPON_INFO_LIST.map((entry) => entry.id));
  const offhands = new Set(OFF_HAND_INFO_LIST.map((entry) => entry.id));
  const armors = new Set(ARMOR_INFO_LIST.map((entry) => entry.id));
  const accessories = new Set(ACCESSORY_INFO_LIST.map((entry) => entry.id));

  for (const item of items) {
    if (!Number.isInteger(item.requiredLevel) || item.requiredLevel < 1) errors.push(`${item.id}:INVALID_LEVEL`);
    if (!Number.isInteger(item.levelRange.min) || !Number.isInteger(item.levelRange.max)
      || item.levelRange.min < 1 || item.levelRange.max < item.levelRange.min || item.levelRange.max > 40) {
      errors.push(`${item.id}:INVALID_LEVEL_RANGE`);
    }
    if (!Number.isInteger(item.powerReferenceLevel) || item.powerReferenceLevel < 1 || item.powerReferenceLevel > 40) {
      errors.push(`${item.id}:INVALID_POWER_REFERENCE_LEVEL`);
    }
    if (item.powerModelId === 'legacy-fixed-v1'
      && (item.levelRange.min !== item.requiredLevel || item.levelRange.max !== item.requiredLevel)) {
      errors.push(`${item.id}:INVALID_LEGACY_LEVEL_RANGE`);
    }
    if (item.rarity !== item.minimumRarity) errors.push(`${item.id}:RARITY_ALIAS_MISMATCH`);
    if (item.provenances.length === 0) errors.push(`${item.id}:NO_PROVENANCE`);
    if (new Set(item.provenances).size !== item.provenances.length) errors.push(`${item.id}:DUPLICATE_PROVENANCE`);
    const discovery = item.blueprintDiscovery;
    if (discovery.kind === 'initial' && !item.blueprintAvailable) errors.push(`${item.id}:INITIAL_BLUEPRINT_UNAVAILABLE`);
    if (discovery.kind === 'random-drop') {
      if (discovery.sources.length === 0 || new Set(discovery.sources).size !== discovery.sources.length) {
        errors.push(`${item.id}:INVALID_BLUEPRINT_SOURCES`);
      }
      if (!Number.isInteger(discovery.floorMin) || !Number.isInteger(discovery.floorMax)
        || discovery.floorMin < 1 || discovery.floorMax < discovery.floorMin) {
        errors.push(`${item.id}:INVALID_BLUEPRINT_FLOORS`);
      }
      if (!Number.isFinite(discovery.weight) || discovery.weight <= 0) errors.push(`${item.id}:INVALID_BLUEPRINT_WEIGHT`);
      if (discovery.bossIds && (discovery.bossIds.length === 0 || new Set(discovery.bossIds).size !== discovery.bossIds.length)) {
        errors.push(`${item.id}:INVALID_BLUEPRINT_BOSSES`);
      }
    }
    if (item.itemType === "weapon" && !weapons.has(item.weaponTypeId)) errors.push(`${item.id}:INVALID_WEAPON_TYPE`);
    if (item.itemType === "weapon" && !isValidWeaponScaling(item.scaling)) errors.push(`${item.id}:INVALID_WEAPON_SCALING`);
    if (item.itemType === "weapon" && !isValidWeaponAttackProfile(item.attackProfile)) {
      errors.push(`${item.id}:INVALID_WEAPON_ATTACK_PROFILE`);
    }
    if (
      item.itemType === "weapon"
      && (
        !Number.isInteger(item.damageRange.min)
        || !Number.isInteger(item.damageRange.max)
        || item.damageRange.min < 0
        || item.damageRange.max < item.damageRange.min
      )
    ) errors.push(`${item.id}:INVALID_WEAPON_DAMAGE_RANGE`);
    if (item.itemType === "weapon" && (!Number.isFinite(item.attackSpeed) || item.attackSpeed <= 0)) {
      errors.push(`${item.id}:INVALID_WEAPON_ATTACK_SPEED`);
    }
    if (item.itemType === "offhand" && !offhands.has(item.offHandTypeId)) errors.push(`${item.id}:INVALID_OFFHAND_TYPE`);
    if (item.itemType === "armor" && !armors.has(item.armorTypeId)) errors.push(`${item.id}:INVALID_ARMOR_TYPE`);
    if (item.itemType === "accessory" && !accessories.has(item.accessoryTypeId)) errors.push(`${item.id}:INVALID_ACCESSORY_TYPE`);
    for (const modifier of item.modifiers ?? []) {
      if (!modifier.stat || !isCanonicalItemModifierField(modifier.stat) || !Number.isFinite(modifier.value)) {
        errors.push(`${item.id}:INVALID_MODIFIER`);
      }
    }
  }
  return errors;
}

const catalogErrors = validateItemCatalog();
if (catalogErrors.length > 0) {
  throw new Error(`INVALID_ITEM_CATALOG:${catalogErrors.join(",")}`);
}
