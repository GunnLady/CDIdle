import type {
  CanonicalActiveDungeonEncounter,
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonTranscriptEvent,
} from "../../shared/contracts/authoritative";
import { getDungeonRoomCount } from "../../shared/domain/dungeon-progression";
import { ACTIVE_HERO_LIMIT } from "../../shared/domain/hero";
import {
  UNARMED_WEAPON_CONTEXT,
  calculateGuaranteedWeaponPower,
  selectWeaponAttackPower,
} from "../../shared/domain/weapon-combat";
import type { BattleLogEntry, Hero } from "../types";
import { getHeroMainHandWeapon } from "../utils/gameCalculations";
import type { HeroRosterEntryView } from "./heroPresentation";

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
}

export interface DungeonProgressBannerView {
  progress: DungeonRoomProgressView;
  status: "Aucun groupe" | "Combat en cours" | "Rencontre en attente" | "Exploration" | "En pause" | "Prêt";
  autoExplore: boolean;
  party: Array<DungeonProgressBannerHeroView | null>;
  canToggleAutoExplore: boolean;
}

export interface DungeonPartyHeroView extends HeroRosterEntryView {
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
}

export interface DungeonEncounterView {
  encounterId: string;
  title: string;
  location: string;
  statusLabel: string;
  state: "pending" | "playing" | "victory" | "defeat";
  transcript: Array<{ id: string; message: string; category: CanonicalDungeonTranscriptEvent["category"] }>;
  result?: string;
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
  floor: number;
  room: number;
  autoExplore: boolean;
  encounter: CanonicalActiveDungeonEncounter | null;
  isExploring: boolean;
  canMutate: boolean;
}): DungeonProgressBannerView {
  const activeHeroes = input.heroes.filter((hero) => hero.isActive).slice(0, ACTIVE_HERO_LIMIT);
  const party = Array.from({ length: ACTIVE_HERO_LIMIT }, (_, index): DungeonProgressBannerHeroView | null => {
    const hero = activeHeroes[index];
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
    };
  });
  const status = activeHeroes.length === 0
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
    canToggleAutoExplore: input.canMutate && activeHeroes.length > 0 && !input.encounter,
  };
}

export function createDungeonPartyView(
  heroes: Hero[],
  roster: HeroRosterEntryView[],
): { party: Array<DungeonPartyHeroView | null>; reserves: DungeonPartyHeroView[] } {
  const rosterById = new Map(roster.map((entry) => [entry.id, entry]));
  const projected = heroes.flatMap((hero): DungeonPartyHeroView[] => {
    const entry = rosterById.get(hero.id);
    if (!entry) return [];
    const maxMana = Math.max(0, hero.calculatedStats.maxMana);
    return [{
      ...entry,
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
      xpPercent: Math.max(0, Math.min(100, Math.round((Math.max(0, hero.xp) / Math.max(1, hero.xpNeeded)) * 100))),
    }];
  });
  const active = projected.filter((hero) => hero.isActive).slice(0, ACTIVE_HERO_LIMIT);
  return {
    party: Array.from({ length: ACTIVE_HERO_LIMIT }, (_, index) => active[index] ?? null),
    reserves: projected.filter((hero) => !hero.isActive),
  };
}

function formatTranscriptEvent(event: CanonicalDungeonTranscriptEvent, heroNames: Map<string, string>): string {
  if (event.message) return event.message;
  const heroName = event.heroName ?? (event.heroId ? heroNames.get(event.heroId) : undefined) ?? "Un héros";
  if (event.type === "hero.hit") return `Tour ${event.round} — ${heroName} inflige ${event.damage} dégâts.`;
  return `Tour ${event.round} — L'ennemi inflige ${event.damage} dégâts à ${heroName}.`;
}

export function createEncounterView(
  record: CanonicalDungeonEncounterRecord,
  heroNames: Map<string, string>,
  playback?: { visibleCount: number; complete: boolean } | null,
): DungeonEncounterView {
  const complete = playback?.complete ?? true;
  const visibleTranscript = playback
    ? record.transcript.slice(0, playback.visibleCount)
    : record.transcript;
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
