import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalGameState } from '../shared/contracts/authoritative';
import type { AuthoritativeCommandSuccess, AuthoritativeGameEnvelope } from '../src/domain/commands';
import type { AuthoritativeCommandDispatchDependencies } from '../src/hooks/useAuthoritativeCommandDispatch';
import { useAuthoritativeCommandDispatch } from '../src/hooks/useAuthoritativeCommandDispatch';
import { CanonicalOperationQueue, type CanonicalOperationContext } from '../src/lib/canonicalOperationQueue';
import { GameApiError } from '../src/lib/supabase';

const transportMocks = vi.hoisted(() => ({
  callGameApi: vi.fn(),
  requestCanonicalBootstrap: vi.fn(),
}));

vi.mock('../src/lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/supabase')>('../src/lib/supabase');
  return { ...actual, callGameApi: transportMocks.callGameApi };
});

vi.mock('../src/lib/canonicalBootstrap', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/canonicalBootstrap')>('../src/lib/canonicalBootstrap');
  return { ...actual, requestCanonicalBootstrap: transportMocks.requestCanonicalBootstrap };
});

const canonicalState = {} as CanonicalGameState;
const successEnvelope: AuthoritativeCommandSuccess = {
  ok: true,
  revision: 8,
  state: canonicalState,
  commandId: 'command-1',
  replayed: false,
  serverTime: '2026-08-09T12:00:00.000Z',
  lastProcessedAt: '2026-08-09T12:00:00.000Z',
  events: [],
};
const bootstrapEnvelope: AuthoritativeGameEnvelope = {
  schemaVersion: 1,
  revision: 9,
  state: canonicalState,
  serverTime: '2026-08-09T12:00:01.000Z',
  lastProcessedAt: '2026-08-09T12:00:01.000Z',
};

const immediateContext: CanonicalOperationContext = {
  measureNetwork: (operation) => operation(),
  measureApplication: (operation) => operation(),
};

function createDependencies(
  overrides: Partial<AuthoritativeCommandDispatchDependencies> = {},
): AuthoritativeCommandDispatchDependencies {
  return {
    addLog: vi.fn(),
    applyAuthoritativeState: vi.fn(async () => true),
    canonicalQueue: new CanonicalOperationQueue(),
    canonicalStateFailureDetails: null,
    currentUserId: 'user-1',
    enqueueInteractiveOperation: (run) => run(immediateContext),
    isAutomationLeaderRef: { current: true },
    isOnline: true,
    playEncounterTranscript: vi.fn(async () => undefined),
    ports: {
      requestBootstrap: transportMocks.requestCanonicalBootstrap,
      sendCommand: transportMocks.callGameApi,
    },
    publishAuthoritativeSnapshot: vi.fn(),
    revisionRef: { current: 7 },
    setApiAvailable: vi.fn(),
    setCanonicalStateFailureDetails: vi.fn(),
    showNotice: vi.fn(),
    ...overrides,
  };
}

