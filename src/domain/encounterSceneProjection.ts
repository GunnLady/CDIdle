import type {
  CanonicalDungeonInitialHeroActor,
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonLoot,
  CanonicalDungeonTranscriptEvent,
} from "../../shared/contracts/authoritative";

export type EncounterSceneTeam = "heroes" | "enemies";
export type EncounterSceneResult = CanonicalDungeonEncounterRecord["outcome"];
export type EncounterSceneImpactKind =
  | "damage"
  | "healing"
  | "recovery"
  | "resource"
  | "defeat"
  | "dodge"
  | "state";

export interface EncounterSceneActor {
  id: string;
  sourceId: string | null;
  team: EncounterSceneTeam;
  slot: number;
  name: string;
  visualKey: string | null;
  contentKey: string | null;
  currentHp: number | null;
  maximumHp: number | null;
  currentMana: number | null;
  maximumMana: number | null;
  knockedOut: boolean | null;
}

export interface EncounterSceneResourceChange {
  before: number | null;
  after: number | null;
  maximum: number | null;
}

export interface EncounterSceneImpact {
  id: string;
  kind: EncounterSceneImpactKind;
  sourceActorId: string | null;
  targetActorId: string;
  announcedValue: number | null;
  appliedValue: number | null;
  hp: EncounterSceneResourceChange | null;
  mana: EncounterSceneResourceChange | null;
  knockedOutAfter: boolean | null;
}

export type EncounterSceneRewardKind = CanonicalDungeonLoot["type"] | "gold" | "gold-loss" | "empty";

export interface EncounterSceneReward {
  kind: EncounterSceneRewardKind;
  amount: number;
  contentId: string | null;
  name: string | null;
  rarity: string | null;
}

export interface EncounterSceneStep {
  id: string;
  actionId: string;
  index: number;
  sequence: number;
  round: number | null;
  type: string;
  category: CanonicalDungeonTranscriptEvent["category"] | null;
  summary: string;
  sourceActorId: string | null;
  targetActorIds: string[];
  impacts: EncounterSceneImpact[];
  rewards: EncounterSceneReward[];
  projection: "structured" | "summary";
  result: EncounterSceneResult | null;
}

export interface EncounterSceneTimeline {
  encounterId: string;
  actors: EncounterSceneActor[];
  steps: EncounterSceneStep[];
  outcome: EncounterSceneResult;
  finalEnemyStates: Array<{
    actorId: string;
    currentHp: number;
    maximumHp: number;
  }>;
  finalRewards: EncounterSceneReward[];
  limitations: string[];
}

export interface EncounterSceneState {
  encounterId: string;
  visibleCount: number;
  complete: boolean;
  actors: EncounterSceneActor[];
  activeStep: EncounterSceneStep | null;
  result: EncounterSceneResult | null;
  rewards: EncounterSceneReward[];
  limitations: string[];
}

export interface EncounterSceneCursor {
  visibleCount: number;
  complete: boolean;
}

type MutableActor = EncounterSceneActor;
type UnknownRecord = Record<string, unknown>;

