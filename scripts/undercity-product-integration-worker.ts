import assert from "node:assert/strict";
import { applyDungeonCommand } from "../supabase/functions/game-api/dungeon-authority.ts";
import type { CanonicalGameState } from "../shared/contracts/authoritative.ts";
import type { Hero } from "../shared/contracts/game.ts";
import type { AuthoritativeDungeonEncounter } from "../shared/domain/authoritative-dungeon.ts";
import { initialTownState } from "../supabase/functions/game-api/town-authority.ts";
import { calculateXpNeeded } from "../shared/domain/hero-xp.ts";
import { createUndercityProgress } from "../shared/domain/undercity-progression.ts";
import { UNDERCITY_DUNGEON_ID, UNDERCITY_ZONES } from "../shared/domain/undercity.ts";
import { getDungeonRoomCount } from "../shared/domain/dungeon-progression.ts";
import { makeHero } from "../tests/fixtures/game.ts";

const workerArg = process.argv.find((argument) => argument.startsWith("--worker="));

class ScriptedRng {
  private state: number;
  private readonly values: number[];

  constructor(seed: number, values: number[] = []) {
    this.state = seed >>> 0 || 1;
    this.values = [...values];
  }
  random() {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0 || 1;
    return this.state / 0x1_0000_0000;
  }
  next() { return this.values.length > 0 ? this.values.shift() : this.random(); }
  nextInt(maxExclusive: number) { return Math.min(maxExclusive - 1, Math.floor(this.random() * maxExclusive)); }
}

function campaignHero(id: string, aoe = true) {
  const maxHp = 1_000_000;
  return makeHero({
    id,
    name: "Éclaireur produit",
    classType: "Guerrier",
    level: 40,
    xp: 0,
    xpNeeded: calculateXpNeeded(41, "Guerrier"),
    currentHp: maxHp,
    currentMana: 1_000_000,
    activeSkills: aoe ? ["cleaving_strike"] : [],
    calculatedStats: {
      ...makeHero().calculatedStats,
      maxHp,
      hp: maxHp,
      maxMana: 1_000_000,
      mana: 1_000_000,
      physicalDamage: 1_000_000,
      physicalDefense: 100_000,
      magicDefense: 100_000,
      speed: 100,
    },
  });
}

function stateAt(seed: number, hero: Hero, floor: number, completedFloor = floor - 1) {
  const state = initialTownState(seed);
  state.heroes = [hero];
  state.highestFloorReached = Math.max(1, floor);
  state.dungeonProgress = createUndercityProgress([hero.id], completedFloor);
  state.dungeonProgress.expedition.floor = floor;
  state.dungeonProgress.expedition.room = 1;
  state.activeDungeonFloor = floor;
  state.activeDungeonRoom = 1;
  state.autoExplore = false;
  return state;
}

function resolveCurrent(state: CanonicalGameState, seed: number, entropy: number, commandId: string) {
  const started = applyDungeonCommand(state, {
    type: "dungeon.explore",
    dungeonId: UNDERCITY_DUNGEON_ID,
    floor: state.activeDungeonFloor,
    commandId,
  });
  const resolved = applyDungeonCommand(started.state, { type: "dungeon.resolve", dungeonId: UNDERCITY_DUNGEON_ID }, new ScriptedRng(seed, [0, entropy]));
  const encounter = resolved.events.find((event) => event.type === "dungeon.encounter_resolved")?.encounter as AuthoritativeDungeonEncounter | undefined;
  assert(encounter, "La résolution autoritaire doit publier la rencontre résolue");
  return { ...resolved, encounter };
}

