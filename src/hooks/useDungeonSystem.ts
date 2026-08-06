import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Hero,
  ItemBlueprint,
  StoredForgeMaterialStack,
  StoredItemInstance,
} from "../types";
import { projectRestingHeroes } from "../domain/heroRecoveryProjection";
import {
  projectAuthoritativeElapsedSeconds,
  type AuthoritativeTimeAnchor,
} from "../domain/authoritativeTimeProjection";

type DungeonSystemOptions = {
  highestFloorReached: number;
  currentUser: unknown;
  isOnline: boolean;
  timeAnchor: AuthoritativeTimeAnchor | null;
  heroes: Hero[];
  storedItems: StoredItemInstance[];
  forgeMaterials: StoredForgeMaterialStack[];
  itemBlueprints: ItemBlueprint[];
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  autoExplore: boolean;
};

/**
 * Client projection of the canonical dungeon state.
 *
 * Gameplay mutations are dispatched by App through game-api commands. This
 * hook deliberately contains no combat, encounter, reward or progression
 * rules.
 */
export function useDungeonSystem({
  highestFloorReached,
  currentUser,
  isOnline,
  timeAnchor,
  heroes,
  storedItems,
  forgeMaterials,
  itemBlueprints,
  activeDungeonFloor,
  activeDungeonRoom,
  autoExplore,
}: DungeonSystemOptions) {
  const [projectionNow, setProjectionNow] = useState(() => globalThis.performance?.now() ?? 0);

  useEffect(() => {
    if (!currentUser || !isOnline) return;
    const interval = window.setInterval(() => setProjectionNow(globalThis.performance?.now() ?? 0), 1_000);
    return () => window.clearInterval(interval);
  }, [currentUser, isOnline]);

  const displayHeroes = useMemo(() => projectRestingHeroes(
    heroes,
    isOnline ? projectAuthoritativeElapsedSeconds(timeAnchor, projectionNow) : 0,
  ), [heroes, isOnline, projectionNow, timeAnchor]);

  return {
    heroes,
    displayHeroes,
    storedItems,
    activeDungeonFloor,
    activeDungeonRoom,
    highestFloorReached,
    autoExplore,
    forgeMaterials,
    itemBlueprints,
  };
}