const RESULT_BY_EVENT_TYPE: Readonly<Record<string, EncounterSceneResult>> = {
  "encounter.victory": "victory",
  "encounter.defeat": "defeat",
  "challenge.succeeded": "victory",
  "challenge.failed": "defeat",
  "treasure.opened": "victory",
  "party.restored": "victory",
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function neutralActorName(team: EncounterSceneTeam, slot: number): string {
  return `${team === "heroes" ? "Héros" : "Ennemi"} ${slot + 1}`;
}

function actorId(encounterId: string, team: EncounterSceneTeam, sourceId: string | null, slot: number): string {
  const identity = sourceId ? encodeURIComponent(sourceId) : `slot-${slot}`;
  return `${encounterId}:actor:${team}:${identity}`;
}

function cloneActor(actor: EncounterSceneActor): EncounterSceneActor {
  return { ...actor };
}

function eventSequence(event: CanonicalDungeonTranscriptEvent, index: number): number {
  return Number.isInteger(event.sequence) && event.sequence >= 0 ? event.sequence : index;
}

function eventSummary(event: CanonicalDungeonTranscriptEvent): string {
  const message = nonEmptyString(event.message);
  if (message) return message;
  const type = nonEmptyString(event.type) ?? "inconnu";
  return `Événement ${type} sans résumé historique.`;
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function rewardView(
  kind: EncounterSceneRewardKind,
  amount: unknown,
  input: UnknownRecord = {},
): EncounterSceneReward {
  return {
    kind,
    amount: finiteNumber(amount) ?? 1,
    contentId: nonEmptyString(input.itemId ?? input.materialId),
    name: nonEmptyString(input.itemName ?? input.name),
    rarity: nonEmptyString(input.rarity),
  };
}

function rewardForEvent(event: CanonicalDungeonTranscriptEvent): EncounterSceneReward[] {
  const data = event as UnknownRecord;
  const goldLost = finiteNumber(event.goldLost);
  if (goldLost !== null && goldLost > 0) return [rewardView("gold-loss", goldLost)];
  if (event.treasureOutcome === "empty") return [rewardView("empty", 0)];
  if (!event.type.startsWith("reward.")) return [];
  if (event.type.endsWith(".none")) return [rewardView("empty", 0)];
  if (finiteNumber(event.gold) !== null) return [rewardView("gold", event.gold, data)];
  if (nonEmptyString(event.materialId)) return [rewardView("material", event.count, data)];
  if (nonEmptyString(event.itemId)) return [rewardView(event.type.includes("blueprint") ? "blueprint" : "item", event.count, data)];
  return [];
}

function finalRewardsForEncounter(encounter: CanonicalDungeonEncounterRecord): EncounterSceneReward[] {
  const received = encounter.transcript.flatMap(rewardForEvent);
  const rewards = encounter.rewards.loot.map((loot) => {
    const data = loot as unknown as UnknownRecord;
    const reward = rewardView(
      loot.type,
      loot.count,
      data,
    );
    const historicalName = received.find((candidate) => (
      candidate.kind === reward.kind
      && candidate.contentId === reward.contentId
      && candidate.name
    ))?.name;
    return historicalName ? { ...reward, name: historicalName } : reward;
  });
  if (encounter.rewards.gold > 0) {
    rewards.unshift(rewardView("gold", encounter.rewards.gold));
  }
  return rewards;
}

function collectHistoricalNames(
  encounter: CanonicalDungeonEncounterRecord,
  currentHeroNames: ReadonlyMap<string, string>,
): { heroes: Map<string, string>; enemies: Map<string, string> } {
  const heroes = new Map(currentHeroNames);
  const enemies = new Map<string, string>();
  for (const enemy of encounter.enemies ?? []) enemies.set(enemy.id, enemy.name);
  if (encounter.enemy?.id && encounter.enemy.name) enemies.set(encounter.enemy.id, encounter.enemy.name);

  const remember = (map: Map<string, string>, id: unknown, name: unknown) => {
    const resolvedId = nonEmptyString(id);
    const resolvedName = nonEmptyString(name);
    if (resolvedId && resolvedName) map.set(resolvedId, resolvedName);
  };
  for (const event of encounter.transcript) {
    remember(heroes, event.heroId, event.heroName);
    remember(heroes, event.targetHeroId, event.targetHeroName);
    remember(enemies, event.monsterId, event.monsterName);
    remember(enemies, event.targetMonsterId, event.targetMonsterName);
    for (const change of [...records(event.heroChanges), ...records(event.heroes)]) {
      remember(heroes, change.heroId, change.heroName);
    }
  }
  return { heroes, enemies };
}

export function getEncounterPlaybackTranscript(encounter: CanonicalDungeonEncounterRecord) {
  return encounter.transcript.filter((event) => event.type !== "enemy.intent");
}

function actionSignature(event: CanonicalDungeonTranscriptEvent): string | null {
  const round = finiteNumber(event.round);
  if (event.type.startsWith("hero.skill.")) {
    const heroId = nonEmptyString(event.heroId);
    const skillId = nonEmptyString(event.skillId);
    return round !== null && heroId && skillId
      ? `hero.skill:${round}:${heroId}:${skillId}`
      : null;
  }
  const strikeCount = finiteNumber(event.strikeCount);
  if (strikeCount === null || strikeCount <= 1 || round === null) return null;
  if (event.type === "hero.hit" || event.type === "hero.hit.critical") {
    const heroId = nonEmptyString(event.heroId);
    return heroId ? `hero.attack:${round}:${heroId}` : null;
  }
  if (event.type === "enemy.hit" || event.type === "enemy.dodged" || event.type === "hero.defeated") {
    const monsterId = nonEmptyString(event.monsterId);
    return monsterId ? `enemy.attack:${round}:${monsterId}` : null;
  }
  return null;
}

function resultForEvent(event: CanonicalDungeonTranscriptEvent): EncounterSceneResult | null {
  return RESULT_BY_EVENT_TYPE[event.type] ?? null;
}

function buildActors(
  encounter: CanonicalDungeonEncounterRecord,
  currentHeroNames: ReadonlyMap<string, string>,
): {
  actors: MutableActor[];
  heroActorsBySource: Map<string, MutableActor>;
  enemyActorsBySource: Map<string, MutableActor>;
  finalEnemyStates: EncounterSceneTimeline["finalEnemyStates"];
} {
  const names = collectHistoricalNames(encounter, currentHeroNames);
  const actors: MutableActor[] = [];
  const heroActorsBySource = new Map<string, MutableActor>();
  const enemyActorsBySource = new Map<string, MutableActor>();
  const initial = encounter.initialActors;

  const addHero = (sourceId: string, values?: CanonicalDungeonInitialHeroActor) => {
    const existing = heroActorsBySource.get(sourceId);
    if (existing) return existing;
    const slot = actors.filter((actor) => actor.team === "heroes").length;
    const tuple = values as readonly unknown[] | undefined;
    const actor: MutableActor = {
      id: actorId(encounter.encounterId, "heroes", sourceId, slot),
      sourceId,
      team: "heroes",
      slot,
      name: names.heroes.get(sourceId) ?? neutralActorName("heroes", slot),
      visualKey: nonEmptyString(tuple?.[1]),
      contentKey: null,
      currentHp: finiteNumber(tuple?.[2]),
      maximumHp: finiteNumber(tuple?.[3]),
      currentMana: finiteNumber(tuple?.[4]),
      maximumMana: finiteNumber(tuple?.[5]),
      knockedOut: tuple?.[6] === 0 ? false : tuple?.[6] === 1 ? true : null,
    };
    actors.push(actor);
    heroActorsBySource.set(sourceId, actor);
    return actor;
  };

  for (const hero of initial?.h ?? []) addHero(hero[0], hero);

  const finalEnemies = encounter.enemies ?? [];
  const initialEnemies = initial?.e ?? [];
  const enemyCount = Math.max(finalEnemies.length, initialEnemies.length);
  for (let slot = 0; slot < enemyCount; slot += 1) {
    const finalEnemy = finalEnemies[slot];
    const initialEnemy = initialEnemies[slot];
    const sourceId = finalEnemy?.id ?? null;
    const memberKey = initialEnemy?.[0] ?? null;
    const contentKey = initial?.b && memberKey ? `${initial.b}:${memberKey}` : null;
    const actor: MutableActor = {
      id: actorId(encounter.encounterId, "enemies", sourceId ?? contentKey, slot),
      sourceId,
      team: "enemies",
      slot,
      name: finalEnemy?.name ?? (sourceId ? names.enemies.get(sourceId) : undefined) ?? neutralActorName("enemies", slot),
      visualKey: null,
      contentKey,
      currentHp: finiteNumber(initialEnemy?.[1]),
      maximumHp: finiteNumber(initialEnemy?.[2]) ?? finiteNumber(finalEnemy?.maxHp),
      currentMana: null,
      maximumMana: null,
      knockedOut: initialEnemy ? initialEnemy[1] <= 0 : null,
    };
    actors.push(actor);
    if (sourceId) enemyActorsBySource.set(sourceId, actor);
  }

  const transcriptEnemyIds = encounter.transcript
    .flatMap((event) => [nonEmptyString(event.monsterId), nonEmptyString(event.targetMonsterId)])
    .filter((id): id is string => id !== null);
  if (finalEnemies.length === 0 && encounter.enemy) {
    const inferredId = encounter.enemy.id ?? (new Set(transcriptEnemyIds).size === 1 ? transcriptEnemyIds[0] : null);
    const slot = actors.filter((actor) => actor.team === "enemies").length;
    const actor: MutableActor = {
      id: actorId(encounter.encounterId, "enemies", inferredId, slot),
      sourceId: inferredId,
      team: "enemies",
      slot,
      name: encounter.enemy.name ?? (inferredId ? names.enemies.get(inferredId) : undefined) ?? neutralActorName("enemies", slot),
      visualKey: null,
      contentKey: null,
      currentHp: null,
      maximumHp: finiteNumber(encounter.enemy.maxHp),
      currentMana: null,
      maximumMana: null,
      knockedOut: null,
    };
    actors.push(actor);
    if (inferredId) enemyActorsBySource.set(inferredId, actor);
  }

  const ensureHero = (id: unknown, maximumHp?: unknown) => {
    const sourceId = nonEmptyString(id);
    if (!sourceId) return null;
    const actor = addHero(sourceId);
    actor.maximumHp ??= finiteNumber(maximumHp);
    return actor;
  };
  const ensureEnemy = (id: unknown, maximumHp?: unknown) => {
    const sourceId = nonEmptyString(id);
    if (!sourceId) return null;
    const existing = enemyActorsBySource.get(sourceId);
    if (existing) {
      existing.maximumHp ??= finiteNumber(maximumHp);
      return existing;
    }
    const slot = actors.filter((actor) => actor.team === "enemies").length;
    const actor: MutableActor = {
      id: actorId(encounter.encounterId, "enemies", sourceId, slot),
      sourceId,
      team: "enemies",
      slot,
      name: names.enemies.get(sourceId) ?? neutralActorName("enemies", slot),
      visualKey: null,
      contentKey: null,
      currentHp: null,
      maximumHp: finiteNumber(maximumHp),
      currentMana: null,
      maximumMana: null,
      knockedOut: null,
    };
    actors.push(actor);
    enemyActorsBySource.set(sourceId, actor);
    return actor;
  };

  for (const event of encounter.transcript) {
    ensureHero(event.heroId, event.heroMaxHp);
    ensureHero(event.targetHeroId, event.heroMaxHp);
    ensureEnemy(event.monsterId, event.enemyMaxHp);
    ensureEnemy(event.targetMonsterId, event.enemyMaxHp);
    for (const change of [...records(event.heroChanges), ...records(event.heroes)]) {
      ensureHero(change.heroId);
    }
  }

  const finalEnemyStates: EncounterSceneTimeline["finalEnemyStates"] = [];
  for (const enemy of finalEnemies) {
    const actor = enemyActorsBySource.get(enemy.id);
    if (actor) finalEnemyStates.push({ actorId: actor.id, currentHp: enemy.hp, maximumHp: enemy.maxHp });
  }
  if (finalEnemies.length === 0 && encounter.enemy) {
    const actor = encounter.enemy.id
      ? enemyActorsBySource.get(encounter.enemy.id)
      : actors.find((candidate) => candidate.team === "enemies");
    if (actor) finalEnemyStates.push({
      actorId: actor.id,
      currentHp: encounter.enemy.hp,
      maximumHp: encounter.enemy.maxHp,
    });
  }

  return { actors, heroActorsBySource, enemyActorsBySource, finalEnemyStates };
}

function sourceActorForEvent(
  event: CanonicalDungeonTranscriptEvent,
  heroes: ReadonlyMap<string, EncounterSceneActor>,
  enemies: ReadonlyMap<string, EncounterSceneActor>,
): string | null {
  if (event.type === "hero.defeated" || event.type.startsWith("enemy.")) {
    return enemies.get(nonEmptyString(event.monsterId) ?? "")?.id ?? null;
  }
  if (event.type.startsWith("hero.") || event.type.startsWith("challenge.")) {
    return heroes.get(nonEmptyString(event.heroId) ?? "")?.id ?? null;
  }
  return null;
}

function impactKind(input: {
  event: CanonicalDungeonTranscriptEvent;
  hpBefore: number | null;
  hpAfter: number | null;
  manaBefore: number | null;
  manaAfter: number | null;
}): EncounterSceneImpactKind {
  if (input.event.type === "enemy.dodged") return "dodge";
  if (input.event.type === "hero.defeated" || input.hpAfter === 0) return "defeat";
  const hpDelta = input.hpBefore !== null && input.hpAfter !== null ? input.hpAfter - input.hpBefore : null;
  const manaDelta = input.manaBefore !== null && input.manaAfter !== null ? input.manaAfter - input.manaBefore : null;
  if (hpDelta !== null && hpDelta < 0) return "damage";
  if (hpDelta !== null && hpDelta > 0 && manaDelta !== null && manaDelta > 0) return "recovery";
  if (hpDelta !== null && hpDelta > 0) return "healing";
  if (manaDelta !== null && manaDelta !== 0) return "resource";
  if (finiteNumber(input.event.damage) !== null) return "damage";
  if (finiteNumber(input.event.healing) !== null) return "healing";
  return "state";
}

function buildSteps(
  encounter: CanonicalDungeonEncounterRecord,
  actors: MutableActor[],
  heroActorsBySource: ReadonlyMap<string, MutableActor>,
  enemyActorsBySource: ReadonlyMap<string, MutableActor>,
): EncounterSceneStep[] {
  const stateByActorId = new Map(actors.map((actor) => [actor.id, cloneActor(actor)]));
  const steps: EncounterSceneStep[] = [];
  let previousSignature: string | null = null;
  let previousActionId: string | null = null;

  for (const [index, event] of getEncounterPlaybackTranscript(encounter).entries()) {
    const sequence = eventSequence(event, index);
    const id = `${encounter.encounterId}:event:${sequence}:${index}`;
    const signature = actionSignature(event);
    const actionId = signature && signature === previousSignature && previousActionId
      ? previousActionId
      : `${encounter.encounterId}:action:${sequence}:${index}`;
    previousSignature = signature;
    previousActionId = actionId;
    const sourceActorId = sourceActorForEvent(event, heroActorsBySource, enemyActorsBySource);
    const impacts: EncounterSceneImpact[] = [];
    const changedActors = new Set<string>();

    const appendImpact = (input: {
      actor: MutableActor | null;
      hpBefore?: unknown;
      hpAfter?: unknown;
      maximumHp?: unknown;
      manaBefore?: unknown;
      manaAfter?: unknown;
      maximumMana?: unknown;
      announcedValue?: number | null;
      allowDuplicate?: boolean;
    }) => {
      if (!input.actor || (changedActors.has(input.actor.id) && !input.allowDuplicate)) return;
      const state = stateByActorId.get(input.actor.id);
      if (!state) return;
      const hpAfter = finiteNumber(input.hpAfter);
      const manaAfter = finiteNumber(input.manaAfter);
      const hpBefore = finiteNumber(input.hpBefore) ?? state.currentHp;
      const manaBefore = finiteNumber(input.manaBefore) ?? state.currentMana;
      const maximumHp = finiteNumber(input.maximumHp) ?? state.maximumHp;
      const maximumMana = finiteNumber(input.maximumMana) ?? state.maximumMana;
      if (hpAfter === null && manaAfter === null && event.type !== "enemy.dodged") return;
      const kind = impactKind({ event, hpBefore, hpAfter, manaBefore, manaAfter });
      const hpDelta = hpBefore !== null && hpAfter !== null ? Math.abs(hpAfter - hpBefore) : null;
      const manaDelta = manaBefore !== null && manaAfter !== null ? Math.abs(manaAfter - manaBefore) : null;
      const knockedOutAfter = hpAfter === null ? state.knockedOut : hpAfter <= 0;
      const impact: EncounterSceneImpact = {
        id: `${id}:impact:${impacts.length}`,
        kind,
        sourceActorId,
        targetActorId: input.actor.id,
        announcedValue: input.announcedValue ?? null,
        appliedValue: hpDelta ?? manaDelta,
        hp: hpAfter === null ? null : { before: hpBefore, after: hpAfter, maximum: maximumHp },
        mana: manaAfter === null ? null : { before: manaBefore, after: manaAfter, maximum: maximumMana },
        knockedOutAfter,
      };
      impacts.push(impact);
      changedActors.add(input.actor.id);
      if (hpAfter !== null) state.currentHp = hpAfter;
      if (maximumHp !== null) state.maximumHp = maximumHp;
      if (manaAfter !== null) state.currentMana = manaAfter;
      if (maximumMana !== null) state.maximumMana = maximumMana;
      state.knockedOut = knockedOutAfter;
    };

    for (const change of [...records(event.heroChanges), ...records(event.heroes)]) {
      const heroId = nonEmptyString(change.heroId);
      appendImpact({
        actor: heroId ? heroActorsBySource.get(heroId) ?? null : null,
        hpBefore: change.hpBefore,
        hpAfter: change.hpAfter,
        manaBefore: change.manaBefore,
        manaAfter: change.manaAfter,
      });
    }

    const targetMonsterId = nonEmptyString(event.targetMonsterId) ?? nonEmptyString(event.monsterId);
    const hitResults = records(event.hitResults);
    const hitActor = targetMonsterId ? enemyActorsBySource.get(targetMonsterId) ?? null : null;
    let projectedHitHp = hitActor ? stateByActorId.get(hitActor.id)?.currentHp ?? null : null;
    let projectedHitCount = 0;
    for (const hit of hitResults) {
      const announcedDamage = finiteNumber(hit.damage);
      if (projectedHitHp === null || announcedDamage === null) break;
      const hpBefore = projectedHitHp;
      projectedHitHp = Math.max(0, hpBefore - announcedDamage);
      appendImpact({
        actor: hitActor,
        hpBefore,
        hpAfter: projectedHitHp,
        maximumHp: event.enemyMaxHp,
        announcedValue: announcedDamage,
        allowDuplicate: true,
      });
      projectedHitCount += 1;
    }
    if (projectedHitCount === 0 && finiteNumber(event.enemyHp) !== null) {
      appendImpact({
        actor: targetMonsterId ? enemyActorsBySource.get(targetMonsterId) ?? null : null,
        hpBefore: event.enemyHpBefore,
        hpAfter: event.enemyHp,
        maximumHp: event.enemyMaxHp,
        announcedValue: finiteNumber(event.announcedHealing)
          ?? finiteNumber(event.announcedDamage)
          ?? finiteNumber(event.healing)
          ?? finiteNumber(event.damage),
      });
    }

    const targetHeroId = nonEmptyString(event.targetHeroId) ?? nonEmptyString(event.heroId);
    if (finiteNumber(event.heroHp) !== null) {
      appendImpact({
        actor: targetHeroId ? heroActorsBySource.get(targetHeroId) ?? null : null,
        hpBefore: event.heroHpBefore,
        hpAfter: event.heroHp,
        maximumHp: event.heroMaxHp,
        announcedValue: finiteNumber(event.announcedHealing)
          ?? finiteNumber(event.announcedDamage)
          ?? finiteNumber(event.healing)
          ?? finiteNumber(event.damage),
      });
    } else if (event.type === "enemy.dodged") {
      appendImpact({
        actor: targetHeroId ? heroActorsBySource.get(targetHeroId) ?? null : null,
      });
    }

    const sourceManaBefore = finiteNumber(event.sourceMana?.[0]);
    const sourceManaAfter = finiteNumber(event.sourceMana?.[1]);
    if (sourceManaBefore !== null && sourceManaAfter !== null) {
      const sourceHeroId = nonEmptyString(event.heroId);
      appendImpact({
        actor: sourceHeroId ? heroActorsBySource.get(sourceHeroId) ?? null : null,
        manaBefore: sourceManaBefore,
        manaAfter: sourceManaAfter,
        maximumMana: event.sourceMana?.[2],
        announcedValue: Math.abs(sourceManaBefore - sourceManaAfter),
        allowDuplicate: true,
      });
    }

    const explicitTargets = event.targets ?? [];
    const explicitTargetActorIds = (explicitTargets[0] === "h"
      ? [...heroActorsBySource.values()]
      : explicitTargets[0] === "e"
        ? [...enemyActorsBySource.values()]
      : [])
      .filter((actor) => explicitTargets.slice(1).includes(actor.slot))
      .map((actor) => actor.id);
    const rewards = rewardForEvent(event);

    steps.push({
      id,
      actionId,
      index,
      sequence,
      round: finiteNumber(event.round),
      type: nonEmptyString(event.type) ?? "unknown",
      category: event.category ?? null,
      summary: eventSummary(event),
      sourceActorId,
      targetActorIds: [...new Set([
        ...explicitTargetActorIds,
        ...impacts
          .filter((impact) => impact.kind !== "resource" || impact.targetActorId !== sourceActorId)
          .map((impact) => impact.targetActorId),
      ])],
      impacts,
      rewards,
      projection: impacts.length || rewards.length
        ? "structured"
        : "summary",
      result: resultForEvent(event),
    });
  }
  return steps;
}

export function createEncounterSceneTimeline(
  encounter: CanonicalDungeonEncounterRecord,
  currentHeroNames: ReadonlyMap<string, string> = new Map(),
): EncounterSceneTimeline {
  const actorModel = buildActors(encounter, currentHeroNames);
  const limitations = encounter.initialActors ? [] : ["initial-actors-unavailable"];
  return {
    encounterId: encounter.encounterId,
    actors: actorModel.actors.map(cloneActor),
    steps: buildSteps(
      encounter,
      actorModel.actors,
      actorModel.heroActorsBySource,
      actorModel.enemyActorsBySource,
    ),
    outcome: encounter.outcome,
    finalEnemyStates: actorModel.finalEnemyStates.map((state) => ({ ...state })),
    finalRewards: finalRewardsForEncounter(encounter),
    limitations,
  };
}

export function createEncounterSceneInitialState(timeline: EncounterSceneTimeline): EncounterSceneState {
  return {
    encounterId: timeline.encounterId,
    visibleCount: 0,
    complete: false,
    actors: timeline.actors.map(cloneActor),
    activeStep: null,
    result: null,
    rewards: [],
    limitations: [...timeline.limitations],
  };
}

export function applyEncounterSceneStep(
  state: EncounterSceneState,
  step: EncounterSceneStep,
): EncounterSceneState {
  if (!step.id.startsWith(`${state.encounterId}:event:`)) return state;
  const actorsById = new Map(state.actors.map((actor) => [actor.id, actor]));
  for (const impact of step.impacts) {
    const actor = actorsById.get(impact.targetActorId);
    if (!actor) continue;
    actorsById.set(actor.id, {
      ...actor,
      currentHp: impact.hp?.after ?? actor.currentHp,
      maximumHp: impact.hp?.maximum ?? actor.maximumHp,
      currentMana: impact.mana?.after ?? actor.currentMana,
      maximumMana: impact.mana?.maximum ?? actor.maximumMana,
      knockedOut: impact.knockedOutAfter,
    });
  }
  return {
    ...state,
    visibleCount: Math.max(state.visibleCount, step.index + 1),
    actors: state.actors.map((actor) => actorsById.get(actor.id) ?? actor),
    activeStep: step,
    result: step.result ?? state.result,
    rewards: [...state.rewards, ...step.rewards],
  };
}

export function completeEncounterSceneState(
  timeline: EncounterSceneTimeline,
  state: EncounterSceneState,
): EncounterSceneState {
  const finalEnemies = new Map(timeline.finalEnemyStates.map((enemy) => [enemy.actorId, enemy]));
  return {
    ...state,
    visibleCount: timeline.steps.length,
    complete: true,
    actors: state.actors.map((actor) => {
      const finalState = finalEnemies.get(actor.id);
      return finalState
        ? {
            ...actor,
            currentHp: finalState.currentHp,
            maximumHp: finalState.maximumHp,
            knockedOut: finalState.currentHp <= 0,
          }
        : actor;
    }),
    result: timeline.outcome,
    rewards: timeline.finalRewards.length > 0
      ? timeline.finalRewards.map((reward) => ({ ...reward }))
      : state.rewards,
  };
}

export function projectEncounterScene(
  timeline: EncounterSceneTimeline,
  cursor: EncounterSceneCursor = { visibleCount: timeline.steps.length, complete: true },
): EncounterSceneState {
  const visibleCount = cursor.complete
    ? timeline.steps.length
    : Math.max(0, Math.min(timeline.steps.length, Math.floor(cursor.visibleCount)));
  let state = createEncounterSceneInitialState(timeline);
  for (const step of timeline.steps.slice(0, visibleCount)) {
    state = applyEncounterSceneStep(state, step);
  }
  return cursor.complete ? completeEncounterSceneState(timeline, state) : state;
}

export function createEncounterSceneProjection(
  encounter: CanonicalDungeonEncounterRecord,
  currentHeroNames: ReadonlyMap<string, string> = new Map(),
  cursor?: EncounterSceneCursor | null,
): EncounterSceneState {
  const timeline = createEncounterSceneTimeline(encounter, currentHeroNames);
  return projectEncounterScene(timeline, cursor ?? undefined);
}
