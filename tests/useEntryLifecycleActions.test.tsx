import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalHero } from '../shared/contracts/authoritative';
import { useEntryLifecycleActions } from '../src/hooks/useEntryLifecycleActions';
import type { DispatchAuthoritativeCommand } from '../src/hooks/useAuthoritativeCommandDispatch';

const authMocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../src/lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/supabase')>('../src/lib/supabase');
  return {
    ...actual,
    signInWithGoogle: authMocks.signInWithGoogle,
    signOut: authMocks.signOut,
  };
});

const canonicalRecruit = {
  id: 'hero-recruit-1',
  name: 'Ariane',
} as CanonicalHero;

function createOptions(overrides: {
  dispatchAuthoritativeCommand?: DispatchAuthoritativeCommand;
  canonicalPendingRecruit?: CanonicalHero | null;
  pendingOnboardingCityName?: string;
} = {}) {
  return {
    addLog: vi.fn(),
    canonicalPendingRecruit: overrides.canonicalPendingRecruit === undefined
      ? canonicalRecruit
      : overrides.canonicalPendingRecruit,
    dispatchAuthoritativeCommand: overrides.dispatchAuthoritativeCommand
      ?? vi.fn(async () => true),
    pendingOnboardingCityName: overrides.pendingOnboardingCityName ?? 'Aube',
    ports: {
      signInWithGoogle: authMocks.signInWithGoogle,
      signOut: authMocks.signOut,
    },
  };
}

describe('entry lifecycle actions hook', () => {
  beforeEach(() => {
    authMocks.signInWithGoogle.mockReset();
    authMocks.signOut.mockReset();
    authMocks.signInWithGoogle.mockResolvedValue(undefined);
    authMocks.signOut.mockResolvedValue({ error: null });
  });

  it('offers candidates and confirms founders through typed canonical commands', async () => {
    const options = createOptions();
    const { result } = renderHook(() => useEntryLifecycleActions(options));
    const founders = [
      { id: 'hero-1', name: 'Ariane' },
      { id: 'hero-2', name: 'Bérénice' },
    ];

    await expect(result.current.handleRequestStartingCandidates('Aube')).resolves.toBe(true);
    await expect(result.current.handleConfirmStartingFounders(founders)).resolves.toBe(true);

    expect(options.dispatchAuthoritativeCommand).toHaveBeenNthCalledWith(1, {
      type: 'onboarding.offer',
      cityName: 'Aube',
    });
    expect(options.dispatchAuthoritativeCommand).toHaveBeenNthCalledWith(2, {
      type: 'onboarding.start',
      cityName: 'Aube',
      starterHeroes: founders,
    });
    expect(options.addLog).toHaveBeenCalledWith(
      '🏰 Cité de Aube ralliée sous vos bannières !',
      'victory',
      'colony',
    );
  });

  it('keeps the edited recruit name local until canonical confirmation', async () => {
    const options = createOptions();
    const { result } = renderHook(() => useEntryLifecycleActions(options));
    await waitFor(() => expect(result.current.pendingRecruit?.name).toBe('Ariane'));

    act(() => result.current.handleUpdatePendingName('Nora'));
    expect(result.current.pendingRecruit?.name).toBe('Nora');

    act(() => result.current.handleConfirmRecruit());
    await waitFor(() => expect(result.current.isRecruitConfirmationPending).toBe(false));
    expect(options.dispatchAuthoritativeCommand).toHaveBeenCalledWith({
      type: 'hero.recruit_confirm',
      name: 'Nora',
    });
  });

  it('reports successful authentication and sign-out without owning the session', async () => {
    const options = createOptions();
    const { result } = renderHook(() => useEntryLifecycleActions(options));

    await result.current.handleAccountAuthenticate();
    await result.current.handleAccountSignOut();

    expect(authMocks.signInWithGoogle).toHaveBeenCalledOnce();
    expect(authMocks.signOut).toHaveBeenCalledOnce();
    expect(options.addLog).toHaveBeenCalledWith('Authentification Google demandée.', 'info');
    expect(options.addLog).toHaveBeenCalledWith(
      'Session fermée. Cache local conservé.',
      'info',
    );
  });

  it('logs and rethrows a sign-out failure for the page boundary', async () => {
    const error = new Error('sign-out failed');
    authMocks.signOut.mockResolvedValue({ error });
    const options = createOptions();
    const { result } = renderHook(() => useEntryLifecycleActions(options));

    await expect(result.current.handleAccountSignOut()).rejects.toBe(error);
    expect(options.addLog).toHaveBeenCalledWith(
      'Échec de la fermeture de la session.',
      'defeat',
    );
  });
});
