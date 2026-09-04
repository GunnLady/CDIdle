import type { CanonicalItemBlueprint } from "../../contracts/authoritative.ts";
import type { Rng } from "../random.ts";
import type { CanonicalItem } from "./types.ts";
import { ITEM_LIBRARY } from "./items.ts";

export type BlueprintRewardSource = "boss" | "treasure";

export function rollBlueprintReward(options: {
  blueprints: CanonicalItemBlueprint[];
  source: BlueprintRewardSource;
  floor: number;
  chance: number;
  rng: Rng;
  bossId?: string;
  levelMin?: number;
  levelMax?: number;
  catalog?: readonly CanonicalItem[];
}): { blueprints: CanonicalItemBlueprint[]; itemId?: string; itemName?: string } {
  const known = new Set(options.blueprints.filter((entry) => entry.unlocked).map((entry) => entry.itemId));
  const candidates = (options.catalog ?? ITEM_LIBRARY).filter((item) => {
    const policy = item.blueprintDiscovery;
    return item.catalogStatus === "active"
      && item.blueprintAvailable
      && item.provenances.includes("forge")
      && policy.kind === "random-drop"
      && policy.sources.includes(options.source)
      && options.floor >= policy.floorMin
      && options.floor <= policy.floorMax
      && item.levelRange.max >= (options.levelMin ?? 1)
      && item.levelRange.min <= (options.levelMax ?? Number.MAX_SAFE_INTEGER)
      && (!policy.bossIds || (options.bossId !== undefined && policy.bossIds.includes(options.bossId)))
      && !known.has(item.id);
  });
  if (options.rng.next() >= options.chance || candidates.length === 0) {
    return { blueprints: options.blueprints };
  }
  const totalWeight = candidates.reduce((sum, item) => (
    sum + (item.blueprintDiscovery.kind === "random-drop" ? item.blueprintDiscovery.weight : 0)
  ), 0);
  let roll = options.rng.next() * totalWeight;
  const selected = candidates.find((item) => {
    const weight = item.blueprintDiscovery.kind === "random-drop" ? item.blueprintDiscovery.weight : 0;
    roll -= weight;
    return roll < 0;
  }) ?? candidates[candidates.length - 1];
  return {
    blueprints: [...options.blueprints.filter((entry) => entry.itemId !== selected.id), { itemId: selected.id, unlocked: true }],
    itemId: selected.id,
    itemName: selected.name,
  };
}
