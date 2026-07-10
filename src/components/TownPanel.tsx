import React, { useState } from "react";
import {
  Home,
  Grape,
  Trees,
  Hammer,
  Pickaxe,
  Store,
  ShieldAlert,
  BookOpen,
  Heart,
  Church,
  Lock,
  Plus,
  Minus,
  Coins,
  UserPlus,
  Sparkles,
  MapPin,
  Flame,
  Swords,
  Target,
  Leaf,
  EyeOff
} from "lucide-react";
import {
  Resources,
  CitizenAllocation,
  Hero,
  StoredItemStack,
  StoredForgeMaterialStack,
  ItemBlueprint,
  ItemInfo,
  Modifier,
  Rarity
} from "../types";
import {
  BUILDINGS_LIST,
  DISTRICTS_LIST,
  checkBuildingUnlocked,
  getBuildingMaxLevel,
  getBuildingUpgradeCost,
  BUILDING_UNLOCKS
} from "../data/gameData";
import { formatResourceValue } from "./IconDetails";
import {
  BASIC_FORGE_CRAFTABLE_ITEMS,
  BASIC_FORGE_CRAFT_COST,
  BASIC_FORGE_UPGRADE_COSTS,
  BASIC_FORGE_BONUS_MODIFIER_VALUES,
  startBasicForgeCraftFromBlueprint,
  finalizeBasicForgeCraft,
  BasicForgeUpgradeProc,
  FORGE_MATERIALS
} from "../utils/gameCalculations";

interface TownPanelProps {
  resources: Resources;
  buildings: { [key: string]: number };
  citizens: CitizenAllocation;
  totalCitizensCount: number;
  unlockedDistricts: { [key: string]: boolean };
  onUpgradeBuilding: (buildingId: string) => void;
  onAllocateCitizen: (job: keyof Omit<CitizenAllocation, "unassigned">, amount: number) => void;
  onUnlockDistrict: (districtId: string) => void;
  citizenGrowthProgress: number;
  highestFloorReached: number;
  heroes: Hero[];
  activeDungeonFloor: number;
  isMigrationPending?: boolean;
  storedItems: StoredItemStack[];
  setStoredItems: React.Dispatch<React.SetStateAction<StoredItemStack[]>>;
  forgeMaterials: StoredForgeMaterialStack[];
  setForgeMaterials: React.Dispatch<React.SetStateAction<StoredForgeMaterialStack[]>>;
  itemBlueprints: ItemBlueprint[];
  setItemBlueprints: React.Dispatch<React.SetStateAction<ItemBlueprint[]>>;
  addLog: (message: string, type?: "info" | "victory" | "defeat" | "loot" | "combat-hero" | "combat-enemy") => void;
}

