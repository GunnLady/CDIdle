import { useCallback, useRef, type MutableRefObject } from 'react';
import type {
  CanonicalDungeonEncounterRecord,
  CanonicalGameState,
} from '../../shared/contracts/authoritative';
import type { GameApplicationPorts } from '../application/gameApplicationPorts';
import type { BattleLogEntry } from '../types';
import type { CanonicalStateFailure } from '../domain/canonicalStateFailure';
import type { AuthoritativeGameEnvelope } from '../domain/commands';
import type { CanonicalOperationContext } from '../lib/canonicalOperationQueue';
import type { GameLogChannel } from './useGameLog';

type AddGameLog = (
  message: string,
  type?: BattleLogEntry['type'],
  channel?: GameLogChannel,
) => void;

export interface AccountRecoveryActionDependencies {
  accountDangerActionsAvailable: boolean;
  accountDangerActionBlockReason?: string;
  addLog: AddGameLog;
  applyAuthoritativeState(
    state: CanonicalGameState,
    revision?: number,
    cacheUserId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
  ): Promise<boolean>;
  clearBattleLogs(channel?: GameLogChannel): void;
  clearClientGameState(): void;
  currentUserId: string | null;
  encounterHistoryRef: MutableRefObject<CanonicalDungeonEncounterRecord[]>;
  enqueueInteractiveOperation<T>(
    run: (context: CanonicalOperationContext) => Promise<T>,
    syncing?: boolean,
    label?: string,
  ): Promise<T> | null;
  invalidateCanonicalSession(options?: { allowBootstrap?: boolean; advanceEpoch?: boolean }): void;
  markUserDeleted(userId: string): void;
  publishAccountDeleted(): void;
  publishAuthoritativeSnapshot(envelope: AuthoritativeGameEnvelope): void;
  ports: Pick<
    GameApplicationPorts,
    'deleteAccount' | 'deleteGameCache' | 'purgeLegacyGameCache' | 'resetGame' | 'signOut'
  >;
  resetEncounterPlayback(): void;
  setApiAvailable(available: boolean): void;
  setCanonicalStateFailureDetails(failure: CanonicalStateFailure | null): void;
  showNotice(message: string): void;
}

export function useAccountRecoveryActions(
  dependencies: AccountRecoveryActionDependencies,
) {
  const dependenciesRef = useRef(dependencies);
  dependenciesRef.current = dependencies;

  const hardResetGame = useCallback(async () => {
    const current = dependenciesRef.current;
    if (!current.accountDangerActionsAvailable) {
      const reason = current.accountDangerActionBlockReason
        ?? 'Remise à zéro momentanément indisponible.';
      current.addLog(reason, 'info');
      current.showNotice(reason + ' L’état actuel est conservé.');
      return;
    }
    const operation = current.enqueueInteractiveOperation(async ({ measureNetwork }) => {
      const latest = dependenciesRef.current;
      let resetCacheUnsafe = false;
      try {
        if (latest.currentUserId) {
          const userId = latest.currentUserId;
          const reset = await measureNetwork(() => latest.ports.resetGame());
          let oldCachePurged = false;
          try {
            await latest.ports.deleteGameCache(userId);
            oldCachePurged = true;
          } catch (error) {
            console.warn('Failed to purge the pre-reset game cache', error);
          }
          const resetCachePersisted = await latest.applyAuthoritativeState(
            reset.state,
            reset.revision,
            userId,
            reset.serverTime,
            reset.lastProcessedAt,
          );
          if (!oldCachePurged && !resetCachePersisted) {
            resetCacheUnsafe = true;
            latest.showNotice(
              'Partie remise à zéro, mais l’ancien cache local n’a pas pu être neutralisé.',
            );
          } else if (!resetCachePersisted) {
            latest.showNotice(
              'Partie remise à zéro. Le cache hors ligne sera recréé à la prochaine synchronisation.',
            );
          }
          latest.publishAuthoritativeSnapshot(reset);
          latest.setApiAvailable(true);
        }
        await latest.ports.purgeLegacyGameCache();

        latest.clearBattleLogs();
        latest.encounterHistoryRef.current = [];
        latest.resetEncounterPlayback();
        latest.setCanonicalStateFailureDetails(null);
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        });

        latest.addLog(
          resetCacheUnsafe
            ? 'Remise à zéro serveur effectuée ; cache local non sécurisé.'
            : '💣 Remise à zéro totale effectuée ! Créez une nouvelle cité.',
          'defeat',
        );
      } catch (error) {
        console.error('Failed to reset Supabase savegame state', error);
        latest.addLog(
          'Échec de la remise à zéro : l’état actuel a été conservé.',
          'defeat',
        );
        latest.showNotice(
          'Échec de la remise à zéro : l’état actuel a été conservé.',
        );
      }
    }, true);
    if (!operation) return;
    await operation;
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = dependenciesRef.current;
    if (!current.accountDangerActionsAvailable) {
      const reason = current.accountDangerActionBlockReason
        ?? 'Suppression du compte momentanément indisponible.';
      current.addLog(reason, 'info');
      current.showNotice(reason);
      return;
    }
    const operation = current.enqueueInteractiveOperation(async ({ measureNetwork }) => {
      const latest = dependenciesRef.current;
      try {
        await measureNetwork(() => latest.ports.deleteAccount());
        const deletedUserId = latest.currentUserId ?? '';
        latest.markUserDeleted(deletedUserId);
        latest.invalidateCanonicalSession({ allowBootstrap: false });
        latest.publishAccountDeleted();
        const cacheCleanup = await Promise.allSettled([
          latest.ports.deleteGameCache(deletedUserId),
          latest.ports.purgeLegacyGameCache(),
        ]);
        const cacheCleanupFailed = cacheCleanup.some(
          (result) => result.status === 'rejected',
        );
        if (cacheCleanupFailed) {
          console.warn('Account deleted but the local game cache cleanup was incomplete');
          latest.showNotice(
            'Compte supprimé, mais le cache local n’a pas pu être entièrement purgé.',
          );
        }
        latest.clearClientGameState();
        const signOutResult = await latest.ports.signOut();
        const signOutFailed = Boolean(signOutResult.error);
        if (signOutFailed) {
          console.warn(
            'Account deleted but the local session could not be closed',
            signOutResult.error,
          );
          latest.showNotice(
            'Compte supprimé, mais la session locale n’a pas pu être fermée.',
          );
        }
        latest.addLog(
          cacheCleanupFailed || signOutFailed
            ? 'Compte supprimé côté serveur ; nettoyage local incomplet.'
            : 'Compte et données supprimés définitivement.',
          'defeat',
        );
      } catch (error) {
        console.error('Failed to delete account', error);
        latest.addLog(
          'Échec de la suppression du compte. Aucune donnée locale n’a été réinitialisée.',
          'defeat',
        );
      }
    }, true);
    if (!operation) return;
    await operation;
  }, []);

  return { deleteAccount, hardResetGame };
}
