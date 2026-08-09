import { useCallback, useRef, type MutableRefObject } from 'react';
import type { CanonicalDungeonEncounterRecord } from '../../shared/contracts/authoritative';
import type { BattleLogEntry } from '../types';
import type { DispatchAuthoritativeCommand } from './useAuthoritativeCommandDispatch';
import type { GameLogChannel } from './useGameLog';

type AddGameLog = (
  message: string,
  type?: BattleLogEntry['type'],
  channel?: GameLogChannel,
) => void;

export interface DungeonPageActionDependencies {
  activeFloor: number;
  addLog: AddGameLog;
  autoExplore: boolean;
  automation: {
    exploreAndResolve(manual?: boolean): Promise<void>;
    isRunningRef: MutableRefObject<boolean>;
    retreat(): Promise<void>;
    setBlocked(blocked: boolean): void;
    waitUntilIdle(): Promise<void>;
  };
  clearDungeonLogs(): void;
  currentEncounter: CanonicalDungeonEncounterRecord | null;
  dispatchAuthoritativeCommand: DispatchAuthoritativeCommand;
  enqueueOptimisticCommand(
    key: string,
    command:
      | { type: 'dungeon.auto_explore'; enabled: boolean }
      | { type: 'dungeon.select_floor'; floor: number }
      | { type: 'hero.activity'; heroId: string; active: boolean },
  ): boolean;
  heroes: Array<{ id: string; isActive: boolean }>;
  highestFloorReached: number;
}

export function useDungeonPageActions(
  dependencies: DungeonPageActionDependencies,
) {
  const dependenciesRef = useRef(dependencies);
  dependenciesRef.current = dependencies;

  const handleToggleAutoExplore = useCallback(() => {
    const current = dependenciesRef.current;
    const enabled = !current.autoExplore;
    current.automation.setBlocked(!enabled);
    current.enqueueOptimisticCommand(
      'dungeon:auto',
      { type: 'dungeon.auto_explore', enabled },
    );
  }, []);

  const handleExplore = useCallback(() => {
    const current = dependenciesRef.current;
    current.automation.setBlocked(false);
    void current.automation.exploreAndResolve();
  }, []);

  const handleChangeFloor = useCallback((direction: 'prev' | 'next') => {
    const current = dependenciesRef.current;
    const floor = Math.min(
      current.highestFloorReached,
      Math.max(1, current.activeFloor + (direction === 'next' ? 1 : -1)),
    );
    if (current.currentEncounter && !current.automation.isRunningRef.current) {
      current.automation.setBlocked(false);
      void current.automation.exploreAndResolve(false);
    }
    current.automation.setBlocked(true);
    current.enqueueOptimisticCommand(
      'dungeon:floor',
      { type: 'dungeon.select_floor', floor },
    );
  }, []);

  const handleRetreatParty = useCallback(() => {
    void dependenciesRef.current.automation.retreat();
  }, []);

  const handleToggleHeroActive = useCallback((heroId: string) => {
    const current = dependenciesRef.current;
    const hero = current.heroes.find((entry) => entry.id === heroId);
    if (!hero) return;
    current.enqueueOptimisticCommand(
      'hero-activity:' + heroId,
      { type: 'hero.activity', heroId, active: !hero.isActive },
    );
  }, []);

  const handleResetLevel = useCallback(() => {
    void (async () => {
      const current = dependenciesRef.current;
      if (current.currentEncounter && !current.automation.isRunningRef.current) {
        current.automation.setBlocked(false);
        void current.automation.exploreAndResolve(false);
      }
      current.automation.setBlocked(true);
      await current.automation.waitUntilIdle();
      const reset = await current.dispatchAuthoritativeCommand({
        type: 'dungeon.select_floor',
        floor: current.activeFloor,
      });
      if (!reset) return;
      current.clearDungeonLogs();
      current.addLog(
        '🔄 Étage réinitialisé : l’exploration reprend à la salle 1.',
        'info',
        'dungeon',
      );
    })();
  }, []);

  return {
    handleChangeFloor,
    handleExplore,
    handleResetLevel,
    handleRetreatParty,
    handleToggleAutoExplore,
    handleToggleHeroActive,
  };
}
