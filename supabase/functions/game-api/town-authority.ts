import { applyInventoryCommand } from "./inventory-authority.ts";
import { applyForgeCommand } from "./forge-authority.ts";
import { applyDungeonCommand } from "./dungeon-authority.ts";
import { generateAuthoritativeNovice } from "./novice-authority.ts";
import type { CanonicalGameCommand } from "../../../shared/contracts/authoritative.ts";

export type TownResources = { gold: number; food: number; wood: number; stone: number; ore: number };
export type TownState = {
  cityName?: string;
  resources: TownResources;
  buildings: Record<string, number>;
  citizens: { farmers: number; woodcutters: number; quarrymen: number; miners: number; unassigned: number };
  totalCitizensCount: number;
  districts: Record<string, boolean>;
  heroes?: Array<Record<string, unknown>>;
  storedItems?: Array<Record<string, unknown>>;
  forgeMaterials?: Array<Record<string, unknown>>;
  itemBlueprints?: Array<Record<string, unknown>>;
  citizenGrowthProgress?: number;
  activeDungeonFloor?: number;
  activeDungeonRoom?: number;
  highestFloorReached?: number;
  currentEncounter?: Record<string, unknown> | null;
  autoExplore?: boolean;
  onboardingCandidates?: Array<Record<string, unknown>>;
  pendingOnboardingCityName?: string;
};

type TownCommand = CanonicalGameCommand & { commandId?: string };

