/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import { Hero } from "./types";
const TownPanel = lazy(() => import("./components/TownPanel"));
const DungeonPanel = lazy(() => import("./components/DungeonPanel"));
const HeroPanel = lazy(() => import("./components/HeroPanel"));
const AccountPanel = lazy(() => import("./components/AccountPanel"));
import LoginPage from "./components/LoginPage";
import CanonicalStateAlert from "./components/CanonicalStateAlert";
const StoragePanel = lazy(() => import("./components/StoragePanel"));
import {
  callGameApi,
  canonicalStateFailure,
  GameApiError,
  getAuthSnapshot,
  onAuthStateChange,
  signOut,
  type CanonicalStateFailure,
} from "./lib/supabase";
import { deleteGameCache, purgeLegacyGameCache, readGameCache, writeGameCache } from "./lib/gameCache";
import type { AuthoritativeCommandSuccess, AuthoritativeGameEnvelope, GameCommand } from "./domain/commands";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import { formatCanonicalIdleReport } from "./domain/idleReport";
import { projectCanonicalState } from "./domain/canonicalStateProjection";
import { shouldRefreshTownAuthority } from "./domain/townHeartbeat";
import { formatCanonicalTownEvent } from "./domain/townEventLog";
import {
  createAuthoritativeTimeAnchor,
  type AuthoritativeTimeAnchor,
} from "./domain/authoritativeTimeProjection";
import {
  ACTIVE_TAB_STORAGE_KEY,
  parseActiveTabPreference,
  type ActiveTab,
} from "./domain/activeTabPreference";
import {
  openCrossTabAuthorityBridge,
  type CrossTabAuthorityBridge,
  type CrossTabAuthoritySnapshot,
} from "./domain/crossTabAuthority";
import {
  canAcquireRequestedControl,
  controlRequestKey,
  isControlRequestExpired,
  requestedControlOwner,
  startExclusiveAutomationLease,
  type AutomationLease,
} from "./domain/automationLeadership";

// Custom Hooks & Utilities
import { useGameLog } from "./hooks/useGameLog";
import { useTownSystem } from "./hooks/useTownSystem";

const cheatsEnabled = import.meta.env.MODE === "development" || import.meta.env.MODE === "staging";
import { useDungeonSystem } from "./hooks/useDungeonSystem";

import {
  CrestBadge,
  GoldIconDetail,
  FoodIconDetail,
  WoodIconDetail,
  StoneIconDetail,
  OreIconDetail,
  formatResourceValue
} from "./components/IconDetails";

