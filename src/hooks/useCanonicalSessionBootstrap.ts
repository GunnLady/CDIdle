import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { User } from "@supabase/supabase-js";
import type { CanonicalGameState } from "../../shared/contracts/authoritative";
import type { AuthoritativeGameEnvelope } from "../domain/commands";
import { formatCanonicalIdleReport } from "../domain/idleReport";
import { hydrateCanonicalBootstrapCache } from "../lib/bootstrapCacheHydration";
import { canonicalBootstrapOperationKey, requestCanonicalBootstrap } from "../lib/canonicalBootstrap";
import type { CanonicalOperationQueue } from "../lib/canonicalOperationQueue";
import { readGameCache } from "../lib/gameCache";
import {
  canonicalStateFailure,
  GameApiError,
  getAuthSnapshot,
  onAuthStateChange,
  type CanonicalStateFailure,
} from "../lib/supabase";

type LogKind = "info" | "victory" | "defeat";

export interface CanonicalSessionBootstrapOptions {
  reconnectNonce: number;
  canonicalQueue: CanonicalOperationQueue;
  bootstrapEpochRef: MutableRefObject<number>;
  applyAuthoritativeState(
    state: CanonicalGameState,
    revision?: number,
    userId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
    persistCache?: boolean,
  ): Promise<boolean>;
  clearClientGameState(): void;
  hasAuthoritativeSnapshot(): boolean;
  setApiAvailable(value: boolean): void;
  setCanonicalStateFailureDetails(value: CanonicalStateFailure | null): void;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  setInitialGameLoadDone(value: boolean): void;
  setIsAuthLoading(value: boolean): void;
  setIsSyncing(value: boolean): void;
  addLog(message: string, kind: LogKind, channel?: "colony"): void;
}

export interface CanonicalSessionBootstrapControl {
  invalidate(options?: { allowBootstrap?: boolean; advanceEpoch?: boolean }): void;
}

export function useCanonicalSessionBootstrap(
  options: CanonicalSessionBootstrapOptions,
): CanonicalSessionBootstrapControl {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const bootstrapUserRef = useRef<string | null>(null);
  const clientStateUserRef = useRef<string | null>(null);
  const authSnapshotGenerationRef = useRef(0);
  const controlRef = useRef<CanonicalSessionBootstrapControl | null>(null);
  if (!controlRef.current) {
    controlRef.current = {
      invalidate: (settings: { allowBootstrap?: boolean; advanceEpoch?: boolean } = {}) => {
        authSnapshotGenerationRef.current += 1;
        if (settings.allowBootstrap !== false) bootstrapUserRef.current = null;
        if (settings.advanceEpoch) optionsRef.current.bootstrapEpochRef.current += 1;
      },
    };
  }

  useEffect(() => {
    let active = true;
    const current = optionsRef.current;
    const applySnapshot = async (user: User | null) => {
      if (user && bootstrapUserRef.current === String(user.id)) return;
      const generation = ++authSnapshotGenerationRef.current;
      const isStale = () => !active || authSnapshotGenerationRef.current !== generation;
      const nextUserId = user ? String(user.id) : null;
      if (clientStateUserRef.current !== nextUserId) {
        current.bootstrapEpochRef.current += 1;
        current.clearClientGameState();
        clientStateUserRef.current = nextUserId;
      }
      if (user) bootstrapUserRef.current = String(user.id);
      current.setCurrentUser(user);
      current.setIsAuthLoading(false);

      if (!user) {
        bootstrapUserRef.current = null;
        current.setInitialGameLoadDone(true);
        current.addLog("🔑 Veuillez vous connecter pour commencer la conquête de l'empire !", "info");
        return;
      }

      current.setInitialGameLoadDone(false);
      let authoritativeReceived = false;
      let cacheApplied = false;
      const cacheHydration = hydrateCanonicalBootstrapCache({
        read: () => readGameCache(user.id),
        apply: async (cached, revision) => {
          await current.applyAuthoritativeState(cached, revision, String(user.id), undefined, undefined, false);
        },
        shouldIgnore: () => authoritativeReceived || isStale(),
        now: () => globalThis.performance?.now() ?? Date.now(),
        onMetrics: (metrics) => {
          if (import.meta.env.DEV || import.meta.env.MODE === "alpha") {
            console.info("Canonical bootstrap cache timing", metrics);
          }
        },
      })
        .then((outcome) => { cacheApplied = outcome === "applied"; })
        .catch(() => { cacheApplied = false; });

      try {
        current.setIsSyncing(true);
        const reason = current.reconnectNonce > 0 ? "reconnect" : "initial";
        let parsed: AuthoritativeGameEnvelope | null = null;
        await current.canonicalQueue.enqueueCoalescedBackground(
          canonicalBootstrapOperationKey(String(user.id), current.bootstrapEpochRef.current),
          async ({ measureNetwork, measureApplication }) => {
            const envelope = await measureNetwork(() => requestCanonicalBootstrap(reason));
            parsed = envelope;
            authoritativeReceived = true;
            if (!isStale() && envelope.state) {
              await measureApplication(() => current.applyAuthoritativeState(
                envelope.state,
                envelope.revision,
                String(user.id),
                envelope.serverTime,
                envelope.lastProcessedAt,
              ));
            }
          },
          `bootstrap:${reason}`,
        );
        authoritativeReceived = true;
        if (isStale()) return;
        current.setApiAvailable(true);
        current.setCanonicalStateFailureDetails(null);

        if (parsed) {
          const idleSummary = formatCanonicalIdleReport(parsed.idleReport);
          if (idleSummary) current.addLog(idleSummary, "info", "colony");
          current.addLog("☁️ Royaume synchronisé : Sauvegarde Supabase chargée avec succès !", "victory");
        } else if (!current.hasAuthoritativeSnapshot()) {
          current.addLog("👑 Bienvenue souverain ! Veuillez nommer votre cité pour fonder votre campement.", "info");
        }
      } catch (error) {
        if (isStale()) return;
        const isRevisionConflict = error instanceof GameApiError && error.status === 409;
        const stateFailure = canonicalStateFailure(error);
        if (stateFailure) {
          current.setCanonicalStateFailureDetails(stateFailure);
          current.setApiAvailable(true);
          console.error("Canonical game state rejected", error);
          current.addLog("Sauvegarde incompatible : mutations verrouillées. Réinitialisez la partie ou contactez l’assistance.", "defeat");
          return;
        }
        if (!isRevisionConflict) current.setApiAvailable(false);
        if (isRevisionConflict) {
          current.setApiAvailable(false);
          bootstrapUserRef.current = null;
          current.addLog("Synchronisation concurrente détectée. Rechargez la partie.", "info");
          return;
        }
        console.error("Supabase sync error", error);
        await cacheHydration;
        if (isStale()) return;
        current.addLog(
          cacheApplied
            ? "📖 Session hors connexion : cache local en lecture seule chargé."
            : "❌ Échec de la récupération des données Supabase.",
          cacheApplied ? "info" : "defeat",
        );
      } finally {
        void cacheHydration;
        if (!isStale()) {
          current.setIsSyncing(false);
          current.setInitialGameLoadDone(true);
        }
      }
    };

    getAuthSnapshot().then(({ user }) => { if (active) void applySnapshot(user); });
    const { data: subscription } = onAuthStateChange(({ user }) => {
      if (active) void applySnapshot(user);
    });
    return () => {
      active = false;
      authSnapshotGenerationRef.current += 1;
      subscription.subscription.unsubscribe();
    };
  }, [options.reconnectNonce]);

  return controlRef.current;
}
