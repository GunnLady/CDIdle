import { useCallback, useRef, type MutableRefObject } from 'react';
import type { CanonicalGameState } from '../../shared/contracts/authoritative';
import type { GameApplicationPorts } from '../application/gameApplicationPorts';
import type { BattleLogEntry } from '../types';
import type { CanonicalStateFailure } from '../domain/canonicalStateFailure';
import type { AuthoritativeGameEnvelope } from '../domain/commands';
import { formatCanonicalIdleReport } from '../domain/idleReport';
import { canonicalBootstrapOperationKey } from '../lib/canonicalBootstrap';
import type { CanonicalOperationContext } from '../lib/canonicalOperationQueue';
import {
  canonicalStateFailure,
  GameApiError,
} from '../lib/supabase';
import type { GameLogChannel } from './useGameLog';

type AddGameLog = (
  message: string,
  type?: BattleLogEntry['type'],
  channel?: GameLogChannel,
) => void;

export interface ManualCanonicalRefreshDependencies {
  addLog: AddGameLog;
  applyAuthoritativeState(
    state: CanonicalGameState,
    revision?: number,
    cacheUserId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
  ): Promise<boolean>;
  bootstrapEpochRef: MutableRefObject<number>;
  currentUserId: string | null;
  enqueueInteractiveCoalescedOperation(
    key: string,
    run: (context: CanonicalOperationContext) => Promise<void>,
    syncing?: boolean,
    label?: string,
  ): Promise<void> | null;
  isAutomationLeaderRef: MutableRefObject<boolean>;
  isOnline: boolean;
  ports: Pick<GameApplicationPorts, 'requestBootstrap'>;
  publishAuthoritativeSnapshot(envelope: AuthoritativeGameEnvelope): void;
  setApiAvailable(available: boolean): void;
  setCanonicalStateFailureDetails(failure: CanonicalStateFailure | null): void;
  showNotice(message: string): void;
}

export function useManualCanonicalRefresh(
  dependencies: ManualCanonicalRefreshDependencies,
): () => Promise<void> {
  const dependenciesRef = useRef(dependencies);
  dependenciesRef.current = dependencies;

  return useCallback(async () => {
    const current = dependenciesRef.current;
    if (!current.currentUserId || !current.isOnline) return;
    if (!current.isAutomationLeaderRef.current) {
      current.showNotice('Mode observateur : prenez le contrôle pour synchroniser.');
      return;
    }
    const userId = current.currentUserId;
    const operation = current.enqueueInteractiveCoalescedOperation(
      canonicalBootstrapOperationKey(userId, current.bootstrapEpochRef.current),
      async ({ measureNetwork, measureApplication }: CanonicalOperationContext) => {
        try {
          const parsed = await measureNetwork<AuthoritativeGameEnvelope>(
            () => current.ports.requestBootstrap('manual'),
          );
          const latest = dependenciesRef.current;
          await measureApplication(() => latest.applyAuthoritativeState(
            parsed.state,
            parsed.revision,
            userId,
            parsed.serverTime,
            parsed.lastProcessedAt,
          ));
          latest.publishAuthoritativeSnapshot(parsed);
          const idleSummary = formatCanonicalIdleReport(parsed.idleReport);
          if (idleSummary) latest.addLog(idleSummary, 'info', 'colony');
          latest.setApiAvailable(true);
          latest.setCanonicalStateFailureDetails(null);
        } catch (error) {
          const latest = dependenciesRef.current;
          const stateFailure = canonicalStateFailure(error);
          if (stateFailure) {
            latest.setCanonicalStateFailureDetails(stateFailure);
            latest.setApiAvailable(true);
          } else if (!(error instanceof GameApiError) || error.status >= 500) {
            latest.setApiAvailable(false);
          }
          throw error;
        }
      },
      true,
      'bootstrap:manual',
    );
    if (!operation) return;
    try {
      await operation;
      dependenciesRef.current.addLog(
        '🔄 État canonique actualisé depuis le serveur.',
        'victory',
      );
    } catch {
      dependenciesRef.current.addLog(
        'Échec de l’actualisation de l’état canonique.',
        'defeat',
      );
    }
  }, []);
}
