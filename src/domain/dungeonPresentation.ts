import type {
  CanonicalActiveDungeonEncounter,
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonProgress,
  CanonicalPendingClassTransition,
  CanonicalDungeonTranscriptEvent,
} from "../../shared/contracts/authoritative";
import { getDungeonRoomCount } from "../../shared/domain/dungeon-progression";
import { UNDERCITY_MAX_FLOOR, UNDERCITY_ZONES } from "../../shared/domain/undercity";
import {
  canFarmUndercity,
  getUndercityCommonCheckpoint,
  isUndercityProgressionComplete,
} from "../../shared/domain/undercity-progression";
import { ACTIVE_HERO_LIMIT } from "../../shared/domain/hero";
import {
  UNARMED_WEAPON_CONTEXT,
  calculateGuaranteedWeaponPower,
  selectWeaponAttackPower,
} from "../../shared/domain/weapon-combat";
import type { BattleLogEntry, Hero } from "../types";
import { getHeroMainHandWeapon } from "../utils/gameCalculations";
import type { HeroRosterEntryView } from "./heroPresentation";
import { HERO_MAX_LEVEL } from "../../shared/data/hero-progression-models";
import {
  createEncounterSceneTimeline,
  getEncounterPlaybackTranscript,
  projectEncounterScene,
  type EncounterSceneState,
} from "./encounterSceneProjection";
import {
  createDungeonCombatSceneView,
  type DungeonCombatSceneView,
} from "./dungeonCombatScene";
import { createDungeonNonCombatSceneView } from "./dungeonNonCombatScene";

