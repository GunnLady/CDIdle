import type { CitizenAllocation, Hero, Resources, ResourceRates } from "../types";
import { calculateRates } from "../utils/gameCalculations";

export const MAX_IDLE_SECONDS = 24 * 60 * 60;
const IMMIGRATION_PROGRESS_PER_SECOND = 5;
const IMMIGRATION_FOOD_COST = 1;

export interface IdleState {
  resources: Resources;
  buildings: Record<string, number>;
  citizens: CitizenAllocation;
  totalCitizensCount: number;
  districts: Record<string, boolean>;
  heroes: Hero[];
  citizenGrowthProgress: number;
  lastProcessedAt: number;
}
export interface IdleReport { elapsedSeconds: number; appliedSeconds: number; discardedSeconds: number; resourcesProduced: ResourceRates; foodConsumed: number; citizensAdded: number; heroesRecovered: number; }
export type IdleError = "INVALID_STATE" | "CLOCK_ROLLBACK";
export type IdleResult = { ok: true; state: IdleState; report: IdleReport } | { ok: false; error: IdleError };

function zeroRates(): ResourceRates { return { food: 0, wood: 0, stone: 0, ore: 0 }; }
function cloneState(state: IdleState): IdleState {
  return { ...state, resources: { ...state.resources }, buildings: { ...state.buildings }, citizens: { ...state.citizens }, districts: { ...state.districts }, heroes: state.heroes.map((hero) => ({ ...hero, calculatedStats: { ...hero.calculatedStats } })) };
}
function isValidState(state: IdleState): boolean {
  return Number.isInteger(state.lastProcessedAt) && state.lastProcessedAt >= 0 && Number.isFinite(state.citizenGrowthProgress) && state.citizenGrowthProgress >= 0 && state.citizenGrowthProgress < 100 && Number.isInteger(state.totalCitizensCount) && state.totalCitizensCount >= 0 && Object.values(state.resources).every((value) => Number.isFinite(value) && value >= 0) && Object.values(state.citizens).every((value) => Number.isInteger(value) && value >= 0) && state.heroes.every((hero) => Number.isFinite(hero.currentHp) && Number.isFinite(hero.currentMana));
}

/** Applies city production, immigration and resting-hero recovery once per elapsed interval. */
export function applyIdle(state: IdleState, now: number, hasUser = true): IdleResult {
  if (!isValidState(state) || !Number.isInteger(now) || now < 0) return { ok: false, error: "INVALID_STATE" };
  if (now < state.lastProcessedAt) return { ok: false, error: "CLOCK_ROLLBACK" };
  const elapsedSeconds = now - state.lastProcessedAt;
  const appliedSeconds = Math.min(elapsedSeconds, MAX_IDLE_SECONDS);
  const next = cloneState(state);
  const rates = hasUser ? calculateRates(next.citizens, next.buildings, next.districts, true) : zeroRates();
  const resourcesProduced = { food: rates.food * appliedSeconds, wood: rates.wood * appliedSeconds, stone: rates.stone * appliedSeconds, ore: rates.ore * appliedSeconds };
  next.resources.food += resourcesProduced.food; next.resources.wood += resourcesProduced.wood; next.resources.stone += resourcesProduced.stone; next.resources.ore += resourcesProduced.ore;
  const maxCitizens = Math.max(0, (next.buildings.habitation ?? 0) * 3);
  let foodConsumed = 0; let citizensAdded = 0; let progress = next.citizenGrowthProgress;
  for (let second = 0; second < appliedSeconds && next.totalCitizensCount < maxCitizens; second += 1) {
    if (next.resources.food < IMMIGRATION_FOOD_COST) break;
    next.resources.food -= IMMIGRATION_FOOD_COST; foodConsumed += IMMIGRATION_FOOD_COST; progress += IMMIGRATION_PROGRESS_PER_SECOND;
    if (progress >= 100) { progress -= 100; next.totalCitizensCount += 1; next.citizens.unassigned += 1; citizensAdded += 1; }
  }
  next.citizenGrowthProgress = next.totalCitizensCount < maxCitizens ? progress : 0;
  let heroesRecovered = 0;
  next.heroes = next.heroes.map((hero) => {
    if (hero.status !== "resting" || appliedSeconds === 0) return hero;
    const currentHp = Math.min(hero.calculatedStats.maxHp, hero.currentHp + (6 + (hero.race === "Homme-Lézard" ? 5 : 0)) * appliedSeconds);
    const currentMana = Math.min(hero.calculatedStats.maxMana, hero.currentMana + 5 * appliedSeconds);
    if (currentHp !== hero.currentHp || currentMana !== hero.currentMana) heroesRecovered += 1;
    return { ...hero, currentHp, currentMana };
  });
  next.lastProcessedAt = now;
  return { ok: true, state: next, report: { elapsedSeconds, appliedSeconds, discardedSeconds: elapsedSeconds - appliedSeconds, resourcesProduced, foodConsumed, citizensAdded, heroesRecovered } };
}
