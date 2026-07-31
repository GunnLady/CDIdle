import type { ClassType, EquippedItemRef, Hero, StoredItemInstance } from "../types.ts";
import { getItemById } from "../data/items.ts";
import {
  getTier1ClassItemDefinition,
  rollTier1ClassEquipment,
  type Tier1ClassType,
} from "../data/tier1ClassEquipment.ts";
import { refreshHeroDerivedStats } from "../utils/gameCalculations.ts";
import type { Rng } from "./random.ts";

export type ClassEquipmentReward = {
  weapon: EquippedItemRef;
  accessory: EquippedItemRef;
  returnedInstanceIds: string[];
};

function takeExistingRewardInstance(
  hero: Hero,
  storedItems: StoredItemInstance[],
  instanceId: string,
  itemId: string,
): EquippedItemRef {
  const equipped = Object.values(hero.equipment ?? {}).find((entry) => entry?.instanceId === instanceId);
  if (equipped) {
    if (equipped.itemId !== itemId) throw new Error(`TIER1_REWARD_INSTANCE_COLLISION:${instanceId}`);
    return { ...equipped };
  }
  const storedIndex = storedItems.findIndex((entry) => entry.instanceId === instanceId);
  if (storedIndex >= 0) {
    const [stored] = storedItems.splice(storedIndex, 1);
    if (stored.itemId !== itemId) throw new Error(`TIER1_REWARD_INSTANCE_COLLISION:${instanceId}`);
    return { ...stored };
  }
  return { instanceId, itemId, rarity: "common" };
}

function storeDisplacedItem(
  storedItems: StoredItemInstance[],
  item: EquippedItemRef | null | undefined,
  rewardInstanceIds: ReadonlySet<string>,
  returnedInstanceIds: string[],
) {
  if (!item || rewardInstanceIds.has(item.instanceId)) return;
  if (storedItems.some((entry) => entry.instanceId === item.instanceId)) {
    throw new Error(`DUPLICATE_DISPLACED_ITEM:${item.instanceId}`);
  }
  storedItems.push({ ...item });
  returnedInstanceIds.push(item.instanceId);
}

export function grantTier1ClassEquipment(
  hero: Hero,
  classType: ClassType,
  rng: Pick<Rng, "nextInt">,
  storedItems: StoredItemInstance[],
): { hero: Hero; storedItems: StoredItemInstance[]; reward: ClassEquipmentReward } {
  const nextStoredItems = storedItems.map((item) => ({ ...item }));
  const { weaponId, accessoryId } = rollTier1ClassEquipment(classType, rng);
  const weaponDefinition = getTier1ClassItemDefinition(weaponId);
  const accessoryDefinition = getTier1ClassItemDefinition(accessoryId);
  if (!weaponDefinition || weaponDefinition.slot !== "mainHand") {
    throw new Error(`INVALID_TIER1_REWARD_WEAPON:${classType}:${weaponId}`);
  }
  if (!accessoryDefinition || accessoryDefinition.slot !== "accessory") {
    throw new Error(`INVALID_TIER1_REWARD_ACCESSORY:${classType}:${accessoryId}`);
  }
  if (!weaponDefinition.allowedClasses.includes(classType as Tier1ClassType)
    || !accessoryDefinition.allowedClasses.includes(classType as Tier1ClassType)) {
    throw new Error(`INVALID_TIER1_REWARD_CLASS:${classType}`);
  }

  const weaponInstanceId = `item:${hero.id}:tier1:weapon`;
  const accessoryInstanceId = `item:${hero.id}:tier1:accessory`;
  const weapon = takeExistingRewardInstance(hero, nextStoredItems, weaponInstanceId, weaponId);
  const accessory = takeExistingRewardInstance(hero, nextStoredItems, accessoryInstanceId, accessoryId);
  const rewardInstanceIds = new Set([weaponInstanceId, accessoryInstanceId]);
  const returnedInstanceIds: string[] = [];
  storeDisplacedItem(nextStoredItems, hero.equipment?.mainHand, rewardInstanceIds, returnedInstanceIds);
  storeDisplacedItem(nextStoredItems, hero.equipment?.accessory, rewardInstanceIds, returnedInstanceIds);
  if (weaponDefinition.twoHanded) {
    storeDisplacedItem(nextStoredItems, hero.equipment?.offHand, rewardInstanceIds, returnedInstanceIds);
  }

  const refreshed = refreshHeroDerivedStats({
    ...hero,
    equipment: {
      ...(hero.equipment ?? {}),
      mainHand: weapon,
      accessory,
      ...(weaponDefinition.twoHanded ? { offHand: null } : {}),
    },
  });
  const equippedHero = {
    ...refreshed,
    currentHp: refreshed.calculatedStats.maxHp,
    currentMana: refreshed.calculatedStats.maxMana,
  };

  return {
    hero: equippedHero,
    storedItems: nextStoredItems,
    reward: { weapon, accessory, returnedInstanceIds },
  };
}

export function describeTier1EquipmentReward(reward: ClassEquipmentReward): {
  weaponName: string;
  accessoryName: string;
} {
  const weaponName = getItemById(reward.weapon.itemId)?.name;
  const accessoryName = getItemById(reward.accessory.itemId)?.name;
  if (!weaponName || !accessoryName) throw new Error("INVALID_TIER1_REWARD_CATALOG");
  return { weaponName, accessoryName };
}
