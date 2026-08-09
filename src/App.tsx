/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
const CityDashboard = lazy(() => import("./components/city/CityDashboard"));
const DungeonPanel = lazy(() => import("./components/DungeonPanel"));
const HeroesPage = lazy(() => import("./components/heroes/HeroesPage"));
const AccountPanel = lazy(() => import("./components/AccountPanel"));
const RecruitmentOfferDialog = lazy(() => import("./components/heroes/RecruitmentOfferDialog"));
import AuthenticationPage from "./components/auth/AuthenticationPage";
import OnboardingPage from "./components/onboarding/OnboardingPage";
import EntryLoadingPage from "./components/onboarding/EntryLoadingPage";
import type { StartingFounderChoice } from "./domain/onboardingPresentation";
import ResourceHeader from "./components/app-shell/ResourceHeader";
import PrimaryNavigation from "./components/app-shell/PrimaryNavigation";
import DeveloperCheatPanel from "./components/app-shell/DeveloperCheatPanel";
import CanonicalStatusLayer from "./components/app-shell/CanonicalStatusLayer";
import AppShell from "./components/app-shell/AppShell";
import DungeonProgressBanner, { shouldShowDungeonProgressBanner } from "./components/app-shell/DungeonProgressBanner";
const StoragePanel = lazy(() => import("./components/StoragePanel"));
const VocationPrayerPrompt = lazy(() => import("./components/VocationPrayerPrompt"));
import {
  callGameApi,
  canonicalStateFailure,
  GameApiError,
  signInWithGoogle,
  signOut,
  type CanonicalStateFailure,
} from "./lib/supabase";
import { deleteGameCache, purgeLegacyGameCache } from "./lib/gameCache";
import type { CanonicalOperationContext } from "./lib/canonicalOperationQueue";
import {
  OptimisticCommandBuffer,
  shouldRetryOptimisticConflict,
} from "./lib/optimisticCommandBuffer";
import {
  applyAuthoritativeCommandSuccess,
  getAuthoritativeFailurePresentation,
  type AuthoritativeDispatchOptions,
} from "./lib/authoritativeCommandDispatch";
import { sendOptimisticCommandWithConflictRetry } from "./lib/optimisticCommandDispatch";
import type { AuthoritativeCommandSuccess, AuthoritativeGameEnvelope, GameCommand } from "./domain/commands";
import { createCommandEnvelope } from "./domain/commandEnvelope";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import { formatCanonicalIdleReport } from "./domain/idleReport";
import { createDungeonProgressBannerView } from "./domain/dungeonPresentation";
import { shouldRefreshTownAuthority } from "./domain/townHeartbeat";
import { canonicalBootstrapOperationKey, requestCanonicalBootstrap } from "./lib/canonicalBootstrap";
import { canMutateCanonicalState, canUseAccountDangerActions } from "./lib/canonicalMutationAccess";
import { formatCanonicalTownEvent } from "./domain/townEventLog";
import {
  ACTIVE_TAB_STORAGE_KEY,
  parseActiveTabPreference,
  type ActiveTab,
} from "./domain/activeTabPreference";

// Custom Hooks & Utilities
import { useGameLog } from "./hooks/useGameLog";
import {
  EMPTY_TOWN_RESOURCES,
  INITIAL_TOWN_BUILDINGS,
  INITIAL_TOWN_CITIZENS,
  useTownSystem,
} from "./hooks/useTownSystem";
import { useImmigrationReconciliation } from "./hooks/useImmigrationReconciliation";
import { useEncounterPlayback } from "./hooks/useEncounterPlayback";
import { useCanonicalOperations } from "./hooks/useCanonicalOperations";
import { useAutomationLeadership } from "./hooks/useAutomationLeadership";
import { useCanonicalSessionBootstrap } from "./hooks/useCanonicalSessionBootstrap";
import { useCanonicalSnapshot } from "./hooks/useCanonicalSnapshot";
import { useDungeonAutomation } from "./hooks/useDungeonAutomation";
import { useCrossTabAuthority } from "./hooks/useCrossTabAuthority";
import { useOptimisticCommands } from "./hooks/useOptimisticCommands";
import { DEFAULT_UNLOCKED_ITEM_BLUEPRINTS } from "./utils/gameCalculations";

const cheatsEnabled = import.meta.env.MODE === "development" || import.meta.env.MODE === "staging";
import { useDungeonSystem } from "./hooks/useDungeonSystem";


