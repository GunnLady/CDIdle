import { Hero, DungeonEncounterType, Rarity, SkillInfo } from "../types.ts";
import { SKILLS_LIBRARY } from "../data/gameData.ts";
import type { Rng } from "../domain/random.ts";
import { systemRng } from "../domain/random.ts";

export const DUNGEON_ENCOUNTER_WEIGHTS: Record<DungeonEncounterType, number> = {
  fight: 85,
  trap: 10,
  enigma: 10,
  ambush: 10,
  ritual: 6,
  obstacle: 10,
  negotiation: 6,
  treasure: 6,
  rest: 6
};

export function rollEncounterForgeMaterial(floor: number, rng: Rng = systemRng): { materialId: string; rarity: Rarity; count: number; name: string } {
  const rand = rng.next();
  let materialId: string;
  let rarity: Rarity;
  let count: number;
  let name: string;

  if (floor >= 75) {
    if (rand < 0.20) {
      materialId = "legendary_essence";
      rarity = "legendary";
      name = "Essence légendaire";
    } else {
      materialId = "arcane_core";
      rarity = "epic";
      name = "Noyau arcanique";
    }
    count = rng.nextInt(2) + 1;
  } else if (floor >= 50) {
    if (rand < 0.25) {
      materialId = "arcane_core";
      rarity = "epic";
      name = "Noyau arcanique";
    } else {
      materialId = "enchanted_fragment";
      rarity = "rare";
      name = "Fragment enchanté";
    }
    count = rng.nextInt(2) + 1;
  } else if (floor >= 25) {
    if (rand < 0.30) {
      materialId = "enchanted_fragment";
      rarity = "rare";
      name = "Fragment enchanté";
    } else {
      materialId = "refined_metal";
      rarity = "uncommon";
      name = "Métal raffiné";
    }
    count = rng.nextInt(3) + 1;
  } else {
    if (rand < 0.25) {
      materialId = "refined_metal";
      rarity = "uncommon";
      name = "Métal raffiné";
    } else {
      materialId = "metal_scrap";
      rarity = "common";
      name = "Débris métalliques";
    }
    count = rng.nextInt(3) + 1;
  }

  return { materialId, rarity, count, name };
}

export function getRandomDungeonEncounterType(
  rng: Rng = systemRng,
  excludedType?: Exclude<DungeonEncounterType, "fight">,
): DungeonEncounterType {
  const keys = Object.keys(DUNGEON_ENCOUNTER_WEIGHTS) as DungeonEncounterType[];
  let totalWeight = 0;

  for (const key of keys) {
    const weight = key === excludedType ? 0 : DUNGEON_ENCOUNTER_WEIGHTS[key];
    if (weight && weight > 0) {
      totalWeight += weight;
    }
  }

  if (totalWeight <= 0) {
    return "fight";
  }

  const roll = rng.next() * totalWeight;
  let cumulative = 0;
  for (const key of keys) {
    const weight = key === excludedType ? 0 : DUNGEON_ENCOUNTER_WEIGHTS[key];
    if (weight && weight > 0) {
      cumulative += weight;
      if (roll <= cumulative) {
        return key;
      }
    }
  }
  return "fight";
}

export function applyLootModifiers(statKey: string, baseValue: number, partyHeroes: Hero[]): number {
  let finalValue = baseValue;
  const activePartyHeroes = partyHeroes.filter(h => h.isActive);
  const partyPassives: SkillInfo[] = [];
  for (const hero of activePartyHeroes) {
    const heroPassives = (hero.passiveSkills || [])
      .map(id => SKILLS_LIBRARY.find(s => s.id === id))
      .filter((s): s is SkillInfo => !!s && s.type === "passive");
    partyPassives.push(...heroPassives);
  }

  for (const passive of partyPassives) {
    if (passive.effect.type === "loot_modifier") {
      for (const mod of passive.effect.modifiers) {
        if (mod.stat === statKey) {
          if (mod.type === "flat") {
            finalValue += mod.value;
          } else if (mod.type === "percent") {
            finalValue += baseValue * (mod.value / 100);
          }
        }
      }
    }
  }
  return finalValue > baseValue
    ? Math.max(Math.floor(baseValue) + 1, Math.floor(finalValue))
    : Math.floor(finalValue);
}
