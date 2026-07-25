import { applyInventoryCommand } from "./inventory-authority.ts";
import { applyForgeCommand } from "./forge-authority.ts";
import { applyDungeonCommand } from "./dungeon-authority.ts";
import { generateAuthoritativeNovice } from "./novice-authority.ts";
import {
  initialCanonicalRngState,
  forkCanonicalRng,
  migrateCanonicalRngState,
  nextCanonicalSubseed,
  restoreCanonicalRng,
  type CanonicalRng,
} from "./authoritative-rng.ts";
import {
  validateCanonicalGameState,
  type CanonicalGameCommand,
  type CanonicalRngState,
} from "../../../shared/contracts/authoritative.ts";
import {
  migrateAuthoritativeHeroProgression,
  validateAuthoritativeHero,
  validateAuthoritativeHeroes,
} from "../../../src/domain/authoritativeHeroValidation.ts";
import {
  ALLOCATABLE_CITIZEN_ROLES,
  validateAuthoritativeTownState,
} from "../../../src/domain/authoritativeTownValidation.ts";
import {
  BUILDINGS_LIST,
  BUILDING_UNLOCKS,
  createInitialBuildingLevels,
  getBuildingMaxLevel,
  getBuildingUpgradeCost,
} from "../../../src/data/buildings.ts";

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
  encounterHistory?: Array<Record<string, unknown>>;
  autoExplore?: boolean;
  onboardingCandidates?: Array<Record<string, unknown>>;
  pendingRecruit?: Record<string, unknown> | null;
  pendingOnboardingCityName?: string;
  rngState: CanonicalRngState;
};

type TownCommand = CanonicalGameCommand & { commandId?: string };

export const initialTownState = (rngSeed?: number): TownState => ({
  resources: { gold: 75, food: 50, wood: 20, stone: 0, ore: 0 },
  buildings: createInitialBuildingLevels(),
  citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
  totalCitizensCount: 3, districts: {}, heroes: [], storedItems: [], forgeMaterials: [], itemBlueprints: [], citizenGrowthProgress: 0
  , activeDungeonFloor: 1, activeDungeonRoom: 1, highestFloorReached: 1, currentEncounter: null, encounterHistory: [], autoExplore: false,
  onboardingCandidates: [], pendingOnboardingCityName: ""
  , rngState: initialCanonicalRngState(rngSeed)
});

class TownCommandError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly reason?: string,
  ) {
    super(message);
  }
}
const affordable = (resources: TownResources, cost: TownResources) => Object.keys(cost).every((key) => resources[key as keyof TownResources] >= cost[key as keyof TownResources]);
const subtract = (resources: TownResources, cost: TownResources): TownResources => ({ gold: resources.gold - cost.gold, food: resources.food - cost.food, wood: resources.wood - cost.wood, stone: resources.stone - cost.stone, ore: resources.ore - cost.ore });
const nextSeedKey = (rng: CanonicalRng, scope: string) =>
  `${scope}:${nextCanonicalSubseed(rng).toString(16).padStart(8, "0")}`;