const costs: Record<string, TownResources[]> = {
  habitation: [{ gold: 15, food: 10, wood: 0, stone: 0, ore: 0 }, { gold: 25, food: 15, wood: 0, stone: 0, ore: 0 }, { gold: 45, food: 30, wood: 0, stone: 0, ore: 0 }, { gold: 75, food: 50, wood: 0, stone: 0, ore: 0 }, { gold: 125, food: 85, wood: 0, stone: 0, ore: 0 }, { gold: 215, food: 145, wood: 90, stone: 0, ore: 0 }, { gold: 365, food: 245, wood: 155, stone: 0, ore: 0 }, { gold: 620, food: 415, wood: 260, stone: 0, ore: 0 }, { gold: 1050, food: 700, wood: 440, stone: 110, ore: 0 }, { gold: 1790, food: 1195, wood: 750, stone: 260, ore: 50 }],
  ferme: [{ gold: 10, food: 10, wood: 0, stone: 0, ore: 0 }, { gold: 20, food: 20, wood: 0, stone: 0, ore: 0 }, { gold: 40, food: 30, wood: 0, stone: 0, ore: 0 }, { gold: 80, food: 60, wood: 0, stone: 0, ore: 0 }, { gold: 160, food: 105, wood: 70, stone: 0, ore: 0 }, { gold: 320, food: 190, wood: 105, stone: 0, ore: 0 }, { gold: 640, food: 340, wood: 160, stone: 0, ore: 0 }, { gold: 1280, food: 610, wood: 235, stone: 0, ore: 0 }, { gold: 2560, food: 1100, wood: 355, stone: 75, ore: 0 }, { gold: 5120, food: 1985, wood: 535, stone: 150, ore: 55 }],
  scierie: [{ gold: 15, food: 10, wood: 20, stone: 0, ore: 0 }, { gold: 25, food: 15, wood: 40, stone: 0, ore: 0 }, { gold: 45, food: 25, wood: 70, stone: 0, ore: 0 }, { gold: 75, food: 40, wood: 135, stone: 0, ore: 0 }, { gold: 125, food: 65, wood: 260, stone: 55, ore: 0 }, { gold: 215, food: 105, wood: 495, stone: 90, ore: 0 }, { gold: 360, food: 170, wood: 940, stone: 140, ore: 105 }, { gold: 615, food: 270, wood: 1790, stone: 225, ore: 220 }, { gold: 1045, food: 430, wood: 3395, stone: 360, ore: 465 }, { gold: 1780, food: 685, wood: 6455, stone: 575, ore: 970 }],
  carriere: [{ gold: 20, food: 10, wood: 30, stone: 0, ore: 0 }, { gold: 35, food: 15, wood: 50, stone: 0, ore: 0 }, { gold: 60, food: 25, wood: 80, stone: 70, ore: 0 }, { gold: 100, food: 35, wood: 135, stone: 130, ore: 0 }, { gold: 165, food: 60, wood: 220, stone: 240, ore: 0 }, { gold: 285, food: 90, wood: 365, stone: 445, ore: 0 }, { gold: 485, food: 140, wood: 605, stone: 820, ore: 155 }, { gold: 820, food: 215, wood: 1000, stone: 1515, ore: 355 }, { gold: 1395, food: 335, wood: 1650, stone: 2805, ore: 735 }, { gold: 2370, food: 515, wood: 2720, stone: 5190, ore: 1240 }],
  mine: [{ gold: 50, food: 20, wood: 60, stone: 65, ore: 0 }, { gold: 85, food: 30, wood: 105, stone: 105, ore: 95 }, { gold: 145, food: 50, wood: 185, stone: 165, ore: 180 }, { gold: 245, food: 80, wood: 320, stone: 265, ore: 345 }, { gold: 420, food: 130, wood: 565, stone: 425, ore: 650 }, { gold: 710, food: 210, wood: 985, stone: 680, ore: 1240 }, { gold: 1205, food: 335, wood: 1725, stone: 1090, ore: 2350 }, { gold: 2050, food: 535, wood: 3015, stone: 1745, ore: 4470 }, { gold: 3490, food: 860, wood: 5275, stone: 2790, ore: 8490 }, { gold: 5930, food: 1375, wood: 9235, stone: 4465, ore: 16135 }],
  maison_chef: [{ gold: 50, food: 35, wood: 80, stone: 60, ore: 20 }, { gold: 135, food: 100, wood: 210, stone: 160, ore: 60 }, { gold: 365, food: 295, wood: 540, stone: 420, ore: 180 }, { gold: 985, food: 855, wood: 1405, stone: 1115, ore: 540 }, { gold: 2655, food: 2475, wood: 3655, stone: 2960, ore: 1620 }],
  guilde: [{ gold: 200, food: 100, wood: 250, stone: 150, ore: 50 }, { gold: 540, food: 290, wood: 650, stone: 400, ore: 150 }, { gold: 1460, food: 840, wood: 1690, stone: 1055, ore: 450 }, { gold: 3935, food: 2440, wood: 4395, stone: 2790, ore: 1350 }, { gold: 10630, food: 7075, wood: 11425, stone: 7400, ore: 4050 }],
  academie: [{ gold: 1595, food: 1260, wood: 2030, stone: 2105, ore: 1800 }], temple: [{ gold: 1325, food: 1170, wood: 1150, stone: 1810, ore: 750 }], cercle: [{ gold: 1785, food: 2525, wood: 3080, stone: 1755, ore: 450 }], lair: [{ gold: 1345, food: 1260, wood: 2030, stone: 1805, ore: 800 }], caserne: [{ gold: 1275, food: 1270, wood: 1050, stone: 980, ore: 800 }], poste_chasse: [{ gold: 1185, food: 1435, wood: 2380, stone: 1355, ore: 450 }], forge: [{ gold: 2000, food: 500, wood: 2500, stone: 1500, ore: 1500 }]
};
const maxLevels: Record<string, number> = { habitation: 10, ferme: 10, scierie: 10, carriere: 10, mine: 10, maison_chef: 5, guilde: 5, academie: 1, temple: 1, cercle: 1, lair: 1, caserne: 1, poste_chasse: 1, forge: 1 };
const prerequisites: Record<string, Record<string, number>> = {
  scierie: { habitation: 1, ferme: 1 }, carriere: { scierie: 1 }, guilde: { carriere: 1 },
  maison_chef: { guilde: 1 }, mine: { carriere: 1 }, caserne: { guilde: 1, mine: 1 },
  temple: { guilde: 1 }, cercle: { temple: 1 }, academie: { temple: 1 },
  poste_chasse: { caserne: 1 }, lair: { caserne: 1 }, forge: { guilde: 1, maison_chef: 1 }
};
const districtCosts: Record<string, TownResources> = {
  quartier_foret: { gold: 500, food: 100, wood: 600, stone: 300, ore: 50 },
  quartier_carriere: { gold: 600, food: 150, wood: 400, stone: 700, ore: 150 },
  quartier_ferme: { gold: 700, food: 500, wood: 500, stone: 500, ore: 100 },
  quartier_mine: { gold: 1000, food: 200, wood: 800, stone: 800, ore: 500 }
};

