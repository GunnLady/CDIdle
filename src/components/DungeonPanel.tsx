/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import {
  Compass,
  Layers,
  Sword,
  Shield,
  Activity,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Flame,
  Clock,
  Sparkles,
  Zap,
  RotateCcw
} from "lucide-react";
import { Hero, Monster, BattleLogEntry, DungeonEncounterType } from "../types";
import { getHeroAttributes } from "../utils/gameCalculations";
import { getEncounterDetails, getEncounterStatPresentation } from "../utils/dungeonHelpers";

interface DungeonPanelProps {
  heroes: Hero[];
  currentMonster: Monster | null;
  currentEncounterType: DungeonEncounterType | null;
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  autoExplore: boolean;
  battleLogs: BattleLogEntry[];
  highestFloorReached: number;
  onToggleAutoExplore: () => void;
  hasActiveEncounter: boolean;
  onExplore: () => void;
  onResolveEncounter: () => void;
  onChangeFloor: (direction: "prev" | "next") => void;
  onRetreatParty: () => void;
  onClearBattleLogs: () => void;
  combatTimer: number; // visual progress of the tick
  onResetLevel: () => void;
}

export default function DungeonPanel({
  heroes,
  currentMonster,
  currentEncounterType,
  activeDungeonFloor,
  activeDungeonRoom,
  autoExplore,
  battleLogs,
  highestFloorReached,
  onToggleAutoExplore,
  hasActiveEncounter,
  onExplore,
  onResolveEncounter,
  onChangeFloor,
  onRetreatParty,
  onClearBattleLogs,
  combatTimer,
  onResetLevel
}: DungeonPanelProps) {
  const activeHeroes = heroes.filter((h) => h.isActive);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isResetConfirming, setIsResetConfirming] = React.useState(false);
  const [logFilter, setLogFilter] = React.useState<"all" | "dungeon" | "colony">("all");

  const filteredBattleLogs = React.useMemo(() => {
    if (logFilter === "all") return battleLogs;
    return battleLogs.filter((log) => {
      const cat = log.category || "dungeon";
      return cat === logFilter;
    });
  }, [battleLogs, logFilter]);

  // Memoized scout calculations for high-performance rendering (display refresh optimization)
  const scoutStats = React.useMemo(() => {
    if (activeHeroes.length === 0) return null;
    
    let totalAtk = 0;
    let totalDef = 0;
    let totalLvl = 0;
    
    activeHeroes.forEach(hero => {
      const isMagicClass = ["Mage", "Acolyte", "Aède", "Druide"].includes(hero.classType);
      const heroAtk = isMagicClass ? hero.calculatedStats.magicDamage : hero.calculatedStats.physicalDamage;
      totalAtk += heroAtk;
      totalDef += hero.calculatedStats.physicalDefense;
      totalLvl += hero.level;
    });

    const avgLvl = Number((totalLvl / activeHeroes.length).toFixed(1));
    const avgDef = Number((totalDef / activeHeroes.length).toFixed(0));

    return { totalAtk, avgDef, avgLvl };
  }, [activeHeroes]);

  const biomeDetails = React.useMemo(() => {
    const floor = activeDungeonFloor;
    if (floor <= 5) {
      return {
        name: "Les Catacombes Sombres",
        desc: "Un labyrinthe de catacombes humides et oubliées. Les murmures des morts résonnent entre les vieux piliers de pierre.",
        threat: "Faible",
        threatScore: 1,
        color: "text-slate-400 border-slate-750/30 bg-slate-950/20",
        bestiary: [
          { name: "Rat Énorme", emoji: "🐀" },
          { name: "Chauve-souris Vampire", emoji: "🦇" },
          { name: "Gobelin Éclaireur", emoji: "🎭" },
          { name: "Brigand Masqué", emoji: "🥷" }
        ],
        boss: "Giga Gobelin 'Roi des Déchets' 👑"
      };
    } else if (floor <= 15) {
      return {
        name: "Les Grottes de Soufre",
        desc: "Des tunnels étroits imprégnés d'une forte odeur de soufre. Des bruits de grattement trahissent la présence d'araignées géantes.",
        threat: "Modéré",
        threatScore: 2,
        color: "text-emerald-400 border-emerald-950/30 bg-emerald-950/20",
        bestiary: [
          { name: "Squelette Guerrier", emoji: "💀" },
          { name: "Zombie Affamé", emoji: "🧟" },
          { name: "Araignée Géante", emoji: "🕷️" },
          { name: "Orc Pilleur", emoji: "🐗" }
        ],
        boss: "Chef de Meute Orc Blindé 👹"
      };
    } else if (floor <= 29) {
      return {
        name: "Les Ruines Magiques Elfiques",
        desc: "D'anciens sanctuaires elfiques déformés par une magie résiduelle instable. Des pièges runiques et golems de pierre veillent encore.",
        threat: "Élevé",
        threatScore: 3,
        color: "text-indigo-400 border-indigo-950/30 bg-indigo-950/20",
        bestiary: [
          { name: "Liche Reconstituée", emoji: "🧙" },
          { name: "Golem de Pierre", emoji: "🗿" },
          { name: "Minotaure Vagabond", emoji: "🐂" },
          { name: "Démon du Soufre", emoji: "😈" }
        ],
        boss: "Gardien du Portail ⛓️"
      };
    } else if (floor <= 49) {
      return {
        name: "Le Temple Sacré Perdu",
        desc: "Les vestiges d'un grandiose temple dédié aux divinités stellaires, désormais profané par de puissants Seigneurs Vampires.",
        threat: "Très Élevé",
        threatScore: 4,
        color: "text-purple-400 border-purple-950/30 bg-purple-950/20",
        bestiary: [
          { name: "Dragon d'Émeraude", emoji: "🐉" },
          { name: "Seigneur Vampire", emoji: "🧛" },
          { name: "Titan Obscur", emoji: "🌌" }
        ],
        boss: "La Liche Éternelle 'Malakor' 🔮"
      };
    } else {
      return {
        name: "Le Noyau d'Obsidienne Primordial",
        desc: "Le coeur ardent de la terre où le feu primordial coule sous forme de fleuves de lave pure. Le grand Dragon Rouge sommeille ici.",
        threat: "Mortel",
        threatScore: 5,
        color: "text-red-400 border-red-950/30 bg-red-950/20",
        bestiary: [
          { name: "Titan Obscur", emoji: "🌌" },
          { name: "Seigneur Vampire", emoji: "🧛" },
          { name: "Dragon d'Émeraude", emoji: "🐉" }
        ],
        boss: "Dragon Rouge Primordial 🌋"
      };
    }
  }, [activeDungeonFloor]);

  // Auto scroll to top when new logs appear (latest entry is on top)
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [filteredBattleLogs]);

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-amber-500 bg-amber-950/20 text-amber-400";
      case "epic":
        return "border-purple-500 bg-purple-950/20 text-purple-400";
      case "rare":
        return "border-blue-500 bg-blue-950/20 text-blue-400";
      default:
        return "border-slate-700 bg-slate-900 text-gray-400";
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "victory":
        return "text-emerald-400 font-bold bg-emerald-950/20 border-l-2 border-emerald-500 px-1.5 py-0.5 rounded";
      case "defeat":
        return "text-rose-400 font-bold bg-rose-950/20 border-l-2 border-rose-500 px-1.5 py-0.5 rounded";
      case "loot":
        return "text-yellow-300 font-semibold bg-yellow-950/15 border-l-2 border-yellow-400 px-1.5 py-0.5 rounded";
      case "combat-hero":
        return "text-sky-300";
      case "combat-enemy":
        return "text-rose-350";
      case "info":
      default:
        return "text-slate-400";
    }
  };

  const getEncounterUIInfoLegacy = (type: DungeonEncounterType) => {
    switch (type) {
      case "trap":
        return { name: "Salle Piégée", emoji: "⚙️", stats: "⚡ AGI + 🎯 DEX", color: "text-amber-400 border-amber-900/40 bg-amber-950/10" };
      case "enigma":
        return { name: "Chambre des Énigmes", emoji: "🧩", stats: "🧠 INT + 🔮 SAG", color: "text-purple-400 border-purple-900/40 bg-purple-950/10" };
      case "ambush":
        return { name: "Embuscade Impromptue", emoji: "🥷", stats: "⚡ AGI + 🍀 CHA", color: "text-rose-400 border-rose-900/40 bg-rose-950/10" };
      case "ritual":
        return { name: "Autel de Rituel", emoji: "🔮", stats: "🎯 DEX + 🔮 SAG", color: "text-indigo-400 border-indigo-900/40 bg-indigo-950/10" };
      case "obstacle":
        return { name: "Obstacle de Taille", emoji: "🪨", stats: "⚔️ FOR + ⚡ AGI", color: "text-yellow-500 border-yellow-900/40 bg-yellow-950/10" };
      case "negotiation":
        return { name: "Négociation Mystique", emoji: "🤝", stats: "🔮 SAG + 🍀 CHA", color: "text-teal-400 border-teal-900/40 bg-teal-950/10" };
      case "treasure":
        return { name: "Chambre au Trésor", emoji: "📦", stats: "Aucun", color: "text-emerald-400 border-emerald-900/40 bg-emerald-950/10" };
      case "rest":
        return { name: "Feu de Camp de Repos", emoji: "⛺", stats: "Aucun", color: "text-sky-400 border-sky-900/40 bg-sky-950/10" };
      default:
        return { name: "Épreuve Inconnue", emoji: "❓", stats: "???", color: "text-slate-400 border-slate-900 bg-slate-950/10" };
    }
  };

  const getEncounterUIInfo = (type: DungeonEncounterType) => {
    const info = getEncounterUIInfoLegacy(type);
    const presentation = getEncounterStatPresentation(type);
    return presentation ? { ...info, stats: presentation.stats } : info;
  };

  interface RoomGroup {
    roomNum: number;
    roomName: string;
    emoji: string;
    timestamp: string;
    logs: BattleLogEntry[];
    status: "victory" | "defeat" | "ongoing";
  }

  const parseRoomAndType = (message: string) => {
    const roomMatch = message.match(/chambre\s+(\d+)/i);
    const roomNum = roomMatch ? parseInt(roomMatch[1], 10) : null;
    
    let name = "";
    let emoji = "⚔️";
    
    if (message.includes("coffre au trésor") || message.includes("📦")) {
      name = "Chambre au Trésor";
      emoji = "📦";
    } else if (message.includes("se reposer") || message.includes("⛺")) {
      name = "Feu de Camp de Repos";
      emoji = "⛺";
    } else if (message.includes("[")) {
      const bracketMatch = message.match(/\[(.*?)\]/);
      name = bracketMatch ? bracketMatch[1] : "Épreuve Mystique";
      if (message.includes("Piégée") || message.includes("⚙️")) emoji = "⚙️";
      else if (message.includes("Énigmes") || message.includes("🧩")) emoji = "🧩";
      else if (message.includes("Embuscade") || message.includes("🥷")) emoji = "🥷";
      else if (message.includes("Rituel") || message.includes("🔮")) emoji = "🔮";
      else if (message.includes("Obstacle") || message.includes("🪨")) emoji = "🪨";
      else if (message.includes("Négociation") || message.includes("🤝")) emoji = "🤝";
    } else if (message.includes("face à un")) {
      const monsterMatch = message.match(/face à un\s+([^!]+)/i);
      name = monsterMatch ? monsterMatch[1].trim() : "Combat de Monstre";
      emoji = "⚔️";
    } else if (message.includes("face à une")) {
      const monsterMatch = message.match(/face à une\s+([^!]+)/i);
      name = monsterMatch ? monsterMatch[1].trim() : "Combat de Monstre";
      emoji = "⚔️";
    } else {
      name = "Combat Hostile";
      emoji = "⚔️";
    }
    
    return { roomNum, name, emoji };
  };

  const groupLogsByRoom = (logs: BattleLogEntry[]) => {
    const groups: RoomGroup[] = [];
    let currentGroup: RoomGroup | null = null;
    
    // Create a default system group for logs before first room
    const systemGroup: RoomGroup = {
      roomNum: 0,
      roomName: "Campement & Intendance",
      emoji: "⛺",
      timestamp: logs[0] ? logs[0].timestamp : "",
      logs: [],
      status: "ongoing"
    };
    
    for (const log of logs) {
      if (log.message.includes("entrent dans la chambre")) {
        if (currentGroup) {
          groups.push(currentGroup);
        } else if (systemGroup.logs.length > 0) {
          groups.push({ ...systemGroup });
          systemGroup.logs = [];
        }
        
        const { roomNum, name, emoji } = parseRoomAndType(log.message);
        currentGroup = {
          roomNum: roomNum || 1,
          roomName: name,
          emoji: emoji,
          timestamp: log.timestamp,
          logs: [log],
          status: "ongoing"
        };
      } else {
        const targetGroup = currentGroup || systemGroup;
        
        // Update status based on log contents
        if (log.type === "victory" || log.message.includes("RÉUSSI") || log.message.includes("RÉSOLUE") || log.message.includes("STABILISÉ") || log.message.includes("DÉGAGÉ") || log.message.includes("RÉUSSIE") || log.message.includes("coffre au trésor") || log.message.includes("se repose")) {
          targetGroup.status = "victory";
        } else if (log.type === "defeat" || log.message.includes("ÉCHOUÉ") || log.message.includes("décimés") || log.message.includes("Repli tactique") || log.message.includes("s'est écroulé")) {
          targetGroup.status = "defeat";
        }
        
        targetGroup.logs.push(log);
      }
    }
    
    if (currentGroup) {
      groups.push(currentGroup);
    } else if (systemGroup.logs.length > 0) {
      groups.push(systemGroup);
    }
    
    return groups;
  };

  const renderActiveEncounter = (type: DungeonEncounterType) => {
    const uiInfo = getEncounterUIInfo(type);
    const difficulty = 10 + activeDungeonFloor * 2;
    
    // Find active slayers to display status / stats
    const activeSlayers = heroes.filter(h => h.isActive && h.currentHp > 0);
    
    // 1. TREASURE CHAMBER
    if (type === "treasure") {
      return (
        <div className="flex flex-col sm:flex-row items-center gap-4 grow w-full">
          {/* Animated Glowing Chest */}
          <div className="relative p-5 bg-[#140b05] border-2 border-amber-500/40 rounded-2xl select-none shrink-0 flex items-center justify-center w-24 h-24 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 to-transparent animate-pulse" />
            <span className="text-5xl animate-[bounce_2s_infinite]">📦</span>
            <Sparkles className="absolute text-amber-400 w-5 h-5 top-1.5 right-1.5 animate-pulse" />
          </div>
          
          <div className="grow text-center sm:text-left w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-[#dfdbc7] uppercase tracking-widest font-serif flex items-center gap-1.5">
                {uiInfo.name}
              </h4>
              <span className="text-[9px] font-sans text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                Butin Obscur
              </span>
            </div>
            
            <p className="text-[11px] text-[#a89078] font-sans mt-1.5 leading-relaxed max-w-lg">
              Une lourde malle cerclée de fer forgé repose au centre de la pièce. Son couvercle orné de runes anciennes promet de mystérieuses richesses, ou peut-être un fabuleux équipement !
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-[#110b06]/50 rounded border border-[#5c402b]/25 max-w-sm mx-auto sm:mx-0">
              <div className="text-[10px] text-[#a89078] font-sans">
                🪙 <span className="text-amber-500 font-bold">Or Garanti</span> : ~{activeDungeonFloor * 5} Or
              </div>
              <div className="text-[10px] text-[#a89078] font-sans">
                ⚙️ <span className="text-slate-300 font-bold">Composants</span> : Matériaux de forge
              </div>
              <div className="col-span-2 text-[9.5px] text-[#ae8650] font-mono border-t border-[#5c402b]/25 pt-1.5 mt-0.5">
                💎 Chance d'équipement de qualité <span className="text-blue-400 font-bold">Rare</span> !
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // 2. CAMPFIRE REST SITE
    if (type === "rest") {
      return (
        <div className="flex flex-col sm:flex-row items-center gap-4 grow w-full">
          {/* Flame Ring */}
          <div className="relative p-5 bg-[#140b05] border-2 border-sky-500/30 rounded-2xl select-none shrink-0 flex items-center justify-center w-24 h-24 overflow-hidden">
            <div className="absolute inset-0 bg-sky-950/15 animate-pulse" />
            <span className="text-5xl animate-[pulse_1.5s_infinite]">⛺</span>
            <Flame className="absolute text-orange-500 w-5 h-5 bottom-2 right-2 animate-bounce" />
          </div>
          
          <div className="grow text-center sm:text-left w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-[#dfdbc7] uppercase tracking-widest font-serif">
                {uiInfo.name}
              </h4>
              <span className="text-[9px] font-sans text-sky-400 bg-sky-950/30 border border-sky-900/40 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                Trêve Salutaire
              </span>
            </div>
            
            <p className="text-[11px] text-[#a89078] font-sans mt-1.5 leading-relaxed max-w-lg">
              Un recoin à l'abri du vent, réchauffé par les braises mourantes d'un précédent bivouac. L'escouade en profite pour panser ses plaies et canaliser les flux magiques.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-[#110b06]/50 rounded border border-[#5c402b]/25 max-w-sm mx-auto sm:mx-0">
              <div className="text-[10px] text-emerald-400 font-sans font-semibold">
                💚 Restauration PV : <span className="font-mono font-bold">+20% Max PV</span>
              </div>
              <div className="text-[10px] text-purple-400 font-sans font-semibold">
                🔮 Restauration PM : <span className="font-mono font-bold">+20% Max PM</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // STAT CHECK EVENT (TRAP, ENIGMA, AMBUSH, RITUAL, OBSTACLE, NEGOTIATION)
    const encounterDetails = getEncounterDetails(type);
    let statA = encounterDetails?.statA ?? "agi";
    let statB = encounterDetails?.statB ?? "dex";
    let desc = "";
    let dangerMsg = "";
    let successMsg = "";
    
    if (type === "trap") {
      desc = "Un grincement sinistre résonne : des lames circulaires et des dards empoisonnés menacent de découper l'escouade.";
      dangerMsg = "Échec : L'escouade subit de cuisants dégâts de piège (45% PV perdus !).";
      successMsg = "Réussite : Évite le piège, gagne de l'expérience et des matériaux de forge.";
    } else if (type === "enigma") {
      desc = "Une imposante porte runique bloque l'accès, exigeant la résolution d'une formule astrale gravée sur la pierre.";
      dangerMsg = "Échec : La décharge runique draine l'énergie magique (-10 PM à toute l'équipe).";
      successMsg = "Réussite : Ouvre la porte, gagne de l'Or, de l'expérience et +15 PM.";
    } else if (type === "ambush") {
      desc = "Des bandits se tapissent dans les ombres des arches, prêts à fondre sur votre expédition sans crier gare.";
      dangerMsg = "Échec : Embuscade réussie ! Vos héros subissent des blessures (20% PV perdus).";
      successMsg = "Réussite : Repère l'embuscade et pille les cachettes des bandits (+Or bonus).";
    } else if (type === "ritual") {
      desc = "Un autel mystique pulse d'une magie chaotique instable, prête à éclater ou à régénérer vos esprits.";
      dangerMsg = "Échec : Retour de flamme magique (-15 PM et 10% PV perdus).";
      successMsg = "Réussite : Stabilise les flux cosmiques, restaurant le mana du groupe.";
    } else if (type === "obstacle") {
      desc = "Un colossal éboulement obstrue la voie. Il faut déplacer de lourds blocs rocheux ou escalader avec agilité.";
      dangerMsg = "Échec : Épuisement général et écorchures (20% PV perdus).";
      successMsg = "Réussite : Dégage la voie avec brio, gagne de l'Exp et des matériaux.";
    } else if (type === "negotiation") {
      desc = "Une entité spectrale exige un lourd tribut ou accepte de marchander des faveurs contre une diplomatie habile.";
      dangerMsg = "Échec : L'entité hostile dérobe 20 Or avant de s'évanouir dans les limbes.";
      successMsg = "Réussite : Convainc le spectre et obtient une bourse d'Or substantielle.";
    }
    
    // Select best hero solver
    let bestHero = activeSlayers[0] || null;
    let bestScore = 0;
    
    if (activeSlayers.length > 0) {
      let highest = -1;
      let chosen = activeSlayers[0];
      for (const hero of activeSlayers) {
        const attrs = hero.calculatedStats;
        const valA = (attrs[statA as keyof typeof attrs] as any) || 10;
        const valB = (attrs[statB as keyof typeof attrs] as any) || 10;
        const score = Math.floor((Number(valA) + Number(valB)) * 0.5);
        if (score > highest) {
          highest = score;
          chosen = hero;
        }
      }
      bestHero = chosen;
      bestScore = highest;
    }
    
    return (
      <div className="flex flex-col sm:flex-row items-stretch gap-4 grow w-full">
        {/* Left Interactive Panel */}
        <div className="flex flex-col items-center justify-center bg-[#110b06] border border-[#5c402b]/40 rounded-xl p-3 shrink-0 text-center sm:w-40 gap-2">
          <div className="text-4xl p-2.5 bg-[#1a110a] border-2 border-[#ae8650]/40 rounded-xl select-none shadow-md">
            {uiInfo.emoji}
          </div>
          <div className="w-full">
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#a89078] block">ÉPREUVE ACTIVE</span>
            <span className="text-[10px] font-serif font-bold text-[#dfdbc7] truncate block max-w-[130px] mx-auto">{uiInfo.name}</span>
          </div>
          
          {bestHero && (
            <div className="w-full mt-1 pt-1.5 border-t border-[#5c402b]/20 text-center">
              <span className="text-[8px] font-mono text-amber-500 uppercase block">Éclaireur désigné</span>
              <span className="text-[10px] font-sans font-bold text-[#dfdbc7] block truncate max-w-[130px] mx-auto">👤 {bestHero.name}</span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                Score : {bestScore}
              </span>
            </div>
          )}
        </div>
        
        {/* Right Panel */}
        <div className="grow flex flex-col justify-between w-full sm:w-auto text-left">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-serif font-bold uppercase text-[#dfdbc7] tracking-wider">
                Obstacle Rencontré
              </h4>
              <span className="text-[9px] font-mono text-red-400 bg-red-955/20 border border-red-900/35 px-1.5 py-0.5 rounded">
                Difficulté : {difficulty}
              </span>
            </div>
            
            <p className="text-[11px] text-[#a89078] font-sans mt-1 leading-relaxed">
              {desc}
            </p>
            
            <div className="flex flex-col gap-1.5 mt-2.5 pt-2 border-t border-[#5c402b]/20">
              <div className="text-[9.5px] font-sans text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{successMsg}</span>
              </div>
              <div className="text-[9.5px] font-sans text-rose-400/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>{dangerMsg}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-[#ae8650] bg-[#1a110a]/50 p-2 rounded border border-[#302117]/35 mt-3">
            <span>🎯 Attributs requis : <strong className="text-[#dfdbc7]">{uiInfo.stats}</strong></span>
            <span>🍀 Jet additionnel : <strong className="text-[#dfdbc7]">{bestHero ? `1 à ${getHeroAttributes(bestHero).luk || 1} (Jet de Chance)` : "Chance"}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* 1. ARENA MONITOR HEADER - Medieval Slate Theme */}
      <div className="bg-[#18110b] border-2 border-[#5c402b] p-4 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#5c402b]/40">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#ae8650] animate-pulse" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] font-serif">Le Donjon sans Fin</h3>
              <p className="text-[10.5px] text-[#a89078] font-sans">Aventurez-vous dans les couloirs obscurs d'Oakhaven</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#110b06] p-1 rounded border border-[#5c402b]/50">
            <button
              onClick={() => onChangeFloor("prev")}
              disabled={activeDungeonFloor <= 1}
              className="p-1.5 text-xs text-[#a89078] hover:text-[#fdf9f2] disabled:opacity-20 rounded hover:bg-[#2c1d12] transition cursor-pointer"
              title="Précédent"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 bg-[#1c1109] text-[#d4af37] border border-[#5c402b]/60 rounded font-serif">
              Étage {activeDungeonFloor} - Salle {activeDungeonRoom}/50
            </span>
            <button
              onClick={() => onChangeFloor("next")}
              disabled={activeDungeonFloor >= highestFloorReached}
              className="p-1.5 text-xs text-[#a89078] hover:text-[#fdf9f2] disabled:opacity-20 rounded hover:bg-[#2c1d12] transition cursor-pointer"
              title="Suivant (Débloqué si déjà franchi)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progression inside the Floor before Boss */}
        <div className="grid grid-cols-10 gap-1 mb-4 bg-[#110b06] p-2 rounded-lg border border-[#5c402b]/30">
          {Array.from({ length: 50 }).map((_, i) => {
            const num = i + 1;
            const isCompleted = num < activeDungeonRoom;
            const isCurrent = num === activeDungeonRoom;
            const isBossRoom = num === 50;

            let colClass = "bg-[#18110b] border-[#2d1d12] text-[#5c4b3f]";
            if (isCompleted) colClass = "bg-[#421d1d]/30 border-red-950/50 text-[#bf4343]/80";
            if (isCurrent) colClass = "bg-red-600 text-[#fbf7f0] font-bold border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse";

            return (
              <div
                key={num}
                className={`h-5 rounded border text-[8px] flex items-center justify-center font-mono select-none ${colClass}`}
                title={isBossRoom ? "Chambre de l'Abomination Boss !" : `Pièce ${num}`}
              >
                {isBossRoom ? "💀" : num}
              </div>
            );
          })}
        </div>

        {/* Toggles and status controls */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2.5">
            <button
              onClick={hasActiveEncounter ? onResolveEncounter : onExplore}
              disabled={activeHeroes.length === 0}
              className="flex-1 bg-[#3b2514] hover:bg-[#5a351b] text-[#f4d28b] border-2 border-[#8c5a2b]/60 py-2.5 px-3 rounded text-[11px] font-bold font-serif tracking-widest transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase"
            >
              {hasActiveEncounter ? "Résoudre l’encounter" : "Explorer la salle"}
            </button>
            <button
              onClick={onToggleAutoExplore}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-[11px] font-bold transition cursor-pointer font-serif tracking-widest border ${
                autoExplore
                  ? "bg-[#8c5a2b] hover:bg-[#ab733c] text-white border-[#d4af37] shadow-md"
                  : "bg-[#1c140f] text-[#a89078] border-[#5c402b]/60 hover:bg-[#2a1c12]"
              }`}
            >
              {autoExplore ? (
                <>
                  <Pause className="w-4 h-4 text-[#d4af37]" />
                  <span>MARCHE AUTO : ON</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 animate-pulse text-red-500" />
                  <span>MARCHE AUTO : PAUSE</span>
                </>
              )}
            </button>

            <button
              onClick={onRetreatParty}
              disabled={activeHeroes.length === 0}
              className="flex-1 bg-[#2d1212] hover:bg-[#701a1a] text-[#f2a1a1] border-2 border-red-900/40 py-2.5 px-3 rounded text-[11px] font-bold font-serif tracking-widest transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase"
            >
              Repli au Campement
            </button>
          </div>

          {/* Reset level action */}
          <div className="flex justify-end mt-0.5">
            <button
              onClick={() => {
                if (isResetConfirming) {
                  onResetLevel();
                  setIsResetConfirming(false);
                } else {
                  setIsResetConfirming(true);
                  setTimeout(() => setIsResetConfirming(false), 4000);
                }
              }}
              className={`text-[10px] px-3 py-1.5 rounded font-serif font-bold tracking-wider uppercase transition border cursor-pointer flex items-center gap-1.5 ${
                isResetConfirming
                  ? "bg-red-950/80 hover:bg-red-900 border-red-500 text-red-200 animate-pulse"
                  : "bg-[#140e0a] hover:bg-[#201711] border-[#5c402b]/50 text-[#a89078]"
              }`}
            >
              <RotateCcw className={`w-3 h-3 ${isResetConfirming ? "animate-spin" : ""}`} />
              <span>{isResetConfirming ? "Confirm Reset?" : "Reset Level"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE HERO RAID PARTY - Medieval Theme */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#ae8650] animate-pulse" />
            <h4 className="text-[10px] text-[#ae8650] font-bold uppercase tracking-widest font-serif">
              Membres Envoyés ({activeHeroes.length}/4)
            </h4>
          </div>
          <span className="text-[9.5px] font-medium text-[#a89078] font-serif">
            Configurez vos compagnons dans l'onglet Aventuriers
          </span>
        </div>

        {activeHeroes.length === 0 ? (
          <div className="bg-[#18110b] p-6 rounded-xl border-2 border-dashed border-[#5c402b]/40 text-center text-xs text-[#a89078] flex flex-col items-center justify-center gap-2">
            <p className="max-w-xs font-serif leading-relaxed">
              Vos aventuriers se reposent au Campement. Assignez au moins un fier compagnon d'armes à l'escouade active de donjon !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {activeHeroes.map((hero) => {
              const hpPercent = (hero.currentHp / hero.calculatedStats.maxHp) * 100;
              const xpPercent = (hero.xp / hero.xpNeeded) * 100;
              const isMagicClass = ["Mage", "Acolyte", "Aède", "Druide"].includes(hero.classType);
              const heroAtk = isMagicClass ? hero.calculatedStats.magicDamage : hero.calculatedStats.physicalDamage;
              const heroDef = hero.calculatedStats.physicalDefense;

              return (
                <div
                  key={hero.id}
                  className="bg-[#120a06] border border-[#5c402b]/45 p-3 rounded-xl hover:border-[#ae8650]/60 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 pb-1.5 border-b border-[#5c402b]/30">
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[#dfdbc7] font-serif truncate">{hero.name}</span>
                        </div>
                        <span className="text-[9px] text-[#a89078] uppercase font-serif tracking-wider font-semibold">
                          {hero.race} • {hero.classType}
                        </span>
                      </div>
                      <span className="text-[9.5px] font-serif font-bold text-[#d4af37] bg-[#22150d] px-1.5 py-0.5 rounded border border-[#5c402b]/60">
                        N{hero.level}
                      </span>
                    </div>

                    {/* Hp gauge */}
                    <div className="mb-2 bg-[#1c1109] rounded p-1.5 border border-[#5c402b]/30">
                      <div className="flex justify-between text-[10px] font-serif text-[#a89078] mb-0.5 font-semibold">
                        <span className="text-red-400">Vie de l'aventurier</span>
                        <span>
                          {Math.floor(hero.currentHp)}/{hero.calculatedStats.maxHp}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#140b06] rounded-full overflow-hidden border border-[#5c402b]/20">
                        <div
                          className="h-full bg-gradient-to-r from-[#7a1d1d] to-[#b91c1c] transition-all duration-300"
                          style={{ width: `${Math.max(0, hpPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Xp gauge */}
                    <div className="bg-[#1c1109] rounded p-1.5 border border-[#5c402b]/30 text-sans">
                      <div className="flex justify-between text-[10px] font-serif text-[#a89078] mb-0.5 font-semibold">
                        <span className="text-amber-500">Expérience</span>
                        <span>{Math.floor(hero.xp)}/{hero.xpNeeded}</span>
                      </div>
                      <div className="w-full h-1 bg-[#140b06] rounded-full overflow-hidden border border-[#5c402b]/15">
                        <div
                          className="h-full bg-gradient-to-r from-[#8c5a2b] to-[#ae8650] transition-all"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Combat Stats Grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] font-mono mt-3 pt-2.5 border-t border-[#5c402b]/20">
                    <span className="flex items-center gap-1 text-red-400 font-semibold" title="Attaque">
                      <Sword className="w-2.5 h-2.5 text-red-500" /> ATK: <strong className="text-[#dfdbc7]">{Math.floor(heroAtk)}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-sky-400 font-semibold" title="Défense">
                      <Shield className="w-2.5 h-2.5 text-sky-500" /> DEF: <strong className="text-[#dfdbc7]">{Math.floor(heroDef)}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold" title="Vitesse">
                      ⚡ VIT: <strong className="text-[#dfdbc7]">{Math.floor(hero.calculatedStats.speed || 10)}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-purple-400 font-semibold" title="Mana">
                      🔮 PM: <strong className="text-[#dfdbc7]">{Math.floor(hero.calculatedStats.maxMana || 20)}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 font-semibold" title="Taux de coups critiques">
                      🎯 CRT: <strong className="text-[#dfdbc7]">{hero.calculatedStats.criticalChance || 5}%</strong>
                    </span>
                    <span className="flex items-center gap-1 text-teal-400 font-semibold" title="Esquive">
                      🍃 ESQ: <strong className="text-[#dfdbc7]">{hero.calculatedStats.dodgeChance || 3}%</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. ACTIVE MONSTER CARD & CLICK SLASHER - Medieval Theme */}
      <div className="bg-[#18110b] border-2 border-[#5c402b] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl relative overflow-hidden">
        {currentEncounterType && currentEncounterType !== "fight" ? (
          <>
            {renderActiveEncounter(currentEncounterType)}

            {/* Combat Clock visual tick */}
            <div className="flex flex-col items-center gap-2 w-full md:w-auto shrink-0 pr-2">
              <div className="flex items-center gap-1 text-[10px] text-[#a89078] font-sans bg-[#110b06] border border-[#5c402b]/40 rounded-lg px-2.5 py-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#ae8650]" />
                <span>Résolution : <strong className="text-[#dfdbc7] font-mono">{combatTimer}s</strong></span>
              </div>
            </div>
          </>
        ) : currentMonster ? (
          <>
            <div className="flex items-center gap-3.5 self-start md:self-auto grow">
              <div className="text-4xl p-3 bg-[#110b06] border-2 border-[#ae8650]/50 rounded-xl relative select-none">
                <span>{currentMonster.image}</span>
                {currentMonster.isBoss && (
                  <span className="absolute -top-1.5 -right-1 text-xs animate-bounce" title="Boss de l'Étage !">
                    👑
                  </span>
                )}
              </div>
              <div className="grow">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#dfdbc7] uppercase tracking-widest font-serif">
                    {currentMonster.name}
                  </h4>
                  {currentMonster.isBoss && (
                    <span className="text-[9px] font-serif text-red-400 bg-red-955/40 border border-red-900/45 uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">
                      MONSTRE SUPRÊME
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#a89078] font-sans mt-0.5">
                  Faveur d'or : ~{currentMonster.xpYield} EXP • {currentMonster.goldYield} Or
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-[#ae8650] font-mono mt-1">
                  <span>⚔️ ATK: <strong className="text-[#dfdbc7]">{currentMonster.atk}</strong> ({
                    currentMonster.damageType === "physical" ? "Physique" :
                    currentMonster.damageType === "fire" ? "Feu 🔥" :
                    currentMonster.damageType === "ice" ? "Glace ❄️" :
                    currentMonster.damageType === "dark" ? "Ombre 🌙" :
                    currentMonster.damageType === "arcane" ? "Arcane ✨" :
                    currentMonster.damageType === "nature" ? "Nature 🌿" :
                    currentMonster.damageType === "poison" ? "Poison ☠️" :
                    currentMonster.damageType.toUpperCase()
                  })</span>
                  <span>🛡️ DEF: <strong className="text-[#dfdbc7]">{currentMonster.def}</strong> Phys. / <strong className="text-[#dfdbc7]">{currentMonster.magicDef}</strong> Mag.</span>
                </div>

                {currentMonster.resistances && Object.keys(currentMonster.resistances).length > 0 && (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] font-sans mt-1.5 text-[#8c7460] bg-[#1a110a]/50 p-1.5 rounded-md border border-[#302117]/35 w-full sm:max-w-xs">
                    <span className="font-serif font-bold text-[#ae8650] mr-1">Résistances :</span>
                    {Object.entries(currentMonster.resistances).map(([elem, val]) => {
                      if (val === undefined) return null;
                      const elementEmoji: Record<string, string> = {
                        arcane: "✨",
                        fire: "🔥",
                        ice: "❄️",
                        water: "💧",
                        earth: "⛰️",
                        wind: "💨",
                        lightning: "⚡",
                        holy: "☀️",
                        dark: "🌙",
                        nature: "🌿",
                        sound: "🎵",
                        poison: "☠️",
                        blood: "🩸",
                        radiant: "🌟"
                      };
                      const elementFrench: Record<string, string> = {
                        arcane: "Arcane",
                        fire: "Feu",
                        ice: "Glace",
                        water: "Eau",
                        earth: "Terre",
                        wind: "Vent",
                        lightning: "Foudre",
                        holy: "Sacré",
                        dark: "Ombre",
                        nature: "Nature",
                        sound: "Son",
                        poison: "Poison",
                        blood: "Sang",
                        radiant: "Éclat"
                      };
                      const emoji = elementEmoji[elem] || "🛡️";
                      const label = elementFrench[elem] || elem;
                      const sign = val >= 0 ? "+" : "";
                      const color = val > 0 ? "text-emerald-400 font-semibold" : val < 0 ? "text-red-400 font-semibold" : "text-[#dfdbc7]";
                      return (
                        <span key={elem} className="inline-flex items-center gap-0.5 mr-1.5">
                          {emoji} {label} <span className={color}>{sign}{val}%</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* HP GAUGE ENEMY */}
                <div className="w-full sm:max-w-xs mt-2.5">
                  <div className="flex justify-between items-center text-[10px] font-serif mb-1">
                    <span className="text-red-400 font-bold uppercase tracking-widest">Énergie du Monstre</span>
                    <span className="text-[#dfdbc7] font-bold">
                      {Math.ceil(currentMonster.hp)} / {currentMonster.maxHp}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#110b06] border border-[#5c402b]/40 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-[#701a1a] to-[#b91c1c] transition-all duration-150"
                      style={{ width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Combat Clock visual tick */}
            <div className="flex flex-col items-center gap-2 w-full md:w-auto shrink-0 pr-2">
              <div className="flex items-center gap-1 text-[10px] text-[#a89078] font-sans bg-[#110b06] border border-[#5c402b]/40 rounded-lg px-2.5 py-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#ae8650]" />
                <span>Cycles : <strong className="text-[#dfdbc7] font-mono">{combatTimer}s</strong></span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 p-2.5">
            {/* Left side: Animated Compass Radar (CSS animation only, 0 JS re-render overhead) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center bg-[#110b06]/60 border border-[#5c402b]/30 p-4 rounded-xl text-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Concentric rotating glowing rings */}
                <div className="absolute inset-0 rounded-full border border-[#ae8650]/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#ae8650]/30 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-red-900/10" />
                <Compass className="w-10 h-10 text-[#ae8650] animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="mt-3.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-widest uppercase border ${
                  activeHeroes.length > 0 && autoExplore
                    ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/20"
                    : "text-amber-500 border-amber-900/40 bg-amber-950/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeHeroes.length > 0 && autoExplore ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
                  {activeHeroes.length > 0 && autoExplore ? "Scanner actif" : "Exploration en pause"}
                </span>
                <p className="text-[10px] text-[#a89078] font-sans mt-2">
                  {activeHeroes.length > 0 && autoExplore
                    ? "L'escouade cartographie la zone..."
                    : "En attente d'aventuriers ou de départ."}
                </p>
              </div>
            </div>

            {/* Right side: Biome & Expected Threats Information */}
            <div className="md:col-span-8 flex flex-col justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#5c402b]/25">
                  <div>
                    <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#ae8650] font-bold">
                      PROFIL D'ÉCOUTEUR DE ZONE
                    </span>
                    <h4 className="text-sm font-bold text-[#dfdbc7] font-serif uppercase tracking-widest mt-0.5">
                      {biomeDetails.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#a89078] font-sans">Danger :</span>
                    <div className="flex gap-0.5" title={`Niveau de danger : ${biomeDetails.threat}`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-sm border ${
                            i < biomeDetails.threatScore
                              ? "bg-red-700/80 border-red-500"
                              : "bg-[#110b06] border-[#5c402b]/35"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-[10.5px] text-[#a89078] font-sans mt-2 italic leading-relaxed">
                  "{biomeDetails.desc}"
                </p>

                {/* Expected monsters at this floor */}
                <div className="mt-3.5">
                  <span className="text-[8.5px] uppercase font-mono tracking-wider text-[#ae8650] font-bold block mb-1.5">
                    ⚠️ Créatures recensées à cette profondeur :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {biomeDetails.bestiary.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[9.5px] font-sans text-[#dfdbc7] bg-[#110b06] border border-[#5c402b]/40 px-2 py-0.5 rounded-md"
                      >
                        <span>{m.emoji}</span>
                        <span>{m.name}</span>
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-serif text-red-400 bg-red-950/20 border border-red-900/40 px-2 py-0.5 rounded-md font-bold">
                      👑 Boss : {biomeDetails.boss}
                    </span>
                  </div>
                </div>
              </div>

              {/* Party scouting metrics (if active heroes are present) */}
              {scoutStats ? (
                <div className="grid grid-cols-3 gap-2 bg-[#110b06]/40 p-2 rounded-lg border border-[#5c402b]/20 mt-1">
                  <div className="text-center border-r border-[#5c402b]/15">
                    <span className="block text-[8px] uppercase font-sans text-[#a89078]">FORCE D'ATTAQUE</span>
                    <span className="text-xs font-bold text-red-400 font-mono">⚔️ {scoutStats.totalAtk}</span>
                  </div>
                  <div className="text-center border-r border-[#5c402b]/15">
                    <span className="block text-[8px] uppercase font-sans text-[#a89078]">DÉFENSE MOYENNE</span>
                    <span className="text-xs font-bold text-sky-400 font-mono">🛡️ {scoutStats.avgDef}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[8px] uppercase font-sans text-[#a89078]">NIVEAU MOYEN</span>
                    <span className="text-xs font-bold text-amber-500 font-serif">⭐ {scoutStats.avgLvl}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-center text-[#ae8650] bg-[#1a110a]/30 p-2 rounded-lg border border-dashed border-[#5c402b]/25 mt-1 font-serif">
                  ⚠️ Aucun éclaireur actif. Sélectionnez des compagnons pour entamer la reconnaissance !
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. REAL-TIME MEDIEVAL LOGS TERMINAL - Medieval Theme */}
      <div className="bg-[#0f0a07] border-2 border-[#5c402b] rounded-xl p-4 flex flex-col flex-1 shadow-inner h-80 min-h-60 relative animate-fade-in">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#5c402b]/40 px-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-[10.5px] text-[#d4af37] font-serif uppercase tracking-widest font-bold">Registre de Combat</span>
          </div>

          <button
            onClick={onClearBattleLogs}
            className="text-[9.5px] font-serif border border-[#5c402b] text-[#dfc3a7] bg-[#22140c] px-2.5 py-1 rounded hover:text-white hover:bg-[#3d2516] flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#ae8650]" /> Effacer
          </button>
        </div>

        {/* Category Tabs for Log Differentiation (Option B) */}
        <div className="flex gap-1 mb-3 bg-[#130b06] p-1 rounded-lg border border-[#5c402b]/30 shrink-0 select-none">
          <button
            onClick={() => setLogFilter("all")}
            className={`flex-1 text-center py-1.5 rounded text-[10px] font-serif transition-all uppercase tracking-wider font-semibold cursor-pointer ${
              logFilter === "all"
                ? "bg-[#ae8650] text-[#0f0a07] font-bold shadow-md"
                : "text-[#a89078] hover:text-white hover:bg-[#1a110a]"
            }`}
          >
            Tout 📜
          </button>
          <button
            onClick={() => setLogFilter("dungeon")}
            className={`flex-1 text-center py-1.5 rounded text-[10px] font-serif transition-all uppercase tracking-wider font-semibold cursor-pointer ${
              logFilter === "dungeon"
                ? "bg-[#ae8650] text-[#0f0a07] font-bold shadow-md"
                : "text-[#a89078] hover:text-white hover:bg-[#1a110a]"
            }`}
          >
            Raid & Donjon ⚔️
          </button>
          <button
            onClick={() => setLogFilter("colony")}
            className={`flex-1 text-center py-1.5 rounded text-[10px] font-serif transition-all uppercase tracking-wider font-semibold cursor-pointer ${
              logFilter === "colony"
                ? "bg-[#ae8650] text-[#0f0a07] font-bold shadow-md"
                : "text-[#a89078] hover:text-white hover:bg-[#1a110a]"
            }`}
          >
            Colonie & Gestion ⛺
          </button>
        </div>

        {/* Scrollable container */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto space-y-2 pr-2 pl-3"
        >
          {filteredBattleLogs.length === 0 ? (
            <p className="text-[#5c402b] italic p-2 text-center font-serif text-xs">
              {logFilter === "all"
                ? "Aucune action inscrite. Activez l'auto-marche pour démarrer le raid !"
                : logFilter === "dungeon"
                ? "Aucune action de combat inscrite. Les affrontements s'afficheront ici !"
                : "Aucun événement de colonie enregistré pour le moment."}
            </p>
          ) : (
            (() => {
              const groups = groupLogsByRoom(filteredBattleLogs);
              const reversedGroups = [...groups].reverse();
              return reversedGroups.map((group) => {
                const isSystem = group.roomNum === 0;
                
                let borderColor = "border-[#5c402b]/40";
                let bgGradient = "from-[#110b06] to-[#18110b]";
                let statusBadge = null;
                
                if (group.status === "victory") {
                  borderColor = "border-emerald-900/60";
                  bgGradient = "from-[#0a180f] to-[#111c14]";
                  statusBadge = <span className="text-[9px] font-sans text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Sécurisé</span>;
                } else if (group.status === "defeat") {
                  borderColor = "border-red-950/60";
                  bgGradient = "from-[#1a0e0e] to-[#221313]";
                  statusBadge = <span className="text-[9px] font-sans text-red-400 bg-red-955/40 border border-red-900/50 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Échec</span>;
                } else {
                  borderColor = "border-amber-700/50";
                  bgGradient = "from-[#1a130e] to-[#1c1611]";
                  statusBadge = <span className="text-[9px] font-sans text-amber-500 bg-amber-955/30 border border-amber-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold animate-pulse">En Cours</span>;
                }
                
                return (
                  <div key={group.roomNum + "-" + group.timestamp} className={`border-l-4 ${borderColor} bg-gradient-to-r ${bgGradient} rounded-r-lg p-3 shadow-md mb-3 border-y border-r border-[#5c402b]/20 transition duration-150`}>
                    {/* Room Header Banner */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#5c402b]/25">
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0 select-none">{group.emoji}</span>
                        <span className="text-[10.5px] font-serif uppercase tracking-wider text-[#dfdbc7] font-bold text-left">
                          {isSystem ? group.roomName : `Chambre ${group.roomNum} : ${group.roomName}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge}
                        <span className="text-[8.5px] text-[#5c402b] font-mono">[{group.timestamp}]</span>
                      </div>
                    </div>
                    
                    {/* Log lines for this room */}
                    <div className="space-y-1.5 pl-2 border-l border-[#5c402b]/15 text-left">
                      {group.logs.length === 0 ? (
                        <p className="text-[#5c402b] italic text-[10px] font-sans">Entrée dans la chambre...</p>
                      ) : (
                        [...group.logs].reverse().map((log) => (
                          <div key={log.id} className="flex items-start gap-1.5 text-[11px] leading-relaxed break-words font-sans">
                            <span className="text-[#5c402b] select-none text-[9px] mt-0.5 shrink-0">•</span>
                            <span className={`${getLogColor(log.type)}`}>
                              {log.message}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>
    </div>
  );
}