export function applyTownCommand(current: Record<string, unknown>, command: Record<string, unknown>, options: { allowCheats?: boolean } = {}): { state: Record<string, unknown>; events: unknown[] } {
  const town = migrateTownState(current);
  const typed = command as TownCommand;
  const rng = restoreCanonicalRng(town.rngState);
  const withRng = <T extends { state: Record<string, unknown>; events: unknown[] }>(transition: T): T => ({
    ...transition,
    state: { ...transition.state, rngState: rng.snapshot() },
  });
  if (typed.type === "dungeon.explore" || typed.type === "dungeon.select_floor" || typed.type === "dungeon.resolve" || typed.type === "dungeon.auto_explore" || typed.type === "dungeon.retreat") {
    const transition = applyDungeonCommand(
      town,
      command,
      typed.type === "dungeon.resolve" ? forkCanonicalRng(rng) : undefined,
    );
    return withRng(transition);
  }
  const heroes = town.heroes ?? [];
  if (typed.type === "hero.recruit_offer") {
    if ((town as TownState & { pendingRecruit?: unknown }).pendingRecruit) throw new TownCommandError("RECRUIT_PENDING", "a recruit offer is already pending");
    const guildLevel = town.buildings.guilde ?? 0;
    if (guildLevel < 1) throw new TownCommandError("GUILD_REQUIRED", "guild building is required");
    if (heroes.length >= Math.max(0, guildLevel) + 2) throw new TownCommandError("CAPACITY_REACHED", "hero capacity reached");
    const seedKey = nextSeedKey(rng, "recruit");
    const candidate = generateAuthoritativeNovice(
      seedKey,
      `candidate-${typed.commandId ?? "offer"}`,
      "Humain",
    );
    return withRng({ state: { ...town, pendingRecruit: candidate }, events: [{ type: "hero.recruit_offer_created", heroId: candidate.id }] });
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
    const onboardingCandidates = Array.from({ length: 5 }, (_, index) =>
      generateAuthoritativeNovice(
        nextSeedKey(rng, `onboarding:${index + 1}`),
        `candidate-${typed.commandId ?? "onboarding"}-${index + 1}`,
      )
    );
    return withRng({
      state: { ...town, onboardingCandidates, pendingOnboardingCityName: cityName },
      events: [{ type: "onboarding.offer_created", heroIds: onboardingCandidates.map((hero) => hero.id) }],
    });
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
      nextSeedKey(rng, "recruit"),
      id,
    );
    return withRng({ state: { ...town, resources: { ...town.resources, gold: town.resources.gold - cost }, heroes: [...heroes, hero] }, events: [{ type: "hero.recruited", heroId: id, cost }] });
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
    if (!BUILDINGS_LIST.some((building) => building.id === id)) throw new TownCommandError("INVALID_COMMAND", "unknown or unsupported building");
    const level = town.buildings[id] ?? 0;
    if (level >= getBuildingMaxLevel(id)) throw new TownCommandError("MAX_LEVEL", "building reached its maximum level");
    const requirement = BUILDING_UNLOCKS[id];
    for (const [required, requiredLevel] of Object.entries(requirement?.requiredBuildings ?? {})) {
      if ((town.buildings[required] ?? 0) < requiredLevel) throw new TownCommandError("BUILDING_REQUIRED", "building prerequisite is missing");
    }
    if (requirement?.requiredFloor && (town.highestFloorReached ?? 1) < requirement.requiredFloor) {
      throw new TownCommandError("FLOOR_REQUIRED", "dungeon floor prerequisite is missing");
    }
    const cost = getBuildingUpgradeCost(id, level);
    if (!affordable(town.resources, cost)) throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient resources");
    return { state: { ...town, resources: subtract(town.resources, cost), buildings: { ...town.buildings, [id]: level + 1 } }, events: [{ type: "building.upgraded", buildingId: id, level: level + 1 }] };
  }
  if (typed.type === "citizens.allocate") {
    const amount = typed.amount;
    if (!Number.isInteger(amount) || amount === 0 || !(ALLOCATABLE_CITIZEN_ROLES as readonly string[]).includes(typed.role)) throw new TownCommandError("INVALID_COMMAND", "invalid citizen allocation");
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
    throw new TownCommandError("DISTRICTS_DISABLED", "districts are disabled pending redesign");
  }
  throw new TownCommandError("INVALID_COMMAND", "unsupported town command");
}

export function migrateTownState(current: Record<string, unknown>, legacySeed?: number): TownState {
  const defaults = initialTownState();
  const mergeMap = <T extends Record<string, unknown>>(fallback: T, value: unknown): T | unknown =>
    value === undefined
      ? { ...fallback }
      : value !== null && typeof value === "object" && !Array.isArray(value)
        ? { ...fallback, ...(value as Record<string, unknown>) }
        : value;
  const migrated = {
    ...defaults,
    ...current,
    resources: mergeMap(defaults.resources, current.resources),
    buildings: mergeMap(defaults.buildings, current.buildings),
    citizens: mergeMap(defaults.citizens, current.citizens),
    heroes: Array.isArray(current.heroes)
      ? current.heroes.map(migrateAuthoritativeHeroProgression)
      : current.heroes ?? defaults.heroes,
    onboardingCandidates: Array.isArray(current.onboardingCandidates)
      ? current.onboardingCandidates.map(migrateAuthoritativeHeroProgression)
      : current.onboardingCandidates,
    pendingRecruit: current.pendingRecruit
      ? migrateAuthoritativeHeroProgression(current.pendingRecruit)
      : current.pendingRecruit,
    rngState: migrateCanonicalRngState(current.rngState, legacySeed),
  } as TownState;
  const errors = [
    ...validateCanonicalGameState(migrated),
    ...validateAuthoritativeTownState(migrated as unknown as Record<string, unknown>),
    ...validateAuthoritativeHeroes(migrated.heroes),
    ...validateAuthoritativeHeroes(migrated.onboardingCandidates ?? [], "onboardingCandidates"),
    ...(migrated.pendingRecruit
      ? validateAuthoritativeHero(migrated.pendingRecruit, "pendingRecruit")
      : []),
  ];
  if (errors.length > 0) {
    const reason = errors.join("; ");
    throw new TownCommandError(
      "INVALID_GAME_STATE",
      `canonical game state is invalid: ${reason}`,
      reason,
    );
  }
  return migrated;
}

export { TownCommandError };
