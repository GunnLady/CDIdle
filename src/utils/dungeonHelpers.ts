import { Hero, DungeonEncounterType, Rarity, SkillInfo } from "../types";
import { SKILLS_LIBRARY } from "../data/gameData";
import { getHeroAttributes } from "./gameCalculations";

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

export function rollEncounterForgeMaterial(floor: number): { materialId: string; rarity: Rarity; count: number; name: string } {
  const rand = Math.random();
  let materialId = "metal_scrap";
  let rarity: Rarity = "common";
  let count = 1;
  let name = "Débris métalliques";

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
    count = Math.floor(Math.random() * 2) + 1;
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
    count = Math.floor(Math.random() * 2) + 1;
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
    count = Math.floor(Math.random() * 3) + 1;
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
    count = Math.floor(Math.random() * 3) + 1;
  }

  return { materialId, rarity, count, name };
}

export function getRandomDungeonEncounterType(): DungeonEncounterType {
  try {
    const keys = Object.keys(DUNGEON_ENCOUNTER_WEIGHTS) as DungeonEncounterType[];
    let totalWeight = 0;
    
    for (const key of keys) {
      const weight = DUNGEON_ENCOUNTER_WEIGHTS[key];
      if (weight && weight > 0) {
        totalWeight += weight;
      }
    }

    if (totalWeight <= 0) {
      return "fight";
    }

    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    for (const key of keys) {
      const weight = DUNGEON_ENCOUNTER_WEIGHTS[key];
      if (weight && weight > 0) {
        cumulative += weight;
        if (roll <= cumulative) {
          return key;
        }
      }
    }
  } catch (error) {
    console.error("Failed to generate encounter type, falling back to fight:", error);
  }
  return "fight";
}

export function getEncounterDetails(type: DungeonEncounterType) {
  switch (type) {
    case "trap":
      return {
        statA: "agi" as const,
        statB: "dex" as const,
        name: "Salle Piégée",
        desc: "La pièce est truffée de plaques de pression, de fléchettes dissimulées et de dalles instables."
      };
    case "enigma":
      return {
        statA: "int" as const,
        statB: "wiz" as const,
        name: "Chambre des Énigmes",
        desc: "Une porte scellée par un ancien mécanisme d'inscription runique magique bloque la voie."
      };
    case "ambush":
      return {
        statA: "agi" as const,
        statB: "luk" as const,
        name: "Embuscade Impromptue",
        desc: "Des créatures rôdent dans l'ombre et s'apprêtent à surprendre l'escouade."
      };
    case "ritual":
      return {
        statA: "dex" as const,
        statB: "wiz" as const,
        name: "Autel de Rituel",
        desc: "Un cercle runique et un cristal de mana instable vibrent d'une énergie occulte."
      };
    case "obstacle":
      return {
        statA: "str" as const,
        statB: "agi" as const,
        name: "Obstacle de Taille",
        desc: "Un éboulement de pierres massives et une grille en fer rouillé bloquent le passage."
      };
    case "negotiation":
      return {
        statA: "wiz" as const,
        statB: "luk" as const,
        name: "Négociation Mystique",
        desc: "Un esprit errant et un marchand suspect proposent un pacte mystérieux."
      };
    default:
      return null;
  }
}

export function selectBestHeroForEncounter(
  slayers: Hero[],
  statA: "str" | "agi" | "end" | "int" | "wiz" | "dex" | "luk",
  statB: "str" | "agi" | "end" | "int" | "wiz" | "dex" | "luk"
) {
  if (slayers.length === 0) return null;
  let bestHero = slayers[0];
  let bestScore = -1;

  slayers.forEach((hero) => {
    const attrs = getHeroAttributes(hero);
    const score = (attrs[statA] || 0) + (attrs[statB] || 0);
    if (score > bestScore) {
      bestScore = score;
      bestHero = hero;
    }
  });

  return { bestHero, bestScore };
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
  return finalValue;
}
