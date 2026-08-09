import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDeveloperCheatActions } from '../src/hooks/useDeveloperCheatActions';
import type { DispatchAuthoritativeCommand } from '../src/hooks/useAuthoritativeCommandDispatch';

function createDependencies(overrides: {
  cheatsAllowedForUser?: boolean;
  dispatchAuthoritativeCommand?: DispatchAuthoritativeCommand;
  isOnline?: boolean;
} = {}) {
  return {
    addLog: vi.fn(),
    cheatsAllowedForUser: overrides.cheatsAllowedForUser ?? true,
    dispatchAuthoritativeCommand: overrides.dispatchAuthoritativeCommand
      ?? vi.fn(async () => true),
    isOnline: overrides.isOnline ?? true,
  };
}

describe('developer cheat actions hook', () => {
  it('blocks developer mutations when the feature is unavailable', () => {
    const dependencies = createDependencies({ cheatsAllowedForUser: false });
    const { result } = renderHook(() => useDeveloperCheatActions(dependencies));

    act(() => result.current.handleApplyCheat());

    expect(dependencies.dispatchAuthoritativeCommand).not.toHaveBeenCalled();
    expect(dependencies.addLog).toHaveBeenCalledWith(
      '📡 Mode hors connexion : les mutations sont verrouillées.',
      'info',
    );
  });

  it('rejects an invalid command without dispatching', () => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useDeveloperCheatActions(dependencies));

    act(() => {
      result.current.setCheatInput('invalid');
    });
    act(() => result.current.handleApplyCheat());

    expect(dependencies.dispatchAuthoritativeCommand).not.toHaveBeenCalled();
    expect(dependencies.addLog).toHaveBeenCalledWith(
      '⚠️ Format invalide. Entrez par exemple : G 10000, A 50000, ou D 5',
      'defeat',
    );
  });

  it('dispatches a floor command and clears the input only after success', async () => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useDeveloperCheatActions(dependencies));

    act(() => result.current.setCheatInput('d 12'));
    act(() => result.current.handleApplyCheat());

    expect(dependencies.dispatchAuthoritativeCommand).toHaveBeenCalledWith({
      type: 'cheat.set_highest_floor',
      floor: 12,
    });
    await waitFor(() => expect(result.current.cheatInput).toBe(''));
  });

  it.each([
    {
      input: 'A 50',
      amounts: { gold: 50, food: 50, wood: 50, stone: 50, ore: 50 },
    },
    {
      input: 'N 25',
      amounts: { food: 25 },
    },
  ])('maps $input to canonical resource amounts', async ({ input, amounts }) => {
    const dependencies = createDependencies();
    const { result } = renderHook(() => useDeveloperCheatActions(dependencies));

    act(() => result.current.setCheatInput(input));
    act(() => result.current.handleApplyCheat());

    expect(dependencies.dispatchAuthoritativeCommand).toHaveBeenCalledWith({
      type: 'cheat.grant_resources',
      amounts,
    });
    await waitFor(() => expect(result.current.cheatInput).toBe(''));
  });
});
