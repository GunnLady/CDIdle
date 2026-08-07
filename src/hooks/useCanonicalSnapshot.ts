import { useCallback, useRef, useState } from "react";
import type { CanonicalGameState } from "../../shared/contracts/authoritative";
import type { OptimisticGameCommand } from "../domain/optimisticStateProjection";
import { createAuthoritativeTimeAnchor, type AuthoritativeTimeAnchor } from "../domain/authoritativeTimeProjection";
import type { CrossTabAuthoritySnapshot } from "../domain/crossTabAuthority";
import { projectOptimisticCommands } from "../domain/optimisticStateProjection";
import { CanonicalAuthorityGeneration } from "../lib/canonicalReconciliation";
import { writeGameCache } from "../lib/gameCache";

type CanonicalSnapshotRuntimeState = {
  confirmed: CrossTabAuthoritySnapshot | null;
  projection: CanonicalGameState | null;
  timeAnchor: AuthoritativeTimeAnchor | null;
};

const EMPTY_RUNTIME_STATE: CanonicalSnapshotRuntimeState = {
  confirmed: null,
  projection: null,
  timeAnchor: null,
};

export function useCanonicalSnapshot(options: {
  getOptimisticCommands(): OptimisticGameCommand[];
}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [runtimeState, setRuntimeState] = useState<CanonicalSnapshotRuntimeState>(EMPTY_RUNTIME_STATE);
  const runtimeStateRef = useRef(runtimeState);
  const revisionRef = useRef(0);
  const deletedUserIdsRef = useRef(new Set<string>());
  const authorityGenerationRef = useRef<CanonicalAuthorityGeneration | null>(null);
  if (!authorityGenerationRef.current) authorityGenerationRef.current = new CanonicalAuthorityGeneration();
  const authorityGeneration = authorityGenerationRef.current;

  const commitRuntimeState = useCallback((next: CanonicalSnapshotRuntimeState) => {
    runtimeStateRef.current = next;
    setRuntimeState(next);
  }, []);

  const applyAuthoritativeState = useCallback(async (
    state: CanonicalGameState,
    revision?: number,
    cacheUserId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
    persistCache = true,
  ): Promise<boolean> => {
    if (!state) return false;
    const userId = cacheUserId ? String(cacheUserId) : null;
    if (userId && deletedUserIdsRef.current.has(userId)) return false;
    authorityGeneration.advance();
    const canonicalRevision = Number.isInteger(revision) ? Number(revision) : revisionRef.current;
    const hasCompleteEnvelope = Number.isInteger(revision)
      && typeof serverTime === "string"
      && typeof lastProcessedAt === "string";
    const confirmed = hasCompleteEnvelope
      ? { revision: canonicalRevision, state, serverTime, lastProcessedAt }
      : runtimeStateRef.current.confirmed;
    const anchor = typeof serverTime === "string" && typeof lastProcessedAt === "string"
      ? createAuthoritativeTimeAnchor(serverTime, lastProcessedAt, globalThis.performance?.now() ?? 0)
      : null;
    const projection = projectOptimisticCommands(state, optionsRef.current.getOptimisticCommands());
    revisionRef.current = canonicalRevision;
    commitRuntimeState({
      confirmed,
      projection,
      timeAnchor: anchor ?? runtimeStateRef.current.timeAnchor,
    });

    if (userId && persistCache) {
      try {
        await writeGameCache(userId, { ...state, revision: canonicalRevision });
        return true;
      } catch (error) {
        console.warn("Failed to update the read-only game cache", error);
        return false;
      }
    }
    return true;
  }, [authorityGeneration, commitRuntimeState]);

  const renderOptimisticCommands = useCallback((commands: OptimisticGameCommand[]) => {
    const base = runtimeStateRef.current.confirmed?.state;
    if (!base) return;
    commitRuntimeState({
      ...runtimeStateRef.current,
      projection: projectOptimisticCommands(base, commands),
    });
  }, [commitRuntimeState]);

  const restoreConfirmedProjection = useCallback(() => {
    const confirmed = runtimeStateRef.current.confirmed;
    if (!confirmed) return;
    commitRuntimeState({ ...runtimeStateRef.current, projection: confirmed.state });
  }, [commitRuntimeState]);

  const clearCanonicalSnapshot = useCallback(() => {
    revisionRef.current = 0;
    runtimeStateRef.current = EMPTY_RUNTIME_STATE;
    setRuntimeState(EMPTY_RUNTIME_STATE);
  }, []);

  const markUserDeleted = useCallback((userId: string) => {
    deletedUserIdsRef.current.add(String(userId));
  }, []);

  const getLatestSnapshot = useCallback(() => runtimeStateRef.current.confirmed, []);

  return {
    applyAuthoritativeState,
    authorityGeneration,
    clearCanonicalSnapshot,
    getLatestSnapshot,
    markUserDeleted,
    projection: runtimeState.projection,
    renderOptimisticCommands,
    restoreConfirmedProjection,
    revisionRef,
    timeAnchor: runtimeState.timeAnchor,
  };
}
