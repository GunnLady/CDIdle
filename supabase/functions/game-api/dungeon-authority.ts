export type DungeonHero = Record<string, unknown> & { id?: string; currentHp?: number; isActive?: boolean; status?: string; calculatedStats?: Record<string, unknown> };
export type DungeonState = Record<string, unknown> & {
  activeDungeonFloor?: number;
  activeDungeonRoom?: number;
  highestFloorReached?: number;
  heroes?: DungeonHero[];
  resources?: Record<string, number>;
  currentEncounter?: Record<string, unknown> | null;
  autoExplore?: boolean;
};

export type DungeonCommand =
  | { type: "dungeon.explore"; floor: number; commandId?: string }
  | { type: "dungeon.resolve"; commandId?: string }
  | { type: "dungeon.auto_explore"; enabled: boolean; commandId?: string }
  | { type: "dungeon.retreat"; commandId?: string };

export class DungeonCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

type TranscriptEvent = { sequence: number; type: string; [key: string]: unknown };

export type DungeonRng = {
  next(): number;
  nextInt(maxExclusive: number): number;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const hash = (value: string): number => Array.from(value).reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
const commandRng = (seedValue: string): DungeonRng => {
  let state = hash(seedValue) || 1;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  return { next, nextInt: (maxExclusive) => Math.floor(next() * maxExclusive) };
};
const activeHeroes = (heroes: DungeonHero[]) => heroes.filter((hero) => (hero.isActive ?? true) && Number(hero.currentHp ?? 0) > 0);
const heroAttack = (hero: DungeonHero) => Math.max(1, Number(hero.calculatedStats?.physicalDamage ?? hero.calculatedStats?.attack ?? 1));

function progress(state: DungeonState): { floor: number; room: number; highest: number } {
  const floor = Number(state.activeDungeonFloor ?? 1);
  const room = Number(state.activeDungeonRoom ?? 1);
  const highest = Number(state.highestFloorReached ?? floor);
  if (!Number.isInteger(floor) || floor < 1 || !Number.isInteger(room) || room < 1 || room > 50 || !Number.isInteger(highest) || highest < floor) {
    throw new DungeonCommandError("INVALID_DUNGEON_STATE", "dungeon progression is invalid");
  }
  return { floor, room, highest };
}

function advance(floor: number, room: number, highest: number) {
  if (room < 50) return { activeDungeonFloor: floor, activeDungeonRoom: room + 1, highestFloorReached: highest };
  const nextFloor = floor + 1;
  return { activeDungeonFloor: nextFloor, activeDungeonRoom: 1, highestFloorReached: Math.max(highest, nextFloor) };
}

function resolveFight(state: DungeonState, floor: number, room: number, rng: DungeonRng) {
  const heroes = clone(activeHeroes(state.heroes ?? []));
  if (heroes.length === 0) throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");
  let enemyHp = 8 + floor * 2 + rng.nextInt(5);
  const enemyMaxHp = enemyHp;
  const transcript: TranscriptEvent[] = [];
  let sequence = 0;
  let round = 0;
  while (enemyHp > 0 && heroes.some((hero) => Number(hero.currentHp ?? 0) > 0) && round < 100) {
    round += 1;
    for (const hero of heroes) {
      if (Number(hero.currentHp ?? 0) <= 0 || enemyHp <= 0) continue;
      const damage = heroAttack(hero) + rng.nextInt(2);
      enemyHp = Math.max(0, enemyHp - damage);
      transcript.push({ sequence: sequence++, type: "hero.hit", round, heroId: hero.id ?? "unknown", damage, enemyHp });
    }
    if (enemyHp > 0) {
      const target = heroes.find((hero) => Number(hero.currentHp ?? 0) > 0);
      if (target) {
        const damage = 1 + rng.nextInt(2);
        target.currentHp = Math.max(0, Number(target.currentHp ?? 0) - damage);
        transcript.push({ sequence: sequence++, type: "enemy.hit", round, heroId: target.id ?? "unknown", damage, heroHp: target.currentHp });
      }
    }
  }
  if (round >= 100 && enemyHp > 0) throw new DungeonCommandError("COMBAT_LIMIT_REACHED", "combat action limit reached");
  const victory = enemyHp === 0;
  const rewardGold = victory ? 5 + floor : 0;
  const next = victory ? advance(floor, room, Number(state.highestFloorReached ?? floor)) : { activeDungeonFloor: floor, activeDungeonRoom: room, highestFloorReached: Number(state.highestFloorReached ?? floor) };
  const resources = { ...(state.resources ?? {}) };
  resources.gold = Number(resources.gold ?? 0) + rewardGold;
  const forgeMaterials = clone((state.forgeMaterials as Array<{ materialId: string; rarity: string; count: number }> | undefined) ?? []);
  const loot: Array<Record<string, unknown>> = [];
  if (victory && room === 50) {
    const bossMaterial = floor >= 50 ? { materialId: "arcane_core", rarity: "epic", count: 1 } : floor >= 25 ? { materialId: "refined_metal", rarity: "uncommon", count: 2 } : { materialId: "metal_scrap", rarity: "common", count: 4 };
    const existing = forgeMaterials.find((entry) => entry.materialId === bossMaterial.materialId && entry.rarity === bossMaterial.rarity);
    if (existing) existing.count += bossMaterial.count;
    else forgeMaterials.push(bossMaterial);
    loot.push({ type: "material", ...bossMaterial });
  }
  const encounter = { kind: "fight", floor, room, outcome: victory ? "victory" : "defeat", roundCount: round, enemy: { hp: enemyHp, maxHp: enemyMaxHp }, transcript, rewards: { gold: rewardGold, loot } };
  return { state: { ...state, ...next, heroes: state.heroes?.map((hero) => heroes.find((updated) => updated.id === hero.id) ?? hero), resources, forgeMaterials, currentEncounter: null, autoExplore: false }, events: [{ type: "dungeon.encounter_resolved", encounter }] };
}

export function applyDungeonCommand(current: Record<string, unknown>, command: Record<string, unknown>, rng?: DungeonRng): { state: DungeonState; events: unknown[] } {
  const state = clone(current) as DungeonState;
  const typed = command as DungeonCommand;
  const { floor, room, highest } = progress(state);
  if (typed.type === "dungeon.auto_explore") {
    if (typed.enabled && activeHeroes(state.heroes ?? []).length === 0) throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");
    return { state: { ...state, autoExplore: typed.enabled }, events: [{ type: "dungeon.auto_explore_changed", enabled: typed.enabled }] };
  }
  if (typed.type === "dungeon.retreat") {
    if (!state.currentEncounter) throw new DungeonCommandError("NO_ACTIVE_ENCOUNTER", "there is no active encounter");
    return { state: { ...state, currentEncounter: null, autoExplore: false }, events: [{ type: "dungeon.retreat", encounterId: state.currentEncounter.encounterId, floor, room }] };
  }
  if (typed.type === "dungeon.resolve") {
    if (!state.currentEncounter || state.currentEncounter.status !== "active") throw new DungeonCommandError("NO_ACTIVE_ENCOUNTER", "there is no active encounter");
    const commandId = String(state.currentEncounter.commandId ?? typed.commandId ?? "dungeon-command");
    return resolveFight(state, floor, room, rng ?? commandRng(`${commandId}:${floor}:${room}`));
  }
  if (typed.type !== "dungeon.explore" || !Number.isInteger(typed.floor) || typed.floor !== floor || typed.floor > highest) {
    throw new DungeonCommandError("FLOOR_NOT_REACHED", "requested dungeon floor is not available");
  }
  if (state.currentEncounter) throw new DungeonCommandError("ENCOUNTER_ACTIVE", "an encounter is already active");
  const commandId = typed.commandId ?? "dungeon-command";
  const encounterId = `encounter-${commandId}`;
  const currentEncounter = { encounterId, kind: "fight", status: "active", floor, room, commandId };
  return { state: { ...state, currentEncounter, autoExplore: false }, events: [{ type: "dungeon.encounter_started", encounterId, floor, room }] };
}