export interface DungeonProgressView {
  floor: number;
  room: number;
  roomCount: number;
  highestFloorReached: number;
  rooms: Array<{ number: number; state: "completed" | "current" | "upcoming"; isBoss: boolean }>;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export interface DungeonRoomProgressView {
  floor: number;
  room: number;
  roomCount: number;
}

export interface DungeonProgressBannerHeroView {
  id: string;
  name: string;
  classType: Hero["classType"];
  level: number;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  healthPercent: number;
  manaPercent: number;
  isKnockedOut: boolean;
}

export interface DungeonProgressBannerView {
  progress: DungeonRoomProgressView;
  status: "Aucun groupe" | "Combat en cours" | "Rencontre en attente" | "Exploration" | "En pause" | "Prêt";
  autoExplore: boolean;
  party: Array<DungeonProgressBannerHeroView | null>;
  canToggleAutoExplore: boolean;
  action: "pause" | "resume" | "continue_checkpoint" | "open_dungeon";
  canUseAction: boolean;
}

export interface DungeonPartyHeroView extends HeroRosterEntryView {
  isKnockedOut: boolean;
  attackPower: number;
  estimatedDps: string;
  physicalDefense: number;
  speed: number;
  criticalChance: number;
  dodgeChance: number;
  manaPercent: number;
  xp: number;
  xpNeeded: number;
  xpPercent: number;
  isMaxLevel: boolean;
}

export interface DungeonEncounterView {
  encounterId: string;
  title: string;
  location: string;
  statusLabel: string;
  state: "pending" | "playing" | "victory" | "defeat";
  transcript: Array<{ id: string; message: string; category: CanonicalDungeonTranscriptEvent["category"] }>;
  result?: string;
  scene: EncounterSceneState | null;
  visualScene: DungeonCombatSceneView | null;
}

export interface DungeonHistoryView {
  encounters: DungeonEncounterView[];
  notes: BattleLogEntry[];
  emptyMessage: string;
}

const encounterKindLabels: Record<CanonicalDungeonEncounterRecord["kind"], string> = {
  fight: "Combat",
  trap: "Piège",
  enigma: "Énigme",
  ambush: "Embuscade",
  ritual: "Rituel",
  obstacle: "Obstacle",
  negotiation: "Négociation",
  treasure: "Trésor",
  rest: "Repos",
};

function formatTranscriptEvent(event: CanonicalDungeonTranscriptEvent, heroNames: Map<string, string>): string {
  if (event.message) return event.message;
  if (event.type !== "hero.hit" && event.type !== "enemy.hit") return event.type;
  const heroName = event.heroName ?? (event.heroId ? heroNames.get(event.heroId) : undefined) ?? "Un héros";
  return event.type === "hero.hit"
    ? `Tour ${event.round} — ${heroName} inflige ${event.damage} dégâts.`
    : `Tour ${event.round} — L'ennemi inflige ${event.damage} dégâts à ${heroName}.`;
}

function normalAttackPower(hero: Hero): number {
  const weapon = getHeroMainHandWeapon(hero);
  const attackProfile = weapon?.attackProfile ?? UNARMED_WEAPON_CONTEXT.attackProfile;
  const attackPower = selectWeaponAttackPower(
    hero.calculatedStats,
    weapon?.scaling ?? UNARMED_WEAPON_CONTEXT.scaling,
  );
  return calculateGuaranteedWeaponPower(attackPower, attackProfile);
}

export function createDungeonProgressView(
  floor: number,
  room: number,
  highestFloorReached: number,
): DungeonProgressView {
  const progress = createDungeonRoomProgressView(floor, room);
  return {
    ...progress,
    highestFloorReached,
    rooms: Array.from({ length: progress.roomCount }, (_, index) => {
      const number = index + 1;
      return {
        number,
        state: number < progress.room ? "completed" : number === progress.room ? "current" : "upcoming",
        isBoss: number === progress.roomCount,
      };
    }),
    canGoPrevious: floor > 1,
    canGoNext: floor < highestFloorReached,
  };
}

export function createDungeonRoomProgressView(floor: number, room: number): DungeonRoomProgressView {
  const roomCount = getDungeonRoomCount(floor);
  return { floor, room: Math.min(room, roomCount), roomCount };
}

export function createDungeonProgressBannerView(input: {
  heroes: Hero[];
  dungeonProgress?: CanonicalDungeonProgress;
  floor: number;
  room: number;
  autoExplore: boolean;
  encounter: CanonicalActiveDungeonEncounter | null;
  isExploring: boolean;
  canMutate: boolean;
  pendingClassTransitions?: CanonicalPendingClassTransition[];
}): DungeonProgressBannerView {
  const expedition = input.dungeonProgress?.expedition;
  const segmentActive = expedition && expedition.phase !== "preparing";
  const heroesById = new Map(input.heroes.map((hero) => [hero.id, hero]));
  const partyHeroes = segmentActive
    ? expedition.segmentHeroIds.flatMap((heroId) => {
        const hero = heroesById.get(heroId);
        return hero ? [hero] : [];
      }).slice(0, ACTIVE_HERO_LIMIT)
    : input.heroes.filter((hero) => hero.isActive).slice(0, ACTIVE_HERO_LIMIT);
  const knockedOutHeroIds = new Set(segmentActive ? expedition.knockedOutHeroIds : []);
  const party = Array.from({ length: ACTIVE_HERO_LIMIT }, (_, index): DungeonProgressBannerHeroView | null => {
    const hero = partyHeroes[index];
    if (!hero) return null;
    const maxHp = Math.max(1, hero.calculatedStats.maxHp);
    const maxMana = Math.max(0, hero.calculatedStats.maxMana);
    const currentHp = Math.max(0, Math.min(maxHp, Math.floor(hero.currentHp)));
    const currentMana = Math.max(0, Math.min(maxMana, Math.floor(hero.currentMana)));
    return {
      id: hero.id,
      name: hero.name,
      classType: hero.classType,
      level: hero.level,
      currentHp,
      maxHp,
      currentMana,
      maxMana,
      healthPercent: Math.round((currentHp / maxHp) * 100),
      manaPercent: maxMana > 0 ? Math.round((currentMana / maxMana) * 100) : 0,
      isKnockedOut: knockedOutHeroIds.has(hero.id),
    };
  });
  const operationalHeroCount = partyHeroes.filter((hero) => !knockedOutHeroIds.has(hero.id) && hero.currentHp > 0).length;
  const checkpointPending = expedition?.phase === "checkpoint_decision";
  const pendingHeroIds = new Set((input.pendingClassTransitions ?? []).map((pending) => pending.heroId));
  const segmentHasPendingVocation = Boolean(expedition?.segmentHeroIds.some((heroId) => pendingHeroIds.has(heroId)));
  const canContinueCheckpointDirectly = Boolean(
    checkpointPending
    && input.canMutate
    && expedition.autoExploreBeforeCheckpoint
    && expedition.knockedOutHeroIds.length === 0
    && !segmentHasPendingVocation
    && (expedition.checkpointFloor ?? UNDERCITY_MAX_FLOOR) < UNDERCITY_MAX_FLOOR,
  );
  const action: DungeonProgressBannerView["action"] = checkpointPending
    ? canContinueCheckpointDirectly ? "continue_checkpoint" : "open_dungeon"
    : input.autoExplore ? "pause" : "resume";
  const canToggleAutoExplore = input.canMutate && operationalHeroCount > 0 && !input.encounter && !checkpointPending;
  const status = partyHeroes.length === 0
    ? "Aucun groupe"
    : input.encounter && input.isExploring
      ? "Combat en cours"
      : input.encounter
        ? "Rencontre en attente"
        : input.isExploring
          ? "Exploration"
          : !input.autoExplore
            ? "En pause"
            : "Prêt";
  return {
    progress: createDungeonRoomProgressView(input.floor, input.room),
    status,
    autoExplore: input.autoExplore,
    party,
    canToggleAutoExplore,
    action,
    canUseAction: checkpointPending
      ? action === "open_dungeon" || canContinueCheckpointDirectly
      : canToggleAutoExplore,
  };
}

export function createDungeonPartyView(
  heroes: Hero[],
  roster: HeroRosterEntryView[],
  progress?: CanonicalDungeonProgress,
): { party: Array<DungeonPartyHeroView | null>; reserves: DungeonPartyHeroView[] } {
  const rosterById = new Map(roster.map((entry) => [entry.id, entry]));
  const projected = heroes.flatMap((hero): DungeonPartyHeroView[] => {
    const entry = rosterById.get(hero.id);
    if (!entry) return [];
    const maxMana = Math.max(0, hero.calculatedStats.maxMana);
    return [{
      ...entry,
      isKnockedOut: Boolean(progress?.expedition.knockedOutHeroIds.includes(hero.id)),
      attackPower: Math.floor(normalAttackPower(hero)),
      estimatedDps: hero.calculatedStats.estimatedDps.toFixed(2),
      physicalDefense: Math.floor(hero.calculatedStats.physicalDefense),
      speed: Math.floor(hero.calculatedStats.speed),
      criticalChance: hero.calculatedStats.criticalChance,
      dodgeChance: hero.calculatedStats.dodgeChance,
      manaPercent: maxMana > 0
        ? Math.max(0, Math.min(100, Math.round((entry.currentMana / maxMana) * 100)))
        : 0,
      xp: Math.max(0, Math.floor(hero.xp)),
      xpNeeded: Math.max(1, hero.xpNeeded),
      xpPercent: hero.level >= HERO_MAX_LEVEL
        ? 100
        : Math.max(0, Math.min(100, Math.round((Math.max(0, hero.xp) / Math.max(1, hero.xpNeeded)) * 100))),
      isMaxLevel: hero.level >= HERO_MAX_LEVEL,
    }];
  });
  const projectedById = new Map(projected.map((hero) => [hero.id, hero]));
  const engagedIds = progress && progress.expedition.phase !== "preparing"
    ? progress.expedition.segmentHeroIds
    : projected.filter((hero) => hero.isActive).map((hero) => hero.id);
  const engaged = engagedIds.flatMap((heroId) => {
    const hero = projectedById.get(heroId);
    return hero ? [hero] : [];
  }).slice(0, ACTIVE_HERO_LIMIT);
  const engagedSet = new Set(engagedIds);
  return {
    party: Array.from({ length: ACTIVE_HERO_LIMIT }, (_, index) => engaged[index] ?? null),
    reserves: projected.filter((hero) => !engagedSet.has(hero.id)),
  };
}

const enemyRoleLabels = {
  ordinary: "Combattant",
  protector: "Protecteur",
  ranged: "Tireur",
  support: "Soutien",
  guard: "Garde",
  king: "Souverain",
} as const;

function formatEnemyRole(role?: string): string {
  return role && role in enemyRoleLabels
    ? enemyRoleLabels[role as keyof typeof enemyRoleLabels]
    : "Ennemi";
}

export function createEncounterView(
  record: CanonicalDungeonEncounterRecord,
  heroNames: Map<string, string>,
  playback?: { visibleCount: number; complete: boolean } | null,
): DungeonEncounterView {
  const complete = playback?.complete ?? true;
  const playbackTranscript = getEncounterPlaybackTranscript(record);
  const timeline = createEncounterSceneTimeline(record, heroNames);
  const scene = projectEncounterScene(timeline, playback ?? undefined);
  const visibleTranscript = playback ? playbackTranscript.slice(0, playback.visibleCount) : playbackTranscript;
  const state = complete ? record.outcome : "playing";
  const title = record.enemy?.name ?? encounterKindLabels[record.kind];
  return {
    encounterId: record.encounterId,
    title,
    location: `Étage ${record.floor} · Salle ${record.room}`,
    statusLabel: !complete
      ? record.kind === "fight" ? "Combat en cours" : "Rencontre en cours"
      : record.outcome === "victory" ? "Victoire" : "Défaite",
    state,
    scene,
    visualScene: record.kind === "fight"
      ? createDungeonCombatSceneView(scene, (record.enemies ?? []).map((enemy) => ({
          id: enemy.id,
          role: formatEnemyRole(enemy.role),
        })))
      : createDungeonNonCombatSceneView(record, timeline, scene),
    transcript: visibleTranscript.map((event) => ({
      id: `${record.encounterId}-${event.sequence}`,
      message: formatTranscriptEvent(event, heroNames),
      category: event.category,
    })),
    result: complete
      ? record.outcome === "victory"
        ? record.kind === "fight"
          ? `Victoire en ${record.roundCount} tour(s) · +${record.rewards.gold} or`
          : `Rencontre résolue · +${record.rewards.gold} or`
        : record.kind === "fight"
          ? `Défaite après ${record.roundCount} tour(s)`
          : "Épreuve échouée · l'escouade poursuit sa route"
      : undefined,
  };
}

export function createCurrentEncounterView(
  activeEncounter: CanonicalActiveDungeonEncounter | null,
  encounterHistory: CanonicalDungeonEncounterRecord[],
  encounterPlayback: { encounterId: string; visibleCount: number; complete: boolean } | null,
  heroes: Hero[],
): DungeonEncounterView | null {
  if (activeEncounter) {
    return {
      encounterId: activeEncounter.encounterId,
      title: "Rencontre autoritaire prête",
      location: `Étage ${activeEncounter.floor} · Salle ${activeEncounter.room}`,
      statusLabel: "Résolution en attente",
      state: "pending",
      transcript: [],
      scene: null,
      visualScene: null,
    };
  }
  const latest = encounterHistory.at(-1);
  if (!latest) return null;
  const heroNames = new Map(heroes.map((hero) => [hero.id, hero.name]));
  const playback = encounterPlayback?.encounterId === latest.encounterId ? encounterPlayback : null;
  return createEncounterView(latest, heroNames, playback);
}

export function createDungeonHistoryView(
  encounterHistory: CanonicalDungeonEncounterRecord[],
  battleLogs: BattleLogEntry[],
  heroes: Hero[],
  encounterPlayback: { encounterId: string; visibleCount: number; complete: boolean } | null,
): DungeonHistoryView {
  const heroNames = new Map(heroes.map((hero) => [hero.id, hero.name]));
  const encounters = [...encounterHistory].reverse().map((record) => {
    const playback = encounterPlayback?.encounterId === record.encounterId ? encounterPlayback : null;
    return createEncounterView(record, heroNames, playback);
  });
  const notes = [...battleLogs]
    .filter((log) => log.category === "dungeon")
    .reverse();
  return { encounters, notes, emptyMessage: "Aucune action de donjon enregistrée." };
}


export interface UndercityJourneyView {
  commonCheckpoint: number;
  maxSelectableFloor: number;
  awaitingFarmSelection: boolean;
  halted: boolean;
  haltReason: "wipe" | "retreat" | null;
  mode: "progression" | "farm";
  selectedZoneId: string | null;
  members: Array<{ heroId: string; name: string; completedFloor: number }>;
  farmZones: Array<{ id: string; name: string; selected: boolean }>;
}

export function createUndercityJourneyView(
  progress: CanonicalDungeonProgress,
  heroes: Hero[],
): UndercityJourneyView {
  const members = heroes
    .filter((hero) => hero.isActive && hero.currentHp > 0)
    .map((hero) => ({
      heroId: hero.id,
      name: hero.name,
      completedFloor: progress.heroes[hero.id]?.completedFloor ?? 0,
    }));
  const memberIds = members.map((member) => member.heroId);
  const commonCheckpoint = getUndercityCommonCheckpoint(progress, memberIds);
  const farmAvailable = canFarmUndercity(progress, memberIds);
  const awaitingFarmSelection = isUndercityProgressionComplete(progress, memberIds);
  const maxSelectableFloor = members.length > 0
    ? Math.min(UNDERCITY_MAX_FLOOR, ...members.map((member) => member.completedFloor + 1))
    : 1;
  return {
    commonCheckpoint,
    maxSelectableFloor,
    awaitingFarmSelection,
    halted: progress.expedition.halted,
    haltReason: progress.expedition.haltReason,
    mode: progress.expedition.mode,
    selectedZoneId: progress.expedition.zoneId,
    members,
    farmZones: farmAvailable
      ? UNDERCITY_ZONES.map((zone) => ({ id: zone.id, name: zone.name, selected: progress.expedition.zoneId === zone.id }))
      : [],
  };
}
