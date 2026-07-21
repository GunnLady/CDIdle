/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Castle,
  Coins,
  Grape,
  Trees,
  Hammer,
  Pickaxe,
  TrendingUp,
  UserPlus,
  HelpCircle,
  Users,
  Compass,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowUpRight,
  ShieldCheck,
  Music,
  Volume2,
  VolumeX,
  Plus,
  X,
  Cloud,
  Squirrel,
  Church
} from "lucide-react";
import {
  Resources,
  CitizenAllocation,
  Hero,
  Monster,
  BattleLogEntry
} from "./types";
import { refreshHeroDerivedStats } from "./utils/gameCalculations";
import TownPanel from "./components/TownPanel";
import DungeonPanel from "./components/DungeonPanel";
import HeroPanel from "./components/HeroPanel";
import AccountPanel from "./components/AccountPanel";
import LoginPage from "./components/LoginPage";
import StoragePanel from "./components/StoragePanel";
import { callGameApi, GameApiError, getAuthSnapshot, onAuthStateChange } from "./lib/supabase";
import { purgeLegacyGameCache, readGameCache, writeGameCache } from "./lib/gameCache";

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
  const [activeTab, setActiveTab] = useState<"city" | "heroes" | "dungeon" | "account" | "storage">("city");

  // Supabase Auth and authoritative game API sync states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isInitialGameLoadDone, setIsInitialGameLoadDone] = useState<boolean>(false);
  const [cityName, setCityName] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudQuotaExceeded, setIsCloudQuotaExceeded] = useState<boolean>(false);
  const [browserOnline, setBrowserOnline] = useState<boolean>(() => typeof navigator === "undefined" || navigator.onLine);
  const [apiAvailable, setApiAvailable] = useState<boolean>(() => typeof navigator === "undefined" || navigator.onLine);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [gameRevision, setGameRevision] = useState(0);
  const isOnline = browserOnline && apiAvailable;
  // Google signup is gated by the server-side alpha_allowlist hook and every
  // game-api request is rechecked against the same allowlist at runtime.
  const cheatsAllowedForUser = cheatsEnabled && currentUser?.app_metadata?.provider === "google";
  const lastCloudSaveTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleOffline = () => setBrowserOnline(false);
    const handleOnline = () => {
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

  // Runtime Transient States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(true);
  const [cheatInput, setCheatInput] = useState<string>("");

  // Hero customizer recruitment states
  const [pendingRecruit, setPendingRecruit] = useState<Hero | null>(null);

  // Custom Hooks
  const {
    battleLogs,
    setBattleLogs,
    addLog,
    clearBattleLogs
  } = useGameLog();

  const [highestFloorReached, setHighestFloorReached] = useState<number>(1);

  const townAddLog = useCallback((message: string, type?: any) => {
    addLog(message, type, "colony");
  }, [addLog]);

  const town = useTownSystem(townAddLog, highestFloorReached, currentUser, isOnline);

  const dungeon = useDungeonSystem({
    buildings: town.buildings,
    resources: town.resources,
    setResources: town.setResources,
    addLog,
    currentUser,
    isOnline,
    highestFloorReached,
    setHighestFloorReached
  });

  const handleInitiateNewRecruitment = useCallback(() => {
    const recruitmentCost = 100 + dungeon.heroes.length * 150;
    if (town.resources.gold < recruitmentCost) {
      addLog("❌ Or insuffisant pour recruter un nouvel aventurier !", "defeat");
      return;
    }

    const guildLevel = town.buildings["guilde"] || 0;
    const maxHeroCapacity = guildLevel + 2;
    if (dungeon.heroes.length >= maxHeroCapacity) {
      addLog(`❌ Capacité de dortoir saturée (${dungeon.heroes.length}/${maxHeroCapacity}). Agrandissez le Campement !`, "defeat");
      return;
    }

    const novice = dungeon.generateSingleNoviceHero();
    setPendingRecruit(novice);
  }, [dungeon.heroes.length, town.resources.gold, town.buildings, dungeon.generateSingleNoviceHero, addLog]);

  const handleConfirmRecruit = () => {
    if (!pendingRecruit) return;
    const cost = 100 + dungeon.heroes.length * 150;
    dungeon.handleRecruitCustomHero(pendingRecruit, cost);
    setPendingRecruit(null);
  };

  const handleCancelRecruit = () => {
    setPendingRecruit(null);
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
      dungeon.setHighestFloorReached(amount);
      addLog(`🧙‍♂️ TRICHE : Le niveau le plus haut exploré du donjon est désormais l'Étage ${amount} ! ✨`, "victory");
      setCheatInput("");
      return;
    }

    if (letter === "A") {
      town.setResources(prev => ({
        ...prev,
        gold: prev.gold + amount,
        food: prev.food + amount,
        wood: prev.wood + amount,
        stone: prev.stone + amount,
        ore: prev.ore + amount
      }));
      addLog(`🧙‍♂️ TRICHE : +${amount} dans TOUTES les ressources ! ✨`, "victory");
      setCheatInput("");
      return;
    }

    const resourceMap: Record<string, keyof typeof town.resources> = {
      G: "gold",
      N: "food",
      B: "wood",
      P: "stone",
      M: "ore"
    };
    
    const resKey = resourceMap[letter] as "gold" | "food" | "wood" | "stone" | "ore";

    if (resKey) {
      town.setResources(prev => ({
        ...prev,
        [resKey]: prev[resKey] + amount
      }));
      const namesInFrench: Record<string, string> = {
        gold: "Or",
        food: "Nourriture",
        wood: "Bois",
        stone: "Pierre",
        ore: "Minerai"
      };
      addLog(`🧙‍♂️ TRICHE : +${amount} ${namesInFrench[resKey]} ajoutés ! ✨`, "victory");
      setCheatInput("");
    }
  }, [cheatInput, town.setResources, dungeon.setHighestFloorReached, addLog, isOnline, cheatsAllowedForUser]);

  // SAVE GAME TO LOCALSTORAGE AND THE AUTHORITATIVE SUPABASE API
  const saveGame = useCallback(async (forceCloud: boolean = false) => {
    if (!cityName || !isOnline) return;
    try {
      const stateToSave = {
        cityName,
        resources: town.resources,
        buildings: town.buildings,
        citizens: town.citizens,
        totalCitizens: town.totalCitizens,
        unlockedDistricts: town.unlockedDistricts,
        heroes: dungeon.heroes,
        storedItems: dungeon.storedItems,
        forgeMaterials: dungeon.forgeMaterials,
        itemBlueprints: dungeon.itemBlueprints,
        activeDungeonFloor: dungeon.activeDungeonFloor,
        activeDungeonRoom: dungeon.activeDungeonRoom,
        highestFloorReached: dungeon.highestFloorReached,
        unlockedRaces: dungeon.unlockedRaces,
        battleLogs,
        autoExplore: dungeon.autoExplore,
        isMigrationPending: town.isMigrationPending
      };
      if (currentUser?.id) await writeGameCache(currentUser.id, stateToSave);

      if (currentUser) {
        const now = Date.now();
        const timeSinceLastSave = now - lastCloudSaveTimeRef.current;
        const throttleLimit = 30000; // 30 seconds

        const shouldSaveToCloud = forceCloud || (!isCloudQuotaExceeded && timeSinceLastSave >= throttleLimit);

        if (shouldSaveToCloud) {
          setIsSyncing(true);
          // Generic client snapshot writes are intentionally local-only. The
          // authoritative API accepts typed domain commands, never save_game.
          lastCloudSaveTimeRef.current = now;
          setIsCloudQuotaExceeded(false); // Reset on successful write
        } else {
          console.log(`Cloud sync throttled. Next allowed in ${Math.round((throttleLimit - timeSinceLastSave) / 1000)}s.`);
        }
      }
    } catch (err: any) {
      if (err instanceof GameApiError && err.status === 409) {
        addLog("⚔️ Conflit de révision : l’état canonique va être rechargé.", "info");
        setReconnectNonce((value) => value + 1);
        return;
      }
      if (!(err instanceof GameApiError) || err.status >= 500) setApiAvailable(false);
      console.error("Supabase save failed", err);
      if (err && String(err).toLowerCase().includes("quota")) {
        setIsCloudQuotaExceeded(true);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [
    cityName,
    town.resources,
    town.buildings,
    town.citizens,
    town.totalCitizens,
    town.unlockedDistricts,
    dungeon.heroes,
    dungeon.storedItems,
    dungeon.forgeMaterials,
    dungeon.itemBlueprints,
    dungeon.activeDungeonFloor,
    dungeon.activeDungeonRoom,
    dungeon.highestFloorReached,
    dungeon.unlockedRaces,
    battleLogs,
    dungeon.autoExplore,
    isCloudQuotaExceeded,
    currentUser,
    isOnline,
    gameRevision
  ]);

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
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setIsInitialGameLoadDone(false);
        try {
          setIsSyncing(true);
          const parsed = await callGameApi<any>("/bootstrap", { method: "POST" });
          setApiAvailable(true);
          if (Number.isInteger(parsed?.revision)) setGameRevision(parsed.revision);

          if (parsed && parsed.state) {
            const state = parsed.state;
            if (state.cityName) {
              setCityName(state.cityName);
            } else {
              setCityName("");
            }
            if (state.resources) town.setResources(state.resources);
            if (state.buildings) town.setBuildings(state.buildings);
            if (state.citizens) town.setCitizens({ ...state.citizens });
            if (state.totalCitizens !== undefined) town.setTotalCitizens(state.totalCitizens);
            if (state.isMigrationPending !== undefined) town.setIsMigrationPending(!!state.isMigrationPending);
            if (state.unlockedDistricts) town.setUnlockedDistricts(state.unlockedDistricts);
            if (state.storedItems) dungeon.setStoredItems(state.storedItems);
            if (state.forgeMaterials) dungeon.setForgeMaterials(state.forgeMaterials);
            if (state.itemBlueprints) dungeon.setItemBlueprints(state.itemBlueprints);
            if (state.heroes) dungeon.setHeroes(state.heroes.map((h: Hero) => {
              const refreshed = refreshHeroDerivedStats(h);
              refreshed.currentHp = Math.min(refreshed.calculatedStats.maxHp, h.currentHp);
              return refreshed;
            }));
            if (state.activeDungeonFloor !== undefined) dungeon.setActiveDungeonFloor(state.activeDungeonFloor);
            if (state.activeDungeonRoom !== undefined) dungeon.setActiveDungeonRoom(state.activeDungeonRoom);
            if (state.highestFloorReached !== undefined) dungeon.setHighestFloorReached(state.highestFloorReached);
            if (state.unlockedRaces) dungeon.setUnlockedRaces(state.unlockedRaces);
            addLog("☁️ Royaume synchronisé : Sauvegarde Supabase chargée avec succès !", "victory");
          } else {
            setCityName("");
            town.setResources({ gold: 0, food: 0, wood: 0, stone: 0, ore: 0 });
            addLog("👑 Bienvenue souverain ! Veuillez nommer votre cité pour fonder votre campement.", "info");
          }
        } catch (err) {
          setApiAvailable(false);
          console.error("Supabase sync error", err);
          const cached = await readGameCache(user.id).catch(() => null);
          if (cached?.cityName) setCityName(String(cached.cityName));
          if (cached?.resources) town.setResources(cached.resources as any);
          if (cached?.buildings) town.setBuildings(cached.buildings as any);
          if (cached?.citizens) town.setCitizens(cached.citizens as any);
          if (cached?.totalCitizens !== undefined) town.setTotalCitizens(Number(cached.totalCitizens));
          if (cached?.unlockedDistricts) town.setUnlockedDistricts(cached.unlockedDistricts as any);
          if (cached?.heroes) dungeon.setHeroes(cached.heroes as any);
          if (cached?.storedItems) dungeon.setStoredItems(cached.storedItems as any);
          if (cached?.forgeMaterials) dungeon.setForgeMaterials(cached.forgeMaterials as any);
          if (cached?.itemBlueprints) dungeon.setItemBlueprints(cached.itemBlueprints as any);
          if (cached?.activeDungeonFloor !== undefined) dungeon.setActiveDungeonFloor(Number(cached.activeDungeonFloor));
          if (cached?.activeDungeonRoom !== undefined) dungeon.setActiveDungeonRoom(Number(cached.activeDungeonRoom));
          if (cached?.highestFloorReached !== undefined) dungeon.setHighestFloorReached(Number(cached.highestFloorReached));
          if (cached?.unlockedRaces) dungeon.setUnlockedRaces(cached.unlockedRaces as any);
          if (cached?.battleLogs) setBattleLogs(cached.battleLogs as any);
          if (cached?.autoExplore !== undefined) dungeon.setAutoExplore(Boolean(cached.autoExplore));
          addLog(cached ? "📖 Session hors connexion : cache local en lecture seule chargé." : "❌ Échec de la récupération des données Supabase.", cached ? "info" : "defeat");
        } finally {
          setIsSyncing(false);
          setIsInitialGameLoadDone(true);
        }
      } else {
        setGameRevision(0);
        setCityName("");
        setIsInitialGameLoadDone(true);
        town.setResources({ gold: 0, food: 0, wood: 0, stone: 0, ore: 0 });
        addLog("🔑 Veuillez vous connecter pour commencer la conquête de l'empire !", "info");
      }
    };
    getAuthSnapshot().then(({ user }) => { if (active) void applySnapshot(user); });
    const { data: subscription } = onAuthStateChange(({ user }) => { if (active) void applySnapshot(user); });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [addLog, reconnectNonce]);

  // Set up saveGameRef to always point to the latest saveGame function
  const saveGameRef = useRef<(forceCloud?: boolean) => Promise<void>>();
  useEffect(() => {
    saveGameRef.current = saveGame;
  }, [saveGame]);

  // Auto-save cycle every 60 seconds
  useEffect(() => {
    const handle = setInterval(() => {
      saveGameRef.current?.();
    }, 60000);
    return () => clearInterval(handle);
  }, []);

  // Auto-save immediately whenever stored items count changes
  const lastStoredItemsCountRef = useRef<number>(0);
  useEffect(() => {
    if (dungeon.storedItems) {
      const currentCount = dungeon.storedItems.length;
      if (currentCount !== lastStoredItemsCountRef.current) {
        lastStoredItemsCountRef.current = currentCount;
        saveGameRef.current?.();
      }
    }
  }, [dungeon.storedItems]);

  const handleManualSaveCloud = useCallback(async () => {
    await saveGame(true);
  }, [saveGame]);

  // Lock offline users to the Account panel
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      setActiveTab("account");
    }
  }, [isAuthLoading, currentUser]);

  const hardResetGame = async () => {
    if (!isOnline) {
      addLog("📡 Mode hors connexion : la réinitialisation est verrouillée.", "info");
      return;
    }
    try {
      setIsSyncing(true);
      await purgeLegacyGameCache();
      
      // Reset systems
      town.resetTownSystem();
      dungeon.resetDungeonSystem();
      setBattleLogs([]);

      // Crucially, set cityName to empty string to send user back to the naming page of LoginPage
      setCityName("");

      if (currentUser) {
        await callGameApi("/reset", { method: "POST" });
      }

      addLog("💣 Remise à zéro totale effectuée ! Créez une nouvelle cité.", "defeat");
    } catch (err) {
      console.error("Failed to reset Supabase savegame state", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // REAL-TIME CLOCK / RESOURCE TICK PROCESSOR
  useEffect(() => {
    if (!currentUser || !isOnline) return;
    const handle = setInterval(() => {
      // 1. RESOURCE ACCUMULATION
      const rates = town.getRates();
      town.setResources((prev) => ({
        ...prev,
        food: prev.food + rates.food,
        wood: prev.wood + rates.wood,
        stone: prev.stone + rates.stone,
        ore: prev.ore + rates.ore
      }));

      // 2. CITIZEN IMMIGRATION GROWTH TIMER
      town.performImmigrationTick();

      // 3. AUTO HEAL & MANA REGEN SYSTEM OUTFLOW FROM BATTLE
      dungeon.setHeroes((prevHeroes) => {
        return prevHeroes.map((hero) => {
          if (hero.status === "resting") {
            const maxHp = hero.calculatedStats.maxHp;
            const maxMana = hero.calculatedStats.maxMana || 0;

            const lizardBonus = hero.race === "Homme-Lézard" ? 5 : 0;
            const healingTick = 6 + lizardBonus;
            const manaTick = 5;

            const newHp = Math.min(maxHp, hero.currentHp + healingTick);
            const newMana = Math.min(maxMana, (hero.currentMana || 0) + manaTick);

            const isFullyHealed = newHp === maxHp;
            const isFullyCharged = maxMana === 0 || newMana === maxMana;

            if (isFullyHealed && isFullyCharged) {
              addLog(`💚 RÉTABLISSEMENT : ${hero.name} s'est entièrement rétabli (PV & Mana) et attend de repartir dans les abysses !`, "info");
              return { ...hero, currentHp: newHp, currentMana: newMana, status: "idle" as const };
            }
            return { ...hero, currentHp: newHp, currentMana: newMana };
          }
          return hero;
        });
      });
    }, 1000);

    return () => clearInterval(handle);
  }, [
    currentUser,
    town.getRates,
    town.buildings,
    town.totalCitizens,
    town.setResources,
    town.setCitizenGrowthProgress,
    town.setTotalCitizens,
    town.setCitizens,
    town.isMigrationPending,
    town.triggerCitizenMigration,
    town.performImmigrationTick,
    dungeon.setHeroes,
    addLog,
    isOnline
  ]);

  const activeRates = town.getRates();
  const recruitmentCost = 100 + dungeon.heroes.length * 150;

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
                    {formatResourceValue(town.resources.gold)}
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
                    {formatResourceValue(town.resources.food)}
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
                    {formatResourceValue(town.resources.wood)}
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
                    {formatResourceValue(town.resources.stone)}
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
                    {formatResourceValue(town.resources.ore)}
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

      {!isOnline && currentUser && (
        <div role="status" className="sticky top-0 z-30 border-b border-amber-700/60 bg-amber-950/95 px-4 py-2 text-center text-sm text-amber-100">
          📡 Mode hors connexion — cache en lecture seule. Les mutations reprendront après reconnexion.
        </div>
      )}

      {/* 2. DYNAMIC NAMING POPUP STAGE (BLOCKED IF USER DID NOT CHOOSE A NAME YET) */}
      {currentUser && !cityName && isInitialGameLoadDone && (
        <div className="flex-1 bg-[#150D08]/90 flex items-center justify-center p-4">
          <LoginPage
            onLoginSuccess={(name, startingHeroes) => {
              setCityName(name);
              town.setResources({ gold: 125, food: 75, wood: 40, stone: 0, ore: 0 });
              town.setBuildings({ "habitation": 1, "guilde": 0 });
              town.setCitizens({ unassigned: 3, woodcutters: 0, farmers: 0, miners: 0, quarrymen: 0 });
              town.setTotalCitizens(3);
              town.setUnlockedDistricts({});
              dungeon.setHeroes(startingHeroes || []);
              dungeon.setActiveDungeonFloor(1);
              dungeon.setActiveDungeonRoom(1);
              dungeon.setHighestFloorReached(1);
              setBattleLogs([]);
            }}
            addLog={addLog}
          />
        </div>
      )}

      {/* 3. CORE VIEW APPLICATION LAYOUT CONTAINER */}
      <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col gap-4 select-none text-[15px] sm:text-base leading-relaxed">
        
        {/* CHEAT CODES ZONE */}
        {cheatsAllowedForUser && cityName && (
          <div className="bg-[#1e130b] border border-[#523520] rounded-xl p-3.5 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between animate-fade-in shrink-0">
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
          
          {/* A. CITY TAB VIEW (TOWN INTERFACE) */}
          {activeTab === "city" && (
            <div className={`w-full ${isOnline ? "" : "pointer-events-none opacity-80"}`} aria-disabled={!isOnline}>
              <TownPanel
                resources={town.resources}
                buildings={town.buildings}
                citizens={town.citizens}
                totalCitizensCount={town.totalCitizens}
                unlockedDistricts={town.unlockedDistricts}
                onUpgradeBuilding={town.handleUpgradeBuilding}
                onAllocateCitizen={town.handleAllocateCitizen}
                onUnlockDistrict={town.handleUnlockDistrict}
                citizenGrowthProgress={town.citizenGrowthProgress}
                highestFloorReached={dungeon.highestFloorReached}
                heroes={dungeon.heroes}
                activeDungeonFloor={dungeon.activeDungeonFloor}
                isMigrationPending={town.isMigrationPending}
                storedItems={dungeon.storedItems}
                setStoredItems={dungeon.setStoredItems}
                forgeMaterials={dungeon.forgeMaterials}
                setForgeMaterials={dungeon.setForgeMaterials}
                itemBlueprints={dungeon.itemBlueprints}
                setItemBlueprints={dungeon.setItemBlueprints}
                addLog={addLog}
                isOnline={isOnline}
              />
            </div>
          )}

          {/* B. HEROES TAB VIEW (HERO GUILD MANAGEMENT) */}
          {activeTab === "heroes" && (
            <div className={`w-full ${isOnline ? "" : "pointer-events-none opacity-80"}`} aria-disabled={!isOnline}>
              <HeroPanel
                heroes={dungeon.heroes}
                resources={town.resources}
                buildings={town.buildings}
                onDismissHero={dungeon.handleDismissHero}
                onToggleHeroActive={dungeon.handleToggleHeroActive}
                onRecruitHero={handleInitiateNewRecruitment}
                onUnequipItem={dungeon.handleUnequipItem}
                onEquipItem={dungeon.handleEquipItem}
                storedItems={dungeon.storedItems}
                onGoToTab={setActiveTab}
              />
            </div>
          )}

          {/* C. DUNGEON TAB VIEW (CENTERED HIGH-PERFORMANCE COMBAT MONITOR) */}
          {activeTab === "dungeon" && (
            <div className={`w-full ${isOnline ? "" : "pointer-events-none opacity-80"}`} aria-disabled={!isOnline}>
              <DungeonPanel
                heroes={dungeon.heroes}
                currentMonster={dungeon.currentMonster}
                currentEncounterType={dungeon.currentEncounterType}
                activeDungeonFloor={dungeon.activeDungeonFloor}
                activeDungeonRoom={dungeon.activeDungeonRoom}
                autoExplore={dungeon.autoExplore}
                battleLogs={battleLogs}
                highestFloorReached={dungeon.highestFloorReached}
                onToggleAutoExplore={() => dungeon.setAutoExploreMutation(!dungeon.autoExplore)}
                onChangeFloor={dungeon.handleChangeFloor}
                onRetreatParty={dungeon.handleRetreatParty}
                onClearBattleLogs={clearBattleLogs}
                combatTimer={dungeon.combatTimer}
                onResetLevel={() => {
                  dungeon.handleResetLevel();
                  clearBattleLogs();
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
                addLog={addLog}
                isCloudQuotaExceeded={isCloudQuotaExceeded}
              />
            </div>
          )}

          {/* E. STORAGE TAB VIEW (GLOBAL CITY VAULT & EQUIPMENT PREVIEW) */}
          {activeTab === "storage" && (
            <div className="w-full">
              <StoragePanel
                storedItems={dungeon.storedItems}
                heroes={dungeon.heroes}
                onEquipItem={dungeon.handleEquipItem}
                isForgeUnlocked={(town.buildings["forge"] || 0) >= 1}
                onScrapItem={dungeon.handleScrapItem}
                forgeMaterials={dungeon.forgeMaterials}
              />
            </div>
          )}

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
      {pendingRecruit && (() => {
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
