import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalGameState } from '../shared/contracts/authoritative';
import type { AuthoritativeGameEnvelope } from '../src/domain/commands';
import {
  TOWN_AUTHORITY_HEARTBEAT_MS,
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
    heartbeat: {
      rates: { food: 0, wood: 0, stone: 0, ore: 0 },
      food: 0,
      totalCitizens: 3,
      habitationLevel: 1,
      heroes: [],
    },
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

  it('owns one heartbeat interval and reuses it across rerenders', async () => {
    vi.useFakeTimers();
    const dependencies = createDependencies({
      heartbeat: {
        rates: { food: 1, wood: 0, stone: 0, ore: 0 },
        food: 0,
        totalCitizens: 3,
        habitationLevel: 1,
        heroes: [],
      },
    });
    const { rerender } = renderHook(() => useTownAuthorityReconciliation(dependencies));

    expect(vi.getTimerCount()).toBe(1);
    rerender();
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TOWN_AUTHORITY_HEARTBEAT_MS);
    });
    expect(bootstrapMocks.requestCanonicalBootstrap).toHaveBeenCalledWith('heartbeat');
  });
});
