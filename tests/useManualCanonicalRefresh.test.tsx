import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalGameState } from '../shared/contracts/authoritative';
import type { AuthoritativeGameEnvelope } from '../src/domain/commands';
import {
  useManualCanonicalRefresh,
  type ManualCanonicalRefreshDependencies,
} from '../src/hooks/useManualCanonicalRefresh';
import type { CanonicalOperationContext } from '../src/lib/canonicalOperationQueue';
import { GameApiError } from '../src/lib/supabase';

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
  revision: 5,
  state: canonicalState,
  serverTime: '2026-08-09T12:00:00.000Z',
  lastProcessedAt: '2026-08-09T12:00:00.000Z',
};
const immediateContext: CanonicalOperationContext = {
  measureNetwork: (operation) => operation(),
  measureApplication: (operation) => operation(),
};

function createDependencies(
  overrides: Partial<ManualCanonicalRefreshDependencies> = {},
): ManualCanonicalRefreshDependencies {
  return {
    addLog: vi.fn(),
    applyAuthoritativeState: vi.fn(async () => true),
    bootstrapEpochRef: { current: 2 },
    currentUserId: 'user-1',
    enqueueInteractiveCoalescedOperation: (_key, run) => run(immediateContext),
    isAutomationLeaderRef: { current: true },
    isOnline: true,
    ports: { requestBootstrap: bootstrapMocks.requestCanonicalBootstrap },
    publishAuthoritativeSnapshot: vi.fn(),
    setApiAvailable: vi.fn(),
    setCanonicalStateFailureDetails: vi.fn(),
    showNotice: vi.fn(),
    ...overrides,
  };
}

describe('manual canonical refresh hook', () => {
  beforeEach(() => {
    bootstrapMocks.requestCanonicalBootstrap.mockReset();
    bootstrapMocks.requestCanonicalBootstrap.mockResolvedValue(bootstrapEnvelope);
  });

  it('blocks an observer before enqueuing a refresh', async () => {
    const enqueueInteractiveCoalescedOperation = vi.fn();
    const dependencies = createDependencies({
      enqueueInteractiveCoalescedOperation,
      isAutomationLeaderRef: { current: false },
    });
    const { result } = renderHook(() => useManualCanonicalRefresh(dependencies));

    await result.current();

    expect(enqueueInteractiveCoalescedOperation).not.toHaveBeenCalled();
    expect(dependencies.showNotice).toHaveBeenCalledWith(
      'Mode observateur : prenez le contrôle pour synchroniser.',
    );
  });

  it('applies and publishes one manually refreshed authoritative snapshot', async () => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useManualCanonicalRefresh(dependencies));

    await result.current();

    expect(bootstrapMocks.requestCanonicalBootstrap).toHaveBeenCalledWith('manual');
    expect(dependencies.applyAuthoritativeState).toHaveBeenCalledWith(
      canonicalState,
      5,
      'user-1',
      bootstrapEnvelope.serverTime,
      bootstrapEnvelope.lastProcessedAt,
    );
    expect(dependencies.publishAuthoritativeSnapshot).toHaveBeenCalledWith(bootstrapEnvelope);
    expect(dependencies.addLog).toHaveBeenCalledWith(
      '🔄 État canonique actualisé depuis le serveur.',
      'victory',
    );
  });

  it('marks the API unavailable and keeps the failure visible when refresh fails', async () => {
    bootstrapMocks.requestCanonicalBootstrap.mockRejectedValue(
      new GameApiError('Backend unavailable', 503),
    );
    const dependencies = createDependencies();
    const { result } = renderHook(() => useManualCanonicalRefresh(dependencies));

    await result.current();

    expect(dependencies.setApiAvailable).toHaveBeenCalledWith(false);
    expect(dependencies.addLog).toHaveBeenCalledWith(
      'Échec de l’actualisation de l’état canonique.',
      'defeat',
    );
  });
});
