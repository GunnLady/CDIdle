import type { Hero } from "../types";
import { recoverRestingGauge } from "../../shared/domain/rest-recovery";

/** Read-only recovery display; server snapshots remain authoritative. */
export function projectRestingHeroes(heroes: Hero[], elapsedSeconds: number): Hero[] {
  const seconds = Math.max(0, Math.floor(elapsedSeconds));
  if (seconds === 0) return heroes;
  return heroes.map((hero) => {
    if (hero.status !== "resting") return hero;
    const currentHp = recoverRestingGauge(hero.currentHp, hero.calculatedStats.maxHp, seconds);
    const currentMana = recoverRestingGauge(hero.currentMana, hero.calculatedStats.maxMana, seconds);
    const fullyRecovered = currentHp === hero.calculatedStats.maxHp
      && currentMana === hero.calculatedStats.maxMana;
    return {
      ...hero,
      currentHp,
      currentMana,
      ...(fullyRecovered ? { status: "idle" as const } : {}),
    };
  });
}
