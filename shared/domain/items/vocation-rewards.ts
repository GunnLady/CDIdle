export const TIER1_VOCATION_REWARD_POOLS = {
  Guerrier: {
    weaponIds: ["basic_sword", "basic_axe", "basic_mace", "basic_spear"],
    accessoryIds: ["sturdy_travel_belt", "patched_field_belt", "knotted_leather_bracelet"],
  },
  Voleur: {
    weaponIds: ["basic_dagger", "basic_saber"],
    accessoryIds: ["dusty_travel_cloak", "ashwood_bracelet", "cracked_coin_charm"],
  },
  Archer: {
    weaponIds: ["basic_shortbow", "basic_longbow", "basic_crossbow"],
    accessoryIds: ["knotted_leather_bracelet", "ashwood_bracelet", "windworn_cloak"],
  },
  Mage: {
    weaponIds: ["basic_wand", "basic_staff", "basic_spellbook"],
    accessoryIds: ["silver_ring", "copper_focus_ring", "warm_ember_amulet"],
  },
  Acolyte: {
    weaponIds: ["basic_mace", "basic_staff", "basic_spellbook"],
    accessoryIds: ["silver_ring", "warm_ember_amulet", "riverstone_amulet"],
  },
  "Aède": {
    weaponIds: ["basic_lute"],
    accessoryIds: ["silver_ring", "lucky_charm", "windworn_cloak"],
  },
  Druide: {
    weaponIds: ["basic_staff"],
    accessoryIds: ["riverstone_amulet", "ashwood_bracelet", "windworn_cloak"],
  },
  Artificier: {
    weaponIds: ["basic_gear_cannon", "basic_rifle", "basic_crossbow"],
    accessoryIds: ["copper_focus_ring", "warm_ember_amulet", "cracked_coin_charm"],
  },
  Pugiliste: {
    weaponIds: ["basic_knuckles", "basic_gauntlets", "basic_bo"],
    accessoryIds: ["ashwood_bracelet", "knotted_leather_bracelet", "sturdy_travel_belt"],
  },
} as const;

export type Tier1Vocation = keyof typeof TIER1_VOCATION_REWARD_POOLS;

const VOCATION_REWARD_ITEM_IDS = new Set<string>(
  Object.values(TIER1_VOCATION_REWARD_POOLS).flatMap((pool) => [
    ...pool.weaponIds,
    ...pool.accessoryIds,
  ]),
);

export function isVocationRewardItem(itemId: string): boolean {
  return VOCATION_REWARD_ITEM_IDS.has(itemId);
}
