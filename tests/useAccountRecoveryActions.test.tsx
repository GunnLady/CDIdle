import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalGameState } from '../shared/contracts/authoritative';
import type { AuthoritativeGameEnvelope } from '../src/domain/commands';
import {
  useAccountRecoveryActions,
  type AccountRecoveryActionDependencies,
} from '../src/hooks/useAccountRecoveryActions';
import type { CanonicalOperationContext } from '../src/lib/canonicalOperationQueue';

const adapterMocks = vi.hoisted(() => ({
  callGameApi: vi.fn(),
  deleteGameCache: vi.fn(),
  purgeLegacyGameCache: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../src/lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/supabase')>('../src/lib/supabase');
  return {
    ...actual,
    callGameApi: adapterMocks.callGameApi,
    signOut: adapterMocks.signOut,
  };
});

vi.mock('../src/lib/gameCache', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/gameCache')>('../src/lib/gameCache');
  return {
    ...actual,
    deleteGameCache: adapterMocks.deleteGameCache,
    purgeLegacyGameCache: adapterMocks.purgeLegacyGameCache,
  };
});

const canonicalState = {} as CanonicalGameState;
const resetEnvelope: AuthoritativeGameEnvelope = {
  schemaVersion: 1,
  revision: 2,
  state: canonicalState,
  serverTime: '2026-08-09T12:00:00.000Z',
  lastProcessedAt: '2026-08-09T12:00:00.000Z',
};
const immediateContext: CanonicalOperationContext = {
  measureNetwork: (operation) => operation(),
  measureApplication: (operation) => operation(),
};

function createDependencies(
  overrides: Partial<AccountRecoveryActionDependencies> = {},
): AccountRecoveryActionDependencies {
  return {
    accountDangerActionsAvailable: true,
    addLog: vi.fn(),
    applyAuthoritativeState: vi.fn(async () => true),
    clearBattleLogs: vi.fn(),
    clearClientGameState: vi.fn(),
    currentUserId: 'user-1',
    encounterHistoryRef: { current: [] },
    enqueueInteractiveOperation: (run) => run(immediateContext),
    invalidateCanonicalSession: vi.fn(),
    markUserDeleted: vi.fn(),
    publishAccountDeleted: vi.fn(),
    publishAuthoritativeSnapshot: vi.fn(),
    ports: {
      deleteAccount: async () => {
        await adapterMocks.callGameApi('/account', { method: 'DELETE' });
      },
      deleteGameCache: adapterMocks.deleteGameCache,
      purgeLegacyGameCache: adapterMocks.purgeLegacyGameCache,
      resetGame: () => adapterMocks.callGameApi('/reset', { method: 'POST' }),
      signOut: adapterMocks.signOut,
    },
    resetEncounterPlayback: vi.fn(),
    setApiAvailable: vi.fn(),
    setCanonicalStateFailureDetails: vi.fn(),
    showNotice: vi.fn(),
    ...overrides,
  };
}

describe('account recovery actions hook', () => {
  beforeEach(() => {
    adapterMocks.callGameApi.mockReset();
    adapterMocks.deleteGameCache.mockReset();
    adapterMocks.purgeLegacyGameCache.mockReset();
    adapterMocks.signOut.mockReset();
    adapterMocks.deleteGameCache.mockResolvedValue(undefined);
    adapterMocks.purgeLegacyGameCache.mockResolvedValue(undefined);
    adapterMocks.signOut.mockResolvedValue({ error: null });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  });

  it('resets server state before replacing cache and transient UI', async () => {
    const order: string[] = [];
    adapterMocks.callGameApi.mockImplementation(async () => {
      order.push('server-reset');
      return resetEnvelope;
    });
    adapterMocks.deleteGameCache.mockImplementation(async () => {
      order.push('delete-old-cache');
    });
    adapterMocks.purgeLegacyGameCache.mockImplementation(async () => {
      order.push('purge-legacy-cache');
    });
    const dependencies = createDependencies({
      applyAuthoritativeState: vi.fn(async () => {
        order.push('apply-reset');
        return true;
      }),
      publishAuthoritativeSnapshot: vi.fn(() => order.push('publish-reset')),
      clearBattleLogs: vi.fn(() => order.push('clear-ui')),
    });
    const { result } = renderHook(() => useAccountRecoveryActions(dependencies));

    await result.current.hardResetGame();

    expect(adapterMocks.callGameApi).toHaveBeenCalledWith('/reset', { method: 'POST' });
    expect(order).toEqual([
      'server-reset',
      'delete-old-cache',
      'apply-reset',
      'publish-reset',
      'purge-legacy-cache',
      'clear-ui',
    ]);
  });

  it('keeps a reset cache hazard visible when neither purge nor persistence succeeds', async () => {
    adapterMocks.callGameApi.mockResolvedValue(resetEnvelope);
    adapterMocks.deleteGameCache.mockRejectedValue(new Error('cache locked'));
    const dependencies = createDependencies({
      applyAuthoritativeState: vi.fn(async () => false),
    });
    const { result } = renderHook(() => useAccountRecoveryActions(dependencies));

    await result.current.hardResetGame();

    expect(dependencies.showNotice).toHaveBeenCalledWith(
      'Partie remise à zéro, mais l’ancien cache local n’a pas pu être neutralisé.',
    );
    expect(dependencies.addLog).toHaveBeenCalledWith(
      'Remise à zéro serveur effectuée ; cache local non sécurisé.',
      'defeat',
    );
  });

  it('invalidates authority before local cleanup after server account deletion', async () => {
    const order: string[] = [];
    adapterMocks.callGameApi.mockImplementation(async () => {
      order.push('server-delete');
      return {};
    });
    adapterMocks.deleteGameCache.mockImplementation(async () => {
      order.push('delete-cache');
    });
    adapterMocks.purgeLegacyGameCache.mockImplementation(async () => {
      order.push('purge-legacy');
    });
    adapterMocks.signOut.mockImplementation(async () => {
      order.push('sign-out');
      return { error: null };
    });
    const dependencies = createDependencies({
      markUserDeleted: vi.fn(() => order.push('mark-deleted')),
      invalidateCanonicalSession: vi.fn(() => order.push('invalidate-session')),
      publishAccountDeleted: vi.fn(() => order.push('publish-deleted')),
      clearClientGameState: vi.fn(() => order.push('clear-client')),
    });
    const { result } = renderHook(() => useAccountRecoveryActions(dependencies));

    await result.current.deleteAccount();

    expect(order).toEqual([
      'server-delete',
      'mark-deleted',
      'invalidate-session',
      'publish-deleted',
      'delete-cache',
      'purge-legacy',
      'clear-client',
      'sign-out',
    ]);
  });

  it('does not erase local state when server account deletion fails', async () => {
    adapterMocks.callGameApi.mockRejectedValue(new Error('server unavailable'));
    const dependencies = createDependencies();
    const { result } = renderHook(() => useAccountRecoveryActions(dependencies));

    await result.current.deleteAccount();

    expect(dependencies.markUserDeleted).not.toHaveBeenCalled();
    expect(dependencies.clearClientGameState).not.toHaveBeenCalled();
    expect(adapterMocks.signOut).not.toHaveBeenCalled();
    expect(dependencies.addLog).toHaveBeenCalledWith(
      'Échec de la suppression du compte. Aucune donnée locale n’a été réinitialisée.',
      'defeat',
    );
  });
});
