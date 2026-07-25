import {
  useCallback,
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

type DungeonSystemOptions = {
  highestFloorReached: number;
  setHighestFloorReached: Dispatch<SetStateAction<number>>;
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
}: DungeonSystemOptions) {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [storedItems, setStoredItems] = useState<StoredItemStack[]>([]);
  const [forgeMaterials, setForgeMaterials] = useState<StoredForgeMaterialStack[]>([]);
  const [itemBlueprints, setItemBlueprints] = useState<ItemBlueprint[]>(
    DEFAULT_UNLOCKED_ITEM_BLUEPRINTS,
  );
  const [activeDungeonFloor, setActiveDungeonFloor] = useState(1);
  const [activeDungeonRoom, setActiveDungeonRoom] = useState(1);
  const [autoExplore, setAutoExplore] = useState(true);
  const [unlockedRaces, setUnlockedRaces] = useState<string[]>(["Humain"]);

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
  }, [setHighestFloorReached]);

  return {
    heroes,
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
    currentMonster: null,
    currentEncounterType: null,
    combatTimer: 0,
    forgeMaterials,
    setForgeMaterials,
    itemBlueprints,
    setItemBlueprints,
    unlockedRaces,
    setUnlockedRaces,
    resetDungeonSystem,
  };
}
