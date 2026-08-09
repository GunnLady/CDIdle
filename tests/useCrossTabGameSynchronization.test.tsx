import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CanonicalDungeonEncounterRecord,
  CanonicalGameState,
} from '../shared/contracts/authoritative';
import type { CrossTabAuthoritySnapshot } from '../src/domain/crossTabAuthority';
import {
  useCrossTabGameSynchronization,
  type CrossTabGameSynchronizationDependencies,
} from '../src/hooks/useCrossTabGameSynchronization';
import type { useCrossTabAuthority } from '../src/hooks/useCrossTabAuthority';
import { CanonicalOperationQueue } from '../src/lib/canonicalOperationQueue';

type CrossTabOptions = Parameters<typeof useCrossTabAuthority>[0];

const bridgeMocks = vi.hoisted(() => ({
  deleteGameCache: vi.fn(),
  options: null as unknown,
  publishAccountDeleted: vi.fn(),
  publishSnapshot: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../src/hooks/useCrossTabAuthority', () => ({
  useCrossTabAuthority: vi.fn((options) => {
    bridgeMocks.options = options;
    return {
      publishAccountDeleted: bridgeMocks.publishAccountDeleted,
      publishSnapshot: bridgeMocks.publishSnapshot,
    };
  }),
}));

vi.mock('../src/lib/gameCache', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/gameCache')>('../src/lib/gameCache');
  return { ...actual, deleteGameCache: bridgeMocks.deleteGameCache };
});

vi.mock('../src/lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/supabase')>('../src/lib/supabase');
  return { ...actual, signOut: bridgeMocks.signOut };
});

const encounter = {
  encounterId: 'encounter-2',
} as CanonicalDungeonEncounterRecord;
const snapshot: CrossTabAuthoritySnapshot = {
  revision: 3,
  state: {
    encounterHistory: [encounter],
  } as CanonicalGameState,
  serverTime: '2026-08-09T12:00:00.000Z',
  lastProcessedAt: '2026-08-09T12:00:00.000Z',
};

function createDependencies(
  overrides: Partial<CrossTabGameSynchronizationDependencies> = {},
): CrossTabGameSynchronizationDependencies {
  return {
    applyAuthoritativeState: vi.fn(async () => true),
    canonicalQueue: new CanonicalOperationQueue(),
    clearClientGameState: vi.fn(),
    encounterHistoryRef: { current: [] },
    getLatestSnapshot: vi.fn(() => null),
    invalidateCanonicalSession: vi.fn(),
    markUserDeleted: vi.fn(),
    playEncounterTranscript: vi.fn(async () => undefined),
    ports: {
      deleteGameCache: bridgeMocks.deleteGameCache,
      signOut: bridgeMocks.signOut,
    },
    prepareEncounterPlayback: vi.fn(),
    ready: true,
    revisionRef: { current: 2 },
    setApiAvailable: vi.fn(),
    setCanonicalStateFailureDetails: vi.fn(),
    showNotice: vi.fn(),
    userId: 'user-1',
    ...overrides,
  };
}

function capturedOptions(): CrossTabOptions {
  return bridgeMocks.options as CrossTabOptions;
}

describe('cross-tab game synchronization hook', () => {
  beforeEach(() => {
    bridgeMocks.options = null;
    bridgeMocks.deleteGameCache.mockReset();
    bridgeMocks.publishAccountDeleted.mockReset();
    bridgeMocks.publishSnapshot.mockReset();
    bridgeMocks.signOut.mockReset();
    bridgeMocks.deleteGameCache.mockResolvedValue(undefined);
    bridgeMocks.signOut.mockResolvedValue({ error: null });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('applies a newer snapshot before playing its new encounter', async () => {
    const order: string[] = [];
    const dependencies = createDependencies({
      applyAuthoritativeState: vi.fn(async () => {
        order.push('apply');
        return true;
      }),
      prepareEncounterPlayback: vi.fn(() => order.push('prepare')),
      playEncounterTranscript: vi.fn(async () => {
        order.push('play');
      }),
    });
    renderHook(() => useCrossTabGameSynchronization(dependencies));

    await capturedOptions().applyIncomingSnapshot(snapshot, () => true);

    expect(dependencies.applyAuthoritativeState).toHaveBeenCalledWith(
      snapshot.state,
      3,
      'user-1',
      snapshot.serverTime,
      snapshot.lastProcessedAt,
    );
    expect(order).toEqual(['prepare', 'apply', 'play']);
    expect(dependencies.setApiAvailable).toHaveBeenCalledWith(true);
  });

  it('does not publish UI success after the incoming subscription became stale', async () => {
    const dependencies = createDependencies();
    renderHook(() => useCrossTabGameSynchronization(dependencies));

    await capturedOptions().applyIncomingSnapshot(snapshot, () => false);

    expect(dependencies.applyAuthoritativeState).toHaveBeenCalledOnce();
    expect(dependencies.setApiAvailable).not.toHaveBeenCalled();
    expect(dependencies.playEncounterTranscript).not.toHaveBeenCalled();
  });

  it('invalidates and clears the local runtime when another tab deletes the account', async () => {
    const dependencies = createDependencies();
    renderHook(() => useCrossTabGameSynchronization(dependencies));

    capturedOptions().onAccountDeleted();

    expect(dependencies.markUserDeleted).toHaveBeenCalledWith('user-1');
    expect(dependencies.invalidateCanonicalSession).toHaveBeenCalledOnce();
    expect(dependencies.clearClientGameState).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(dependencies.showNotice).toHaveBeenCalledWith(
        'Compte supprimé dans un autre onglet. Cache purgé et session fermée.',
      );
    });
  });

  it('keeps both cleanup failures visible after a propagated deletion', async () => {
    bridgeMocks.deleteGameCache.mockRejectedValue(new Error('cache locked'));
    bridgeMocks.signOut.mockResolvedValue({ error: new Error('sign-out failed') });
    const dependencies = createDependencies();
    renderHook(() => useCrossTabGameSynchronization(dependencies));

    capturedOptions().onAccountDeleted();

    await waitFor(() => {
      expect(dependencies.showNotice).toHaveBeenCalledWith(
        'Compte supprimé dans un autre onglet, mais le cache et la session locale n’ont pas pu être nettoyés.',
      );
    });
  });
});