export const initialTownState = (): TownState => ({
  resources: { gold: 75, food: 50, wood: 20, stone: 0, ore: 0 },
  buildings: { habitation: 1, ferme: 0, scierie: 0, carriere: 0, mine: 0, maison_chef: 0, guilde: 0, academie: 0, temple: 0, cercle: 0, lair: 0, caserne: 0, poste_chasse: 0, forge: 0 },
  citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
  totalCitizensCount: 3, districts: {}, heroes: [], storedItems: [], forgeMaterials: [], itemBlueprints: [], citizenGrowthProgress: 0
  , activeDungeonFloor: 1, activeDungeonRoom: 1, highestFloorReached: 1, currentEncounter: null, autoExplore: false,
  onboardingCandidates: [], pendingOnboardingCityName: ""
});

class TownCommandError extends Error { constructor(public readonly code: string, message: string) { super(message); } }
const affordable = (resources: TownResources, cost: TownResources) => Object.keys(cost).every((key) => resources[key as keyof TownResources] >= cost[key as keyof TownResources]);
const subtract = (resources: TownResources, cost: TownResources): TownResources => ({ gold: resources.gold - cost.gold, food: resources.food - cost.food, wood: resources.wood - cost.wood, stone: resources.stone - cost.stone, ore: resources.ore - cost.ore });