export default function App() {
  // Layout active tab controller (City, Heroes, Dungeon, Storage or Account)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window === "undefined") return "city";
    return parseActiveTabPreference(window.sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY));
  });
  const activeTabRef = useRef(activeTab);
  const {
    encounterPlayback,
    playEncounterTranscript,
    prepareEncounterPlayback,
    resetEncounterPlayback,
  } = useEncounterPlayback(activeTabRef);
  activeTabRef.current = activeTab;

  useEffect(() => {
    window.sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Supabase Auth and authoritative game API sync states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isInitialGameLoadDone, setIsInitialGameLoadDone] = useState<boolean>(false);
  const [browserOnline, setBrowserOnline] = useState<boolean>(() => typeof navigator === "undefined" || navigator.onLine);
  const [apiAvailable, setApiAvailable] = useState<boolean>(() => typeof navigator === "undefined" || navigator.onLine);
  const [canonicalStateFailureDetails, setCanonicalStateFailureDetails] = useState<CanonicalStateFailure | null>(null);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [crossTabNotice, setCrossTabNotice] = useState<{ id: number; message: string } | null>(null);
  const canonicalBootstrapEpochRef = useRef(0);
  const crossTabNoticeIdRef = useRef(0);
  const encounterHistoryRef = useRef<CanonicalDungeonEncounterRecord[]>([]);
  const dungeonAutomationResetRef = useRef<() => void>(() => undefined);
  const optimisticBufferRef = useRef<OptimisticCommandBuffer | null>(null);
  const optimisticResetRef = useRef<() => void>(() => undefined);
  const leadershipRefreshRef = useRef<(
    userId: string,
    context: CanonicalOperationContext,
    isCurrent: () => boolean,
  ) => Promise<void>>(async () => undefined);
  const transportOnline = browserOnline && apiAvailable;
  const isOnline = transportOnline && canonicalStateFailureDetails === null;
  // Google signup is gated by the server-side alpha_allowlist hook and every
  // game-api request is rechecked against the same allowlist at runtime.
  const cheatsAllowedForUser = cheatsEnabled && currentUser?.app_metadata?.provider === "google";

  const showCrossTabNotice = useCallback((message: string) => {
    crossTabNoticeIdRef.current += 1;
    setCrossTabNotice({ id: crossTabNoticeIdRef.current, message });
  }, []);

  const {
    canonicalQueue,
    enqueueInteractiveCoalescedOperation,
    enqueueInteractiveOperation,
    isSyncing,
    pendingUserCommandCount,
    resetPendingOperations,
    setIsSyncing,
    setOptimisticPendingCount,
  } = useCanonicalOperations(() => showCrossTabNotice("Action déjà en cours…"));
  const refreshLeadershipAuthority = useCallback(
    (userId: string, context: CanonicalOperationContext, isCurrent: () => boolean) => (
      leadershipRefreshRef.current(userId, context, isCurrent)
    ),
    [],
  );
  const {
    isAutomationLeader,
    isAutomationLeaderRef,
    isControlTransferPending,
    requestGameControl,
    resetAutomationLeadership,
  } = useAutomationLeadership({
    userId: currentUser ? String(currentUser.id) : null,
    ready: isInitialGameLoadDone,
    transportOnline,
    canonicalQueue,
    getBootstrapOperationKey: (userId) => canonicalBootstrapOperationKey(
      userId,
      canonicalBootstrapEpochRef.current,
    ),
    refreshAuthority: refreshLeadershipAuthority,
    onAuthorityAcquired: () => {
      setApiAvailable(true);
      setCanonicalStateFailureDetails(null);
    },
    onAuthorityFailure: () => setApiAvailable(false),
    showNotice: showCrossTabNotice,
  });
  const canMutate = canMutateCanonicalState({
    online: isOnline,
    authoritativeReady: isInitialGameLoadDone,
    automationLeader: isAutomationLeader,
  });
  const accountDangerActionsAvailable = canUseAccountDangerActions({
    browserOnline,
    transportOnline,
    authoritativeReady: isInitialGameLoadDone,
    automationLeader: isAutomationLeader,
    canonicalStateFailed: canonicalStateFailureDetails !== null,
  });
  const mutationBlockReason = canonicalStateFailureDetails
    ? "Sauvegarde incompatible : les mutations de jeu sont verrouillées."
    : !transportOnline
      ? "Service indisponible : les actions canoniques sont verrouillées."
      : !isInitialGameLoadDone
        ? "Chargement de l’état canonique en cours."
        : !isAutomationLeader
          ? "Mode observateur : prenez le contrôle pour agir."
          : undefined;
  const accountDangerActionBlockReason = accountDangerActionsAvailable
    ? undefined
    : !browserOnline || !transportOnline
      ? "Service indisponible : les actions de récupération sont verrouillées."
      : !isInitialGameLoadDone
        ? "Chargement de la session en cours."
        : !isAutomationLeader
          ? "Mode observateur : prenez le contrôle pour gérer le royaume."
          : undefined;

  useEffect(() => {
    if (!crossTabNotice) return;
    const timeout = window.setTimeout(() => setCrossTabNotice(null), 8_000);
    return () => window.clearTimeout(timeout);
  }, [crossTabNotice]);

  const [cheatInput, setCheatInput] = useState<string>("");

  // Hero customizer recruitment states
  const [pendingRecruitName, setPendingRecruitName] = useState<string | null>(null);
  const [isRecruitConfirmationPending, setIsRecruitConfirmationPending] = useState(false);

  // Custom Hooks
  const {
    dungeonLogs,
    colonyLogs,
    systemLogs,
    addLog,
    clearBattleLogs
  } = useGameLog();

  const {
    applyAuthoritativeState,
    authorityGeneration,
    clearCanonicalSnapshot,
    getLatestSnapshot,
    markUserDeleted,
    projection: canonicalProjection,
    renderOptimisticCommands: renderCanonicalOptimisticCommands,
    restoreConfirmedProjection,
    revisionRef: gameRevisionRef,
    timeAnchor: authoritativeTimeAnchor,
  } = useCanonicalSnapshot({
    getOptimisticCommands: () => optimisticBufferRef.current?.commands ?? [],
  });

  const cityName = canonicalProjection?.cityName ?? "";
  const currentEncounter = canonicalProjection?.currentEncounter ?? null;
  const encounterHistory = canonicalProjection?.encounterHistory ?? [];
  const pendingForge = canonicalProjection?.pendingForge ?? null;
  const pendingClassTransitions = canonicalProjection?.pendingClassTransitions ?? [];
  const onboardingCandidates = canonicalProjection?.onboardingCandidates ?? [];
  const pendingOnboardingCityName = canonicalProjection?.pendingOnboardingCityName ?? "";
  const canonicalPendingRecruit = canonicalProjection?.pendingRecruit ?? null;
  const pendingRecruit = canonicalPendingRecruit
    ? { ...canonicalPendingRecruit, name: pendingRecruitName ?? canonicalPendingRecruit.name }
    : null;
  encounterHistoryRef.current = encounterHistory;

  useEffect(() => {
    setPendingRecruitName(canonicalPendingRecruit?.name ?? null);
  }, [canonicalPendingRecruit?.id, canonicalPendingRecruit?.name]);

  const town = useTownSystem({
    currentUser,
    isOnline,
    timeAnchor: authoritativeTimeAnchor,
    resources: canonicalProjection?.resources ?? EMPTY_TOWN_RESOURCES,
    buildings: canonicalProjection?.buildings ?? INITIAL_TOWN_BUILDINGS,
    citizens: canonicalProjection?.citizens ?? INITIAL_TOWN_CITIZENS,
    totalCitizens: canonicalProjection?.totalCitizensCount ?? 3,
    citizenGrowthProgress: canonicalProjection?.citizenGrowthProgress ?? 0,
  });

  const dungeon = useDungeonSystem({
    highestFloorReached: canonicalProjection?.highestFloorReached ?? 1,
    currentUser,
    isOnline,
    timeAnchor: authoritativeTimeAnchor,
    heroes: canonicalProjection?.heroes ?? [],
    storedItems: canonicalProjection?.storedItems ?? [],
    forgeMaterials: canonicalProjection?.forgeMaterials ?? [],
    itemBlueprints: canonicalProjection?.itemBlueprints ?? DEFAULT_UNLOCKED_ITEM_BLUEPRINTS,
    activeDungeonFloor: canonicalProjection?.activeDungeonFloor ?? 1,
    activeDungeonRoom: canonicalProjection?.activeDungeonRoom ?? 1,
    autoExplore: canonicalProjection?.autoExplore ?? true,
  });

  const {
    buildings: townBuildings,
    getRates: getTownRates,
    resources: townResources,
    totalCitizens: townTotalCitizens,
  } = town;

  const clearClientGameState = useCallback(() => {
    optimisticResetRef.current();
    encounterHistoryRef.current = [];
    resetEncounterPlayback();
    setPendingRecruitName(null);
    clearBattleLogs();
    clearCanonicalSnapshot();
    dungeonAutomationResetRef.current();
    resetPendingOperations();
    setCanonicalStateFailureDetails(null);
    resetAutomationLeadership();
  }, [clearBattleLogs, clearCanonicalSnapshot, resetAutomationLeadership, resetEncounterPlayback, resetPendingOperations]);

  const canonicalSession = useCanonicalSessionBootstrap({
    reconnectNonce,
    canonicalQueue,
    bootstrapEpochRef: canonicalBootstrapEpochRef,
    applyAuthoritativeState,
    clearClientGameState,
    hasAuthoritativeSnapshot: () => getLatestSnapshot() !== null,
    setApiAvailable,
    setCanonicalStateFailureDetails,
    setCurrentUser,
    setInitialGameLoadDone: setIsInitialGameLoadDone,
    setIsAuthLoading,
    setIsSyncing,
    addLog,
  });

  useEffect(() => {
    const handleOffline = () => setBrowserOnline(false);
    const handleOnline = () => {
      canonicalSession.invalidate({ advanceEpoch: true });
      setBrowserOnline(true);
      setReconnectNonce((value) => value + 1);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [canonicalSession]);

  const { publishAccountDeleted, publishSnapshot } = useCrossTabAuthority({
    userId: currentUser ? String(currentUser.id) : null,
    ready: isInitialGameLoadDone,
    canonicalQueue,
    revisionRef: gameRevisionRef,
    getLatestSnapshot,
    applyIncomingSnapshot: async (snapshot, isCurrent) => {
      try {
        const incomingEncounter = snapshot.state.encounterHistory.at(-1);
        const previousEncounter = encounterHistoryRef.current.at(-1);
        const shouldPlayEncounter = Boolean(
          incomingEncounter && incomingEncounter.encounterId !== previousEncounter?.encounterId,
        );
        if (shouldPlayEncounter && incomingEncounter) prepareEncounterPlayback(incomingEncounter.encounterId);
        await applyAuthoritativeState(
          snapshot.state,
          snapshot.revision,
          String(currentUser?.id ?? ""),
          snapshot.serverTime,
          snapshot.lastProcessedAt,
        );
        if (!isCurrent()) return;
        setApiAvailable(true);
        setCanonicalStateFailureDetails(null);
        if (shouldPlayEncounter && incomingEncounter) void playEncounterTranscript(incomingEncounter);
      } catch (error) {
        if (!isCurrent()) return;
        const stateFailure = canonicalStateFailure(error);
        if (stateFailure) {
          setCanonicalStateFailureDetails(stateFailure);
          setApiAvailable(true);
        } else if (!(error instanceof GameApiError) || error.status >= 500) {
          setApiAvailable(false);
        }
        showCrossTabNotice("Échec de la mise à jour depuis un autre onglet.");
      }
    },
    onAccountDeleted: () => {
      if (!currentUser) return;
      const userId = String(currentUser.id);
      markUserDeleted(userId);
      canonicalSession.invalidate();
      clearClientGameState();
      void Promise.allSettled([
        deleteGameCache(userId),
        signOut().then((result) => {
          if (result.error) throw result.error;
        }),
      ]).then(([cacheResult, signOutResult]) => {
        const cacheFailed = cacheResult.status === "rejected";
        const signOutFailed = signOutResult.status === "rejected";
        if (cacheFailed) console.warn("Failed to purge the deleted account cache in another tab", cacheResult.reason);
        if (cacheFailed && signOutFailed) {
          showCrossTabNotice("Compte supprimé dans un autre onglet, mais le cache et la session locale n’ont pas pu être nettoyés.");
        } else if (cacheFailed) {
          showCrossTabNotice("Compte supprimé dans un autre onglet. Session fermée, cache local incomplètement purgé.");
        } else if (signOutFailed) {
          showCrossTabNotice("Compte supprimé dans un autre onglet, mais la session locale n’a pas pu être fermée.");
        } else {
          showCrossTabNotice("Compte supprimé dans un autre onglet. Cache purgé et session fermée.");
        }
      });
    },
  });

  const publishAuthoritativeSnapshot = useCallback((envelope: {
    revision: number;
    state: unknown;
    serverTime: string;
    lastProcessedAt: string;
  }) => {
    if (!Number.isInteger(envelope.revision)
      || !envelope.state
      || typeof envelope.state !== "object"
      || typeof envelope.serverTime !== "string"
      || typeof envelope.lastProcessedAt !== "string") return;
    publishSnapshot({
      revision: envelope.revision,
      state: envelope.state as Record<string, unknown>,
      serverTime: envelope.serverTime,
      lastProcessedAt: envelope.lastProcessedAt,
    });
  }, [publishSnapshot]);

  leadershipRefreshRef.current = async (userId, { measureNetwork, measureApplication }, isCurrent) => {
    const canonical = await measureNetwork(() => requestCanonicalBootstrap("leadership"));
    if (!isCurrent()) return;
    await measureApplication(() => applyAuthoritativeState(
      canonical.state,
      canonical.revision,
      userId,
      canonical.serverTime,
      canonical.lastProcessedAt,
    ));
    publishAuthoritativeSnapshot(canonical);
  };

  const dispatchAuthoritativeCommand = useCallback((
    command: GameCommand,
    options: AuthoritativeDispatchOptions = {},
  ): Promise<boolean> => {
    const interactive = options.interactive ?? true;
    if (canonicalStateFailureDetails) {
      addLog("Sauvegarde canonique incompatible : mutation verrouillée.", "defeat");
      return Promise.resolve(false);
    }
    if (!currentUser || !isOnline) {
      addLog("📡 Mode hors connexion : mutation verrouillée.", "info");
      return Promise.resolve(false);
    }
    if (!isAutomationLeaderRef.current) {
      showCrossTabNotice("Mode observateur : prenez le contrôle pour agir.");
      return Promise.resolve(false);
    }
    const runCommand = async ({ measureNetwork, measureApplication }: CanonicalOperationContext): Promise<{
      ok: boolean;
      playback?: Promise<void>;
    }> => {
      try {
        const commandId = crypto.randomUUID();
        const envelope = createCommandEnvelope(
          commandId,
          gameRevisionRef.current,
          command,
        );
        const result = await measureNetwork(() => callGameApi<AuthoritativeCommandSuccess>("/commands", {
          method: "POST",
          body: JSON.stringify(envelope),
        }));
        setCanonicalStateFailureDetails(null);
        const resolvedEncounter = (result?.events ?? [])
          .find((event) => event.type === "dungeon.encounter_resolved")
          ?.encounter as CanonicalDungeonEncounterRecord | undefined;
        await applyAuthoritativeCommandSuccess(
          result,
          options.beforeApplyAuthoritativeState,
          () => measureApplication(() => applyAuthoritativeState(
            result?.state,
            result?.revision,
            String(currentUser.id),
            result?.serverTime,
            result?.lastProcessedAt,
          )),
        );
        publishAuthoritativeSnapshot(result);
        for (const event of result?.events ?? []) {
          const townLog = formatCanonicalTownEvent(event);
          if (townLog && !options.silentSuccess) addLog(townLog.message, townLog.type, "colony");
          if (event?.type === "dungeon.encounter_started") addLog("⚔️ Une rencontre autoritaire a commencé.", "info", "dungeon");
          if (event?.type === "dungeon.retreat") addLog("🏕️ Repli tactique : l’escouade regagne le campement.", "info", "dungeon");
        }
        const playback = resolvedEncounter
          ? playEncounterTranscript(resolvedEncounter)
          : undefined;
        return { ok: true, ...(playback ? { playback } : {}) };
      } catch (error) {
        if (error instanceof GameApiError && error.status === 409) {
          const commandInProgress = error.code === "COMMAND_IN_PROGRESS";
          let reloadSucceeded = false;
          try {
            const canonical = await measureNetwork(() => requestCanonicalBootstrap("conflict"));
            await measureApplication(() => applyAuthoritativeState(canonical?.state, canonical?.revision, String(currentUser.id), canonical?.serverTime, canonical?.lastProcessedAt));
            publishAuthoritativeSnapshot(canonical);
            setApiAvailable(true);
            setCanonicalStateFailureDetails(null);
            reloadSucceeded = true;
          } catch (reloadError) {
            const stateFailure = canonicalStateFailure(reloadError);
            if (stateFailure) {
              setCanonicalStateFailureDetails(stateFailure);
              setApiAvailable(true);
            } else if (!(reloadError instanceof GameApiError) || reloadError.status >= 500) {
              setApiAvailable(false);
            }
            addLog(commandInProgress
              ? "Échec de la synchronisation de la commande déjà en cours."
              : "Échec du rechargement canonique après conflit.", "defeat");
          }
          if (reloadSucceeded && !options.silentConflict) {
            addLog(commandInProgress
              ? "⏳ Commande identique déjà en cours : synchronisation canonique."
              : "⚔️ Conflit de révision : rechargement de l’état canonique.", "info");
            showCrossTabNotice(commandInProgress
              ? "Une commande identique est déjà traitée dans une autre session. État resynchronisé."
              : "Action annulée : une autre session avait déjà modifié la partie. État resynchronisé.");
          } else if (!reloadSucceeded) {
            showCrossTabNotice("Conflit détecté, mais la resynchronisation a échoué. Réessayez dans quelques secondes.");
          }
          if (reloadSucceeded && shouldRetryOptimisticConflict(error.code)) {
            options.onConflictResolved?.();
          }
        } else {
          const stateFailure = canonicalStateFailure(error);
          if (stateFailure) {
            setCanonicalStateFailureDetails(stateFailure);
            setApiAvailable(true);
          } else if (!(error instanceof GameApiError) || error.status >= 500) {
            setApiAvailable(false);
          }
          const presentation = getAuthoritativeFailurePresentation({
            isBusinessRefusal: error instanceof GameApiError && error.status < 500,
            ...(error instanceof GameApiError ? { message: error.message } : {}),
          });
          addLog(presentation.logMessage, "defeat");
          showCrossTabNotice(presentation.notice);
        }
        return { ok: false };
      }
    };
    const operation = interactive
      ? enqueueInteractiveOperation(runCommand, false, `command:${command.type}`)
      : canonicalQueue.enqueueUser(runCommand, `command:${command.type}`);
    if (!operation) return Promise.resolve(false);
    return operation.then(async ({ ok, playback }) => {
      if (playback) await playback;
      return ok;
    });
  }, [addLog, applyAuthoritativeState, canonicalQueue, canonicalStateFailureDetails, currentUser, enqueueInteractiveOperation, gameRevisionRef, isAutomationLeaderRef, isOnline, playEncounterTranscript, publishAuthoritativeSnapshot, showCrossTabNotice]);

  const dungeonAutomation = useDungeonAutomation({
    activeFloor: dungeon.activeDungeonFloor,
    autoExplore: dungeon.autoExplore,
    currentEncounter,
    enabled: Boolean(currentUser && isOnline && isAutomationLeader),
    leaderRef: isAutomationLeaderRef,
    dispatchCommand: dispatchAuthoritativeCommand,
  });
  dungeonAutomationResetRef.current = dungeonAutomation.reset;

  const optimisticCommands = useOptimisticCommands({
    enabled: Boolean(currentUser && isOnline && isAutomationLeaderRef.current && !canonicalStateFailureDetails),
    bufferRef: optimisticBufferRef,
    onChange: (commands) => {
      renderCanonicalOptimisticCommands(commands);
      setOptimisticPendingCount(commands.length);
    },
    send: async (bufferedCommand, acknowledge) => {
      if (bufferedCommand.type === "dungeon.select_floor") await dungeonAutomation.waitUntilIdle();
      return sendOptimisticCommandWithConflictRetry(
        bufferedCommand,
        acknowledge,
        dispatchAuthoritativeCommand,
      );
    },
    onDisabled: () => {
      restoreConfirmedProjection();
      setOptimisticPendingCount(0);
    },
  });
  optimisticResetRef.current = optimisticCommands.reset;
  const enqueueOptimisticCommand = optimisticCommands.enqueue;

  const handleConfirmRecruit = () => {
    if (!pendingRecruit || isRecruitConfirmationPending) return;
    setIsRecruitConfirmationPending(true);
    void dispatchAuthoritativeCommand({
      type: "hero.recruit_confirm",
      name: pendingRecruit.name,
    }).finally(() => setIsRecruitConfirmationPending(false));
  };

  const handleCancelRecruit = () => {
    if (isRecruitConfirmationPending) return;
    void dispatchAuthoritativeCommand({ type: "hero.recruit_cancel" });
  };

  const handleUpdatePendingName = (name: string) => {
    if (!pendingRecruit) return;
    setPendingRecruitName(name);
  };

  const handleApplyCheat = useCallback(() => {
    if (!cheatsAllowedForUser || !isOnline) {
      addLog("📡 Mode hors connexion : les mutations sont verrouillées.", "info");
      return;
    }
    const code = cheatInput.trim().toUpperCase();
    const match = code.match(/^([GNBPMDA])\s+(\d+)$/);
    if (!match) {
      addLog("⚠️ Format invalide. Entrez par exemple : G 10000, A 50000, ou D 5", "defeat");
      return;
    }
    
    const letter = match[1];
    const amount = parseInt(match[2], 10);

    if (letter === "D") {
      void dispatchAuthoritativeCommand({ type: "cheat.set_highest_floor", floor: amount }).then((ok) => {
        if (!ok) return;
        addLog(`Triche serveur appliquée : étage maximal ${amount}.`, "victory");
        setCheatInput("");
      });
      return;
    }

    if (letter === "A") {
      void dispatchAuthoritativeCommand({ type: "cheat.grant_resources", amounts: { gold: amount, food: amount, wood: amount, stone: amount, ore: amount } }).then((ok) => {
        if (!ok) return;
        addLog(`Triche serveur appliquée : +${amount} à toutes les ressources.`, "victory");
        setCheatInput("");
      });
      return;
    }

    const resourceMap: Record<string, "gold" | "food" | "wood" | "stone" | "ore"> = {
      G: "gold",
      N: "food",
      B: "wood",
      P: "stone",
      M: "ore"
    };
    
    const resKey = resourceMap[letter];

    if (resKey) {
      void dispatchAuthoritativeCommand({ type: "cheat.grant_resources", amounts: { [resKey]: amount } }).then((ok) => {
        if (!ok) return;
        addLog(`Triche serveur appliquée : +${amount} ${resKey}.`, "victory");
        setCheatInput("");
      });
      return;
    }
  }, [cheatInput, addLog, isOnline, cheatsAllowedForUser, dispatchAuthoritativeCommand]);

  // Purge the legacy shared localStorage snapshot. Offline state is now
  // scoped per authenticated user in IndexedDB and remains read-only.
  useEffect(() => {
    void purgeLegacyGameCache();
    if (!currentUser) addLog("🔑 Veuillez vous connecter pour commencer la conquête de l'empire !", "info");
  }, [currentUser, addLog]);

  const reconcileTownAuthority = useCallback((
    reason: "heartbeat" | "immigration",
    skipWhenBusy: boolean,
    skipIfAuthorityAdvancedFrom?: number,
  ): Promise<void> | null => {
    if (!isAutomationLeaderRef.current || !currentUser || !browserOnline
      || !isInitialGameLoadDone || !cityName || canonicalStateFailureDetails) return null;
    const run = async ({ measureNetwork, measureApplication }: CanonicalOperationContext) => {
      if (!isAutomationLeaderRef.current) return;
      if (skipIfAuthorityAdvancedFrom !== undefined
        && !authorityGeneration.isCurrent(skipIfAuthorityAdvancedFrom)) return;
      try {
        const parsed = await measureNetwork(() => requestCanonicalBootstrap(reason));
        if (!isAutomationLeaderRef.current) return;
        await measureApplication(() => applyAuthoritativeState(
          parsed.state,
          parsed.revision,
          String(currentUser.id),
          parsed.serverTime,
          parsed.lastProcessedAt,
        ));
        publishAuthoritativeSnapshot(parsed);
        const idleSummary = formatCanonicalIdleReport(parsed.idleReport);
        if (idleSummary) addLog(idleSummary, "info", "colony");
        setApiAvailable(true);
        setCanonicalStateFailureDetails(null);
      } catch (error) {
        const stateFailure = canonicalStateFailure(error);
        if (stateFailure) setCanonicalStateFailureDetails(stateFailure);
        else setApiAvailable(false);
        throw error;
      }
    };
    const operationKey = canonicalBootstrapOperationKey(
      String(currentUser.id),
      canonicalBootstrapEpochRef.current,
    );
    return skipWhenBusy
      ? canonicalQueue.tryEnqueueCoalescedBackground(
        operationKey,
        run,
        `bootstrap:${reason}`,
      )
      : canonicalQueue.enqueueCoalescedBackground(
        operationKey,
        run,
        `bootstrap:${reason}`,
      );
  }, [
    addLog,
    applyAuthoritativeState,
    authorityGeneration,
    browserOnline,
    canonicalQueue,
    canonicalStateFailureDetails,
    cityName,
    currentUser,
    isInitialGameLoadDone,
    isAutomationLeaderRef,
    publishAuthoritativeSnapshot,
  ]);

  // A projected threshold never creates a local citizen. It schedules one
  // coalesced canonical reconciliation, after any player command already in
  // the queue, and the server response unlocks the new citizen.
  const reconcilePendingImmigration = useCallback((scheduledGeneration: number) =>
    reconcileTownAuthority("immigration", false, scheduledGeneration), [reconcileTownAuthority]);

  useImmigrationReconciliation({
    isAutomationLeader,
    hasPendingImmigration: town.hasPendingImmigration,
    authorityGeneration: authorityGeneration.current,
    reconcile: reconcilePendingImmigration,
  });

  // Refresh other active city progression from the authoritative clock. A
  // periodic heartbeat is skipped while unrelated canonical work is busy and
  // reuses an immigration reconciliation already in flight.
  useEffect(() => {
    if (!isAutomationLeader || !currentUser || !browserOnline || !isInitialGameLoadDone || !cityName || canonicalStateFailureDetails) return;
    const rates = getTownRates();
    if (!shouldRefreshTownAuthority({
      rates,
      food: townResources.food,
      totalCitizens: townTotalCitizens,
      habitationLevel: townBuildings.habitation ?? 0,
      heroes: dungeon.heroes,
    })) return;
    const refresh = () => {
      const operation = reconcileTownAuthority("heartbeat", true);
      if (operation) void operation.catch(() => undefined);
    };
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, [
    browserOnline,
    canonicalStateFailureDetails,
    cityName,
    currentUser,
    dungeon.heroes,
    getTownRates,
    isAutomationLeader,
    isInitialGameLoadDone,
    reconcileTownAuthority,
    townBuildings,
    townResources.food,
    townTotalCitizens,
  ]);

  const handleManualSaveCloud = useCallback(async () => {
    if (!currentUser || !isOnline) return;
    if (!isAutomationLeaderRef.current) {
      showCrossTabNotice("Mode observateur : prenez le contrôle pour synchroniser.");
      return;
    }
    const operation = enqueueInteractiveCoalescedOperation(
      canonicalBootstrapOperationKey(String(currentUser.id), canonicalBootstrapEpochRef.current),
      async ({ measureNetwork, measureApplication }) => {
      try {
        const parsed = await measureNetwork(() => requestCanonicalBootstrap("manual"));
        await measureApplication(() => applyAuthoritativeState(parsed?.state, parsed?.revision, String(currentUser.id), parsed?.serverTime, parsed?.lastProcessedAt));
        publishAuthoritativeSnapshot(parsed);
        const idleSummary = formatCanonicalIdleReport(parsed?.idleReport);
        if (idleSummary) addLog(idleSummary, "info", "colony");
        setApiAvailable(true);
        setCanonicalStateFailureDetails(null);
      } catch (error) {
        const stateFailure = canonicalStateFailure(error);
        if (stateFailure) {
          setCanonicalStateFailureDetails(stateFailure);
          setApiAvailable(true);
        } else if (!(error instanceof GameApiError) || error.status >= 500) {
          setApiAvailable(false);
        }
        throw error;
      }
    }, true, "bootstrap:manual");
    if (!operation) return;
    try {
      await operation;
      addLog("☁️ État canonique actualisé depuis le serveur.", "victory");
    } catch {
      addLog("Échec de l’actualisation de l’état canonique.", "defeat");
    }
  }, [addLog, applyAuthoritativeState, currentUser, enqueueInteractiveCoalescedOperation, isAutomationLeaderRef, isOnline, publishAuthoritativeSnapshot, showCrossTabNotice]);

  const handleAccountAuthenticate = useCallback(async () => {
    try {
      await signInWithGoogle();
      addLog("Authentification Google demandée.", "info");
    } catch (error) {
      addLog("Échec de la demande d’authentification Google.", "defeat");
      throw error;
    }
  }, [addLog]);

  const handleRequestStartingCandidates = useCallback((name: string) => (
    dispatchAuthoritativeCommand({ type: "onboarding.offer", cityName: name })
  ), [dispatchAuthoritativeCommand]);

  const handleConfirmStartingFounders = useCallback(async (founders: StartingFounderChoice[]) => {
    const completed = await dispatchAuthoritativeCommand({
      type: "onboarding.start",
      cityName: pendingOnboardingCityName,
      starterHeroes: founders,
    });
    if (completed) {
      addLog(`🏰 Cité de ${pendingOnboardingCityName} ralliée sous vos bannières !`, "victory", "colony");
      addLog(`🤝 ${founders.map((founder) => founder.name).join(" et ")} intègrent l’escouade du domaine.`, "victory", "colony");
    }
    return completed;
  }, [addLog, dispatchAuthoritativeCommand, pendingOnboardingCityName]);

  const handleAccountSignOut = useCallback(async () => {
    const result = await signOut();
    if (result.error) {
      addLog("Échec de la fermeture de la session cloud.", "defeat");
      throw result.error;
    }
    addLog("Session cloud fermée. Sauvegarde locale active.", "info");
  }, [addLog]);

  // Lock offline users to the Account panel
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      setActiveTab("account");
    }
  }, [isAuthLoading, currentUser]);

  const hardResetGame = async () => {
    if (!accountDangerActionsAvailable) {
      const reason = accountDangerActionBlockReason ?? "Remise à zéro momentanément indisponible.";
      addLog(reason, "info");
      showCrossTabNotice(`${reason} L’état actuel est conservé.`);
      return;
    }
    const operation = enqueueInteractiveOperation(async ({ measureNetwork }) => {
      let resetCacheUnsafe = false;
      try {
        if (currentUser) {
          const userId = String(currentUser.id);
          const reset = await measureNetwork(() => callGameApi<AuthoritativeGameEnvelope>("/reset", { method: "POST" }));
          let oldCachePurged = false;
          try {
            await deleteGameCache(userId);
            oldCachePurged = true;
          } catch (error) {
            console.warn("Failed to purge the pre-reset game cache", error);
          }
          const resetCachePersisted = await applyAuthoritativeState(
            reset?.state,
            reset?.revision,
            userId,
            reset?.serverTime,
            reset?.lastProcessedAt,
          );
          if (!oldCachePurged && !resetCachePersisted) {
            resetCacheUnsafe = true;
            showCrossTabNotice("Partie remise à zéro, mais l’ancien cache local n’a pas pu être neutralisé.");
          } else if (!resetCachePersisted) {
            showCrossTabNotice("Partie remise à zéro. Le cache hors ligne sera recréé à la prochaine synchronisation.");
          }
          publishAuthoritativeSnapshot(reset);
          setApiAvailable(true);
        }
        await purgeLegacyGameCache();

        // Clear transient UI after the canonical reset response was applied.
        clearBattleLogs();
        encounterHistoryRef.current = [];
        resetEncounterPlayback();
        setCanonicalStateFailureDetails(null);
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });

        addLog(resetCacheUnsafe
          ? "Remise à zéro serveur effectuée ; cache local non sécurisé."
          : "💣 Remise à zéro totale effectuée ! Créez une nouvelle cité.", "defeat");
      } catch (err) {
        console.error("Failed to reset Supabase savegame state", err);
        addLog("Échec de la remise à zéro : l’état actuel a été conservé.", "defeat");
        showCrossTabNotice("Échec de la remise à zéro : l’état actuel a été conservé.");
      }
    }, true);
    if (!operation) return;
    await operation;
  };

  const deleteAccount = async () => {
    if (!accountDangerActionsAvailable) {
      const reason = accountDangerActionBlockReason ?? "Suppression du compte momentanément indisponible.";
      addLog(reason, "info");
      showCrossTabNotice(reason);
      return;
    }
    const operation = enqueueInteractiveOperation(async ({ measureNetwork }) => {
      try {
        await measureNetwork(() => callGameApi("/account", { method: "DELETE" }));
        const deletedUserId = currentUser ? String(currentUser.id) : "";
        markUserDeleted(deletedUserId);
        canonicalSession.invalidate({ allowBootstrap: false });
        publishAccountDeleted();
        const cacheCleanup = await Promise.allSettled([
          deleteGameCache(deletedUserId),
          purgeLegacyGameCache(),
        ]);
        const cacheCleanupFailed = cacheCleanup.some((result) => result.status === "rejected");
        if (cacheCleanupFailed) {
          console.warn("Account deleted but the local game cache cleanup was incomplete");
          showCrossTabNotice("Compte supprimé, mais le cache local n’a pas pu être entièrement purgé.");
        }
        clearClientGameState();
        const signOutResult = await signOut();
        const signOutFailed = Boolean(signOutResult.error);
        if (signOutFailed) {
          console.warn("Account deleted but the local session could not be closed", signOutResult.error);
          showCrossTabNotice("Compte supprimé, mais la session locale n’a pas pu être fermée.");
        }
        addLog(cacheCleanupFailed || signOutFailed
          ? "Compte supprimé côté serveur ; nettoyage local incomplet."
          : "Compte et données supprimés définitivement.", "defeat");
      } catch (err) {
        console.error("Failed to delete account", err);
        addLog("Échec de la suppression du compte. Aucune donnée locale n’a été réinitialisée.", "defeat");
      }
    }, true);
    if (!operation) return;
    await operation;
  };

  // Canonical idle/health progression is applied by game-api. React only
  // requests and renders snapshots; it never computes a gameplay tick.

  if (isAuthLoading || !currentUser) {
    return <AuthenticationPage
      sessionLoading={isAuthLoading}
      onAuthenticate={handleAccountAuthenticate}
    />;
  }

  if (!isInitialGameLoadDone) return <EntryLoadingPage />;

  if (!canonicalStateFailureDetails && !cityName) {
    return <OnboardingPage
      candidates={onboardingCandidates}
      pendingCityName={pendingOnboardingCityName}
      canMutate={canMutate}
      mutationBlockReason={mutationBlockReason}
      controlTransferPending={isControlTransferPending}
      onRequestControl={transportOnline && !isAutomationLeader ? requestGameControl : undefined}
      onRequestCandidates={handleRequestStartingCandidates}
      onConfirmFounders={handleConfirmStartingFounders}
    />;
  }

  const activeRates = town.getRates();
  const dungeonProgressBannerView = createDungeonProgressBannerView({
    heroes: dungeon.displayHeroes,
    floor: dungeon.activeDungeonFloor,
    room: dungeon.activeDungeonRoom,
    autoExplore: dungeon.autoExplore,
    encounter: currentEncounter,
    isExploring: dungeonAutomation.isRunning,
    canMutate,
  });
  return (
    <>
      <AppShell
        header={<ResourceHeader cityName={cityName} authenticated={Boolean(currentUser)} resources={town.displayResources} rates={activeRates} accountActive={activeTab === "account"} onOpenAccount={() => setActiveTab("account")} />}
        statusLayer={<CanonicalStatusLayer
          authenticated={Boolean(currentUser)}
          failure={canonicalStateFailureDetails}
          transportOnline={transportOnline}
          online={isOnline}
          ready={isInitialGameLoadDone}
          automationLeader={isAutomationLeader}
          controlTransferPending={isControlTransferPending}
          notice={crossTabNotice?.message ?? null}
          onOpenAccount={() => setActiveTab("account")}
          onRequestControl={requestGameControl}
        />}
        developerTools={cheatsAllowedForUser && cityName ? <DeveloperCheatPanel value={cheatInput} canMutate={canMutate} onChange={setCheatInput} onApply={handleApplyCheat} /> : null}
        navigation={<PrimaryNavigation activeTab={activeTab} authenticated={Boolean(currentUser)} onChange={setActiveTab} />}
        progress={shouldShowDungeonProgressBanner(Boolean(currentUser), activeTab) ? (
          <DungeonProgressBanner
            view={dungeonProgressBannerView}
            onNavigate={setActiveTab}
            onToggleAutoExplore={() => {
              const enabled = !dungeon.autoExplore;
              dungeonAutomation.setBlocked(!enabled);
              enqueueOptimisticCommand("dungeon:auto", { type: "dungeon.auto_explore", enabled });
            }}
          />
        ) : null}
      >

        {/* TAB MAIN CONTENT CONTAINER */}
        <div className="h-full">
          <Suspense fallback={<div role="status" className="rounded-xl border border-[#5c402b]/60 bg-[#160f0a] p-6 text-center text-sm text-[#c5ad94]">Chargement de la vue…</div>}>
          
          {/* A. CITY TAB VIEW (TOWN INTERFACE) */}
          {activeTab === "city" && (
            <div className="w-full">
              <CityDashboard
                resources={town.displayResources}
                buildings={town.buildings}
                citizens={town.citizens}
                totalCitizensCount={town.displayTotalCitizens}
                onUpgradeBuilding={(buildingId) => {
                  enqueueOptimisticCommand(`building:${buildingId}`, { type: "building.upgrade", buildingId });
                }}
                onAllocateCitizen={(role, amount) => {
                  enqueueOptimisticCommand(`citizens:${role}`, { type: "citizens.allocate", role, amount });
                }}
                citizenGrowthProgress={town.displayCitizenGrowthProgress}
                highestFloorReached={dungeon.highestFloorReached}
                forgeMaterials={dungeon.forgeMaterials}
                itemBlueprints={dungeon.itemBlueprints}
                battleLogs={colonyLogs}
                onClearCityLogs={() => clearBattleLogs("colony")}
                canMutate={canMutate}
                pendingForge={pendingForge}
                onStartForge={(recipeId) => { void dispatchAuthoritativeCommand({ type: "forge.start", recipeId }); }}
                onFinalizeForge={(previewId, acceptUpgrade, chosenModifierStat) => { void dispatchAuthoritativeCommand({ type: "forge.finalize", previewId, acceptUpgrade, chosenModifierStat }); }}
                onCancelForge={(previewId) => { void dispatchAuthoritativeCommand({ type: "forge.cancel", previewId }); }}
              />
            </div>
          )}

          {/* B. HEROES TAB VIEW (HERO GUILD MANAGEMENT) */}
          {activeTab === "heroes" && (
            <div className="w-full">
              <HeroesPage
                heroes={dungeon.displayHeroes}
                resources={town.resources}
                buildings={town.buildings}
                activeDungeonFloor={dungeon.activeDungeonFloor}
                activeDungeonRoom={dungeon.activeDungeonRoom}
                canMutate={canMutate}
                onDismissHero={(heroId) => { void dispatchAuthoritativeCommand({ type: "hero.dismiss", heroId }); }}
                onToggleHeroActive={(heroId) => {
                  const hero = dungeon.heroes.find((entry) => entry.id === heroId);
                  if (hero) enqueueOptimisticCommand(`hero-activity:${heroId}`, { type: "hero.activity", heroId, active: !hero.isActive });
                }}
                onRecruitHero={() => { void dispatchAuthoritativeCommand({ type: "hero.recruit_offer" }); }}
                onUnequipItem={(heroId, slot) => {
                  enqueueOptimisticCommand(`equipment:${heroId}:${slot}`, { type: "hero.unequip", heroId, slot });
                }}
                onEquipItem={(heroId, instanceId) => {
                  enqueueOptimisticCommand(`equipment:${heroId}`, { type: "hero.equip", heroId, instanceId });
                }}
                storedItems={dungeon.storedItems}
                onGoToTab={setActiveTab}
              />
            </div>
          )}

          {/* C. DUNGEON TAB VIEW (CENTERED HIGH-PERFORMANCE COMBAT MONITOR) */}
          {activeTab === "dungeon" && (
            <div className="w-full">
              <DungeonPanel
                heroes={dungeon.displayHeroes}
                activeDungeonFloor={dungeon.activeDungeonFloor}
                activeDungeonRoom={dungeon.activeDungeonRoom}
                autoExplore={dungeon.autoExplore}
                battleLogs={dungeonLogs}
                highestFloorReached={dungeon.highestFloorReached}
                canMutate={canMutate}
                onToggleAutoExplore={() => {
                  const enabled = !dungeon.autoExplore;
                  dungeonAutomation.setBlocked(!enabled);
                  enqueueOptimisticCommand("dungeon:auto", { type: "dungeon.auto_explore", enabled });
                }}
                activeEncounter={currentEncounter}
                encounterHistory={encounterHistory}
                encounterPlayback={encounterPlayback}
                isExploring={dungeonAutomation.isRunning}
                onExplore={() => {
                  dungeonAutomation.setBlocked(false);
                  void dungeonAutomation.exploreAndResolve();
                }}
                onChangeFloor={(direction) => {
                  const floor = Math.min(
                    dungeon.highestFloorReached,
                    Math.max(1, dungeon.activeDungeonFloor + (direction === "next" ? 1 : -1)),
                  );
                  if (currentEncounter && !dungeonAutomation.isRunningRef.current) {
                    dungeonAutomation.setBlocked(false);
                    void dungeonAutomation.exploreAndResolve(false);
                  }
                  dungeonAutomation.setBlocked(true);
                  enqueueOptimisticCommand("dungeon:floor", { type: "dungeon.select_floor", floor });
                }}
                onRetreatParty={() => { void dungeonAutomation.retreat(); }}
                onToggleHeroActive={(heroId) => {
                  const hero = dungeon.heroes.find((entry) => entry.id === heroId);
                  if (hero) enqueueOptimisticCommand(`hero-activity:${heroId}`, { type: "hero.activity", heroId, active: !hero.isActive });
                }}
                onClearBattleLogs={() => clearBattleLogs("dungeon")}
                onResetLevel={() => {
                  void (async () => {
                    if (currentEncounter && !dungeonAutomation.isRunningRef.current) {
                      dungeonAutomation.setBlocked(false);
                      void dungeonAutomation.exploreAndResolve(false);
                    }
                    dungeonAutomation.setBlocked(true);
                    await dungeonAutomation.waitUntilIdle();
                    const reset = await dispatchAuthoritativeCommand({
                      type: "dungeon.select_floor",
                      floor: dungeon.activeDungeonFloor,
                    });
                    if (reset) {
                      clearBattleLogs("dungeon");
                      addLog(
                        "🔄 Étage réinitialisé : l'exploration reprend à la salle 1.",
                        "info",
                        "dungeon",
                      );
                    }
                  })();
                }}
              />
            </div>
          )}

          {/* D. ACCOUNT TAB VIEW (CLOUD USER ACCOUNT PROFILE & MANAGE) */}
          {activeTab === "account" && (
            <div className="w-full">
              <AccountPanel
                currentUser={currentUser}
                isSyncing={isSyncing}
                isCommandPending={pendingUserCommandCount > 0}
                canMutate={canMutate}
                canUseDangerActions={accountDangerActionsAvailable}
                mutationBlockReason={mutationBlockReason}
                dangerActionBlockReason={accountDangerActionBlockReason}
                resources={town.displayResources}
                buildings={town.buildings}
                totalCitizensCount={town.displayTotalCitizens}
                heroesCount={dungeon.displayHeroes.length}
                highestFloorReached={dungeon.highestFloorReached}
                onSaveCloud={handleManualSaveCloud}
                onHardReset={hardResetGame}
                onDeleteAccount={deleteAccount}
                onSignOut={handleAccountSignOut}
                systemLogs={systemLogs}
                onClearSystemLogs={() => clearBattleLogs("system")}
              />
            </div>
          )}

          {/* E. STORAGE TAB VIEW (GLOBAL CITY VAULT & EQUIPMENT PREVIEW) */}
          {activeTab === "storage" && (
            <div className="w-full">
              <StoragePanel
                storedItems={dungeon.storedItems}
                heroes={dungeon.heroes}
                onEquipItem={(heroId, instanceId) => {
                  enqueueOptimisticCommand(`equipment:${heroId}`, { type: "hero.equip", heroId, instanceId });
                }}
                isForgeUnlocked={(town.buildings["forge"] || 0) >= 1}
                onScrapItem={(instanceId) => { void dispatchAuthoritativeCommand({ type: "inventory.recycle", instanceId }); }}
                forgeMaterials={dungeon.forgeMaterials}
                canMutate={canMutate}
              />
            </div>
          )}
          </Suspense>
        </div>
      </AppShell>

      {/* 5. GORGEOUS CUSTOM RECRUITMENT MODAL */}
      {pendingClassTransitions.length > 0 && (() => {
        const pending = pendingClassTransitions[0];
        const hero = dungeon.heroes.find((entry) => entry.id === pending.heroId);
        return (
          <Suspense fallback={null}>
            <VocationPrayerPrompt
              pending={pending}
              hero={hero}
              disabled={pendingUserCommandCount > 0}
              readOnly={!isAutomationLeader}
              onChoose={(classType) => {
                void dispatchAuthoritativeCommand({
                  type: "hero.choose_vocation",
                  heroId: pending.heroId,
                  classType,
                });
              }}
            />
          </Suspense>
        );
      })()}

      {pendingRecruit && <Suspense fallback={null}>
        <RecruitmentOfferDialog
          candidate={pendingRecruit}
          editedName={pendingRecruit.name}
          heroCount={dungeon.heroes.length}
          pending={isRecruitConfirmationPending}
          readOnly={!canMutate}
          blockReason={mutationBlockReason}
          onNameChange={handleUpdatePendingName}
          onConfirm={handleConfirmRecruit}
          onCancel={handleCancelRecruit}
        />
      </Suspense>}

    </>
  );
}
