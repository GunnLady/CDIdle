import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CanonicalDungeonEncounterRecord } from '../shared/contracts/authoritative';
import {
  useDungeonPageActions,
  type DungeonPageActionDependencies,
} from '../src/hooks/useDungeonPageActions';

function createDependencies(
  overrides: Partial<DungeonPageActionDependencies> = {},
): DungeonPageActionDependencies {
  return {
    activeFloor: 2,
    addLog: vi.fn(),
    autoExplore: false,
    automation: {
      exploreAndResolve: vi.fn(async () => undefined),
      isRunningRef: { current: false },
      retreat: vi.fn(async () => undefined),
      setBlocked: vi.fn(),
      waitUntilIdle: vi.fn(async () => undefined),
    },
    clearDungeonLogs: vi.fn(),
    currentEncounter: null,
    dispatchAuthoritativeCommand: vi.fn(async () => true),
    enqueueOptimisticCommand: vi.fn(() => true),
    heroes: [{ id: 'hero-1', isActive: false }],
    highestFloorReached: 3,
    ...overrides,
  };
}

describe('dungeon page actions hook', () => {
  it('toggles auto-exploration through the optimistic command boundary', () => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useDungeonPageActions(dependencies));

    act(() => result.current.handleToggleAutoExplore());

    expect(dependencies.automation.setBlocked).toHaveBeenCalledWith(false);
    expect(dependencies.enqueueOptimisticCommand).toHaveBeenCalledWith(
      'dungeon:auto',
      { type: 'dungeon.auto_explore', enabled: true },
    );
  });

  it('resolves a pending encounter and clamps the next selected floor', () => {
    const dependencies = createDependencies({
      activeFloor: 3,
      currentEncounter: {} as CanonicalDungeonEncounterRecord,
      highestFloorReached: 3,
    });
    const { result } = renderHook(() => useDungeonPageActions(dependencies));

    act(() => result.current.handleChangeFloor('next'));

    expect(dependencies.automation.exploreAndResolve).toHaveBeenCalledWith(false);
    expect(dependencies.automation.setBlocked).toHaveBeenNthCalledWith(1, false);
    expect(dependencies.automation.setBlocked).toHaveBeenNthCalledWith(2, true);
    expect(dependencies.enqueueOptimisticCommand).toHaveBeenCalledWith(
      'dungeon:floor',
      { type: 'dungeon.select_floor', floor: 3 },
    );
  });

  it('waits for automation before resetting the current floor', async () => {
    const order: string[] = [];
    const dependencies = createDependencies({
      automation: {
        exploreAndResolve: vi.fn(async () => undefined),
        isRunningRef: { current: false },
        retreat: vi.fn(async () => undefined),
        setBlocked: vi.fn(),
        waitUntilIdle: vi.fn(async () => {
          order.push('idle');
        }),
      },
      clearDungeonLogs: vi.fn(() => order.push('clear')),
      dispatchAuthoritativeCommand: vi.fn(async () => {
        order.push('dispatch');
        return true;
      }),
    });
    const { result } = renderHook(() => useDungeonPageActions(dependencies));

    act(() => result.current.handleResetLevel());

    await waitFor(() => expect(dependencies.clearDungeonLogs).toHaveBeenCalledOnce());
    expect(dependencies.dispatchAuthoritativeCommand).toHaveBeenCalledWith({
      type: 'dungeon.select_floor',
      floor: 2,
    });
    expect(order).toEqual(['idle', 'dispatch', 'clear']);
  });

  it('ignores an unknown hero and toggles a known hero', () => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useDungeonPageActions(dependencies));

    act(() => result.current.handleToggleHeroActive('missing'));
    expect(dependencies.enqueueOptimisticCommand).not.toHaveBeenCalled();

    act(() => result.current.handleToggleHeroActive('hero-1'));
    expect(dependencies.enqueueOptimisticCommand).toHaveBeenCalledWith(
      'hero-activity:hero-1',
      { type: 'hero.activity', heroId: 'hero-1', active: true },
    );
  });
});
