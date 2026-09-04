import type { CanonicalItemBlueprint } from "../../../shared/contracts/authoritative.ts";
import { LEGACY_ITEM_EVOLUTION_TARGETS } from "../../../shared/domain/items/items.ts";

export const DEFAULT_NOVICE_ITEM_BLUEPRINTS: CanonicalItemBlueprint[] = [
  { itemId: "progression_sword", unlocked: true },
  { itemId: "progression_dagger", unlocked: true },
  { itemId: "progression_axe", unlocked: true },
  { itemId: "progression_shield", unlocked: true },
  { itemId: "progression_cloth_armor", unlocked: true },
  { itemId: "progression_leather_armor", unlocked: true },
];

/** Every historical plan unlocks its complete level-bands-v1 family. */
export const LEGACY_BLUEPRINT_EVOLUTION_TARGETS: Readonly<Record<string, string>> = LEGACY_ITEM_EVOLUTION_TARGETS;

/** Compatibility export for callers introduced with canonical state v4. */
export const LEGACY_NOVICE_BLUEPRINT_REPLACEMENTS = LEGACY_BLUEPRINT_EVOLUTION_TARGETS;
