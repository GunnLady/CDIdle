import { createInitialBuildingLevels } from "../../../shared/data/buildings.ts";
import {
  CURRENT_CANONICAL_STATE_VERSION,
  validateCanonicalGameState,
  type CanonicalGameState,
} from "../../../shared/contracts/authoritative.ts";
import {
  validateAuthoritativeHero,
  validateAuthoritativeHeroes,
} from "../../../shared/domain/authoritative-hero-validation.ts";
import { validateAuthoritativeTownState } from "../../../shared/domain/authoritative-town-validation.ts";
import {
  RARITY_ORDER,
  getItemById,
  getItemHandedness,
  getItemSlot,
  rarityRank,
} from "../../../shared/domain/items/items.ts";
import { initialCanonicalRngState } from "./authoritative-rng.ts";
import { TownCommandError } from "./command-handler.ts";
import { DEFAULT_NOVICE_ITEM_BLUEPRINTS } from "./forge-blueprints.ts";
import { migrateCanonicalState } from "./state-migrations.ts";

export type TownResources = { gold: number; food: number; wood: number; stone: number; ore: number };
export type TownState = CanonicalGameState;

export const initialTownState = (rngSeed?: number): TownState => ({
  stateVersion: CURRENT_CANONICAL_STATE_VERSION,
  resources: { gold: 75, food: 50, wood: 20, stone: 0, ore: 0 },
  buildings: createInitialBuildingLevels(),
  citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
  totalCitizensCount: 3, districts: {}, heroes: [], storedItems: [], forgeMaterials: [], itemBlueprints: DEFAULT_NOVICE_ITEM_BLUEPRINTS.map((entry) => ({ ...entry })), citizenGrowthProgress: 0
  , activeDungeonFloor: 1, activeDungeonRoom: 1, highestFloorReached: 1, currentEncounter: null, encounterHistory: [], autoExplore: false,
  onboardingCandidates: [], pendingOnboardingCityName: "", pendingClassTransitions: []
  , rngState: initialCanonicalRngState(rngSeed)
});

function validateCatalogReferences(state: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const checkModel = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") return undefined;
    const itemId = (value as Record<string, unknown>).itemId;
    if (typeof itemId !== "string") return undefined;
    const model = getItemById(itemId);
    if (!model) errors.push(`${path}.itemId references unknown item ${itemId}`);
    return model;
  };
  const checkInstance = (value: unknown, path: string, slot?: string, heroLevel?: number) => {
    const model = checkModel(value, path);
    if (!model || !value || typeof value !== "object") return model;
    const rarity = (value as Record<string, unknown>).rarity;
    if (typeof rarity === "string" && RARITY_ORDER.includes(rarity as typeof RARITY_ORDER[number])) {
      if (rarityRank(rarity as typeof RARITY_ORDER[number]) < rarityRank(model.minimumRarity)) {
        errors.push(`${path}.rarity is below ${model.id} minimum rarity ${model.minimumRarity}`);
      }
    }
    if (slot && getItemSlot(model) !== slot) {
      errors.push(`${path}.itemId ${model.id} is incompatible with slot ${slot}`);
    }
    if (heroLevel !== undefined && Number.isFinite(heroLevel) && heroLevel < model.requiredLevel) {
      errors.push(`${path}.itemId ${model.id} requires level ${model.requiredLevel}`);
    }
    return model;
  };
  ((state.storedItems as unknown[] | undefined) ?? []).forEach((item, index) => checkInstance(item, `storedItems[${index}]`));
  ((state.itemBlueprints as unknown[] | undefined) ?? []).forEach((item, index) => {
    const model = checkModel(item, `itemBlueprints[${index}]`);
    if (model && (!model.blueprintAvailable || !model.provenances.includes("forge"))) {
      errors.push(`itemBlueprints[${index}].itemId ${model.id} is not forgeable`);
    }
  });
  const pendingModel = checkModel(state.pendingForge, "pendingForge");
  if (pendingModel && state.pendingForge && typeof state.pendingForge === "object") {
    const pending = state.pendingForge as Record<string, unknown>;
    if (typeof pending.recipeId === "string" && pending.recipeId !== pendingModel.id) {
      errors.push(`pendingForge.recipeId ${pending.recipeId} does not match itemId ${pendingModel.id}`);
    }
    if (typeof pending.itemType === "string" && pending.itemType !== pendingModel.itemType) {
      errors.push(`pendingForge.itemType ${pending.itemType} does not match ${pendingModel.id}`);
    }
  }
  const heroGroups = [
    ["heroes", state.heroes],
    ["onboardingCandidates", state.onboardingCandidates],
    ["pendingRecruit", state.pendingRecruit ? [state.pendingRecruit] : []],
  ] as const;
  for (const [groupName, group] of heroGroups) {
    if (!Array.isArray(group)) continue;
    group.forEach((hero, heroIndex) => {
      if (!hero || typeof hero !== "object") return;
      const heroRecord = hero as Record<string, unknown>;
      const equipment = heroRecord.equipment;
      if (!equipment || typeof equipment !== "object") return;
      for (const [slot, item] of Object.entries(equipment as Record<string, unknown>)) {
        checkInstance(item, `${groupName}[${heroIndex}].equipment.${slot}`, slot, Number(heroRecord.level));
      }
      const equipped = equipment as Record<string, unknown>;
      const mainHandRef = equipped.mainHand && typeof equipped.mainHand === "object"
        ? equipped.mainHand as Record<string, unknown>
        : undefined;
      const mainHand = typeof mainHandRef?.itemId === "string" ? getItemById(mainHandRef.itemId) : undefined;
      if (mainHand && equipped.offHand && ["two_handed", "dual_wield"].includes(getItemHandedness(mainHand) ?? "")) {
        errors.push(`${groupName}[${heroIndex}].equipment.offHand conflicts with two-handed mainHand ${mainHand.id}`);
      }
    });
  }
  return errors;
}

export function migrateTownState(current: Record<string, unknown>, legacySeed?: number): TownState {
  const migrated = migrateCanonicalState(current, {
    defaults: initialTownState(),
    legacySeed,
  });
  const canonicalErrors = validateCanonicalGameState(migrated);
  if (canonicalErrors.length > 0) {
    const reason = canonicalErrors.join("; ");
    throw new TownCommandError(
      "INVALID_GAME_STATE",
      `canonical game state is invalid: ${reason}`,
      reason,
    );
  }
  const errors = [
    ...validateAuthoritativeTownState(migrated as unknown as Record<string, unknown>),
    ...validateAuthoritativeHeroes(migrated.heroes),
    ...validateAuthoritativeHeroes(migrated.onboardingCandidates ?? [], "onboardingCandidates"),
    ...(migrated.pendingRecruit
      ? validateAuthoritativeHero(migrated.pendingRecruit, "pendingRecruit")
      : []),
    ...validateCatalogReferences(migrated as unknown as Record<string, unknown>),
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
