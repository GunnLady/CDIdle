import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalGameState } from '../shared/contracts/authoritative';
import type { AuthoritativeGameEnvelope } from '../src/domain/commands';
import {
  useTownAuthorityReconciliation,
  type TownAuthorityReconciliationDependencies,
} from '../src/hooks/useTownAuthorityReconciliation';
import { CanonicalOperationQueue } from '../src/lib/canonicalOperationQueue';
import { CanonicalAuthorityGeneration } from '../src/lib/canonicalReconciliation';

const bootstrapMocks = vi.hoisted(() => ({
  requestCanonicalBootstrap: vi.fn(),
}));

vi.mock('../src/lib/canonicalBootstrap', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/canonicalBootstrap')>('../src/lib/canonicalBootstrap');
  return { ...actual, requestCanonicalBootstrap: bootstrapMocks.requestCanonicalBootstrap };
});

const canonicalState = {} as CanonicalGameState;
const bootstrapEnvelope: AuthoritativeGameEnvelope = {
  schemaVersion: 1,
  revision: 4,
  state: canonicalState,
  serverTime: '2026-08-09T12:00:00.000Z',
  lastProcessedAt: '2026-08-09T12:00:00.000Z',
};

function createDependencies(
  overrides: Partial<TownAuthorityReconciliationDependencies> = {},
): TownAuthorityReconciliationDependencies {
  return {
    addLog: vi.fn(),
    applyAuthoritativeState: vi.fn(async () => true),
    authorityGeneration: new CanonicalAuthorityGeneration(),
    bootstrapEpochRef: { current: 0 },
    browserOnline: true,
    canonicalQueue: new CanonicalOperationQueue(),
    canonicalStateFailureDetails: null,
    cityName: 'Aube',
    currentUserId: 'user-1',
    hasPendingImmigration: false,
    recoveryHeroes: [],
    isAutomationLeader: true,
    isAutomationLeaderRef: { current: true },
    isInitialGameLoadDone: true,
    ports: { requestBootstrap: bootstrapMocks.requestCanonicalBootstrap },
    publishAuthoritativeSnapshot: vi.fn(),
    setApiAvailable: vi.fn(),
    setCanonicalStateFailureDetails: vi.fn(),
    ...overrides,
  };
}

describe('town authority reconciliation hook', () => {
  beforeEach(() => {
    bootstrapMocks.requestCanonicalBootstrap.mockReset();
    bootstrapMocks.requestCanonicalBootstrap.mockResolvedValue(bootstrapEnvelope);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('reconciles pending immigration through the canonical queue', async () => {
    const dependencies = createDependencies({ hasPendingImmigration: true });

    renderHook(() => useTownAuthorityReconciliation(dependencies));

    await waitFor(() => {
      expect(bootstrapMocks.requestCanonicalBootstrap).toHaveBeenCalledWith('immigration');
    });
    expect(dependencies.applyAuthoritativeState).toHaveBeenCalledWith(
      canonicalState,
      4,
      'user-1',
      bootstrapEnvelope.serverTime,
      bootstrapEnvelope.lastProcessedAt,
    );
    expect(dependencies.publishAuthoritativeSnapshot).toHaveBeenCalledWith(bootstrapEnvelope);
  });

  it('drops an immigration reconciliation when authority advanced before execution', async () => {
    const dependencies = createDependencies({ hasPendingImmigration: true });

    renderHook(() => useTownAuthorityReconciliation(dependencies));
    dependencies.authorityGeneration.advance();
    await Promise.resolve();
    await Promise.resolve();

    expect(bootstrapMocks.requestCanonicalBootstrap).not.toHaveBeenCalled();
  });

  it('schedules one recovery deadline without a periodic interval', async () => {
    vi.useFakeTimers();
    const dependencies = createDependencies({
      recoveryHeroes: [{
        status: 'resting',
        currentHp: 19,
        currentMana: 20,
        calculatedStats: { maxHp: 20, maxMana: 20 },
      }],
    });
    const { rerender } = renderHook(() => useTownAuthorityReconciliation(dependencies));

    expect(vi.getTimerCount()).toBe(1);
    rerender();
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_500);
    });
    expect(bootstrapMocks.requestCanonicalBootstrap).toHaveBeenCalledWith('recovery');
  });

  it('suspends reconciliation while hidden and catches up once when visible', async () => {
    vi.useFakeTimers();
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    const dependencies = createDependencies({
      hasPendingImmigration: true,
      recoveryHeroes: [{
        status: 'resting',
        currentHp: 19,
        currentMana: 20,
        calculatedStats: { maxHp: 20, maxMana: 20 },
      }],
    });
    dependencies.applyAuthoritativeState = vi.fn(async () => {
      dependencies.hasPendingImmigration = false;
      dependencies.recoveryHeroes = [];
      return true;
    });
    const { unmount } = renderHook(() => useTownAuthorityReconciliation(dependencies));

    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(bootstrapMocks.requestCanonicalBootstrap).not.toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(bootstrapMocks.requestCanonicalBootstrap).toHaveBeenCalledTimes(1);
    expect(bootstrapMocks.requestCanonicalBootstrap).toHaveBeenCalledWith('visibility');

    unmount();
    visibility.mockRestore();
    expect(vi.getTimerCount()).toBe(0);
  });
});
