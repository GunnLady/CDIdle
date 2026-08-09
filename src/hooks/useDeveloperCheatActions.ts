import { useCallback, useState } from 'react';
import type { BattleLogEntry } from '../types';
import type { DispatchAuthoritativeCommand } from './useAuthoritativeCommandDispatch';
import type { GameLogChannel } from './useGameLog';

type AddGameLog = (
  message: string,
  type?: BattleLogEntry['type'],
  channel?: GameLogChannel,
) => void;

export interface DeveloperCheatActionDependencies {
  addLog: AddGameLog;
  cheatsAllowedForUser: boolean;
  dispatchAuthoritativeCommand: DispatchAuthoritativeCommand;
  isOnline: boolean;
}

export function useDeveloperCheatActions(
  dependencies: DeveloperCheatActionDependencies,
) {
  const {
    addLog,
    cheatsAllowedForUser,
    dispatchAuthoritativeCommand,
    isOnline,
  } = dependencies;
  const [cheatInput, setCheatInput] = useState('');

  const handleApplyCheat = useCallback(() => {
    if (!cheatsAllowedForUser || !isOnline) {
      addLog('📡 Mode hors connexion : les mutations sont verrouillées.', 'info');
      return;
    }
    const code = cheatInput.trim().toUpperCase();
    const match = code.match(/^([GNBPMDA])\s+(\d+)$/);
    if (!match) {
      addLog(
        '⚠️ Format invalide. Entrez par exemple : G 10000, A 50000, ou D 5',
        'defeat',
      );
      return;
    }

    const letter = match[1];
    const amount = Number.parseInt(match[2], 10);

    if (letter === 'D') {
      void dispatchAuthoritativeCommand({
        type: 'cheat.set_highest_floor',
        floor: amount,
      }).then((ok) => {
        if (!ok) return;
        addLog('Triche serveur appliquée : étage maximal ' + amount + '.', 'victory');
        setCheatInput('');
      });
      return;
    }

    if (letter === 'A') {
      void dispatchAuthoritativeCommand({
        type: 'cheat.grant_resources',
        amounts: {
          gold: amount,
          food: amount,
          wood: amount,
          stone: amount,
          ore: amount,
        },
      }).then((ok) => {
        if (!ok) return;
        addLog(
          'Triche serveur appliquée : +' + amount + ' à toutes les ressources.',
          'victory',
        );
        setCheatInput('');
      });
      return;
    }

    const resourceMap: Record<string, 'gold' | 'food' | 'wood' | 'stone' | 'ore'> = {
      G: 'gold',
      N: 'food',
      B: 'wood',
      P: 'stone',
      M: 'ore',
    };
    const resource = resourceMap[letter];
    if (!resource) return;
    void dispatchAuthoritativeCommand({
      type: 'cheat.grant_resources',
      amounts: { [resource]: amount },
    }).then((ok) => {
      if (!ok) return;
      addLog(
        'Triche serveur appliquée : +' + amount + ' ' + resource + '.',
        'victory',
      );
      setCheatInput('');
    });
  }, [
    addLog,
    cheatInput,
    cheatsAllowedForUser,
    dispatchAuthoritativeCommand,
    isOnline,
  ]);

  return { cheatInput, handleApplyCheat, setCheatInput };
}