function runWorker(index: number) {
  const seed = 0x6d2b79f5 + index;
  const sizesByZone: Record<string, number[]> = {};
  let aoeTargetEvents = 0;
  let ordinaryRewards = 0;
  for (const [zoneIndex, zone] of UNDERCITY_ZONES.entries()) {
    const observed = new Set<number>();
    for (const size of [1, 2, 3]) {
      const encounterIndex = zone.encounters.findIndex((encounter) => encounter.members.length === size);
      const fixed = zone.elite.members.length === size ? "elite" : zone.boss.members.length === size ? "boss" : null;
      assert(encounterIndex >= 0 || fixed, `${zone.id} ne contient pas de rencontre à ${size} ennemi(s)`);
      const entropy = encounterIndex >= 0 ? (encounterIndex + 0.25) / zone.encounters.length : 0.5;
      const floor = encounterIndex >= 0 ? zone.floorMin : fixed === "elite" ? zone.floorMin + 4 : zone.floorMax;
      const sampleState = stateAt(seed, campaignHero(`hero-${index}-${zone.id}-${size}`), floor);
      if (encounterIndex < 0) {
        sampleState.activeDungeonRoom = getDungeonRoomCount(floor);
        sampleState.dungeonProgress.expedition.room = sampleState.activeDungeonRoom;
      }
      const resolution = resolveCurrent(sampleState, seed + zoneIndex * 17 + size, entropy, `sample-${index}-${zone.id}-${size}`);
      assert.equal(resolution.encounter.outcome, "victory");
      observed.add(resolution.encounter.enemies?.length ?? 0);
      const aoeTargets = new Set(resolution.encounter.transcript.filter((event) => event.type === "hero.skill.damage" && event.skillId === "cleaving_strike").map((event) => event.monsterId));
      if (aoeTargets.size > 1) aoeTargetEvents += 1;
      ordinaryRewards += resolution.encounter.rewards.loot.filter((loot) => loot.type === "item").length;
    }
    sizesByZone[zone.id] = [...observed].sort();
  }

  const weak = makeHero({
    id: `weak-${index}`,
    currentHp: 1,
    calculatedStats: { ...makeHero().calculatedStats, physicalDamage: 0, physicalDefense: 0, magicDefense: 0 },
  });
  const wipe = resolveCurrent(stateAt(seed + 101, weak, 1), seed + 101, 0.05, `wipe-${index}`);
  assert.equal(wipe.encounter.outcome, "defeat");
  assert.equal(wipe.state.dungeonProgress.expedition.halted, true);

  const kingHero = campaignHero(`king-${index}`);
  const kingRoom = getDungeonRoomCount(50);
  const kingState = stateAt(seed + 202, kingHero, 50, 49);
  kingState.activeDungeonRoom = kingRoom;
  kingState.dungeonProgress.expedition.room = kingRoom;
  const king = resolveCurrent(kingState, seed + 202, 0.5, `king-${index}`);
  assert.equal(king.encounter.outcome, "victory");
  assert.equal(king.state.activeDungeonFloor, 50);
  assert.equal(king.state.highestFloorReached, 50);

  let farmState = stateAt(seed + 303, campaignHero(`farm-${index}`), 50, 50);
  farmState = applyDungeonCommand(farmState, { type: "dungeon.select_farm_zone", dungeonId: UNDERCITY_DUNGEON_ID, zoneId: "sewers" }).state;
  let farmEncounters = 0;
  let farmLoot = 0;
  while (farmEncounters < 300) {
    const floor = farmState.activeDungeonFloor;
    const room = farmState.activeDungeonRoom;
    const resolution = resolveCurrent(farmState, seed + 400 + farmEncounters, 0.4, `farm-${index}-${farmEncounters}`);
    farmState = resolution.state;
    farmEncounters += 1;
    farmLoot += resolution.encounter.rewards.loot.length;
    if (floor === 10 && room === getDungeonRoomCount(10)) break;
  }
  assert.equal(farmState.dungeonProgress.expedition.mode, "farm");
  assert.equal(farmState.activeDungeonFloor, 1);
  assert.equal(farmState.activeDungeonRoom, 1);

  return { seed, sizesByZone, aoeTargetEvents, ordinaryRewards, wipe: true, kingCapped: true, farmEncounters, farmLoot };
}

const workerIndex = Number(workerArg?.split("=")[1]);
assert(Number.isInteger(workerIndex) && workerIndex >= 0, "--worker=<index> est requis");
const report = runWorker(workerIndex);
console.log("[UNDERCITY_PRODUCT_RESULT]" + Buffer.from(JSON.stringify(report)).toString("base64"));