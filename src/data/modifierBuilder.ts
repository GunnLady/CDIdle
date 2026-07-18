import { Modifier, ModifierType } from "../types";

export interface RawModifierInput {
  stat: string;
  value: number;
  type?: ModifierType;
}

/**
 * Creates a single Modifier object.
 * Defaults to "flat" if type is omitted.
 */
export function createModifier(
  stat: string,
  value: number,
  type: ModifierType = "flat"
): Modifier {
  return {
    stat,
    type,
    value,
  };
}

/**
 * Creates an array of Modifier objects from raw inputs.
 * Defaults type to "flat" if omitted.
 */
export function createModifiers(
  mods: RawModifierInput[]
): Modifier[] {
  return mods.map((m) => ({
    stat: m.stat,
    type: m.type || "flat",
    value: m.value,
  }));
}

/**
 * Helper to quickly create a flat modifier.
 */
export function flatModifier(stat: string, value: number): Modifier {
  return createModifier(stat, value, "flat");
}

/**
 * Helper to quickly create a percent modifier.
 */
export function percentModifier(stat: string, value: number): Modifier {
  return createModifier(stat, value, "percent");
}
