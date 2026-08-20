/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { gameApplicationPorts } from "./application/gameApplicationPorts";
const CityDashboard = lazy(() => import("./components/city/CityDashboard"));
const DungeonPanel = lazy(() => import("./components/DungeonPanel"));
const HeroesPage = lazy(() => import("./components/heroes/HeroesPage"));
const AccountPanel = lazy(() => import("./components/AccountPanel"));
const RecruitmentOfferDialog = lazy(() => import("./components/heroes/RecruitmentOfferDialog"));
import AuthenticationPage from "./components/auth/AuthenticationPage";
import OnboardingPage from "./components/onboarding/OnboardingPage";
import EntryLoadingPage from "./components/onboarding/EntryLoadingPage";
import ResourceHeader from "./components/app-shell/ResourceHeader";
import PrimaryNavigation from "./components/app-shell/PrimaryNavigation";
import DeveloperCheatPanel from "./components/app-shell/DeveloperCheatPanel";
import CanonicalStatusLayer from "./components/app-shell/CanonicalStatusLayer";
import AppShell from "./components/app-shell/AppShell";
import DungeonProgressBanner, { shouldShowDungeonProgressBanner } from "./components/app-shell/DungeonProgressBanner";
const StoragePanel = lazy(() => import("./components/StoragePanel"));
const VocationPrayerPrompt = lazy(() => import("./components/VocationPrayerPrompt"));
import type { CanonicalStateFailure } from "./domain/canonicalStateFailure";
import { purgeLegacyGameCache } from "./lib/gameCache";
import type { CanonicalOperationContext } from "./lib/canonicalOperationQueue";
import { OptimisticCommandBuffer } from "./lib/optimisticCommandBuffer";
import { sendOptimisticCommandWithConflictRetry } from "./lib/optimisticCommandDispatch";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import { createDungeonProgressBannerView } from "./domain/dungeonPresentation";
import { canonicalBootstrapOperationKey, requestCanonicalBootstrap } from "./lib/canonicalBootstrap";
import { canMutateCanonicalState, canUseAccountDangerActions } from "./lib/canonicalMutationAccess";
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
import { useEncounterPlayback } from "./hooks/useEncounterPlayback";
import { useCanonicalOperations } from "./hooks/useCanonicalOperations";
import { useAutomationLeadership } from "./hooks/useAutomationLeadership";
import { useCanonicalSessionBootstrap } from "./hooks/useCanonicalSessionBootstrap";
import { useCanonicalSnapshot } from "./hooks/useCanonicalSnapshot";
import { useDungeonAutomation } from "./hooks/useDungeonAutomation";
import { useOptimisticCommands } from "./hooks/useOptimisticCommands";
import { useAuthoritativeCommandDispatch } from "./hooks/useAuthoritativeCommandDispatch";
import { useTownAuthorityReconciliation } from "./hooks/useTownAuthorityReconciliation";
import { useEntryLifecycleActions } from "./hooks/useEntryLifecycleActions";
import { useManualCanonicalRefresh } from "./hooks/useManualCanonicalRefresh";
import { useAccountRecoveryActions } from "./hooks/useAccountRecoveryActions";
import { useCrossTabGameSynchronization } from "./hooks/useCrossTabGameSynchronization";
import { useDeveloperCheatActions } from "./hooks/useDeveloperCheatActions";
import { useDungeonPageActions } from "./hooks/useDungeonPageActions";
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
  encounterHistoryRef.current = encounterHistory;

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

  const clearClientGameState = useCallback(() => {
    optimisticResetRef.current();
    encounterHistoryRef.current = [];
    resetEncounterPlayback();
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

  const {
    publishAccountDeleted,
    publishSnapshot,
  } = useCrossTabGameSynchronization({
    applyAuthoritativeState,
    canonicalQueue,
    clearClientGameState,
    encounterHistoryRef,
    getLatestSnapshot,
    invalidateCanonicalSession: canonicalSession.invalidate,
    markUserDeleted,
    playEncounterTranscript,
    ports: gameApplicationPorts,
    prepareEncounterPlayback,
    ready: isInitialGameLoadDone,
    revisionRef: gameRevisionRef,
    setApiAvailable,
    setCanonicalStateFailureDetails,
    showNotice: showCrossTabNotice,
    userId: currentUser ? String(currentUser.id) : null,
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

  const dispatchAuthoritativeCommand = useAuthoritativeCommandDispatch({
    addLog,
    applyAuthoritativeState,
    canonicalQueue,
    canonicalStateFailureDetails,
    currentUserId: currentUser ? String(currentUser.id) : null,
    enqueueInteractiveOperation,
    isAutomationLeaderRef,
    isOnline,
    playEncounterTranscript,
    ports: gameApplicationPorts,
    publishAuthoritativeSnapshot,
    revisionRef: gameRevisionRef,
    setApiAvailable,
    setCanonicalStateFailureDetails,
    showNotice: showCrossTabNotice,
  });

  const {
    handleAccountAuthenticate,
    handleAccountSignOut,
    handleCancelRecruit,
    handleConfirmRecruit,
    handleConfirmStartingFounders,
    handleRequestStartingCandidates,
    handleUpdatePendingName,
    isRecruitConfirmationPending,
    pendingRecruit,
  } = useEntryLifecycleActions({
    addLog,
    canonicalPendingRecruit,
    dispatchAuthoritativeCommand,
    pendingOnboardingCityName,
    ports: gameApplicationPorts,
  });

  const {
    cheatInput,
    handleApplyCheat,
    setCheatInput,
  } = useDeveloperCheatActions({
    addLog,
    cheatsAllowedForUser,
    dispatchAuthoritativeCommand,
    isOnline,
  });

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
  const {
    handleChangeFloor,
    handleExplore,
    handleResetLevel,
    handleRetreatParty,
    handleToggleAutoExplore,
    handleToggleHeroActive,
  } = useDungeonPageActions({
    activeFloor: dungeon.activeDungeonFloor,
    addLog,
    autoExplore: dungeon.autoExplore,
    automation: dungeonAutomation,
    clearDungeonLogs: () => clearBattleLogs("dungeon"),
    currentEncounter,
    dispatchAuthoritativeCommand,
    enqueueOptimisticCommand,
    heroes: dungeon.heroes,
    highestFloorReached: dungeon.highestFloorReached,
  });

  // Purge the legacy shared localStorage snapshot. Offline state is now
  // scoped per authenticated user in IndexedDB and remains read-only.
  useEffect(() => {
    void purgeLegacyGameCache();
    if (!currentUser) addLog("🔑 Veuillez vous connecter pour commencer la conquête de l'empire !", "info");
  }, [currentUser, addLog]);

  useTownAuthorityReconciliation({
    addLog,
    applyAuthoritativeState,
    authorityGeneration,
    bootstrapEpochRef: canonicalBootstrapEpochRef,
    browserOnline,
    canonicalQueue,
    canonicalStateFailureDetails,
    cityName,
    currentUserId: currentUser ? String(currentUser.id) : null,
    hasPendingImmigration: town.hasPendingImmigration,
    recoveryHeroes: dungeon.heroes,
    isAutomationLeader,
    isAutomationLeaderRef,
    isInitialGameLoadDone,
    ports: gameApplicationPorts,
    publishAuthoritativeSnapshot,
    setApiAvailable,
    setCanonicalStateFailureDetails,
  });

  const handleManualServerRefresh = useManualCanonicalRefresh({
    addLog,
    applyAuthoritativeState,
    bootstrapEpochRef: canonicalBootstrapEpochRef,
    currentUserId: currentUser ? String(currentUser.id) : null,
    enqueueInteractiveCoalescedOperation,
    isAutomationLeaderRef,
    isOnline,
    ports: gameApplicationPorts,
    publishAuthoritativeSnapshot,
    setApiAvailable,
    setCanonicalStateFailureDetails,
    showNotice: showCrossTabNotice,
  });

  // Lock offline users to the Account panel
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      setActiveTab("account");
    }
  }, [isAuthLoading, currentUser]);

  const { deleteAccount, hardResetGame } = useAccountRecoveryActions({
    accountDangerActionsAvailable,
    accountDangerActionBlockReason,
    addLog,
    applyAuthoritativeState,
    clearBattleLogs,
    clearClientGameState,
    currentUserId: currentUser ? String(currentUser.id) : null,
    encounterHistoryRef,
    enqueueInteractiveOperation,
    invalidateCanonicalSession: canonicalSession.invalidate,
    markUserDeleted,
    publishAccountDeleted,
    publishAuthoritativeSnapshot,
    ports: gameApplicationPorts,
    resetEncounterPlayback,
    setApiAvailable,
    setCanonicalStateFailureDetails,
    showNotice: showCrossTabNotice,
  });

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
            onToggleAutoExplore={handleToggleAutoExplore}
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
                rates={activeRates}
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
                onToggleHeroActive={handleToggleHeroActive}
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
                onToggleAutoExplore={handleToggleAutoExplore}
                activeEncounter={currentEncounter}
                encounterHistory={encounterHistory}
                encounterPlayback={encounterPlayback}
                isExploring={dungeonAutomation.isRunning}
                onExplore={handleExplore}
                onChangeFloor={handleChangeFloor}
                onRetreatParty={handleRetreatParty}
                onToggleHeroActive={handleToggleHeroActive}
                onClearBattleLogs={() => clearBattleLogs("dungeon")}
                onResetLevel={handleResetLevel}
              />
            </div>
          )}

          {/* D. ACCOUNT TAB VIEW (USER ACCOUNT PROFILE & SERVER STATE) */}
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
                onRefreshServerState={handleManualServerRefresh}
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