export function applyTownCommand(current: Record<string, unknown>, command: Record<string, unknown>, options: { allowCheats?: boolean } = {}): { state: Record<string, unknown>; events: unknown[] } {
  const town = { ...initialTownState(), ...current } as TownState;
  const typed = command as TownCommand;
  if (typed.type === "dungeon.explore" || typed.type === "dungeon.select_floor" || typed.type === "dungeon.resolve" || typed.type === "dungeon.auto_explore" || typed.type === "dungeon.retreat") return applyDungeonCommand(town, command);
  const heroes = town.heroes ?? [];
  if (typed.type === "hero.recruit_offer") {
    if ((town as TownState & { pendingRecruit?: unknown }).pendingRecruit) throw new TownCommandError("RECRUIT_PENDING", "a recruit offer is already pending");
    const guildLevel = town.buildings.guilde ?? 0;
    if (guildLevel < 1) throw new TownCommandError("GUILD_REQUIRED", "guild building is required");
    if (heroes.length >= Math.max(0, guildLevel) + 2) throw new TownCommandError("CAPACITY_REACHED", "hero capacity reached");
    const token = String(typed.commandId ?? "offer").replace(/-/g, "");
    const score = [...token].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const races = ["Humain", "Nain", "Elfe", "Gobelin"];
    const candidate = generateAuthoritativeNovice(
      `recruit:${typed.commandId ?? "offer"}`,
      `candidate-${typed.commandId ?? "offer"}`,
      races[score % races.length],
    );
    return { state: { ...town, pendingRecruit: candidate }, events: [{ type: "hero.recruit_offer_created", heroId: candidate.id }] };
  }
  if (typed.type === "hero.recruit_cancel") {
    if (!(town as TownState & { pendingRecruit?: unknown }).pendingRecruit) throw new TownCommandError("RECRUIT_NOT_FOUND", "recruit offer not found");
    return { state: { ...town, pendingRecruit: null }, events: [{ type: "hero.recruit_offer_cancelled" }] };
  }
  if (typed.type === "hero.recruit_confirm") {
    const pending = (town as TownState & { pendingRecruit?: Record<string, unknown> | null }).pendingRecruit;
    if (!pending) throw new TownCommandError("RECRUIT_NOT_FOUND", "recruit offer not found");
    const guildLevel = town.buildings.guilde ?? 0;
    const cost = 100 + heroes.length * 150;
    if (heroes.length >= Math.max(0, guildLevel) + 2) throw new TownCommandError("CAPACITY_REACHED", "hero capacity reached");
    if (town.resources.gold < cost) throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient gold");
    const name = typed.name?.trim();
    const hero = { ...pending, ...(name ? { name: name.slice(0, 40) } : {}), id: String(pending.id).replace("candidate-", "hero-") };
    return { state: { ...town, resources: { ...town.resources, gold: town.resources.gold - cost }, heroes: [...heroes, hero], pendingRecruit: null }, events: [{ type: "hero.recruited", heroId: hero.id, cost }] };
  }
  if (typed.type === "cheat.grant_resources" || typed.type === "cheat.set_highest_floor") {
    if (!options.allowCheats) throw new TownCommandError("CHEATS_DISABLED", "cheats are disabled");
    if (typed.type === "cheat.set_highest_floor") {
      if (!Number.isInteger(typed.floor) || typed.floor < 1 || typed.floor > 10000) throw new TownCommandError("INVALID_COMMAND", "invalid cheat floor");
      return { state: { ...town, highestFloorReached: typed.floor }, events: [{ type: "cheat.highest_floor_set", floor: typed.floor }] };
    }
    const resources = { ...town.resources };
    for (const [resource, amount] of Object.entries(typed.amounts)) {
      if (!(resource in resources) || !Number.isFinite(amount) || Number(amount) < 0 || Number(amount) > 1_000_000_000) throw new TownCommandError("INVALID_COMMAND", "invalid cheat resource amount");
      resources[resource as keyof TownResources] += Number(amount);
    }
    return { state: { ...town, resources }, events: [{ type: "cheat.resources_granted", amounts: typed.amounts }] };
  }
  if (typed.type === "onboarding.offer") {
    const cityName = typed.cityName.trim();
    if (!cityName || cityName.length > 48) throw new TownCommandError("INVALID_COMMAND", "city name is invalid");
    if (town.cityName || heroes.length > 0) throw new TownCommandError("ALREADY_STARTED", "onboarding is already complete");
    const commandId = String(typed.commandId ?? "onboarding");
    const onboardingCandidates = Array.from({ length: 5 }, (_, index) =>
      generateAuthoritativeNovice(
        `onboarding:${commandId}:${index + 1}`,
        `candidate-${commandId}-${index + 1}`,
      )
    );
    return {
      state: { ...town, onboardingCandidates, pendingOnboardingCityName: cityName },
      events: [{ type: "onboarding.offer_created", heroIds: onboardingCandidates.map((hero) => hero.id) }],
    };
  }
  if (typed.type === "onboarding.start") {
    const cityName = typed.cityName.trim();
    if (!cityName || cityName.length > 48) throw new TownCommandError("INVALID_COMMAND", "city name is invalid");
    if (town.cityName || heroes.length > 0) throw new TownCommandError("ALREADY_STARTED", "onboarding is already complete");
    if (!Array.isArray(typed.starterHeroes) || typed.starterHeroes.length !== 2) throw new TownCommandError("INVALID_COMMAND", "exactly two starter heroes are required");
    if (town.pendingOnboardingCityName !== cityName) throw new TownCommandError("INVALID_COMMAND", "onboarding city does not match the offer");
    const candidates = town.onboardingCandidates ?? [];
    const selectedIds = new Set(typed.starterHeroes.map((selection) => String(selection.id ?? "")));
    if (selectedIds.size !== 2) throw new TownCommandError("INVALID_COMMAND", "starter hero ids must be unique");
    const starterHeroes = typed.starterHeroes.map((selection, index) => {
      const candidate = candidates.find((entry) => entry.id === selection.id);
      if (!candidate) throw new TownCommandError("INVALID_COMMAND", "starter hero was not offered");
      const name = String(selection.name ?? "").trim();
      if (!name || name.length > 40) throw new TownCommandError("INVALID_COMMAND", "starter hero identity is invalid");
      return {
        ...candidate,
        id: `hero-${typed.commandId ?? "onboarding"}-${index + 1}`,
        name,
        isActive: false,
        status: "idle",
      };
    });
    return {
      state: {
        ...town,
        cityName,
        resources: { gold: 125, food: 75, wood: 40, stone: 0, ore: 0 },
        heroes: starterHeroes,
        onboardingCandidates: [],
        pendingOnboardingCityName: "",
      },
      events: [{ type: "onboarding.started", cityName, heroIds: starterHeroes.map((hero) => hero.id) }],
    };
  }
  if (typed.type === "inventory.add" || typed.type === "inventory.remove" || typed.type === "hero.equip" || typed.type === "hero.unequip") {
    return applyInventoryCommand(town, command);
  }
  if (typed.type === "forge.start" || typed.type === "forge.finalize" || typed.type === "forge.cancel" || typed.type === "inventory.recycle") {
    return applyForgeCommand(town, command);
  }
  if (typed.type === "hero.recruit") {
    const guildLevel = town.buildings.guilde ?? 0;
    const cost = 100 + heroes.length * 150;
    const capacity = Math.max(0, guildLevel) + 2;
    if (guildLevel < 1) throw new TownCommandError("GUILD_REQUIRED", "guild building is required");
    if (heroes.length >= capacity) throw new TownCommandError("CAPACITY_REACHED", "hero capacity reached");
    if (town.resources.gold < cost) throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient gold");
    const id = `hero-${typed.commandId ?? `slot-${heroes.length}`}`;
    const hero = generateAuthoritativeNovice(
      `recruit:${typed.commandId ?? `slot-${heroes.length}`}`,
      id,
    );
    return { state: { ...town, resources: { ...town.resources, gold: town.resources.gold - cost }, heroes: [...heroes, hero] }, events: [{ type: "hero.recruited", heroId: id, cost }] };
  }
  if (typed.type === "hero.dismiss") {
    if (!heroes.some((hero) => hero.id === typed.heroId)) throw new TownCommandError("HERO_NOT_FOUND", "hero not found");
    return { state: { ...town, heroes: heroes.filter((hero) => hero.id !== typed.heroId) }, events: [{ type: "hero.dismissed", heroId: typed.heroId }] };
  }
  if (typed.type === "hero.activity") {
    const hero = heroes.find((entry) => entry.id === typed.heroId);
    if (!hero) throw new TownCommandError("HERO_NOT_FOUND", "hero not found");
    if (typed.active && Number(hero.currentHp ?? 0) <= 0) throw new TownCommandError("INVALID_HEALTH", "hero has no health");
    if (typed.active && heroes.filter((entry) => entry.isActive).length >= 4) throw new TownCommandError("ACTIVE_LIMIT", "active hero limit reached");
    return { state: { ...town, heroes: heroes.map((entry) => entry.id === typed.heroId ? { ...entry, isActive: typed.active, status: typed.active ? "idle" : "resting" } : entry) }, events: [{ type: "hero.activity_changed", heroId: typed.heroId, active: typed.active }] };
  }
  if (typed.type === "building.upgrade") {
    const id = typed.buildingId;
    const level = town.buildings[id] ?? 0;
    const cost = costs[id]?.[Math.min(level, (costs[id]?.length ?? 1) - 1)];
    if (!cost) throw new TownCommandError("INVALID_COMMAND", "unknown or unsupported building");
    if (level >= (maxLevels[id] ?? 1)) throw new TownCommandError("MAX_LEVEL", "building reached its maximum level");
    for (const [required, requiredLevel] of Object.entries(prerequisites[id] ?? {})) if ((town.buildings[required] ?? 0) < requiredLevel) throw new TownCommandError("BUILDING_REQUIRED", "building prerequisite is missing");
    if (!affordable(town.resources, cost)) throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient resources");
    return { state: { ...town, resources: subtract(town.resources, cost), buildings: { ...town.buildings, [id]: level + 1 } }, events: [{ type: "building.upgraded", buildingId: id, level: level + 1 }] };
  }
  if (typed.type === "citizens.allocate") {
    const amount = typed.amount;
    if (!Number.isInteger(amount) || amount === 0 || !(typed.role in town.citizens)) throw new TownCommandError("INVALID_COMMAND", "invalid citizen allocation");
    if (amount > 0) {
      const required: Record<string, string> = { farmers: "ferme", woodcutters: "scierie", quarrymen: "carriere", miners: "mine" };
      if (required[typed.role] && (town.buildings[required[typed.role]] ?? 0) < 1) throw new TownCommandError("BUILDING_REQUIRED", "profession building is missing");
    }
    const next = town.citizens[typed.role] + amount;
    const unassigned = town.citizens.unassigned - amount;
    if (next < 0 || unassigned < 0) throw new TownCommandError("INVALID_COMMAND", "invalid citizen allocation");
    return { state: { ...town, citizens: { ...town.citizens, [typed.role]: next, unassigned } }, events: [{ type: "citizens.allocated", role: typed.role, amount }] };
  }
  if (typed.type === "district.unlock") {
    const cost = districtCosts[typed.districtId];
    if (!cost) throw new TownCommandError("NOT_FOUND", "unknown district");
    if (town.districts[typed.districtId]) throw new TownCommandError("ALREADY_UNLOCKED", "district already unlocked");
    if (!affordable(town.resources, cost)) throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient resources");
    return { state: { ...town, resources: subtract(town.resources, cost), districts: { ...town.districts, [typed.districtId]: true } }, events: [{ type: "district.unlocked", districtId: typed.districtId }] };
  }
  throw new TownCommandError("INVALID_COMMAND", "unsupported town command");
}

export { TownCommandError };
