export * from "../../shared/domain/game-calculations.ts";

import type { ArmorItemInfo, Hero, HeroEquipment, HeroStats, WeaponItemInfo } from "../types.ts";
import * as domain from "../../shared/domain/game-calculations.ts";
import type { Rng } from "../../shared/domain/random.ts";
import { systemRng } from "../domain/random.ts";

export const generateNoviceStats = (rng: Rng = systemRng): { stats: HeroStats; isElite: boolean } =>
  domain.generateNoviceStats(rng);
export const getRandomNoviceWeapon = (rng: Rng = systemRng): WeaponItemInfo | null =>
  domain.getRandomNoviceWeapon(rng);
export const getRandomNoviceArmor = (rng: Rng = systemRng): ArmorItemInfo | null =>
  domain.getRandomNoviceArmor(rng);
export const generateNoviceStarterEquipment = (
  rng: Rng = systemRng,
  instanceScope = "local-preview",
): HeroEquipment => domain.generateNoviceStarterEquipment(rng, instanceScope);
export const generateSingleNoviceHero = (
  unlockedRaces: string[] = ["Humain"],
  rng: Rng = systemRng,
): Hero => domain.generateSingleNoviceHero(unlockedRaces, rng);
export function rollWeaponDamage(
  weapon: WeaponItemInfo | null,
  rng: Rng = systemRng,
): number {
  return domain.rollWeaponDamage(weapon, rng);
}
