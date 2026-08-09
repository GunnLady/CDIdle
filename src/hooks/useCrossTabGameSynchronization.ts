import { useRef, type MutableRefObject } from 'react';
import type {
  CanonicalDungeonEncounterRecord,
  CanonicalGameState,
} from '../../shared/contracts/authoritative';
import type { GameApplicationPorts } from '../application/gameApplicationPorts';
import type {
  CrossTabAuthoritySnapshot,
} from '../domain/crossTabAuthority';
import type { CanonicalStateFailure } from '../domain/canonicalStateFailure';
import type { CanonicalOperationQueue } from '../lib/canonicalOperationQueue';
import {
  canonicalStateFailure,
  GameApiError,
} from '../lib/supabase';
import { useCrossTabAuthority } from './useCrossTabAuthority';

export interface CrossTabGameSynchronizationDependencies {
  applyAuthoritativeState(
    state: CanonicalGameState,
    revision?: number,
    cacheUserId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
  ): Promise<boolean>;
  canonicalQueue: CanonicalOperationQueue;
  clearClientGameState(): void;
  encounterHistoryRef: MutableRefObject<CanonicalDungeonEncounterRecord[]>;
  getLatestSnapshot(): CrossTabAuthoritySnapshot | null;
  invalidateCanonicalSession(): void;
  markUserDeleted(userId: string): void;
  playEncounterTranscript(encounter: CanonicalDungeonEncounterRecord): Promise<void>;
  prepareEncounterPlayback(encounterId: string): void;
  ports: Pick<GameApplicationPorts, 'deleteGameCache' | 'signOut'>;
  ready: boolean;
  revisionRef: MutableRefObject<number>;
  setApiAvailable(available: boolean): void;
  setCanonicalStateFailureDetails(failure: CanonicalStateFailure | null): void;
  showNotice(message: string): void;
  userId: string | null;
}

export function useCrossTabGameSynchronization(
  dependencies: CrossTabGameSynchronizationDependencies,
) {
  const dependenciesRef = useRef(dependencies);
  dependenciesRef.current = dependencies;

  return useCrossTabAuthority({
    userId: dependencies.userId,
    ready: dependencies.ready,
    canonicalQueue: dependencies.canonicalQueue,
    revisionRef: dependencies.revisionRef,
    getLatestSnapshot: dependencies.getLatestSnapshot,
    applyIncomingSnapshot: async (snapshot, isCurrent) => {
      const current = dependenciesRef.current;
      try {
        const incomingEncounter = snapshot.state.encounterHistory.at(-1);
        const previousEncounter = current.encounterHistoryRef.current.at(-1);
        const shouldPlayEncounter = Boolean(
          incomingEncounter
          && incomingEncounter.encounterId !== previousEncounter?.encounterId,
        );
        if (shouldPlayEncounter && incomingEncounter) {
          current.prepareEncounterPlayback(incomingEncounter.encounterId);
        }
        await current.applyAuthoritativeState(
          snapshot.state,
          snapshot.revision,
          current.userId ?? '',
          snapshot.serverTime,
          snapshot.lastProcessedAt,
        );
        if (!isCurrent()) return;
        const latest = dependenciesRef.current;
        latest.setApiAvailable(true);
        latest.setCanonicalStateFailureDetails(null);
        if (shouldPlayEncounter && incomingEncounter) {
          void latest.playEncounterTranscript(incomingEncounter);
        }
      } catch (error) {
        if (!isCurrent()) return;
        const latest = dependenciesRef.current;
        const stateFailure = canonicalStateFailure(error);
        if (stateFailure) {
          latest.setCanonicalStateFailureDetails(stateFailure);
          latest.setApiAvailable(true);
        } else if (!(error instanceof GameApiError) || error.status >= 500) {
          latest.setApiAvailable(false);
        }
        latest.showNotice('Échec de la mise à jour depuis un autre onglet.');
      }
    },
    onAccountDeleted: () => {
      const current = dependenciesRef.current;
      if (!current.userId) return;
      const userId = current.userId;
      current.markUserDeleted(userId);
      current.invalidateCanonicalSession();
      current.clearClientGameState();
      void Promise.allSettled([
        current.ports.deleteGameCache(userId),
        current.ports.signOut().then((result) => {
          if (result.error) throw result.error;
        }),
      ]).then(([cacheResult, signOutResult]) => {
        const latest = dependenciesRef.current;
        const cacheFailed = cacheResult.status === 'rejected';
        const signOutFailed = signOutResult.status === 'rejected';
        if (cacheFailed) {
          console.warn(
            'Failed to purge the deleted account cache in another tab',
            cacheResult.reason,
          );
        }
        if (cacheFailed && signOutFailed) {
          latest.showNotice(
            'Compte supprimé dans un autre onglet, mais le cache et la session locale n’ont pas pu être nettoyés.',
          );
        } else if (cacheFailed) {
          latest.showNotice(
            'Compte supprimé dans un autre onglet. Session fermée, cache local incomplètement purgé.',
          );
        } else if (signOutFailed) {
          latest.showNotice(
            'Compte supprimé dans un autre onglet, mais la session locale n’a pas pu être fermée.',
          );
        } else {
          latest.showNotice(
            'Compte supprimé dans un autre onglet. Cache purgé et session fermée.',
          );
        }
      });
    },
  });
}
