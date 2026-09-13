import type {
  CanonicalActiveDungeonEncounter,
  CanonicalDungeonProgress,
  CanonicalPendingClassTransition,
} from "../../shared/contracts/authoritative";
import { getDungeonRoomCount } from "../../shared/domain/dungeon-progression";
import { ACTIVE_HERO_LIMIT } from "../../shared/domain/hero";
import { UNDERCITY_MAX_FLOOR } from "../../shared/domain/undercity";
import type { Hero } from "../types";

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
