import { recoverRestingGauge } from "../../../shared/domain/rest-recovery.ts";
import type { CanonicalGameState } from "../../../shared/contracts/authoritative.ts";

export const MAX_IDLE_SECONDS = 24 * 60 * 60;
const IMMIGRATION_PROGRESS_PER_SECOND = 5;

export type IdleReport = {
  elapsedSeconds: number;
  appliedSeconds: number;
  discardedSeconds: number;
  resourcesProduced: { food: number; wood: number; stone: number; ore: number };
  foodConsumed: number;
  citizensAdded: number;
  heroesRecovered: number;
  heroesFullyRecovered: number;
};

export class IdleCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const number = (value: unknown, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback;
const zeroRates = () => ({ food: 0, wood: 0, stone: 0, ore: 0 });

function rates(state: CanonicalGameState) {
  const citizens = state.citizens;
  const buildings = state.buildings;
  const multiplier = 1 + number(buildings.maison_chef) * 0.03;
  return {
    food: number(citizens.farmers) * number(buildings.ferme) * multiplier,
    wood: number(citizens.woodcutters) * number(buildings.scierie) * multiplier,
    stone: number(citizens.quarrymen) * number(buildings.carriere) * multiplier,
    ore: number(citizens.miners) * number(buildings.mine) * multiplier,
  };
}

/** Server-side idle transition. Timestamps at the API boundary are ISO strings. */
export function applyIdleAuthority(
  current: CanonicalGameState,
  lastProcessedAt: string,
  now = new Date(),
): { state: CanonicalGameState; lastProcessedAt: string; report: IdleReport } {
  const previous = Date.parse(lastProcessedAt);
  const timestamp = now.getTime();
  if (!Number.isFinite(previous) || !Number.isFinite(timestamp)) throw new IdleCommandError("INVALID_IDLE_CLOCK", "idle timestamps are invalid");
  if (timestamp < previous) throw new IdleCommandError("CLOCK_ROLLBACK", "server clock moved backwards");

  const elapsedSeconds = Math.floor((timestamp - previous) / 1000);
  const appliedSeconds = Math.min(elapsedSeconds, MAX_IDLE_SECONDS);
  const processedTimestamp = previous + elapsedSeconds * 1000;
  const next = clone(current);
  const resources = { ...next.resources };
  const produced = elapsedSeconds === 0 ? zeroRates() : rates(next);
  const resourcesProduced = {
    food: produced.food * appliedSeconds,
    wood: produced.wood * appliedSeconds,
    stone: produced.stone * appliedSeconds,
    ore: produced.ore * appliedSeconds,
  };
  resources.food += resourcesProduced.food;
  resources.wood += resourcesProduced.wood;
  resources.stone += resourcesProduced.stone;
  resources.ore += resourcesProduced.ore;

  const citizens = { ...next.citizens };
  const buildings = next.buildings;
  const maxCitizens = Math.max(0, number(buildings.habitation) * 3);
  let totalCitizens = number(next.totalCitizensCount);
  let progress = number(next.citizenGrowthProgress);
  let foodConsumed = 0;
  let citizensAdded = 0;
  for (let second = 0; second < appliedSeconds && totalCitizens < maxCitizens; second += 1) {
    if (resources.food < 1) break;
    resources.food -= 1;
    foodConsumed += 1;
    progress += IMMIGRATION_PROGRESS_PER_SECOND;
    if (progress >= 100) {
      progress -= 100;
      totalCitizens += 1;
      citizens.unassigned += 1;
      citizensAdded += 1;
    }
  }

  let heroesRecovered = 0;
  let heroesFullyRecovered = 0;
  const heroes = next.heroes.map((hero) => {
    if (hero.status !== "resting" || appliedSeconds === 0) return hero;
    const stats = hero.calculatedStats;
    const maxHp = number(stats.maxHp, number(hero.currentHp));
    const maxMana = number(stats.maxMana, number(hero.currentMana));
    const currentHp = recoverRestingGauge(number(hero.currentHp), maxHp, appliedSeconds);
    const currentMana = recoverRestingGauge(number(hero.currentMana), maxMana, appliedSeconds);
    if (currentHp !== number(hero.currentHp) || currentMana !== number(hero.currentMana)) heroesRecovered += 1;
    const fullyRecovered = currentHp === maxHp && currentMana === maxMana;
    if (fullyRecovered) heroesFullyRecovered += 1;
    return { ...hero, currentHp, currentMana, ...(fullyRecovered ? { status: "idle" as const } : {}) };
  });

  next.resources = resources;
  next.citizens = citizens;
  next.totalCitizensCount = totalCitizens;
  next.citizenGrowthProgress = totalCitizens < maxCitizens ? progress : 0;
  next.heroes = heroes;
  return {
    state: next,
    // PostgreSQL timestamps may contain microseconds that Date cannot represent.
    // Preserve the original value when no whole second elapsed so a rapid
    // command never moves the temporal cursor backwards by a fraction of a ms.
    lastProcessedAt: elapsedSeconds === 0 ? lastProcessedAt : new Date(processedTimestamp).toISOString(),
    report: { elapsedSeconds, appliedSeconds, discardedSeconds: elapsedSeconds - appliedSeconds, resourcesProduced, foodConsumed, citizensAdded, heroesRecovered, heroesFullyRecovered },
  };
}
