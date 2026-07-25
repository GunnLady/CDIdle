import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type {
  Hero,
  ItemBlueprint,
  StoredForgeMaterialStack,
  StoredItemStack,
} from "../types";
import { DEFAULT_UNLOCKED_ITEM_BLUEPRINTS } from "../utils/gameCalculations";
import { projectRestingHeroes } from "../domain/heroRecoveryProjection";

type DungeonSystemOptions = {
  highestFloorReached: number;
  setHighestFloorReached: Dispatch<SetStateAction<number>>;
  currentUser: unknown;
  isOnline: boolean;
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
  setHighestFloorReached,
  currentUser,
  isOnline,
}: DungeonSystemOptions) {
  const [heroes, setCanonicalHeroes] = useState<Hero[]>([]);
  const [projectionStartedAt, setProjectionStartedAt] = useState(() => Date.now());
  const [projectionNow, setProjectionNow] = useState(() => Date.now());
  const setHeroes = useCallback((next: Hero[]) => {
    const now = Date.now();
    setCanonicalHeroes(next);
    setProjectionStartedAt(now);
    setProjectionNow(now);
  }, []);
  const [storedItems, setStoredItems] = useState<StoredItemStack[]>([]);
  const [forgeMaterials, setForgeMaterials] = useState<StoredForgeMaterialStack[]>([]);
  const [itemBlueprints, setItemBlueprints] = useState<ItemBlueprint[]>(
    DEFAULT_UNLOCKED_ITEM_BLUEPRINTS,
  );
  const [activeDungeonFloor, setActiveDungeonFloor] = useState(1);
  const [activeDungeonRoom, setActiveDungeonRoom] = useState(1);
  const [autoExplore, setAutoExplore] = useState(true);
  const [unlockedRaces, setUnlockedRaces] = useState<string[]>(["Humain"]);

  useEffect(() => {
    if (!currentUser || !isOnline) return;
    const interval = window.setInterval(() => setProjectionNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [currentUser, isOnline]);

  const displayHeroes = useMemo(() => projectRestingHeroes(
    heroes,
    isOnline ? (projectionNow - projectionStartedAt) / 1_000 : 0,
  ), [heroes, isOnline, projectionNow, projectionStartedAt]);

  const resetDungeonSystem = useCallback(() => {
    setHeroes([]);
    setStoredItems([]);
    setForgeMaterials([]);
    setItemBlueprints(DEFAULT_UNLOCKED_ITEM_BLUEPRINTS);
    setActiveDungeonFloor(1);
    setActiveDungeonRoom(1);
    setHighestFloorReached(1);
    setAutoExplore(true);
    setUnlockedRaces(["Humain"]);
  }, [setHeroes, setHighestFloorReached]);

  return {
    heroes,
    displayHeroes,
    setHeroes,
    storedItems,
    setStoredItems,
    activeDungeonFloor,
    setActiveDungeonFloor,
    activeDungeonRoom,
    setActiveDungeonRoom,
    highestFloorReached,
    setHighestFloorReached,
    autoExplore,
    setAutoExplore,
    forgeMaterials,
    setForgeMaterials,
    itemBlueprints,
    setItemBlueprints,
    unlockedRaces,
    setUnlockedRaces,
    resetDungeonSystem,
  };
}
