import type { CityDashboardView } from "../../domain/cityPresentation";
import type { DungeonEncounterView, DungeonPartyHeroView, DungeonProgressBannerView } from "../../domain/dungeonPresentation";
import type { EquipmentCandidateView, EquipmentItemView, HeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import type { SelectedHeroView } from "../../domain/heroPresentation";
import type { FounderCandidateView } from "../../domain/onboardingPresentation";
import type { Hero, ResourceRates, Resources } from "../../types";

export const catalogResources: Resources = { gold: 12_450, food: 840, wood: 315, stone: 96, ore: 18 };
export const catalogRates: ResourceRates = { food: 24, wood: 8, stone: 0, ore: 2 };

export const catalogDungeonBanner: DungeonProgressBannerView = {
  progress: { floor: 3, room: 2, roomCount: 4 },
  status: "Exploration",
  autoExplore: true,
  canToggleAutoExplore: true,
  party: [
    { id: "catalog-ariane", name: "Ariane", level: 7, currentHp: 84, maxHp: 100, currentMana: 18, maxMana: 30, healthPercent: 84, manaPercent: 60 },
    { id: "catalog-borin", name: "Borin", level: 5, currentHp: 51, maxHp: 72, currentMana: 34, maxMana: 48, healthPercent: 71, manaPercent: 71 },
    null,
    null,
  ],
};

export const catalogCurrentItem: EquipmentItemView = {
  name: "Épée de voyage", rarity: "uncommon", description: "Une lame fiable marquée par les routes.",
  facts: ["Niveau requis : 2", "Main principale"], modifiers: [{ id: "damage", label: "+7 dégâts physiques" }],
};

export const catalogEquipmentCandidate: EquipmentCandidateView = {
  instanceId: "catalog-item-candidate",
  item: { name: "Lame du guet", rarity: "rare", description: "Forgée pour tenir les remparts sous la pluie.", facts: ["Niveau requis : 5", "Main principale"], modifiers: [{ id: "damage", label: "+12 dégâts physiques" }, { id: "speed", label: "+2 vitesse" }] },
  levelBlocked: false, requiredLevel: 5, displacedItems: ["Épée de voyage"],
  statDeltas: [{ label: "Dégâts phys.", value: 5, before: 21, after: 26 }, { label: "Vitesse", value: 2, before: 8, after: 10 }],
};

export const catalogBlockedCandidate: EquipmentCandidateView = { ...catalogEquipmentCandidate, instanceId: "catalog-item-blocked", levelBlocked: true, requiredLevel: 12, displacedItems: [] };

const buildingCost = (gold: number, wood = 0, stone = 0, ore = 0): Resources => ({ gold, food: 0, wood, stone, ore });

export const catalogCityView: CityDashboardView = {
  buildings: [
    { id: "ferme", name: "Ferme", description: "Produit la nourriture.", icon: "Wheat", categoryLabel: "Production", level: 3, maxLevel: 10, unlocked: true, cost: buildingCost(180, 45), affordable: true, atMaxLevel: false },
    { id: "forge", name: "Forge", description: "Façonne les équipements.", icon: "Anvil", categoryLabel: "Vocation", level: 1, maxLevel: 10, unlocked: true, cost: buildingCost(420, 80, 60, 12), affordable: false, atMaxLevel: false },
    { id: "guilde", name: "Guilde", description: "Réunit les aventuriers.", icon: "Castle", categoryLabel: "Communauté", level: 0, maxLevel: 5, unlocked: false, prerequisite: "Donjon étage 5", cost: buildingCost(900, 120, 100), affordable: false, atMaxLevel: false },
  ],
  jobs: [
    { id: "farmers", label: "Fermiers", buildingLabel: "Ferme", buildingLevel: 3, count: 4, canAdd: true, canRemove: true },
    { id: "woodcutters", label: "Bûcherons", buildingLabel: "Scierie", buildingLevel: 2, count: 2, canAdd: true, canRemove: true },
    { id: "quarrymen", label: "Carriers", buildingLabel: "Carrière", buildingLevel: 1, count: 0, canAdd: true, canRemove: false },
    { id: "miners", label: "Mineurs", buildingLabel: "Mine", buildingLevel: 0, count: 0, canAdd: false, canRemove: false },
  ],
  unassignedCitizens: 1, totalCitizens: 8, maxCitizens: 12, citizenGrowthProgress: 62,
};

export const catalogEncounter: DungeonEncounterView = {
  encounterId: "catalog-encounter", title: "Embuscade des gobelins", location: "Étage 3 · Salle 2", statusLabel: "Combat en cours", state: "playing",
  transcript: [{ id: "turn-1", message: "Ariane frappe le gobelin pour 18 dégâts.", category: "combat-hero" }, { id: "turn-2", message: "Le gobelin riposte et inflige 7 dégâts.", category: "combat-enemy" }],
};

export const catalogVictoryEncounter: DungeonEncounterView = { ...catalogEncounter, encounterId: "catalog-victory", statusLabel: "Victoire", state: "victory", transcript: [{ id: "victory", message: "Le groupe remporte le combat.", category: "victory" }], result: "Butin : 34 or et une Lame du guet." };

export const catalogPendingEncounter: DungeonEncounterView = { ...catalogEncounter, encounterId: "catalog-pending", statusLabel: "En attente", state: "pending", transcript: [] };
export const catalogDefeatEncounter: DungeonEncounterView = { ...catalogEncounter, encounterId: "catalog-defeat", statusLabel: "Défaite", state: "defeat", transcript: [{ id: "defeat", message: "Le groupe bat en retraite.", category: "defeat" }], result: "Aucune récompense obtenue." };

const partyHero = (overrides: Partial<DungeonPartyHeroView>): DungeonPartyHeroView => ({
  id: "catalog-ariane", name: "Ariane", race: "Humaine", className: "Guerrière", level: 7, isActive: true, statusLabel: "En expédition",
  currentHp: 84, maxHp: 100, currentMana: 18, maxMana: 30, healthPercent: 84, canDeploy: true, attackPower: 26, estimatedDps: "18,4",
  physicalDefense: 14, speed: 10, criticalChance: 8, dodgeChance: 6, manaPercent: 60, xp: 420, xpNeeded: 600, xpPercent: 70,
  ...overrides,
});

export const catalogParty: Array<DungeonPartyHeroView | null> = [partyHero({}), partyHero({ id: "catalog-borin", name: "Borin", race: "Nain", className: "Mage", level: 6, currentHp: 51, maxHp: 72, healthPercent: 71, currentMana: 34, maxMana: 48, manaPercent: 71 }), null, null];
export const catalogReserves = [partyHero({ id: "catalog-celia", name: "Célia", race: "Elfe", className: "Archère", level: 4, isActive: false, statusLabel: "Disponible", currentHp: 64, maxHp: 64, healthPercent: 100, canDeploy: true })];

export const catalogSelectedHero: SelectedHeroView = {
  id: "catalog-ariane", name: "Ariane", level: 7, portrait: { id: "catalog-ariane", name: "Ariane", classType: "Guerrier", gender: "Female", spriteIndex: 2 },
  identityLabel: "Humaine · Guerrière · Niveau 7", statusLabel: "En expédition", currentHp: 84, maxHp: 100, currentMana: 18, maxMana: 30,
  xp: 420, xpNeeded: 600, xpPercent: 70, attributes: [{ key: "str", short: "FOR", name: "Force", value: 14, isPrimary: true }],
  combatStats: [{ label: "Attaque", value: 26 }, { label: "Défense", value: 14 }, { label: "Vitesse", value: 10 }, { label: "Critique", value: "8 %" }], descriptions: [], resistances: [],
};

export const catalogHeroEquipment: HeroEquipmentView = {
  heroId: "catalog-ariane", heroName: "Ariane", slots: [
    { key: "mainHand", label: "Main principale", icon: "🗡️", blocked: false, item: catalogCurrentItem, candidates: [catalogEquipmentCandidate] },
    { key: "offHand", label: "Main gauche", icon: "🛡️", blocked: false, item: null, candidates: [] },
    { key: "armor", label: "Armure", icon: "👕", blocked: false, item: null, candidates: [] },
    { key: "accessory", label: "Accessoire", icon: "💍", blocked: true, blockReason: "Niveau 10 requis", item: null, candidates: [] },
  ],
};

export const catalogFounder: FounderCandidateView = {
  id: "catalog-founder", name: "Maëlys", race: "Humaine", genderLabel: "Femme", genderSymbol: "♀", genderTone: "pink", isElite: true,
  portrait: { id: "catalog-founder", name: "Maëlys", classType: "Novice", gender: "Female", spriteIndex: 4 }, bestStat: { label: "Sagesse", value: 12 }, weakestStat: { label: "Force", value: 5 }, maxHp: 42, maxMana: 36,
};

export const catalogRecruit: Hero = {
  id: "catalog-recruit", name: "Edern", race: "Humain", classType: "Novice", gender: "Male", spriteIndex: 1, isElite: false,
  level: 1, xp: 0, xpNeeded: 100, currentHp: 30, currentMana: 22, baseStats: { str: 8, agi: 6, end: 7, int: 5, wiz: 9, dex: 6, luk: 4 },
  isActive: false, status: "idle", activeSkills: [], passiveSkills: [],
  calculatedStats: { maxHp: 30, hp: 30, maxMana: 22, mana: 22, physicalDamage: 8, magicDamage: 7, estimatedDps: 8, physicalDefense: 6, magicDefense: 7, speed: 6, criticalChance: 3, dodgeChance: 2, resistances: { arcane: 0, fire: 0, ice: 0, water: 0, earth: 0, wind: 0, lightning: 0, holy: 0, dark: 0, nature: 0, sound: 0, poison: 0, blood: 0, radiant: 0 } },
  equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
};