export default function App() {
  // Layout active tab controller (City, Heroes, Dungeon, Storage or Account)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window === "undefined") return "city";
    return parseActiveTabPreference(window.sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY));
  });
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => {
    window.sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Supabase Auth and authoritative game API sync states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isInitialGameLoadDone, setIsInitialGameLoadDone] = useState<boolean>(false);
  const [cityName, setCityName] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [browserOnline, setBrowserOnline] = useState<boolean>(() => typeof navigator === "undefined" || navigator.onLine);
  const [apiAvailable, setApiAvailable] = useState<boolean>(() => typeof navigator === "undefined" || navigator.onLine);
  const [canonicalStateFailureDetails, setCanonicalStateFailureDetails] = useState<CanonicalStateFailure | null>(null);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [, setGameRevision] = useState(0);
  const [currentEncounter, setCurrentEncounter] = useState<Record<string, unknown> | null>(null);
  const [encounterHistory, setEncounterHistory] = useState<CanonicalDungeonEncounterRecord[]>([]);
  const [encounterPlayback, setEncounterPlayback] = useState<{
    encounterId: string;
    visibleCount: number;
    complete: boolean;
  } | null>(null);
  const [isDungeonSequenceRunning, setIsDungeonSequenceRunning] = useState(false);
  const [isAutomationLeader, setIsAutomationLeader] = useState(false);
  const [isControlTransferPending, setIsControlTransferPending] = useState(false);
  const [controlLeaseEpoch, setControlLeaseEpoch] = useState(0);
  const [pendingForge, setPendingForge] = useState<{ previewId: string; itemId: string; upgradeProc?: "none" | "uncommon" | "rare" } | null>(null);
  const [authoritativeTimeAnchor, setAuthoritativeTimeAnchor] = useState<AuthoritativeTimeAnchor | null>(null);
  const [crossTabNotice, setCrossTabNotice] = useState<{ id: number; message: string } | null>(null);
  const gameRevisionRef = useRef(0);
  const commandQueueRef = useRef<Promise<void>>(Promise.resolve());
  const authorityChannelRef = useRef<CrossTabAuthorityBridge | null>(null);
  const latestAuthoritativeSnapshotRef = useRef<CrossTabAuthoritySnapshot | null>(null);
  const controlLeaseRef = useRef<AutomationLease | null>(null);
  const controlTabIdRef = useRef(crypto.randomUUID());
  const clientStateUserRef = useRef<string | null>(null);
  const authSnapshotGenerationRef = useRef(0);
  const deletedCacheUserIdsRef = useRef(new Set<string>());
  const isAutomationLeaderRef = useRef(false);
  const crossTabNoticeIdRef = useRef(0);
  const encounterHistoryRef = useRef<CanonicalDungeonEncounterRecord[]>([]);
  const encounterPlaybackTokenRef = useRef(0);
  const dungeonSequenceRunningRef = useRef(false);
  const bootstrapUserRef = useRef<string | null>(null);
  const transportOnline = browserOnline && apiAvailable;
  const isOnline = transportOnline && canonicalStateFailureDetails === null;
  const canMutate = isOnline && isAutomationLeader;
  // Google signup is gated by the server-side alpha_allowlist hook and every
  // game-api request is rechecked against the same allowlist at runtime.
  const cheatsAllowedForUser = cheatsEnabled && currentUser?.app_metadata?.provider === "google";

  const showCrossTabNotice = useCallback((message: string) => {
    crossTabNoticeIdRef.current += 1;
    setCrossTabNotice({ id: crossTabNoticeIdRef.current, message });
  }, []);

  useEffect(() => {
    if (!crossTabNotice) return;
    const timeout = window.setTimeout(() => setCrossTabNotice(null), 8_000);
    return () => window.clearTimeout(timeout);
  }, [crossTabNotice]);

  useEffect(() => {
    const handleOffline = () => setBrowserOnline(false);
    const handleOnline = () => {
      bootstrapUserRef.current = null;
      setBrowserOnline(true);
      setReconnectNonce((value) => value + 1);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const [cheatInput, setCheatInput] = useState<string>("");

  // Hero customizer recruitment states
  const [pendingRecruit, setPendingRecruit] = useState<Hero | null>(null);
  const [onboardingCandidates, setOnboardingCandidates] = useState<Hero[]>([]);
  const [pendingOnboardingCityName, setPendingOnboardingCityName] = useState("");

  // Custom Hooks
  const {
    battleLogs,
    setBattleLogs,
    addLog,
    clearBattleLogs
  } = useGameLog();

  const [highestFloorReached, setHighestFloorReached] = useState<number>(1);

  const town = useTownSystem(currentUser, isOnline, authoritativeTimeAnchor);

  const dungeon = useDungeonSystem({
    highestFloorReached,
    setHighestFloorReached,
    currentUser,
    isOnline,
    timeAnchor: authoritativeTimeAnchor,
  });

  const {
    buildings: townBuildings,
    getRates: getTownRates,
    resetTownSystem,
    resources: townResources,
    setBuildings: setTownBuildings,
    setCitizenGrowthProgress,
    setCitizens: setTownCitizens,
    setResources: setTownResources,
    setTotalCitizens,
    totalCitizens: townTotalCitizens,
  } = town;
  const {
    setActiveDungeonFloor,
    setActiveDungeonRoom,
    setAutoExplore,
    setForgeMaterials,
    setHeroes,
    setHighestFloorReached: setDungeonHighestFloorReached,
    setItemBlueprints,
    resetDungeonSystem,
    setStoredItems,
    setUnlockedRaces,
  } = dungeon;

  const applyAuthoritativeState = useCallback(async (
    state: any,
    revision?: number,
    cacheUserId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
    persistCache = true,
  ): Promise<boolean> => {
    if (!state) return false;
    const projectedState = projectCanonicalState(state);
    const userId = cacheUserId ?? currentUser?.id;
    if (userId && deletedCacheUserIdsRef.current.has(String(userId))) return false;
    if (Number.isInteger(revision)
      && typeof state === "object"
      && typeof serverTime === "string"
      && typeof lastProcessedAt === "string") {
      latestAuthoritativeSnapshotRef.current = {
        revision: Number(revision),
        state: state as Record<string, unknown>,
        serverTime,
        lastProcessedAt,
      };
    }
    if (typeof serverTime === "string" && typeof lastProcessedAt === "string") {
      const anchor = createAuthoritativeTimeAnchor(
        serverTime,
        lastProcessedAt,
        globalThis.performance?.now() ?? 0,
      );
      if (anchor) setAuthoritativeTimeAnchor(anchor);
    }
    if (projectedState.cityName !== undefined) setCityName(String(projectedState.cityName));
    if (projectedState.resources) setTownResources(projectedState.resources);
    if (projectedState.buildings) setTownBuildings(projectedState.buildings);
    if (projectedState.citizens) setTownCitizens({ ...projectedState.citizens });
    if (projectedState.totalCitizensCount !== undefined) setTotalCitizens(Number(projectedState.totalCitizensCount));
    if (projectedState.citizenGrowthProgress !== undefined) setCitizenGrowthProgress(Number(projectedState.citizenGrowthProgress));
    if (projectedState.storedItems) setStoredItems(projectedState.storedItems);
    if (projectedState.forgeMaterials) setForgeMaterials(projectedState.forgeMaterials);
    if (projectedState.itemBlueprints) setItemBlueprints(projectedState.itemBlueprints);
    if (projectedState.heroes) setHeroes(projectedState.heroes);
    if (projectedState.activeDungeonFloor !== undefined) setActiveDungeonFloor(Number(projectedState.activeDungeonFloor));
    if (projectedState.activeDungeonRoom !== undefined) setActiveDungeonRoom(Number(projectedState.activeDungeonRoom));
    if (projectedState.highestFloorReached !== undefined) setDungeonHighestFloorReached(Number(projectedState.highestFloorReached));
    if (projectedState.autoExplore !== undefined) setAutoExplore(Boolean(projectedState.autoExplore));
    if (projectedState.currentEncounter !== undefined) setCurrentEncounter(projectedState.currentEncounter);
    if (Array.isArray(projectedState.encounterHistory)) {
      encounterHistoryRef.current = projectedState.encounterHistory;
      setEncounterHistory(projectedState.encounterHistory);
    }
    if (projectedState.pendingForge !== undefined) setPendingForge(projectedState.pendingForge);
    if (projectedState.pendingRecruit !== undefined) setPendingRecruit(projectedState.pendingRecruit ?? null);
    if (projectedState.onboardingCandidates !== undefined) {
      setOnboardingCandidates(projectedState.onboardingCandidates);
    }
    if (projectedState.pendingOnboardingCityName !== undefined) setPendingOnboardingCityName(String(projectedState.pendingOnboardingCityName));
    const canonicalRevision = Number.isInteger(revision) ? Number(revision) : gameRevisionRef.current;
    if (Number.isInteger(revision)) {
      gameRevisionRef.current = canonicalRevision;
      setGameRevision(canonicalRevision);
    }
    if (userId && persistCache) {
      try {
        await writeGameCache(String(userId), { ...state, revision: canonicalRevision });
        return true;
      } catch (error) {
        // The canonical server snapshot is already applied. A local cache
        // failure must not turn a committed mutation into a client error.
        console.warn("Failed to update the read-only game cache", error);
        return false;
      }
    }
    return true;
  }, [
    currentUser?.id,
    setActiveDungeonFloor,
    setActiveDungeonRoom,
    setAutoExplore,
    setCitizenGrowthProgress,
    setDungeonHighestFloorReached,
    setForgeMaterials,
    setHeroes,
    setItemBlueprints,
    setStoredItems,
    setTotalCitizens,
    setTownBuildings,
    setTownCitizens,
    setTownResources,
  ]);

  const clearClientGameState = useCallback(() => {
    resetTownSystem();
    resetDungeonSystem();
    setTownResources({ gold: 0, food: 0, wood: 0, stone: 0, ore: 0 });
    setCityName("");
    setCurrentEncounter(null);
    encounterHistoryRef.current = [];
    setEncounterHistory([]);
    setEncounterPlayback(null);
    setPendingForge(null);
    setPendingRecruit(null);
    setOnboardingCandidates([]);
    setPendingOnboardingCityName("");
    setBattleLogs([]);
    setAuthoritativeTimeAnchor(null);
    latestAuthoritativeSnapshotRef.current = null;
    encounterPlaybackTokenRef.current += 1;
    dungeonSequenceRunningRef.current = false;
    setIsDungeonSequenceRunning(false);
    gameRevisionRef.current = 0;
    setGameRevision(0);
    setCanonicalStateFailureDetails(null);
    isAutomationLeaderRef.current = false;
    setIsAutomationLeader(false);
    setIsControlTransferPending(false);
  }, [resetDungeonSystem, resetTownSystem, setBattleLogs, setTownResources]);

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
    authorityChannelRef.current?.publish({
      revision: envelope.revision,
      state: envelope.state as Record<string, unknown>,
      serverTime: envelope.serverTime,
      lastProcessedAt: envelope.lastProcessedAt,
    });
  }, []);

  const playEncounterTranscript = useCallback(async (encounter: CanonicalDungeonEncounterRecord) => {
    const token = ++encounterPlaybackTokenRef.current;
    const wait = (duration: number) => new Promise<void>((resolve) => window.setTimeout(resolve, duration));
    const completePlayback = () => setEncounterPlayback({
      encounterId: encounter.encounterId,
      visibleCount: encounter.transcript.length,
      complete: true,
    });
    setEncounterPlayback({ encounterId: encounter.encounterId, visibleCount: 0, complete: false });
    if (activeTabRef.current !== "dungeon") {
      await wait((encounter.transcript.length + 1) * 400);
      if (encounterPlaybackTokenRef.current !== token) return;
      completePlayback();
      return;
    }
    for (let index = 0; index < encounter.transcript.length; index += 1) {
      await wait(400);
      if (encounterPlaybackTokenRef.current !== token) return;
      if (activeTabRef.current !== "dungeon") {
        await wait((encounter.transcript.length - index) * 400);
        if (encounterPlaybackTokenRef.current !== token) return;
        completePlayback();
        return;
      }
      setEncounterPlayback({
        encounterId: encounter.encounterId,
        visibleCount: index + 1,
        complete: false,
      });
    }
    await wait(400);
    if (encounterPlaybackTokenRef.current !== token) return;
    completePlayback();
  }, []);

  useEffect(() => () => {
    encounterPlaybackTokenRef.current += 1;
  }, []);

  const dispatchAuthoritativeCommand = useCallback((command: GameCommand): Promise<boolean> => {
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
    const operation = commandQueueRef.current.then(async (): Promise<{
      ok: boolean;
      playback?: Promise<void>;
    }> => {
      try {
        const commandId = crypto.randomUUID();
        const result = await callGameApi<AuthoritativeCommandSuccess>("/commands", {
          method: "POST",
          body: JSON.stringify({
            commandId,
            idempotencyKey: commandId,
            clientVersion: "cdi-061",
            expectedRevision: gameRevisionRef.current,
            command,
          }),
        });
        setCanonicalStateFailureDetails(null);
        const resolvedEncounter = (result?.events ?? [])
          .find((event: any) => event?.type === "dungeon.encounter_resolved")
          ?.encounter as CanonicalDungeonEncounterRecord | undefined;
        await applyAuthoritativeState(result?.state, result?.revision, undefined, result?.serverTime, result?.lastProcessedAt);
        publishAuthoritativeSnapshot(result);
        for (const event of result?.events ?? []) {
          const townLog = formatCanonicalTownEvent(event);
          if (townLog) addLog(townLog.message, townLog.type, "colony");
          if (event?.type === "dungeon.encounter_started") addLog("⚔️ Une rencontre autoritaire a commencé.", "info");
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
            const canonical = await callGameApi<AuthoritativeGameEnvelope>("/bootstrap", { method: "POST" });
            await applyAuthoritativeState(canonical?.state, canonical?.revision, String(currentUser.id), canonical?.serverTime, canonical?.lastProcessedAt);
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
          if (reloadSucceeded) {
            addLog(commandInProgress
              ? "⏳ Commande identique déjà en cours : synchronisation canonique."
              : "⚔️ Conflit de révision : rechargement de l’état canonique.", "info");
            showCrossTabNotice(commandInProgress
              ? "Une commande identique est déjà traitée dans une autre session. État resynchronisé."
              : "Action annulée : une autre session avait déjà modifié la partie. État resynchronisé.");
          } else {
            showCrossTabNotice("Conflit détecté, mais la resynchronisation a échoué. Réessayez dans quelques secondes.");
          }
        } else {
          const stateFailure = canonicalStateFailure(error);
          if (stateFailure) {
            setCanonicalStateFailureDetails(stateFailure);
            setApiAvailable(true);
          } else if (!(error instanceof GameApiError) || error.status >= 500) {
            setApiAvailable(false);
          }
          const message = error instanceof GameApiError ? error.message : "Mutation autoritaire indisponible";
          addLog(`❌ ${message}.`, "defeat");
        }
        return { ok: false };
      }
    });
    commandQueueRef.current = operation.then(() => undefined, () => undefined);
    return operation.then(async ({ ok, playback }) => {
      if (playback) await playback;
      return ok;
    });
  }, [addLog, applyAuthoritativeState, canonicalStateFailureDetails, currentUser, isOnline, playEncounterTranscript, publishAuthoritativeSnapshot, showCrossTabNotice]);

  useEffect(() => {
    if (!currentUser || !isInitialGameLoadDone || typeof BroadcastChannel === "undefined") return;
    const sourceId = crypto.randomUUID();
    let active = true;
    const bridge = openCrossTabAuthorityBridge({
      userId: String(currentUser.id),
      sourceId,
      currentRevision: () => gameRevisionRef.current,
      onSnapshot: (snapshot: CrossTabAuthoritySnapshot) => {
        const operation = commandQueueRef.current.then(async () => {
          if (!active || snapshot.revision <= gameRevisionRef.current) return;
          try {
            const incomingHistory = Array.isArray(snapshot.state.encounterHistory)
              ? snapshot.state.encounterHistory as CanonicalDungeonEncounterRecord[]
              : [];
            const incomingEncounter = incomingHistory.at(-1);
            const previousEncounter = encounterHistoryRef.current.at(-1);
            const shouldPlayEncounter = Boolean(
              incomingEncounter && incomingEncounter.encounterId !== previousEncounter?.encounterId,
            );
            if (shouldPlayEncounter && incomingEncounter) {
              setEncounterPlayback({
                encounterId: incomingEncounter.encounterId,
                visibleCount: 0,
                complete: false,
              });
            }
            await applyAuthoritativeState(
              snapshot.state,
              snapshot.revision,
              String(currentUser.id),
              snapshot.serverTime,
              snapshot.lastProcessedAt,
            );
            if (!active) return;
            setApiAvailable(true);
            setCanonicalStateFailureDetails(null);
            if (shouldPlayEncounter && incomingEncounter) {
              void playEncounterTranscript(incomingEncounter);
            }
          } catch (error) {
            if (!active) return;
            const stateFailure = canonicalStateFailure(error);
            if (stateFailure) {
              setCanonicalStateFailureDetails(stateFailure);
              setApiAvailable(true);
            } else if (!(error instanceof GameApiError) || error.status >= 500) {
              setApiAvailable(false);
            }
            showCrossTabNotice("Échec de la mise à jour depuis un autre onglet.");
          }
        });
        commandQueueRef.current = operation.then(() => undefined, () => undefined);
      },
      onAccountDeleted: () => {
        const userId = String(currentUser.id);
        deletedCacheUserIdsRef.current.add(userId);
        authSnapshotGenerationRef.current += 1;
        bootstrapUserRef.current = null;
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
    authorityChannelRef.current = bridge;
    const latestSnapshot = latestAuthoritativeSnapshotRef.current;
    if (latestSnapshot) bridge.publish(latestSnapshot);

    return () => {
      active = false;
      bridge.close();
      if (authorityChannelRef.current === bridge) authorityChannelRef.current = null;
    };
  }, [applyAuthoritativeState, clearClientGameState, currentUser, isInitialGameLoadDone, playEncounterTranscript, showCrossTabNotice]);

  useEffect(() => {
    if (!currentUser || !isInitialGameLoadDone) {
      isAutomationLeaderRef.current = false;
      setIsAutomationLeader(false);
      return;
    }
    if (!navigator.locks) {
      isAutomationLeaderRef.current = true;
      setIsAutomationLeader(true);
      return;
    }
    isAutomationLeaderRef.current = false;
    setIsAutomationLeader(false);
    let active = true;
    const userId = String(currentUser.id);
    const requestKey = controlRequestKey(userId);
    const tabId = controlTabIdRef.current;
    const lease = startExclusiveAutomationLease({
      userId,
      requestLock: (name, callback) => navigator.locks.request(
        name,
        { mode: "exclusive" },
        callback,
      ),
      canAcquire: () => {
        const requestedTabId = window.localStorage.getItem(requestKey);
        return canAcquireRequestedControl(requestedTabId, tabId, Date.now());
      },
      onLeadershipChange: async (leader) => {
        if (!leader) {
          if (active) {
            isAutomationLeaderRef.current = false;
            setIsAutomationLeader(false);
          }
          return;
        }
        const operation = commandQueueRef.current.then(async () => {
          const canonical = await callGameApi<AuthoritativeGameEnvelope>("/bootstrap", { method: "POST" });
          if (!active) return;
          await applyAuthoritativeState(
            canonical.state,
            canonical.revision,
            userId,
            canonical.serverTime,
            canonical.lastProcessedAt,
          );
          publishAuthoritativeSnapshot(canonical);
        });
        commandQueueRef.current = operation.then(() => undefined, () => undefined);
        await operation;
        if (!active) return;
        const currentRequest = window.localStorage.getItem(requestKey);
        const explicitlyRequested = requestedControlOwner(currentRequest) === tabId;
        if (explicitlyRequested || isControlRequestExpired(currentRequest, Date.now())) {
          window.localStorage.removeItem(requestKey);
        }
        setApiAvailable(true);
        setCanonicalStateFailureDetails(null);
        isAutomationLeaderRef.current = true;
        setIsControlTransferPending(false);
        setIsAutomationLeader(true);
        if (explicitlyRequested) showCrossTabNotice("Cet onglet contrôle maintenant la partie.");
      },
    });
    controlLeaseRef.current = lease;
    const handleControlRequest = (event: StorageEvent) => {
      if (event.key !== requestKey) return;
      if (event.newValue === null) {
        if (requestedControlOwner(event.oldValue) === tabId) setIsControlTransferPending(false);
        if (active && !isAutomationLeaderRef.current) setControlLeaseEpoch((value) => value + 1);
        return;
      }
      if (requestedControlOwner(event.newValue) === tabId) return;
      const requestValue = event.newValue;
      window.setTimeout(() => {
        if (window.localStorage.getItem(requestKey) === requestValue) {
          window.localStorage.removeItem(requestKey);
        }
      }, 30_000);
      isAutomationLeaderRef.current = false;
      setIsControlTransferPending(false);
      setIsAutomationLeader(false);
      void commandQueueRef.current.finally(() => lease.stop());
    };
    window.addEventListener("storage", handleControlRequest);
    void lease.completion.catch(() => {
      if (!active) return;
      isAutomationLeaderRef.current = false;
      setIsControlTransferPending(false);
      setIsAutomationLeader(false);
      setApiAvailable(false);
      showCrossTabNotice("Impossible d’acquérir le contrôle de la partie.");
    });
    return () => {
      active = false;
      window.removeEventListener("storage", handleControlRequest);
      lease.stop();
      if (controlLeaseRef.current === lease) controlLeaseRef.current = null;
    };
  }, [applyAuthoritativeState, controlLeaseEpoch, currentUser, isInitialGameLoadDone, publishAuthoritativeSnapshot, showCrossTabNotice]);

  const requestGameControl = useCallback(() => {
    if (!currentUser || isAutomationLeader || isControlTransferPending || !transportOnline) return;
    const requestKey = controlRequestKey(String(currentUser.id));
    window.localStorage.setItem(
      requestKey,
      `${controlTabIdRef.current}:${Date.now()}:${crypto.randomUUID()}`,
    );
    setIsControlTransferPending(true);
    controlLeaseRef.current?.stop();
    setControlLeaseEpoch((value) => value + 1);
    showCrossTabNotice("Transfert du contrôle en cours…");
  }, [currentUser, isAutomationLeader, isControlTransferPending, showCrossTabNotice, transportOnline]);

  const exploreAndResolveDungeon = useCallback(async () => {
    if (dungeonSequenceRunningRef.current || !currentUser || !isOnline || !isAutomationLeaderRef.current) return false;
    dungeonSequenceRunningRef.current = true;
    setIsDungeonSequenceRunning(true);
    try {
      if (!currentEncounter) {
        const explored = await dispatchAuthoritativeCommand({
          type: "dungeon.explore",
          floor: dungeon.activeDungeonFloor,
        });
        if (!explored) return false;
      }
      return await dispatchAuthoritativeCommand({ type: "dungeon.resolve" });
    } finally {
      dungeonSequenceRunningRef.current = false;
      setIsDungeonSequenceRunning(false);
    }
  }, [
    currentEncounter,
    currentUser,
    dispatchAuthoritativeCommand,
    dungeon.activeDungeonFloor,
    isOnline,
  ]);

  useEffect(() => {
    if (!isAutomationLeader || !currentEncounter || !currentUser || !isOnline || isDungeonSequenceRunning) return;
    void exploreAndResolveDungeon();
  }, [currentEncounter, currentUser, exploreAndResolveDungeon, isAutomationLeader, isDungeonSequenceRunning, isOnline]);

  useEffect(() => {
    if (!isAutomationLeader || !currentUser || !isOnline || !dungeon.autoExplore || currentEncounter || isDungeonSequenceRunning) return;
    const handle = window.setTimeout(() => {
      void exploreAndResolveDungeon();
    }, 1000);
    return () => window.clearTimeout(handle);
  }, [
    currentEncounter,
    currentUser,
    dungeon.autoExplore,
    exploreAndResolveDungeon,
    isAutomationLeader,
    isDungeonSequenceRunning,
    isOnline,
  ]);

  const handleConfirmRecruit = () => {
    if (!pendingRecruit) return;
    void dispatchAuthoritativeCommand({ type: "hero.recruit_confirm", name: pendingRecruit.name }).then((ok) => {
      if (ok) setPendingRecruit(null);
    });
  };

  const handleCancelRecruit = () => {
    void dispatchAuthoritativeCommand({ type: "hero.recruit_cancel" });
  };

  const handleUpdatePendingName = (name: string) => {
    if (!pendingRecruit) return;
    setPendingRecruit({ ...pendingRecruit, name });
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

  // Supabase auth state subscription and authoritative cloud loading
  useEffect(() => {
    let active = true;
    const applySnapshot = async (user: any) => {
      if (user && bootstrapUserRef.current === String(user.id)) return;
      const generation = ++authSnapshotGenerationRef.current;
      const isStale = () => !active || authSnapshotGenerationRef.current !== generation;
      const nextUserId = user ? String(user.id) : null;
      if (clientStateUserRef.current !== nextUserId) {
        clearClientGameState();
        clientStateUserRef.current = nextUserId;
      }
      if (user) bootstrapUserRef.current = String(user.id);
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setIsInitialGameLoadDone(false);
        try {
          setIsSyncing(true);
          const parsed = await callGameApi<AuthoritativeGameEnvelope>("/bootstrap", { method: "POST" });
          if (isStale()) return;
          setApiAvailable(true);
          setCanonicalStateFailureDetails(null);
          if (Number.isInteger(parsed?.revision)) {
            gameRevisionRef.current = parsed.revision;
            setGameRevision(parsed.revision);
          }

          if (parsed && parsed.state) {
            const state = parsed.state;
            await applyAuthoritativeState(state, parsed.revision, String(user.id), parsed?.serverTime, parsed?.lastProcessedAt);
            if (isStale()) return;
            const idleSummary = formatCanonicalIdleReport(parsed.idleReport);
            if (idleSummary) addLog(idleSummary, "info", "colony");
            addLog("☁️ Royaume synchronisé : Sauvegarde Supabase chargée avec succès !", "victory");
          } else {
            setCityName("");
            setTownResources({ gold: 0, food: 0, wood: 0, stone: 0, ore: 0 });
            addLog("👑 Bienvenue souverain ! Veuillez nommer votre cité pour fonder votre campement.", "info");
          }
        } catch (err) {
          if (isStale()) return;
          const isRevisionConflict = err instanceof GameApiError && err.status === 409;
          const stateFailure = canonicalStateFailure(err);
          if (stateFailure) {
            setCanonicalStateFailureDetails(stateFailure);
            setApiAvailable(true);
            console.error("Canonical game state rejected", err);
            addLog("Sauvegarde incompatible : mutations verrouillées. Réinitialisez la partie ou contactez l’assistance.", "defeat");
            return;
          }
          if (!isRevisionConflict) setApiAvailable(false);
          if (isRevisionConflict) {
            bootstrapUserRef.current = null;
            addLog("Synchronisation concurrente détectée. Rechargez la partie.", "info");
            return;
          }
          console.error("Supabase sync error", err);
          const cached = await readGameCache(user.id).catch(() => null);
          if (isStale()) return;
          if (cached) {
            await applyAuthoritativeState(
              cached,
              Number(cached.revision),
              String(user.id),
              undefined,
              undefined,
              false,
            );
          }
          if (isStale()) return;
          if (cached?.unlockedRaces) setUnlockedRaces(cached.unlockedRaces as any);
          if (cached?.battleLogs) setBattleLogs(cached.battleLogs as any);
          if (cached?.autoExplore !== undefined) setAutoExplore(Boolean(cached.autoExplore));
          addLog(cached ? "📖 Session hors connexion : cache local en lecture seule chargé." : "❌ Échec de la récupération des données Supabase.", cached ? "info" : "defeat");
        } finally {
          if (!isStale()) {
            setIsSyncing(false);
            setIsInitialGameLoadDone(true);
          }
        }
      } else {
        bootstrapUserRef.current = null;
        setIsInitialGameLoadDone(true);
        addLog("🔑 Veuillez vous connecter pour commencer la conquête de l'empire !", "info");
      }
    };
    getAuthSnapshot().then(({ user }) => { if (active) void applySnapshot(user); });
    const { data: subscription } = onAuthStateChange(({ user }) => { if (active) void applySnapshot(user); });
    return () => {
      active = false;
      authSnapshotGenerationRef.current += 1;
      subscription.subscription.unsubscribe();
    };
  }, [
    addLog,
    applyAuthoritativeState,
    clearClientGameState,
    setAutoExplore,
    setUnlockedRaces,
    reconnectNonce,
    setBattleLogs,
    setTownResources,
  ]);

  // Refresh active city progression from the authoritative clock. The
  // command queue prevents this heartbeat from racing user mutations.
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
    let active = true;
    let pending = false;
    const refresh = () => {
      if (!isAutomationLeaderRef.current || pending) return;
      pending = true;
      const operation = commandQueueRef.current.then(async () => {
        if (!isAutomationLeaderRef.current) return;
        try {
          const parsed = await callGameApi<AuthoritativeGameEnvelope>("/bootstrap", { method: "POST" });
          if (!active) return;
          await applyAuthoritativeState(parsed?.state, parsed?.revision, String(currentUser.id), parsed?.serverTime, parsed?.lastProcessedAt);
          publishAuthoritativeSnapshot(parsed);
          const idleSummary = formatCanonicalIdleReport(parsed?.idleReport);
          if (idleSummary) addLog(idleSummary, "info", "colony");
          setApiAvailable(true);
          setCanonicalStateFailureDetails(null);
        } catch (error) {
          if (!active) return;
          const stateFailure = canonicalStateFailure(error);
          if (stateFailure) setCanonicalStateFailureDetails(stateFailure);
          else setApiAvailable(false);
        }
      });
      commandQueueRef.current = operation.then(() => undefined, () => undefined);
      void operation.finally(() => { pending = false; });
    };
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [
    addLog,
    applyAuthoritativeState,
    browserOnline,
    canonicalStateFailureDetails,
    cityName,
    currentUser,
    dungeon.heroes,
    getTownRates,
    isAutomationLeader,
    isInitialGameLoadDone,
    publishAuthoritativeSnapshot,
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
    const operation = commandQueueRef.current.then(async () => {
      try {
        setIsSyncing(true);
        const parsed = await callGameApi<AuthoritativeGameEnvelope>("/bootstrap", { method: "POST" });
        await applyAuthoritativeState(parsed?.state, parsed?.revision, String(currentUser.id), parsed?.serverTime, parsed?.lastProcessedAt);
        publishAuthoritativeSnapshot(parsed);
        const idleSummary = formatCanonicalIdleReport(parsed?.idleReport);
        if (idleSummary) addLog(idleSummary, "info", "colony");
        setApiAvailable(true);
        setCanonicalStateFailureDetails(null);
        addLog("☁️ État canonique actualisé depuis le serveur.", "victory");
      } catch (error) {
        const stateFailure = canonicalStateFailure(error);
        if (stateFailure) {
          setCanonicalStateFailureDetails(stateFailure);
          setApiAvailable(true);
        } else if (!(error instanceof GameApiError) || error.status >= 500) {
          setApiAvailable(false);
        }
        addLog("Échec de l’actualisation de l’état canonique.", "defeat");
      } finally {
        setIsSyncing(false);
      }
    });
    commandQueueRef.current = operation.then(() => undefined, () => undefined);
    await operation;
  }, [addLog, applyAuthoritativeState, currentUser, isOnline, publishAuthoritativeSnapshot, showCrossTabNotice]);

  // Lock offline users to the Account panel
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      setActiveTab("account");
    }
  }, [isAuthLoading, currentUser]);

  const hardResetGame = async () => {
    if (!transportOnline) {
      addLog("📡 Mode hors connexion : la réinitialisation est verrouillée.", "info");
      showCrossTabNotice("Remise à zéro indisponible hors connexion. L’état actuel est conservé.");
      return;
    }
    if (!isAutomationLeaderRef.current) {
      showCrossTabNotice("Mode observateur : prenez le contrôle avant de réinitialiser.");
      return;
    }
    const operation = commandQueueRef.current.then(async () => {
      let resetCacheUnsafe = false;
      try {
        setIsSyncing(true);
        if (currentUser) {
          const userId = String(currentUser.id);
          const reset = await callGameApi<AuthoritativeGameEnvelope>("/reset", { method: "POST" });
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
        }
        await purgeLegacyGameCache();

        // Clear transient UI after the canonical reset response was applied.
        setBattleLogs([]);
        setCurrentEncounter(null);
        encounterHistoryRef.current = [];
        setEncounterHistory([]);
        setEncounterPlayback(null);
        setCanonicalStateFailureDetails(null);

        // Crucially, set cityName to empty string to send user back to the naming page of LoginPage
        setCityName("");
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
      } finally {
        setIsSyncing(false);
      }
    });
    commandQueueRef.current = operation.then(() => undefined, () => undefined);
    await operation;
  };

  const deleteAccount = async () => {
    if (!transportOnline) {
      addLog("📡 Mode hors connexion : la suppression du compte est verrouillée.", "info");
      return;
    }
    if (!isAutomationLeaderRef.current) {
      showCrossTabNotice("Mode observateur : prenez le contrôle avant de supprimer le compte.");
      return;
    }
    const operation = commandQueueRef.current.then(async () => {
      try {
        setIsSyncing(true);
        await callGameApi("/account", { method: "DELETE" });
        const deletedUserId = currentUser ? String(currentUser.id) : "";
        deletedCacheUserIdsRef.current.add(deletedUserId);
        authSnapshotGenerationRef.current += 1;
        authorityChannelRef.current?.publishAccountDeleted();
        const cacheCleanup = await Promise.allSettled([
          deleteGameCache(deletedUserId),
          purgeLegacyGameCache(),
        ]);
        const cacheCleanupFailed = cacheCleanup.some((result) => result.status === "rejected");
        if (cacheCleanupFailed) {
          console.warn("Account deleted but the local game cache cleanup was incomplete");
          showCrossTabNotice("Compte supprimé, mais le cache local n’a pas pu être entièrement purgé.");
        }
        town.resetTownSystem();
        dungeon.resetDungeonSystem();
        setBattleLogs([]);
        setCurrentEncounter(null);
        setEncounterHistory([]);
        setEncounterPlayback(null);
        setCanonicalStateFailureDetails(null);
        setCityName("");
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
      } finally {
        setIsSyncing(false);
      }
    });
    commandQueueRef.current = operation.then(() => undefined, () => undefined);
    await operation;
  };

  // Canonical idle/health progression is applied by game-api. React only
  // requests and renders snapshots; it never computes a gameplay tick.

  const activeRates = town.getRates();
  return (
    <div className="min-h-screen bg-[#110905] text-[#fbf7f0] flex flex-col font-sans selection:bg-[#ae8650] selection:text-white">

      {/* 1. PRIMARY GAME HEADBOARD HEADER */}
      <header className="relative bg-[#1d120a] border-b-[3px] border-[#5a3a1a] shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0 sticky top-0 z-40 select-none overflow-hidden py-3 px-4">
        {/* Subtle internal horizontal double groove borders mimicking the wood panel cuts */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[#3a2211] opacity-60" />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#110904]" />

        {/* Diamond metallic rivets at top and bottom center */}
        <div className="absolute top-[1px] left-1/2 -translate-x-1/2 z-10">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polygon points="5,0 10,5 5,10 0,5" fill="#4d535e" stroke="#2a2e35" strokeWidth="1" />
            <circle cx="5" cy="5" r="1.5" fill="#caa050" />
          </svg>
        </div>
        <div className="absolute bottom-[1px] left-1/2 -translate-x-1/2 z-10">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polygon points="5,0 10,5 5,10 0,5" fill="#4d535e" stroke="#2a2e35" strokeWidth="1" />
            <circle cx="5" cy="5" r="1.5" fill="#caa050" />
          </svg>
        </div>

        {/* Outer Banner Flags (Gothic Royal Fleur-de-lis banners on far left and right ends) */}
        <div className="absolute left-2 top-0 bottom-0 w-3 hidden lg:flex flex-col items-center justify-between pointer-events-none opacity-80 z-20">
          <div className="h-full w-full bg-gradient-to-b from-[#4a1205] to-[#240600] border-x border-[#803a11] px-[1px] flex flex-col justify-between">
            <div className="text-[6px] text-[#caa050] text-center font-bold">⚜</div>
            <div className="text-[6px] text-[#caa050] text-center font-bold">⚜</div>
          </div>
        </div>
        <div className="absolute right-2 top-0 bottom-0 w-3 hidden lg:flex flex-col items-center justify-between pointer-events-none opacity-80 z-20">
          <div className="h-full w-full bg-gradient-to-b from-[#4a1205] to-[#240600] border-x border-[#803a11] px-[1px] flex flex-col justify-between">
            <div className="text-[6px] text-[#caa050] text-center font-bold">⚜</div>
            <div className="text-[6px] text-[#caa050] text-center font-bold">⚜</div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <CrestBadge />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wide text-[#caa050] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                  {cityName || "Colonie"}
                </h1>
              </div>
            </div>
          </div>

          {/* DYNAMIC TOP RESOURCE BANNER */}
          {currentUser && cityName && (
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-2 sm:gap-4 max-w-2xl bg-[#140b07]/80 rounded-lg p-2 border border-[#442c19]/50 shadow-inner">
              
              {/* Gold Slot */}
              <div className="flex items-center gap-2 px-1">
                <GoldIconDetail />
                <div className="flex flex-col justify-center leading-none">
                  <span className="font-serif font-black text-sm sm:text-base text-[#fbbf24] tracking-wider drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.9)]">
                    {formatResourceValue(town.displayResources.gold)}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-[1px] h-6 bg-[#3a2211]" />

              {/* Food Slot */}
              <div className="flex items-center gap-2 px-1">
                <FoodIconDetail />
                <div className="flex flex-col justify-center leading-none">
                  <span className="font-serif font-black text-sm sm:text-base text-[#59ba59] tracking-wider drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.9)]">
                    {formatResourceValue(town.displayResources.food)}
                  </span>
                  <span className="text-[10px] font-mono text-[#8f8376] font-semibold mt-0.5">
                    +{activeRates.food.toFixed(0)}/s
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-[1px] h-6 bg-[#3a2211]" />

              {/* Wood Slot */}
              <div className="flex items-center gap-2 px-1">
                <WoodIconDetail />
                <div className="flex flex-col justify-center leading-none">
                  <span className="font-serif font-black text-sm sm:text-base text-[#d26d36] tracking-wider drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.9)]">
                    {formatResourceValue(town.displayResources.wood)}
                  </span>
                  <span className="text-[10px] font-mono text-[#8f8376] font-semibold mt-0.5">
                    +{activeRates.wood.toFixed(0)}/s
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-[1px] h-6 bg-[#3a2211]" />

              {/* Stone Slot */}
              <div className="flex items-center gap-2 px-1">
                <StoneIconDetail />
                <div className="flex flex-col justify-center leading-none">
                  <span className="font-serif font-black text-sm sm:text-base text-[#cdcdcd] tracking-wider drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.9)]">
                    {formatResourceValue(town.displayResources.stone)}
                  </span>
                  <span className="text-[10px] font-mono text-[#8f8376] font-semibold mt-0.5">
                    +{activeRates.stone.toFixed(0)}/s
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-[1px] h-6 bg-[#3a2211]" />

              {/* Ore Slot */}
              <div className="flex items-center gap-2 px-1">
                <OreIconDetail />
                <div className="flex flex-col justify-center leading-none">
                  <span className="font-serif font-black text-sm sm:text-base text-[#9653ec] tracking-wider drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.9)]">
                    {formatResourceValue(town.displayResources.ore)}
                  </span>
                  <span className="text-[10px] font-mono text-[#8f8376] font-semibold mt-0.5">
                    +{activeRates.ore.toFixed(0)}/s
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>
      </header>

      {canonicalStateFailureDetails && currentUser && (
        <CanonicalStateAlert
          requestId={canonicalStateFailureDetails.requestId}
          onOpenAccount={() => setActiveTab("account")}
        />
      )}

      {!transportOnline && currentUser && (
        <div role="status" className="sticky top-0 z-30 border-b border-amber-700/60 bg-amber-950/95 px-4 py-2 text-center text-sm text-amber-100">
          📡 Mode hors connexion — cache en lecture seule. Les mutations reprendront après reconnexion.
        </div>
      )}

      {isOnline && currentUser && !isAutomationLeader && (
        <div role="status" className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-3 border-b border-violet-700/60 bg-violet-950/95 px-4 py-2 text-center text-sm text-violet-100">
          <span>{isControlTransferPending
            ? "Transfert du contrôle en cours…"
            : "Mode observateur — la partie est contrôlée dans un autre onglet."}</span>
          <button
            type="button"
            onClick={requestGameControl}
            disabled={isControlTransferPending}
            className="rounded border border-violet-400/70 bg-violet-800 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isControlTransferPending ? "Transfert…" : "Prendre le contrôle"}
          </button>
        </div>
      )}

      {crossTabNotice && currentUser && (
        <div role="status" aria-live="polite" className="sticky top-0 z-30 border-b border-sky-700/60 bg-sky-950/95 px-4 py-2 text-center text-sm text-sky-100">
          {crossTabNotice.message}
        </div>
      )}

      {/* 2. DYNAMIC NAMING POPUP STAGE (BLOCKED IF USER DID NOT CHOOSE A NAME YET) */}
      {currentUser && !canonicalStateFailureDetails && !cityName && isInitialGameLoadDone && (
        <div className={`flex-1 bg-[#150D08]/90 flex items-center justify-center p-4 ${canMutate ? "" : "pointer-events-none opacity-80"}`}>
          <LoginPage
            authoritativeNovices={onboardingCandidates}
            pendingCityName={pendingOnboardingCityName}
            onGenerateStartingNovices={(name) => dispatchAuthoritativeCommand({
              type: "onboarding.offer",
              cityName: name,
            })}
            onLoginSuccess={(name, startingHeroes) => {
              return dispatchAuthoritativeCommand({
                type: "onboarding.start",
                cityName: name,
                starterHeroes: (startingHeroes ?? []).map((hero) => ({ id: hero.id, name: hero.name })),
              });
            }}
            addLog={addLog}
          />
        </div>
      )}

      {/* 3. CORE VIEW APPLICATION LAYOUT CONTAINER */}
      <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col gap-4 select-none text-[15px] sm:text-base leading-relaxed">
        
        {/* CHEAT CODES ZONE */}
        {cheatsAllowedForUser && cityName && (
          <div className={`bg-[#1e130b] border border-[#523520] rounded-xl p-3.5 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between animate-fade-in shrink-0 ${canMutate ? "" : "pointer-events-none opacity-60"}`}>
            <div className="flex items-center gap-3">
              <span className="text-[#caa050] text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🔑</span>
              <div>
                <h2 className="text-sm font-serif font-bold text-[#caa050] tracking-wide">
                  Grimoire de Triche (Cheat Codes)
                </h2>
                <div className="text-[11px] text-[#a39080] flex flex-wrap gap-x-2 mt-0.5">
                  <span>Format : <code className="text-[#fbbf24] font-mono font-bold">G X</code> (Or)</span>
                  <span className="text-[#523520]">•</span>
                  <span><code className="text-[#59ba59] font-mono font-bold">N X</code> (Nourriture)</span>
                  <span className="text-[#523520]">•</span>
                  <span><code className="text-[#d26d36] font-mono font-bold">B X</code> (Bois)</span>
                  <span className="text-[#523520]">•</span>
                  <span><code className="text-[#cdcdcd] font-mono font-bold">P X</code> (Pierre)</span>
                  <span className="text-[#523520]">•</span>
                  <span><code className="text-[#9653ec] font-mono font-bold">M X</code> (Minerai)</span>
                  <span className="text-[#523520]">•</span>
                  <span><code className="text-[#ffd043] font-mono font-bold">A X</code> (Toutes les ressources)</span>
                  <span className="text-[#523520]">•</span>
                  <span><code className="text-[#cba374] font-mono font-bold">D X</code> (Donjon Étage Max)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={cheatInput}
                onChange={(e) => setCheatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApplyCheat();
                  }
                }}
                placeholder="Exemple: G 10000"
                className="flex-1 md:w-48 bg-[#100805] text-[#fbf7f0] border border-[#523520] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#caa050] focus:ring-1 focus:ring-[#caa050] placeholder-[#5a483a]"
              />
              <button
                onClick={handleApplyCheat}
                className="bg-gradient-to-b from-[#caa050] to-[#ab813a] text-[#110905] hover:from-[#d9b363] hover:to-[#be9348] active:from-[#ab813a] active:to-[#8c6523] px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-[#ebd7a0]/45 shadow-[0_2px_4px_rgba(0,0,0,0.5)] cursor-pointer shrink-0"
              >
                Invoquer
              </button>
            </div>
          </div>
        )}

        {/* NAV ROUTE TABS BAR */}
        <div className="bg-[#20150d] p-1.5 rounded-xl border border-[#2c1d12] select-none shrink-0">
          <div className="flex flex-row gap-1">
            <button
              onClick={() => currentUser && setActiveTab("city")}
              disabled={!currentUser}
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ${
                !currentUser
                  ? "opacity-35 cursor-not-allowed text-[#a39080]/60"
                  : activeTab === "city"
                    ? "bg-gradient-to-r from-[#944415] to-[#ae561c] text-[#fbf7f0] shadow-[0_0_12px_rgba(174,86,28,0.35)] border border-[#a15124] cursor-pointer"
                    : "text-[#a39080] hover:text-[#fdf9f2] hover:bg-[#2c1d12]/50 cursor-pointer"
              }`}
            >
              <span className="text-sm">{!currentUser ? "🔒" : "🏰"}</span> Cité
            </button>
            <button
              onClick={() => currentUser && setActiveTab("heroes")}
              disabled={!currentUser}
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ${
                !currentUser
                  ? "opacity-35 cursor-not-allowed text-[#a39080]/60"
                  : activeTab === "heroes"
                    ? "bg-gradient-to-r from-[#ae8650] to-[#cba374] text-[#fbf7f0] shadow-[0_0_12px_rgba(203,163,116,0.35)] border border-[#d4af37] cursor-pointer"
                    : "text-[#a39080] hover:text-[#fdf9f2] hover:bg-[#2c1d12]/50 cursor-pointer"
              }`}
              title={!currentUser ? "Connexion requise pour inspecter vos forces" : ""}
            >
              <span className="text-sm">{!currentUser ? "🔒" : "⚔️"}</span> Aventuriers
            </button>
            <button
              onClick={() => currentUser && setActiveTab("dungeon")}
              disabled={!currentUser}
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ${
                !currentUser
                  ? "opacity-35 cursor-not-allowed text-[#a39080]/60"
                  : activeTab === "dungeon"
                    ? "bg-gradient-to-r from-[#701a1a] to-[#991b1b] text-[#fbf7f0] shadow-[0_0_12px_rgba(153,27,27,0.45)] border border-[#b91c1c] cursor-pointer"
                    : "text-[#a39080] hover:text-[#fdf9f2] hover:bg-[#2c1d12]/50 cursor-pointer"
              }`}
              title={!currentUser ? "Connexion requise pour braver les abysses" : ""}
            >
              <span className="text-sm">{!currentUser ? "🔒" : "🛡️"}</span> Donjon
            </button>
            <button
              onClick={() => currentUser && setActiveTab("storage")}
              disabled={!currentUser}
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ${
                !currentUser
                  ? "opacity-35 cursor-not-allowed text-[#a39080]/60"
                  : activeTab === "storage"
                    ? "bg-gradient-to-r from-[#5c402b] to-[#785437] text-[#fbf7f0] shadow-[0_0_12px_rgba(120,84,55,0.45)] border border-[#caa050] cursor-pointer"
                    : "text-[#a39080] hover:text-[#fdf9f2] hover:bg-[#2c1d12]/50 cursor-pointer"
              }`}
              title={!currentUser ? "Connexion requise pour inspecter le coffre" : ""}
            >
              <span className="text-sm">{!currentUser ? "🔒" : "📦"}</span> Coffre
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === "account"
                  ? "bg-gradient-to-r from-[#20150d] to-[#45301f] text-[#fbf7f0] shadow-[0_0_12px_rgba(92,64,43,0.45)] border border-[#d4af37]"
                  : "text-[#a39080] hover:text-[#fdf9f2] hover:bg-[#2c1d12]/50"
              }`}
            >
              <span className="text-sm">☁️</span> Compte
            </button>
          </div>
        </div>

        {/* TAB MAIN CONTENT CONTAINER */}
        <div className="h-full">
          <Suspense fallback={<div role="status" className="rounded-xl border border-[#5c402b]/60 bg-[#160f0a] p-6 text-center text-sm text-[#c5ad94]">Chargement de la vue…</div>}>
          
          {/* A. CITY TAB VIEW (TOWN INTERFACE) */}
          {activeTab === "city" && (
            <div className={`w-full ${canMutate ? "" : "pointer-events-none opacity-80"}`} aria-disabled={!canMutate}>
              <TownPanel
                resources={town.resources}
                buildings={town.buildings}
                citizens={town.citizens}
                totalCitizensCount={town.displayTotalCitizens}
                onUpgradeBuilding={(buildingId) => { void dispatchAuthoritativeCommand({ type: "building.upgrade", buildingId }); }}
                onAllocateCitizen={(role, amount) => { void dispatchAuthoritativeCommand({ type: "citizens.allocate", role, amount }); }}
                citizenGrowthProgress={town.displayCitizenGrowthProgress}
                highestFloorReached={dungeon.highestFloorReached}
                heroes={dungeon.heroes}
                forgeMaterials={dungeon.forgeMaterials}
                itemBlueprints={dungeon.itemBlueprints}
                addLog={addLog}
                isOnline={isOnline}
                pendingForge={pendingForge}
                onStartForge={(recipeId) => { void dispatchAuthoritativeCommand({ type: "forge.start", recipeId }); }}
                onFinalizeForge={(previewId, acceptUpgrade, chosenModifierStat) => { void dispatchAuthoritativeCommand({ type: "forge.finalize", previewId, acceptUpgrade, chosenModifierStat }); }}
                onCancelForge={(previewId) => { void dispatchAuthoritativeCommand({ type: "forge.cancel", previewId }); }}
              />
            </div>
          )}

          {/* B. HEROES TAB VIEW (HERO GUILD MANAGEMENT) */}
          {activeTab === "heroes" && (
            <div className={`w-full ${canMutate ? "" : "pointer-events-none opacity-80"}`} aria-disabled={!canMutate}>
              <HeroPanel
                heroes={dungeon.displayHeroes}
                resources={town.resources}
                buildings={town.buildings}
                onDismissHero={(heroId) => { void dispatchAuthoritativeCommand({ type: "hero.dismiss", heroId }); }}
                onToggleHeroActive={(heroId) => {
                  const hero = dungeon.heroes.find((entry) => entry.id === heroId);
                  if (hero) void dispatchAuthoritativeCommand({ type: "hero.activity", heroId, active: !hero.isActive });
                }}
                onRecruitHero={() => { void dispatchAuthoritativeCommand({ type: "hero.recruit_offer" }); }}
                onUnequipItem={(heroId, slot) => { void dispatchAuthoritativeCommand({ type: "hero.unequip", heroId, slot }); }}
                onEquipItem={(heroId, instanceId) => { void dispatchAuthoritativeCommand({ type: "hero.equip", heroId, instanceId }); }}
                storedItems={dungeon.storedItems}
                onGoToTab={setActiveTab}
              />
            </div>
          )}

          {/* C. DUNGEON TAB VIEW (CENTERED HIGH-PERFORMANCE COMBAT MONITOR) */}
          {activeTab === "dungeon" && (
            <div className={`w-full ${canMutate ? "" : "pointer-events-none opacity-80"}`} aria-disabled={!canMutate}>
              <DungeonPanel
                heroes={dungeon.heroes}
                activeDungeonFloor={dungeon.activeDungeonFloor}
                activeDungeonRoom={dungeon.activeDungeonRoom}
                autoExplore={dungeon.autoExplore}
                battleLogs={battleLogs}
                highestFloorReached={dungeon.highestFloorReached}
                onToggleAutoExplore={() => { void dispatchAuthoritativeCommand({ type: "dungeon.auto_explore", enabled: !dungeon.autoExplore }); }}
                activeEncounter={currentEncounter}
                encounterHistory={encounterHistory}
                encounterPlayback={encounterPlayback}
                isExploring={isDungeonSequenceRunning}
                onExplore={() => { void exploreAndResolveDungeon(); }}
                onChangeFloor={(direction) => {
                  const floor = Math.max(1, dungeon.activeDungeonFloor + (direction === "next" ? 1 : -1));
                  void dispatchAuthoritativeCommand({ type: "dungeon.select_floor", floor });
                }}
                onRetreatParty={() => { void dispatchAuthoritativeCommand({ type: "dungeon.retreat" }); }}
                onClearBattleLogs={clearBattleLogs}
                onResetLevel={() => {
                  void (async () => {
                    const reset = await dispatchAuthoritativeCommand({
                      type: "dungeon.select_floor",
                      floor: dungeon.activeDungeonFloor,
                    });
                    if (reset) {
                      addLog(
                        "🔄 Étage réinitialisé : l'exploration reprend à la salle 1.",
                        "info",
                      );
                      clearBattleLogs();
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
                isAuthLoading={isAuthLoading}
                isSyncing={isSyncing}
                resources={town.resources}
                buildings={town.buildings}
                totalCitizensCount={town.totalCitizens}
                heroesCount={dungeon.heroes.length}
                highestFloorReached={dungeon.highestFloorReached}
                onSaveCloud={handleManualSaveCloud}
                onHardReset={hardResetGame}
                onDeleteAccount={deleteAccount}
                addLog={addLog}
              />
            </div>
          )}

          {/* E. STORAGE TAB VIEW (GLOBAL CITY VAULT & EQUIPMENT PREVIEW) */}
          {activeTab === "storage" && (
            <div className={`w-full ${canMutate ? "" : "pointer-events-none opacity-80"}`} aria-disabled={!canMutate}>
              <StoragePanel
                storedItems={dungeon.storedItems}
                heroes={dungeon.heroes}
                onEquipItem={(heroId, instanceId) => { void dispatchAuthoritativeCommand({ type: "hero.equip", heroId, instanceId }); }}
                isForgeUnlocked={(town.buildings["forge"] || 0) >= 1}
                onScrapItem={(instanceId) => { void dispatchAuthoritativeCommand({ type: "inventory.recycle", instanceId }); }}
                forgeMaterials={dungeon.forgeMaterials}
              />
            </div>
          )}
          </Suspense>
        </div>
      </main>

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 text-center text-xs text-gray-500 font-mono mt-auto shrink-0 select-none">
        <p>© 2026 Colonie & Donjon Idle. Tous droits réservés. Bâti sur les sables fins d'Antigravity.</p>
        <p className="text-[10px] text-indigo-400 mt-1">
          Taux globaux : {town.totalCitizens} Citoyens • {dungeon.heroes.length} Champions • Étage record : {dungeon.highestFloorReached}
        </p>
      </footer>

      {/* 5. GORGEOUS CUSTOM RECRUITMENT MODAL */}
      {pendingRecruit && isAutomationLeader && (() => {
        const STAT_LABELS: Record<string, string> = {
          str: "Force (STR)",
          wiz: "Sagesse (WIZ)",
          agi: "Agilité (AGI)",
          dex: "Dextérité (DEX)",
          end: "Constitution (END)",
          luk: "Chance (LUK)",
          int: "Intelligence (INT)"
        };
        const entries = Object.entries(pendingRecruit.baseStats || {}) as [string, number][];
        const valid = entries.filter(([key]) => key in STAT_LABELS);
        const bestEntry = valid.reduce((max, curr) => curr[1] > max[1] ? curr : max, valid[0] || ["str", 0]);
        const worstEntry = valid.reduce((min, curr) => curr[1] < min[1] ? curr : min, valid[0] || ["str", 0]);

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none">
            <div className="w-full max-w-sm bg-[#160f0a] border-2 border-[#d4af37] rounded-3xl p-6 shadow-[0_15px_45px_rgba(0,0,0,0.95)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#926430]/5 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-[#ae8650] via-[#86592e] to-[#462d16] rounded-xl flex items-center justify-center mx-auto shadow-md border-2 border-[#d4af37] mb-2">
                  <span className="text-xl">🤝</span>
                </div>
                <h3 className="line-clamp-1 text-lg font-serif font-bold text-[#d4af37] uppercase tracking-wider">
                  Nouveau Pacte de Recrutement
                </h3>
                <p className="text-[11px] text-[#a89078] mt-0.5 font-serif">
                  Ajustez le prénom de ce candidat avant de sceller le contrat d'embauche.
                </p>
              </div>

              {/* First Name Input */}
              <div className="mb-4">
                <label className="text-[9px] uppercase tracking-widest text-[#8c5a2b] font-extrabold block mb-1.5 font-mono">
                  Prénom de l'aventurier
                </label>
                <input
                  type="text"
                  value={pendingRecruit.name}
                  onChange={(e) => handleUpdatePendingName(e.target.value)}
                  className="bg-[#0f0a06] border-2 border-[#45301f] text-[#fbf7f0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#d4af37] w-full font-serif font-bold"
                  maxLength={20}
                />
              </div>

              {/* Candidate Summary Panel (Only showing requested info) */}
              <div className="bg-[#0b0704] border border-[#45301f] rounded-2xl p-4 mb-5 space-y-3 font-mono text-xs text-[#a89078]">
                {/* Sex */}
                <div className="flex justify-between items-center border-b border-[#302216]/40 pb-2">
                  <span className="uppercase text-[9px] tracking-wider font-bold text-[#8c5a2b]">Sexe / Genre :</span>
                  <span className="font-extrabold text-[#dfdbc7]">
                    {pendingRecruit.gender === "Male" ? "♂ Homme" : "♀ Femme"}
                  </span>
                </div>

                {/* Best Stat */}
                <div className="flex justify-between items-center border-b border-[#302216]/40 pb-2">
                  <span className="uppercase text-[9px] tracking-wider font-bold text-[#8c5a2b]">Meilleur Attribut :</span>
                  <span className="font-extrabold text-emerald-400">
                    {STAT_LABELS[bestEntry[0]]} ({bestEntry[1]})
                  </span>
                </div>

                {/* Worst Stat */}
                <div className="flex justify-between items-center border-b border-[#302216]/40 pb-2">
                  <span className="uppercase text-[9px] tracking-wider font-bold text-[#8c5a2b]">Attribut Faible :</span>
                  <span className="font-extrabold text-red-400">
                    {STAT_LABELS[worstEntry[0]]} ({worstEntry[1]})
                  </span>
                </div>

                {/* Max HP & Max Mana */}
                <div className="grid grid-cols-2 gap-4 pt-1 text-center">
                  <div className="bg-[#1a110a] border border-[#3e2c1c] rounded-xl py-2">
                    <span className="block text-[#a89078] text-[9px] uppercase font-bold tracking-wider mb-0.5">PV Max</span>
                    <strong className="text-emerald-400 text-xs font-bold">{pendingRecruit.calculatedStats.maxHp} HP</strong>
                  </div>
                  <div className="bg-[#1a110a] border border-[#3e2c1c] rounded-xl py-2">
                    <span className="block text-[#a89078] text-[9px] uppercase font-bold tracking-wider mb-0.5">PM Max</span>
                    <strong className="text-sky-400 text-xs font-bold">{pendingRecruit.calculatedStats.maxMana || 20} PM</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelRecruit}
                  className="flex-1 py-2.5 px-4 bg-[#231710] hover:bg-[#342217] border border-[#5c402b]/70 text-[#a89078] rounded-xl font-serif font-bold text-xs text-center transition cursor-pointer"
                >
                  Décliner l'Offre
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRecruit}
                  className="flex-1 py-2.5 px-4 bg-[#8c5a2b] hover:bg-[#b0773f] text-[#fdf9f2] border border-[#d4af37] rounded-xl font-serif font-bold text-xs text-center transition cursor-pointer shadow-[0_4px_12px_rgba(140,90,43,0.3)] flex items-center justify-center gap-1.5"
                >
                  <span>SCELLER (🪙 {(100 + dungeon.heroes.length * 150).toLocaleString()})</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
