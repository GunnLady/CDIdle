import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import type { CanonicalGameState } from '../../shared/contracts/authoritative';
import type { GameApplicationPorts } from '../application/gameApplicationPorts';
import type { BattleLogEntry } from '../types';
import type { CanonicalStateFailure } from '../domain/canonicalStateFailure';
import type { AuthoritativeGameEnvelope } from '../domain/commands';
import { formatCanonicalIdleReport } from '../domain/idleReport';
import { shouldRefreshTownAuthority, type TownHeartbeatInput } from '../domain/townHeartbeat';
import { canonicalBootstrapOperationKey } from '../lib/canonicalBootstrap';
import type { CanonicalOperationQueue } from '../lib/canonicalOperationQueue';
import type { CanonicalAuthorityGeneration } from '../lib/canonicalReconciliation';
import { canonicalStateFailure } from '../lib/supabase';
import type { GameLogChannel } from './useGameLog';
import { useImmigrationReconciliation } from './useImmigrationReconciliation';

export const TOWN_AUTHORITY_HEARTBEAT_MS = 30_000;

type AddGameLog = (
  message: string,
  type?: BattleLogEntry['type'],
  channel?: GameLogChannel,
) => void;

export interface TownAuthorityReconciliationDependencies {
  addLog: AddGameLog;
  applyAuthoritativeState(
    state: CanonicalGameState,
    revision?: number,
    cacheUserId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
  ): Promise<boolean>;
  authorityGeneration: CanonicalAuthorityGeneration;
  bootstrapEpochRef: MutableRefObject<number>;
  browserOnline: boolean;
  canonicalQueue: CanonicalOperationQueue;
  canonicalStateFailureDetails: CanonicalStateFailure | null;
  cityName: string;
  currentUserId: string | null;
  hasPendingImmigration: boolean;
  heartbeat: TownHeartbeatInput;
  isAutomationLeader: boolean;
  isAutomationLeaderRef: MutableRefObject<boolean>;
  isInitialGameLoadDone: boolean;
  ports: Pick<GameApplicationPorts, 'requestBootstrap'>;
  publishAuthoritativeSnapshot(envelope: AuthoritativeGameEnvelope): void;
  setApiAvailable(available: boolean): void;
  setCanonicalStateFailureDetails(failure: CanonicalStateFailure | null): void;
}

export function useTownAuthorityReconciliation(
  dependencies: TownAuthorityReconciliationDependencies,
): void {
  const dependenciesRef = useRef(dependencies);
  dependenciesRef.current = dependencies;

  const reconcileTownAuthority = useCallback((
    reason: 'heartbeat' | 'immigration',
    skipWhenBusy: boolean,
    skipIfAuthorityAdvancedFrom?: number,
  ): Promise<void> | null => {
    const current = dependenciesRef.current;
    if (!current.isAutomationLeaderRef.current
      || !current.currentUserId
      || !current.browserOnline
      || !current.isInitialGameLoadDone
      || !current.cityName
      || current.canonicalStateFailureDetails) return null;

    const run = async ({ measureNetwork, measureApplication }: {
      measureNetwork<T>(operation: () => Promise<T>): Promise<T>;
      measureApplication<T>(operation: () => Promise<T>): Promise<T>;
    }) => {
      const latest = dependenciesRef.current;
      if (!latest.isAutomationLeaderRef.current) return;
      if (skipIfAuthorityAdvancedFrom !== undefined
        && !latest.authorityGeneration.isCurrent(skipIfAuthorityAdvancedFrom)) return;
      try {
        const parsed = await measureNetwork<AuthoritativeGameEnvelope>(
          () => latest.ports.requestBootstrap(reason),
        );
        const afterRequest = dependenciesRef.current;
        if (!afterRequest.isAutomationLeaderRef.current) return;
        await measureApplication(() => afterRequest.applyAuthoritativeState(
          parsed.state,
          parsed.revision,
          afterRequest.currentUserId ?? undefined,
          parsed.serverTime,
          parsed.lastProcessedAt,
        ));
        afterRequest.publishAuthoritativeSnapshot(parsed);
        const idleSummary = formatCanonicalIdleReport(parsed.idleReport);
        if (idleSummary) afterRequest.addLog(idleSummary, 'info', 'colony');
        afterRequest.setApiAvailable(true);
        afterRequest.setCanonicalStateFailureDetails(null);
      } catch (error) {
        const afterFailure = dependenciesRef.current;
        const stateFailure = canonicalStateFailure(error);
        if (stateFailure) afterFailure.setCanonicalStateFailureDetails(stateFailure);
        else afterFailure.setApiAvailable(false);
        throw error;
      }
    };
    const operationKey = canonicalBootstrapOperationKey(
      current.currentUserId,
      current.bootstrapEpochRef.current,
    );
    return skipWhenBusy
      ? current.canonicalQueue.tryEnqueueCoalescedBackground(
        operationKey,
        run,
        'bootstrap:' + reason,
      )
      : current.canonicalQueue.enqueueCoalescedBackground(
        operationKey,
        run,
        'bootstrap:' + reason,
      );
  }, []);

  const reconcilePendingImmigration = useCallback(
    (scheduledGeneration: number) => reconcileTownAuthority(
      'immigration',
      false,
      scheduledGeneration,
    ),
    [reconcileTownAuthority],
  );

  useImmigrationReconciliation({
    isAutomationLeader: dependencies.isAutomationLeader,
    hasPendingImmigration: dependencies.hasPendingImmigration,
    authorityGeneration: dependencies.authorityGeneration.current,
    reconcile: reconcilePendingImmigration,
  });

  const heartbeatRequired = dependencies.isAutomationLeader
    && Boolean(dependencies.currentUserId)
    && dependencies.browserOnline
    && dependencies.isInitialGameLoadDone
    && Boolean(dependencies.cityName)
    && !dependencies.canonicalStateFailureDetails
    && shouldRefreshTownAuthority(dependencies.heartbeat);

  useEffect(() => {
    if (!heartbeatRequired) return;
    const refresh = () => {
      const operation = reconcileTownAuthority('heartbeat', true);
      if (operation) void operation.catch(() => undefined);
    };
    const interval = window.setInterval(refresh, TOWN_AUTHORITY_HEARTBEAT_MS);
    return () => window.clearInterval(interval);
  }, [heartbeatRequired, reconcileTownAuthority]);
}
