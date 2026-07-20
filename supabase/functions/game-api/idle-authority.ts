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
};

export class IdleCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const number = (value: unknown, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback;
const zeroRates = () => ({ food: 0, wood: 0, stone: 0, ore: 0 });

function rates(state: Record<string, unknown>) {
  const citizens = (state.citizens as Record<string, unknown> | undefined) ?? {};
  const buildings = (state.buildings as Record<string, unknown> | undefined) ?? {};
  const districts = (state.districts as Record<string, unknown> | undefined) ?? {};
  const multiplier = 1 + number(buildings.maison_chef) * 0.03;
  return {
    food: number(citizens.farmers) * number(buildings.ferme) * multiplier * (districts.quartier_ferme ? 1.25 : 1),
    wood: number(citizens.woodcutters) * number(buildings.scierie) * multiplier * (districts.quartier_bois ? 1.2 : 1),
    stone: number(citizens.quarrymen) * number(buildings.carriere) * multiplier,
    ore: number(citizens.miners) * number(buildings.mine) * multiplier * (districts.quartier_mine ? 1.2 : 1),
  };
}

/** Server-side idle transition. Timestamps at the API boundary are ISO strings. */
export function applyIdleAuthority(
  current: Record<string, unknown>,
  lastProcessedAt: string,
  now = new Date(),
): { state: Record<string, unknown>; lastProcessedAt: string; report: IdleReport } {
  const previous = Date.parse(lastProcessedAt);
  const timestamp = now.getTime();
  if (!Number.isFinite(previous) || !Number.isFinite(timestamp)) throw new IdleCommandError("INVALID_IDLE_CLOCK", "idle timestamps are invalid");
  if (timestamp < previous) throw new IdleCommandError("CLOCK_ROLLBACK", "server clock moved backwards");

  const elapsedSeconds = Math.floor((timestamp - previous) / 1000);
  const appliedSeconds = Math.min(elapsedSeconds, MAX_IDLE_SECONDS);
  const next = clone(current);
  const resources = { food: 0, wood: 0, stone: 0, ore: 0, ...((next.resources as Record<string, number> | undefined) ?? {}) };
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

  const citizens = { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 0, ...((next.citizens as Record<string, number> | undefined) ?? {}) };
  const buildings = (next.buildings as Record<string, number> | undefined) ?? {};
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
  const heroes = ((next.heroes as Array<Record<string, unknown>> | undefined) ?? []).map((hero) => {
    if (hero.status !== "resting" || appliedSeconds === 0) return hero;
    const stats = (hero.calculatedStats as Record<string, number> | undefined) ?? {};
    const maxHp = number(stats.maxHp, number(hero.currentHp));
    const maxMana = number(stats.maxMana, number(hero.currentMana));
    const raceBonus = hero.race === "Homme-Lézard" ? 5 : 0;
    const currentHp = Math.min(maxHp, number(hero.currentHp) + (6 + raceBonus) * appliedSeconds);
    const currentMana = Math.min(maxMana, number(hero.currentMana) + 5 * appliedSeconds);
    if (currentHp !== number(hero.currentHp) || currentMana !== number(hero.currentMana)) heroesRecovered += 1;
    return { ...hero, currentHp, currentMana };
  });

  next.resources = resources;
  next.citizens = citizens;
  next.totalCitizensCount = totalCitizens;
  next.citizenGrowthProgress = totalCitizens < maxCitizens ? progress : 0;
  next.heroes = heroes;
  return {
    state: next,
    lastProcessedAt: new Date(timestamp).toISOString(),
    report: { elapsedSeconds, appliedSeconds, discardedSeconds: elapsedSeconds - appliedSeconds, resourcesProduced, foodConsumed, citizensAdded, heroesRecovered },
  };
}