describe('authoritative command dispatch hook', () => {
  beforeEach(() => {
    transportMocks.callGameApi.mockReset();
    transportMocks.requestCanonicalBootstrap.mockReset();
  });

  it('rejects an offline mutation before it reaches the operation queue', async () => {
    const enqueueInteractiveOperation = vi.fn();
    const dependencies = createDependencies({
      isOnline: false,
      enqueueInteractiveOperation,
    });
    const { result } = renderHook(() => useAuthoritativeCommandDispatch(dependencies));

    await expect(result.current({ type: 'dungeon.retreat' })).resolves.toBe(false);

    expect(enqueueInteractiveOperation).not.toHaveBeenCalled();
    expect(transportMocks.callGameApi).not.toHaveBeenCalled();
    expect(dependencies.addLog).toHaveBeenCalledWith(
      '📡 Mode hors connexion : mutation verrouillée.',
      'info',
    );
  });

  it('sends one versioned command and applies the authoritative response through injected boundaries', async () => {
    const order: string[] = [];
    transportMocks.callGameApi.mockResolvedValue(successEnvelope);
    const dependencies = createDependencies({
      applyAuthoritativeState: vi.fn(async () => {
        order.push('apply');
        return true;
      }),
      publishAuthoritativeSnapshot: vi.fn(() => order.push('publish')),
    });
    const { result } = renderHook(() => useAuthoritativeCommandDispatch(dependencies));

    let accepted = false;
    await act(async () => {
      accepted = await result.current(
        { type: 'dungeon.retreat' },
        { beforeApplyAuthoritativeState: () => order.push('acknowledge') },
      );
    });

    expect(accepted).toBe(true);
    expect(transportMocks.callGameApi).toHaveBeenCalledOnce();
    expect(transportMocks.callGameApi).toHaveBeenCalledWith(expect.objectContaining({
      expectedRevision: 7,
      command: { type: 'dungeon.retreat' },
    }));
    expect(dependencies.applyAuthoritativeState).toHaveBeenCalledWith(
      canonicalState,
      8,
      'user-1',
      successEnvelope.serverTime,
      successEnvelope.lastProcessedAt,
    );
    expect(order).toEqual(['acknowledge', 'apply', 'publish']);
  });

  it('accepts an idempotent replay as an authoritative success', async () => {
    const replayedEnvelope = { ...successEnvelope, replayed: true };
    transportMocks.callGameApi.mockResolvedValue(replayedEnvelope);
    const dependencies = createDependencies();
    const { result } = renderHook(() => useAuthoritativeCommandDispatch(dependencies));

    await expect(result.current({ type: 'dungeon.retreat' })).resolves.toBe(true);

    expect(dependencies.applyAuthoritativeState).toHaveBeenCalledWith(
      canonicalState,
      replayedEnvelope.revision,
      'user-1',
      replayedEnvelope.serverTime,
      replayedEnvelope.lastProcessedAt,
    );
    expect(dependencies.publishAuthoritativeSnapshot).toHaveBeenCalledWith(replayedEnvelope);
  });

  it('resynchronizes a revision conflict and exposes the optimistic retry boundary', async () => {
    transportMocks.callGameApi.mockRejectedValue(
      new GameApiError('Revision conflict', 409, 'REVISION_CONFLICT'),
    );
    transportMocks.requestCanonicalBootstrap.mockResolvedValue(bootstrapEnvelope);
    const onConflictResolved = vi.fn();
    const dependencies = createDependencies();
    const { result } = renderHook(() => useAuthoritativeCommandDispatch(dependencies));

    await expect(result.current(
      { type: 'dungeon.retreat' },
      { onConflictResolved },
    )).resolves.toBe(false);

    expect(transportMocks.requestCanonicalBootstrap).toHaveBeenCalledWith('conflict');
    expect(dependencies.applyAuthoritativeState).toHaveBeenCalledWith(
      canonicalState,
      9,
      'user-1',
      bootstrapEnvelope.serverTime,
      bootstrapEnvelope.lastProcessedAt,
    );
    expect(dependencies.publishAuthoritativeSnapshot).toHaveBeenCalledWith(bootstrapEnvelope);
    expect(dependencies.setApiAvailable).toHaveBeenCalledWith(true);
    expect(onConflictResolved).toHaveBeenCalledOnce();
  });

  it('resynchronizes a command already in progress without retrying it', async () => {
    transportMocks.callGameApi.mockRejectedValue(
      new GameApiError('Command already in progress', 409, 'COMMAND_IN_PROGRESS'),
    );
    transportMocks.requestCanonicalBootstrap.mockResolvedValue(bootstrapEnvelope);
    const onConflictResolved = vi.fn();
    const dependencies = createDependencies();
    const { result } = renderHook(() => useAuthoritativeCommandDispatch(dependencies));

    await expect(result.current(
      { type: 'dungeon.retreat' },
      { onConflictResolved },
    )).resolves.toBe(false);

    expect(transportMocks.requestCanonicalBootstrap).toHaveBeenCalledWith('conflict');
    expect(dependencies.publishAuthoritativeSnapshot).toHaveBeenCalledWith(bootstrapEnvelope);
    expect(dependencies.showNotice).toHaveBeenCalledWith(
      expect.stringContaining('resynchronis'),
    );
    expect(onConflictResolved).not.toHaveBeenCalled();
  });

  it('reports a business refusal without marking the API unavailable', async () => {
    transportMocks.callGameApi.mockRejectedValue(
      new GameApiError('Ressources insuffisantes', 400, 'INSUFFICIENT_RESOURCES'),
    );
    const dependencies = createDependencies();
    const { result } = renderHook(() => useAuthoritativeCommandDispatch(dependencies));

    await expect(result.current({ type: 'dungeon.retreat' })).resolves.toBe(false);

    expect(dependencies.setApiAvailable).not.toHaveBeenCalledWith(false);
    expect(dependencies.addLog).toHaveBeenCalledWith(
      '❌ Ressources insuffisantes.',
      'defeat',
    );
    expect(dependencies.showNotice).toHaveBeenCalledWith(
      'Action refusée : Ressources insuffisantes. L’état précédent a été restauré.',
    );
  });
});
