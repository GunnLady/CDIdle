export * from "../../shared/domain/dungeon-helpers.ts";

import type { DungeonEncounterType } from "../types.ts";
import * as domain from "../../shared/domain/dungeon-helpers.ts";
import type { Rng } from "../../shared/domain/random.ts";
import { systemRng } from "../domain/random.ts";

export function rollEncounterForgeMaterial(floor: number, rng: Rng = systemRng) {
  return domain.rollEncounterForgeMaterial(floor, rng);
}

export function getRandomDungeonEncounterType(
  rng: Rng = systemRng,
  excludedType?: Exclude<DungeonEncounterType, "fight">,
): DungeonEncounterType {
  return domain.getRandomDungeonEncounterType(rng, excludedType);
}