export default function TownPanel({
  resources,
  buildings,
  citizens,
  totalCitizensCount,
  unlockedDistricts,
  onUpgradeBuilding,
  onAllocateCitizen,
  onUnlockDistrict,
  citizenGrowthProgress,
  highestFloorReached,
  heroes,
  activeDungeonFloor,
  isMigrationPending = false,
  storedItems,
  setStoredItems,
  forgeMaterials,
  setForgeMaterials,
  itemBlueprints,
  setItemBlueprints,
  addLog
}: TownPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"citizens" | "buildings" | "districts" | "forge">("citizens");

  // Forge System Local States
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("starter_sword");
  const [activeCraftPreview, setActiveCraftPreview] = useState<ItemInfo | null>(null);
  const [activeCraftUpgradeProc, setActiveCraftUpgradeProc] = useState<BasicForgeUpgradeProc>("none");
  const [upgradeAccepted, setUpgradeAccepted] = useState<boolean>(false);
  const [chosenModifierStat, setChosenModifierStat] = useState<string | undefined>(undefined);
  const [craftError, setCraftError] = useState<string | null>(null);

  const getCompatibleModifiers = (itemType: string): string[] => {
    if (itemType === "weapon") {
      return ["physicalDamage", "magicDamage", "critChance", "speed"];
    } else {
      return [
        "maxHp",
        "maxMana",
        "physicalDefense",
        "magicDefense",
        "dodgeChance",
        "fireResistance",
        "iceResistance",
        "waterResistance",
        "earthResistance",
        "windResistance",
        "lightningResistance",
        "holyResistance",
        "darkResistance",
        "natureResistance",
        "arcaneResistance",
        "poisonResistance",
        "bloodResistance",
        "soundResistance",
        "radiantResistance"
      ];
    }
  };

  const getModifierLabel = (stat: string): string => {
    switch (stat) {
      case "physicalDamage": return "⚔️ +1 Dégâts Physiques";
      case "magicDamage": return "🔮 +1 Dégâts Magiques";
      case "critChance": return "✨ +1% Chances de Critique";
      case "speed": return "👟 +2% Vitesse";
      case "maxHp": return "❤️ +3% PV Max";
      case "maxMana": return "🧪 +3% Mana Max";
      case "physicalDefense": return "🛡️ +1 Défense Physique";
      case "magicDefense": return "🧼 +1 Défense Magique";
      case "dodgeChance": return "💨 +1% Chances d'Esquive";
      case "fireResistance": return "🔥 +2 Résistance Feu";
      case "iceResistance": return "❄️ +2 Résistance Glace";
      case "waterResistance": return "💧 +2 Résistance Eau";
      case "earthResistance": return "🪨 +2 Résistance Terre";
      case "windResistance": return "🌀 +2 Résistance Vent";
      case "lightningResistance": return "⚡ +2 Résistance Foudre";
      case "holyResistance": return "☀️ +2 Résistance Sacré";
      case "darkResistance": return "🌙 +2 Résistance Ombre";
      case "natureResistance": return "🍃 +2 Résistance Nature";
      case "arcaneResistance": return "🔯 +2 Résistance Arcanes";
      case "poisonResistance": return "🧪 +2 Résistance Poison";
      case "bloodResistance": return "🩸 +2 Résistance Sang";
      case "soundResistance": return "🔊 +2 Résistance Son";
      case "radiantResistance": return "🌟 +2 Résistance Radiant";
      default: return stat;
    }
  };

  const handleStartCraft = () => {
    setCraftError(null);
    const result = startBasicForgeCraftFromBlueprint(
      { unlocked: true },
      forgeMaterials,
      itemBlueprints,
      selectedBlueprintId
    );

    if (result.success && result.craftedPreview) {
      setForgeMaterials(result.forgeMaterials);
      setActiveCraftPreview(result.craftedPreview);
      setActiveCraftUpgradeProc(result.upgradeProc);
      setUpgradeAccepted(false);
      const compat = getCompatibleModifiers(result.craftedPreview.itemType);
      setChosenModifierStat(compat[0]);
    } else {
      setCraftError(result.message);
      addLog(`⚠️ Forge : ${result.message}`, "defeat");
    }
  };

  const handleFinalizeCraft = () => {
    if (!activeCraftPreview) return;
    const result = finalizeBasicForgeCraft(
      storedItems,
      forgeMaterials,
      activeCraftPreview,
      activeCraftUpgradeProc,
      {
        accepted: upgradeAccepted,
        chosenModifierStat: upgradeAccepted ? chosenModifierStat : undefined
      }
    );

    if (result.success && result.finalItem) {
      setStoredItems(result.storedItems);
      setForgeMaterials(result.forgeMaterials);
      addLog(`🎉 Forge : ${result.message}`, "victory");
      setActiveCraftPreview(null);
      setActiveCraftUpgradeProc("none");
      setUpgradeAccepted(false);
      setChosenModifierStat(undefined);
      setCraftError(null);
    } else {
      setCraftError(result.message);
      addLog(`⚠️ Forge : Échec de finalisation. ${result.message}`, "defeat");
    }
  };

  const handleCancelCraft = () => {
    setActiveCraftPreview(null);
    setActiveCraftUpgradeProc("none");
    setUpgradeAccepted(false);
    setChosenModifierStat(undefined);
    setCraftError(null);
    addLog(`🔨 Forge : Fabrication annulée. Les matériaux de base ont été consumés dans les flammes.`, "info");
  };

  const guildLevel = buildings["guilde"] || 0;
  const maxHeroCapacity = guildLevel + 2;
  const maxCitizens = (buildings["habitation"] || 0) * 3;
  const recruitCost = 100 + heroes.length * 150;

  // Render job icon helper
  const getJobIcon = (job: string) => {
    switch (job) {
      case "farmers":
        return <Grape className="w-4 h-4 text-[#59ba59]" />;
      case "woodcutters":
        return <Trees className="w-4 h-4 text-[#d26d36]" />;
      case "quarrymen":
        return <Hammer className="w-4 h-4 text-[#cdcdcd]" />;
      case "miners":
        return <Pickaxe className="w-4 h-4 text-[#9653ec]" />;
      default:
        return <Home className="w-4 h-4 text-gray-400" />;
    }
  };

  // Render building icon helper
  const getBuildingIcon = (iconName: string) => {
    switch (iconName) {
      case "Home":
        return <Home className="w-5 h-5 text-[#caa050]" />;
      case "Grape":
        return <Grape className="w-5 h-5 text-[#59ba59]" />;
      case "Trees":
        return <Trees className="w-5 h-5 text-[#d26d36]" />;
      case "Hammer":
        return <Hammer className="w-5 h-5 text-[#cdcdcd]" />;
      case "Flame":
        return <Flame className="w-5 h-5 text-[#f97316]" />;
      case "Pickaxe":
        return <Pickaxe className="w-5 h-5 text-[#9653ec]" />;
      case "Store":
        return <Store className="w-5 h-5 text-[#e5c158]" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-5 h-5 text-[#d23636]" />;
      case "BookOpen":
        return <BookOpen className="w-5 h-5 text-[#3b82f6]" />;
      case "Heart":
        return <Heart className="w-5 h-5 text-[#ec4899]" />;
      case "Church":
        return <Church className="w-5 h-5 text-[#10b981]" />;
      case "Swords":
        return <Swords className="w-5 h-5 text-[#f43f5e]" />;
      case "Target":
        return <Target className="w-5 h-5 text-[#a3e635]" />;
      case "Leaf":
        return <Leaf className="w-5 h-5 text-[#10b981]" />;
      case "EyeOff":
        return <EyeOff className="w-5 h-5 text-[#a78bfa]" />;
      default:
        return <Home className="w-5 h-5 text-gray-400" />;
    }
  };

  // Check if cost is affordable helper
  const isAffordable = (cost: Resources) => {
    return (
      resources.gold >= (cost.gold || 0) &&
      resources.food >= (cost.food || 0) &&
      resources.wood >= (cost.wood || 0) &&
      resources.stone >= (cost.stone || 0) &&
      resources.ore >= (cost.ore || 0)
    );
  };

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-amber-400 border-amber-500/50 bg-amber-950/20";
      case "epic":
        return "text-purple-400 border-purple-500/50 bg-purple-950/20";
      case "rare":
        return "text-blue-400 border-blue-500/50 bg-blue-950/20";
      default:
        return "text-gray-300 border-[#5c402b]/40 bg-slate-900/10";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TOWN CONTROLLER STATS HEADER */}
      <div className="bg-[#1c120a] border border-[#442c19]/70 rounded-xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#2c1d12] rounded-xl flex items-center justify-center border-2 border-[#caa050] text-2xl shadow-inner">
            🏰
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-[#caa050] tracking-wide">
              Gestion de la Colonie
            </h2>
            <p className="text-xs text-[#a89078] font-sans">
              Progressez en construisant des infrastructures et en assignant vos citoyens.
            </p>
          </div>
        </div>

        {/* ADVENTURERS CAPACITY DISPLAY */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <div className="text-right">
            <span className="text-[10px] text-[#8f8376] uppercase tracking-wider block font-mono">
              Effectif Aventuriers
            </span>
            <span className="text-xs font-bold text-[#dfdbc7]">
              {heroes.length} / {maxHeroCapacity} Membres
            </span>
          </div>
        </div>
      </div>

      {/* SUB MENU TABS BAR */}
      <div className="bg-[#1a1109] p-1 rounded-lg border border-[#3e2917] flex gap-1">
        <button
          onClick={() => setActiveSubTab("citizens")}
          className={`flex-1 py-2 rounded-md font-bold text-center text-xs transition cursor-pointer ${
            activeSubTab === "citizens"
              ? "bg-[#caa050] text-[#110905]"
              : "text-[#a89078] hover:text-[#dfdbc7] hover:bg-[#251910]"
          }`}
        >
          🧑‍🌾 Population ({citizens.unassigned} Libres)
        </button>
        <button
          onClick={() => setActiveSubTab("buildings")}
          className={`flex-1 py-2 rounded-md font-bold text-center text-xs transition cursor-pointer ${
            activeSubTab === "buildings"
              ? "bg-[#caa050] text-[#110905]"
              : "text-[#a89078] hover:text-[#dfdbc7] hover:bg-[#251910]"
          }`}
        >
          🏢 Infrastructures ({Object.values(buildings).reduce((a, b) => a + b, 0)} Lvl)
        </button>
        <button
          onClick={() => setActiveSubTab("districts")}
          className={`flex-1 py-2 rounded-md font-bold text-center text-xs transition cursor-pointer ${
            activeSubTab === "districts"
              ? "bg-[#caa050] text-[#110905]"
              : "text-[#a89078] hover:text-[#dfdbc7] hover:bg-[#251910]"
          }`}
        >
          🗺️ Districts ({Object.values(unlockedDistricts).filter(Boolean).length} Débloqués)
        </button>
        <button
          onClick={() => setActiveSubTab("forge")}
          className={`flex-1 py-2 rounded-md font-bold text-center text-xs transition cursor-pointer ${
            activeSubTab === "forge"
              ? "bg-[#caa050] text-[#110905]"
              : "text-[#a89078] hover:text-[#dfdbc7] hover:bg-[#251910]"
          }`}
        >
          🔨 Forge {(buildings["forge"] || 0) < 1 ? "🔒" : "✨"}
        </button>
      </div>

      {/* CONTENT REGIONS */}
      
      {/* 1. CITIZENS / JOB ALLOCATIONS */}
      {activeSubTab === "citizens" && (
        <div className="bg-[#18110b] border border-[#45301f] rounded-xl p-5 shadow-lg space-y-4">
          
          {/* Header Progress and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#3c291a]">
            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#caa050] uppercase font-serif mb-1">
                IMMIGRATION ET MAISONS
              </h3>
              <p className="text-[11px] text-[#a89078]">
                Vos citoyens consomment de la nourriture pour attirer de nouveaux paysans. L'immigration s'effectue strictement <strong className="text-amber-500 font-semibold">un par un</strong> pour assurer la stabilité de la colonie.
              </p>
            </div>

            <div className="bg-[#100a06] p-3 rounded-lg border border-[#302014] flex flex-col justify-center">
              <div className="flex justify-between text-[11px] font-semibold text-[#dfdbc7] mb-1 font-serif">
                <span>{isMigrationPending ? "⌛ Migration en cours..." : "Immigration en cours"}</span>
                <span className="text-amber-500 font-mono">
                  {totalCitizensCount} / {maxCitizens} Paysans
                </span>
              </div>
              <div className="w-full h-2 bg-[#1a110a] rounded-full overflow-hidden border border-[#442c19]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#86592e] to-[#caa050] transition-all duration-300"
                  style={{ width: `${totalCitizensCount >= maxCitizens ? 0 : citizenGrowthProgress}%` }}
                />
              </div>
              <p className="text-[9.5px] text-[#8f8376] mt-1 text-right italic">
                {totalCitizensCount >= maxCitizens 
                  ? "Capacité maximale de population atteinte." 
                  : isMigrationPending
                    ? "Serrage de mains en cours... (un par un)"
                    : "Consomme 1 nourriture/s pour immigrer."}
              </p>
            </div>
          </div>

          {/* Allocation Grid */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[#ae8650] uppercase tracking-wider font-serif">
              Affectation des rôles
            </h4>

            {citizens.unassigned > 0 && (
              <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-[#ebd7a0] flex items-center gap-2 font-mono animate-pulse">
                <span>⚠️</span>
                <span>Vous possédez <strong>{citizens.unassigned}</strong> citoyen(s) inoccupé(s). Assignez-les à la collecte !</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Job 1: Farmers */}
              <div className="bg-[#120a06] p-3 rounded-lg border border-[#45301f] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#59ba59]/10 border border-[#59ba59]/25 flex items-center justify-center">
                    {getJobIcon("farmers")}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#dfdbc7] font-serif">Fermiers</h5>
                    <span className="text-[9.5px] text-[#8f8376] font-mono">Ferme Niv. {buildings["ferme"] || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 font-mono">
                  <button
                    onClick={() => onAllocateCitizen("farmers", -1)}
                    disabled={(citizens.farmers || 0) <= 0}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">
                    {citizens.farmers || 0}
                  </span>
                  <button
                    onClick={() => onAllocateCitizen("farmers", 1)}
                    disabled={citizens.unassigned <= 0 || (buildings["ferme"] || 0) < 1}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Job 2: Woodcutters */}
              <div className="bg-[#120a06] p-3 rounded-lg border border-[#45301f] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#d26d36]/10 border border-[#d26d36]/25 flex items-center justify-center">
                    {getJobIcon("woodcutters")}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#dfdbc7] font-serif">Bûcherons</h5>
                    <span className="text-[9.5px] text-[#8f8376] font-mono">Maison bûcheron Niv. {buildings["scierie"] || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 font-mono">
                  <button
                    onClick={() => onAllocateCitizen("woodcutters", -1)}
                    disabled={(citizens.woodcutters || 0) <= 0}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">
                    {citizens.woodcutters || 0}
                  </span>
                  <button
                    onClick={() => onAllocateCitizen("woodcutters", 1)}
                    disabled={citizens.unassigned <= 0 || (buildings["scierie"] || 0) < 1}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Job 3: Quarrymen */}
              <div className="bg-[#120a06] p-3 rounded-lg border border-[#45301f] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#cdcdcd]/10 border border-[#cdcdcd]/25 flex items-center justify-center">
                    {getJobIcon("quarrymen")}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#dfdbc7] font-serif">Tailleurs de pierre</h5>
                    <span className="text-[9.5px] text-[#8f8376] font-mono">Carrière Niv. {buildings["carriere"] || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 font-mono">
                  <button
                    onClick={() => onAllocateCitizen("quarrymen", -1)}
                    disabled={(citizens.quarrymen || 0) <= 0}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">
                    {citizens.quarrymen || 0}
                  </span>
                  <button
                    onClick={() => onAllocateCitizen("quarrymen", 1)}
                    disabled={citizens.unassigned <= 0 || (buildings["carriere"] || 0) < 1}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Job 4: Miners */}
              <div className="bg-[#120a06] p-3 rounded-lg border border-[#45301f] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#9653ec]/10 border border-[#9653ec]/25 flex items-center justify-center">
                    {getJobIcon("miners")}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#dfdbc7] font-serif">Mineurs</h5>
                    <span className="text-[9.5px] text-[#8f8376] font-mono">Mine Niv. {buildings["mine"] || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 font-mono">
                  <button
                    onClick={() => onAllocateCitizen("miners", -1)}
                    disabled={(citizens.miners || 0) <= 0}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">
                    {citizens.miners || 0}
                  </span>
                  <button
                    onClick={() => onAllocateCitizen("miners", 1)}
                    disabled={citizens.unassigned <= 0 || (buildings["mine"] || 0) < 1}
                    className="p-1 rounded bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] disabled:opacity-30 disabled:cursor-not-allowed border border-[#5c402b]/60 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. BUILDINGS GRID */}
      {activeSubTab === "buildings" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BUILDINGS_LIST.map((building) => {
            const level = buildings[building.id] || 0;
            const maxLvl = getBuildingMaxLevel(building.id);
            const unlocked = checkBuildingUnlocked(building.id, buildings, highestFloorReached);
            const cost = getBuildingUpgradeCost(building.id, level);
            const affordable = unlocked && level < maxLvl && isAffordable(cost);

            return (
              <div
                key={building.id}
                className={`p-4 rounded-xl border-2 transition duration-150 flex flex-col justify-between ${
                  !unlocked
                    ? "bg-[#100a06]/40 border-[#301c0f]/50 opacity-40 select-none"
                    : level > 0
                      ? "bg-[#1c120a] border-[#5a3a1a] shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                      : "bg-[#140d08] border-[#3a2211] shadow-inner"
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 mb-2 pb-2 border-b border-[#5a3a1a]/45">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg bg-slate-950/40 border border-[#5a3a1a]/45 flex items-center justify-center`}>
                        {getBuildingIcon(building.icon)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#dfdbc7] font-serif">
                          {building.name}
                        </h4>
                        <span className="text-[9px] text-[#8f8376] font-semibold uppercase tracking-wider font-mono">
                          {building.category === "production" ? "Collecte" : building.category === "housing" ? "Logement" : "Militaire/Social"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#caa050] font-serif block select-none">
                        {level === 0 ? "Non bâti" : `Niveau ${level}/${maxLvl}`}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[10.5px] text-[#a89078] leading-relaxed mb-3 min-h-[32px]">
                    {building.description}
                  </p>
                </div>

                {/* Lock or Upgrade Option */}
                <div className="pt-2 border-t border-[#5a3a1a]/25 mt-2">
                  {!unlocked ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-mono italic">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Requis : {BUILDING_UNLOCKS[building.id]?.desc}</span>
                    </div>
                  ) : level >= maxLvl ? (
                    <span className="block text-center text-[10px] text-emerald-500 font-serif uppercase tracking-wider font-extrabold py-1">
                      👑 Bâtiment au Niveau Maximum
                    </span>
                  ) : (
                    <div>
                      {/* Cost Details */}
                      <div className="mb-2.5 bg-black/35 p-2 rounded-lg border border-[#442c19]/30">
                        <span className="text-[8.5px] uppercase tracking-widest text-[#8c5a2b] font-bold font-mono block mb-1">
                          Coût d'amélioration :
                        </span>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px]">
                          {cost.gold > 0 && (
                            <span className={resources.gold >= cost.gold ? "text-yellow-500 font-bold" : "text-[#7a6a5b]"}>
                              💰 {formatResourceValue(cost.gold)}
                            </span>
                          )}
                          {cost.food > 0 && (
                            <span className={resources.food >= cost.food ? "text-emerald-500 font-bold" : "text-[#7a6a5b]"}>
                              🌾 {formatResourceValue(cost.food)}
                            </span>
                          )}
                          {cost.wood > 0 && (
                            <span className={resources.wood >= cost.wood ? "text-[#d26d36] font-bold" : "text-[#7a6a5b]"}>
                              🪵 {formatResourceValue(cost.wood)}
                            </span>
                          )}
                          {cost.stone > 0 && (
                            <span className={resources.stone >= cost.stone ? "text-gray-300 font-bold" : "text-[#7a6a5b]"}>
                              🪨 {formatResourceValue(cost.stone)}
                            </span>
                          )}
                          {cost.ore > 0 && (
                            <span className={resources.ore >= cost.ore ? "text-[#9653ec] font-bold" : "text-[#7a6a5b]"}>
                              ⛓️ {formatResourceValue(cost.ore)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Upgrade action trigger button */}
                      <button
                        onClick={() => onUpgradeBuilding(building.id)}
                        disabled={!affordable}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold font-serif uppercase tracking-wider border transition cursor-pointer select-none ${
                          affordable
                            ? "bg-[#caa050] hover:bg-[#d9b363] text-[#110905] border-[#ebd7a0]"
                            : "bg-[#18110b] border-[#302014] text-[#5c4b3f]/70 cursor-not-allowed"
                        }`}
                      >
                        {level === 0 ? "Bâtir" : "Améliorer"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. DISTRICTS / SPECIALISATIONS */}
      {activeSubTab === "districts" && (
        <div className="bg-[#18110b] border border-[#45301f] rounded-xl p-5 shadow-lg space-y-4">
          <div className="border-b border-[#3c291a] pb-3 mb-3">
            <h3 className="text-xs font-bold tracking-widest text-[#caa050] uppercase font-serif mb-1">
              Spécialisation des Districts
            </h3>
            <p className="text-[11px] text-[#a89078]">
              Érigez des concessions géographiques uniques autour de votre cité pour doubler ou booster durablement vos rendements de paysans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DISTRICTS_LIST.map((district) => {
              const unlocked = unlockedDistricts[district.id] || false;
              const affordable = !unlocked && isAffordable(district.cost);

              return (
                <div
                  key={district.id}
                  className={`p-4 rounded-xl border-2 flex flex-col justify-between transition duration-150 ${
                    unlocked
                      ? "bg-[#1a1c11] border-[#5e701a]/80 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                      : "bg-[#120a06] border-[#302014]"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-[#302014]/60 mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${unlocked ? "text-emerald-400 animate-bounce" : "text-[#ae8650]"}`} />
                        <h4 className="text-xs font-serif font-black uppercase text-[#dfdbc7]">
                          {district.name}
                        </h4>
                      </div>
                      {unlocked && (
                        <span className="text-[8.5px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-[#2b4c13] text-[#a1f158]">
                          Inauguré 🟢
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#a89078] leading-relaxed mb-3">
                      {district.description}
                    </p>
                  </div>

                  {/* Footer costs and unlock trigger */}
                  <div className="pt-2 border-t border-[#302014]/40 mt-2">
                    {unlocked ? (
                      <span className="block text-center text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest py-1">
                        ✨ Production passive activée (+{(district.boostValue * 100).toFixed(0)}%)
                      </span>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-black/20 p-2 rounded-lg border border-[#3e2c1c]/50">
                          <span className="text-[8px] uppercase font-mono font-bold tracking-wider text-[#8c5a2b] block mb-1">
                            Frais d'inauguration :
                          </span>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[9px]">
                            {district.cost.gold > 0 && (
                              <span className={resources.gold >= district.cost.gold ? "text-yellow-500 font-semibold" : "text-[#7a6a5b]"}>
                                💰 {formatResourceValue(district.cost.gold)}
                              </span>
                            )}
                            {district.cost.food > 0 && (
                              <span className={resources.food >= district.cost.food ? "text-emerald-500 font-semibold" : "text-[#7a6a5b]"}>
                                🌾 {formatResourceValue(district.cost.food)}
                              </span>
                            )}
                            {district.cost.wood > 0 && (
                              <span className={resources.wood >= district.cost.wood ? "text-[#d26d36] font-semibold" : "text-[#7a6a5b]"}>
                                🪵 {formatResourceValue(district.cost.wood)}
                              </span>
                            )}
                            {district.cost.stone > 0 && (
                              <span className={resources.stone >= district.cost.stone ? "text-gray-300 font-semibold" : "text-[#7a6a5b]"}>
                                🪨 {formatResourceValue(district.cost.stone)}
                              </span>
                            )}
                            {district.cost.ore > 0 && (
                              <span className={resources.ore >= district.cost.ore ? "text-[#9653ec] font-semibold" : "text-[#7a6a5b]"}>
                                ⛓️ {formatResourceValue(district.cost.ore)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onUnlockDistrict(district.id)}
                          disabled={!affordable}
                          className={`w-full py-1.5 rounded-lg text-xs font-serif uppercase tracking-widest font-black transition cursor-pointer select-none ${
                            affordable
                              ? "bg-[#caa050] hover:bg-[#d9b363] text-[#110905] border border-[#ebd7a0]"
                              : "bg-[#18110b] border-[#302014] text-[#5c4b3f]/70 cursor-not-allowed"
                          }`}
                        >
                          Acheter le District
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. FORGE (FABRICATION D'EQUIPEMENT) */}
      {activeSubTab === "forge" && (
        <div className="bg-[#18110b] border border-[#45301f] rounded-xl p-5 shadow-lg space-y-4">
          
          {(buildings["forge"] || 0) < 1 ? (
            <div className="p-8 text-center text-xs text-[#a89078] border border-dashed border-[#5c402b]/40 rounded-xl bg-[#1f1610]/30 font-mono space-y-2">
              <Lock className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
              <h3 className="font-serif font-black uppercase text-[#dfdbc7] text-sm">Forge Rustique Verrouillée</h3>
              <p>Vous devez d'abord ériger la Forge Rustique (Infrastructures) avant de commencer la fabrication de reliques d'acier.</p>
              <p className="text-[10px] text-[#ae8650] font-sans">
                Requis : {BUILDING_UNLOCKS["forge"]?.desc || "Campement Niv. 1, Maison du chef Niv. 1 et Étage atteint 7"}
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-[#3c291a] pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <h3 className="text-xs font-bold tracking-widest text-[#caa050] uppercase font-serif">
                    Enclume & Fourneaux de la Forge
                  </h3>
                </div>
                <p className="text-[11px] text-[#a89078]">
                  Consommez vos débris métalliques, métal raffiné et fragments magiques pour forger vos futurs équipements de guerre !
                </p>
              </div>

              {/* Forge materials inventory bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {FORGE_MATERIALS.map((mat) => {
                  const count = (forgeMaterials || [])
                    .find((stack) => stack.materialId === mat.id)
                    ?.count || 0;
                  
                  // Get custom border color based on rarity
                  const rarityColorClass = 
                    mat.rarity === "legendary" ? "border-amber-900/60 bg-amber-950/20 text-amber-400" :
                    mat.rarity === "epic" ? "border-purple-900/60 bg-purple-950/20 text-purple-400" :
                    mat.rarity === "rare" ? "border-sky-900/60 bg-sky-950/20 text-sky-400" :
                    mat.rarity === "uncommon" ? "border-green-900/60 bg-green-950/20 text-green-400" :
                    "border-[#3e2b1f] bg-[#110a06]/80 text-[#a89078]";

                  return (
                    <div
                      key={mat.id}
                      className={`p-2 rounded-xl border flex flex-col justify-between ${rarityColorClass} transition-all`}
                      title={mat.description}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider font-serif truncate">
                        {mat.name}
                      </div>
                      <div className="flex justify-between items-end mt-1.5">
                        <span className="text-[9px] text-[#8c7460] uppercase">{mat.rarity}</span>
                        <span className="font-mono text-sm font-bold text-[#dfdbc7]">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {craftError && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 text-xs rounded-lg font-mono">
                  ⚠️ {craftError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left Column: Blueprints List */}
                <div className="md:col-span-5 space-y-3">
                  <h4 className="text-xs font-bold tracking-widest text-[#caa050] uppercase font-serif">
                    📜 Plans d'Artisanat de Novice
                  </h4>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {BASIC_FORGE_CRAFTABLE_ITEMS.map((item) => {
                      const isUnlocked = (itemBlueprints || []).some(b => b.itemId === item.id && b.unlocked);
                      const isSelected = selectedBlueprintId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isUnlocked && !activeCraftPreview) {
                              setSelectedBlueprintId(item.id);
                              setCraftError(null);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition select-none ${
                            !isUnlocked
                              ? "bg-[#18110b]/20 border-[#302014] opacity-40 cursor-not-allowed"
                              : activeCraftPreview
                                ? "bg-[#1c140e] border-[#302014] opacity-50 cursor-not-allowed"
                                : isSelected
                                  ? "bg-[#2d1f14] border-[#caa050] shadow-[0_0_8px_rgba(202,160,80,0.25)] cursor-pointer"
                                  : "bg-[#1c140e] border-[#3c291a] hover:border-[#caa050]/40 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif font-bold text-xs text-[#dfdbc7]">
                                  {item.name}
                                </span>
                                {!isUnlocked && <Lock className="w-3 h-3 text-red-500" />}
                              </div>
                              <p className="text-[10px] text-[#a89078] mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-black tracking-wider ${
                              item.itemType === "weapon"
                                ? "bg-red-950/40 text-red-400 border border-red-900/30"
                                : item.itemType === "armor"
                                  ? "bg-green-950/40 text-green-400 border border-green-900/30"
                                  : "bg-blue-950/40 text-blue-400 border border-blue-900/30"
                            }`}>
                              {item.itemType}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Workstation & Craft Console */}
                <div className="md:col-span-7 bg-[#120a06]/80 border border-[#3c291a] rounded-xl p-4 space-y-4">
                  {activeCraftPreview === null ? (
                    // Idle state: Show selected blueprint details & base craft button
                    (() => {
                      const selectedBlueprint = BASIC_FORGE_CRAFTABLE_ITEMS.find(item => item.id === selectedBlueprintId);
                      if (!selectedBlueprint) {
                        return (
                          <div className="text-center py-12 text-xs text-[#a89078] font-mono">
                            Sélectionnez un plan à forger sur la gauche.
                          </div>
                        );
                      }

                      const currentScrap = forgeMaterials.find(m => m.materialId === "metal_scrap" && m.rarity === "common")?.count || 0;
                      const currentRefined = forgeMaterials.find(m => m.materialId === "refined_metal" && m.rarity === "uncommon")?.count || 0;

                      const scrapOk = currentScrap >= 6;
                      const refinedOk = currentRefined >= 1;
                      const canAfford = scrapOk && refinedOk;

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-[#3c291a]">
                            <Hammer className="w-5 h-5 text-amber-500" />
                            <div>
                              <h4 className="text-xs font-black tracking-wider text-[#caa050] uppercase font-serif">
                                Détails du Plan : {selectedBlueprint.name}
                              </h4>
                              <p className="text-[10px] text-[#a89078]">Qualité de départ : Commune</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-[#1c140e] border border-[#302014] text-xs space-y-2">
                            <p className="text-[#dfdbc7] italic font-sans text-[11px]">
                              "{selectedBlueprint.description}"
                            </p>
                            <div className="pt-1.5 border-t border-[#302014]/40 font-mono space-y-1 text-[11px]">
                              {selectedBlueprint.itemType === "weapon" && (selectedBlueprint as any).damageRange && (
                                <p className="text-red-400">
                                  ⚔️ Dégâts de base : {(selectedBlueprint as any).damageRange.min} - {(selectedBlueprint as any).damageRange.max}
                                </p>
                              )}
                              {selectedBlueprint.modifiers && selectedBlueprint.modifiers.length > 0 && (
                                <div className="space-y-0.5">
                                  <p className="text-gray-400">Propriétés :</p>
                                  {selectedBlueprint.modifiers.map((m, idx) => (
                                    <p key={idx} className="text-[#caa050] pl-2">
                                      • {m.stat} : {m.type === "percent" ? `+${m.value}%` : `+${m.value}`}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-[10px] font-black tracking-widest text-[#caa050]/80 uppercase font-mono">
                              🛠️ Coût de Fabrication de Base :
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                                scrapOk ? "bg-green-950/10 border-green-900/40 text-green-400" : "bg-red-950/10 border-red-900/40 text-red-400"
                              }`}>
                                <span className="text-[10px] text-gray-400">Débris métalliques</span>
                                <span className="font-bold mt-1 text-[13px]">
                                  {currentScrap} / 6
                                </span>
                              </div>
                              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                                refinedOk ? "bg-green-950/10 border-green-900/40 text-green-400" : "bg-red-950/10 border-red-900/40 text-red-400"
                              }`}>
                                <span className="text-[10px] text-gray-400">Métal raffiné</span>
                                <span className="font-bold mt-1 text-[13px]">
                                  {currentRefined} / 1
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleStartCraft}
                            disabled={!canAfford}
                            className={`w-full py-3 rounded-xl text-xs font-serif uppercase tracking-widest font-black transition-all duration-200 select-none shadow-md ${
                              canAfford
                                ? "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white border border-[#ebd7a0] cursor-pointer shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)]"
                                : "bg-[#18110b] border-[#302014] text-[#5c4b3f]/70 cursor-not-allowed"
                            }`}
                          >
                            ⚒️ Déclencher le soufflet & Forger
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    // Craft in progress / pending upgrade decision & finalization
                    (() => {
                      const ownedRefined = forgeMaterials.find(m => m.materialId === "refined_metal" && m.rarity === "uncommon")?.count || 0;
                      const ownedEnchanted = forgeMaterials.find(m => m.materialId === "enchanted_fragment" && m.rarity === "rare")?.count || 0;

                      // Check cost based on rolled upgrade proc
                      let upgradeCostText = "";
                      let upgradeCostMet = false;

                      if (activeCraftUpgradeProc === "uncommon") {
                        upgradeCostText = "2 Métal raffiné (Inhabituel)";
                        upgradeCostMet = ownedRefined >= 2;
                      } else if (activeCraftUpgradeProc === "rare") {
                        upgradeCostText = "4 Métal raffiné (Inhabituel) & 1 Fragment enchanté (Rare)";
                        upgradeCostMet = ownedRefined >= 4 && ownedEnchanted >= 1;
                      }

                      const compats = getCompatibleModifiers(activeCraftPreview.itemType);

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-[#3c291a] animate-pulse">
                            <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
                            <div>
                              <h4 className="text-xs font-black tracking-wider text-orange-400 uppercase font-serif">
                                ⚔️ Forge Active : Métal Fusionné !
                              </h4>
                              <p className="text-[10px] text-gray-400">Objet en phase de refroidissement...</p>
                            </div>
                          </div>

                          <div className="p-3 bg-[#1c140e] border border-[#caa050]/40 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400 font-mono">Objet Forgé :</span>
                              <span className="text-xs font-serif font-black text-[#dfdbc7]">
                                {activeCraftPreview.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#a89078] font-mono leading-relaxed bg-[#120a06]/60 p-2 rounded border border-[#302014]/60">
                              Qualité standard : <span className="text-gray-400 uppercase font-bold">Commune</span>
                            </div>
                          </div>

                          {/* Upgrade Roll Section */}
                          <div className="p-3 rounded-xl border bg-[#1c140e] border-[#3c291a] space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400 font-mono">Flux de l'Enclume :</span>
                              {activeCraftUpgradeProc === "none" ? (
                                <span className="text-xs font-mono text-gray-500 uppercase font-black bg-gray-950/60 px-2 py-0.5 rounded border border-gray-900">
                                  Standard
                                </span>
                              ) : activeCraftUpgradeProc === "uncommon" ? (
                                <span className="text-xs font-mono text-green-400 uppercase font-black bg-green-950/60 px-2 py-0.5 rounded border border-green-900 animate-pulse">
                                  ✨ Inhabituel Détecté !
                                </span>
                              ) : (
                                <span className="text-xs font-mono text-blue-400 uppercase font-black bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900 animate-pulse">
                                  🌟 Rare Détecté !
                                </span>
                              )}
                            </div>

                            {activeCraftUpgradeProc !== "none" ? (
                              <div className="space-y-2 pt-1 border-t border-[#302014]/40">
                                <p className="text-[11px] text-[#a89078]">
                                  Les braises s'embrasent d'une lueur divine ! Vous pouvez dépenser des matériaux pour infuser cette qualité supérieure.
                                </p>
                                <div className="text-[10px] font-mono text-gray-400">
                                  Coût d'amélioration : <span className={upgradeCostMet ? "text-green-400" : "text-red-400"}>{upgradeCostText}</span>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="checkbox"
                                    id="upgrade-toggle"
                                    disabled={!upgradeCostMet}
                                    checked={upgradeAccepted}
                                    onChange={(e) => setUpgradeAccepted(e.target.checked)}
                                    className="rounded border-[#caa050]/40 text-orange-600 focus:ring-orange-500 bg-gray-900 w-4 h-4 cursor-pointer disabled:opacity-40"
                                  />
                                  <label
                                    htmlFor="upgrade-toggle"
                                    className={`text-xs font-serif uppercase tracking-wider font-bold select-none cursor-pointer ${
                                      !upgradeCostMet ? "text-[#7a6a5b] cursor-not-allowed" : "text-[#dfdbc7]"
                                    }`}
                                  >
                                    🚀 Accepter l'amélioration (+choix modificateur)
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-500 font-mono italic">
                                Les soufflets de base n'ont pas produit d'étincelles arcaniques cette fois-ci (85% de chances).
                              </p>
                            )}
                          </div>

                          {/* Modifier Selection Section (Only if upgraded) */}
                          {upgradeAccepted && (
                            <div className="p-3 bg-gradient-to-b from-[#1c140e] to-[#251a12] border border-amber-500/30 rounded-xl space-y-2">
                              <h5 className="text-[10px] font-black tracking-wider text-[#caa050] uppercase font-serif">
                                ✨ Modificateur d'Infusion : (Choisissez-en un)
                              </h5>
                              <p className="text-[10px] text-gray-400 font-mono leading-normal">
                                Choisissez le bonus magique à insuffler sur l'enclume :
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 max-h-[140px] overflow-y-auto pr-1">
                                {compats.map((stat) => {
                                  const isSelected = chosenModifierStat === stat;
                                  return (
                                    <button
                                      key={stat}
                                      onClick={() => setChosenModifierStat(stat)}
                                      className={`p-1.5 rounded-lg text-left text-xs font-mono transition select-none cursor-pointer border ${
                                        isSelected
                                          ? "bg-amber-950/40 border-amber-500 text-amber-300 font-bold"
                                          : "bg-gray-950/30 border-gray-900 text-gray-400 hover:border-amber-500/30"
                                      }`}
                                    >
                                      {getModifierLabel(stat)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Finalization Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              onClick={handleCancelCraft}
                              className="py-2.5 rounded-xl border border-red-900/60 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-serif uppercase tracking-widest font-black transition cursor-pointer"
                            >
                              🛑 Abandonner
                            </button>
                            <button
                              onClick={handleFinalizeCraft}
                              className="py-2.5 rounded-xl border border-[#ebd7a0] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#110905] text-xs font-serif uppercase tracking-widest font-black transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                            >
                              ✔️ Finaliser
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
}
