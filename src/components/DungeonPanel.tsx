/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import {
  Compass,
  Sword,
  Shield,
  Activity,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { Hero, BattleLogEntry } from "../types";
import type {
  CanonicalActiveDungeonEncounter,
  CanonicalDungeonEncounterRecord,
} from "../../shared/contracts/authoritative";
import { getDungeonRoomCount } from "../../shared/domain/dungeon-progression";
import {
  UNARMED_WEAPON_CONTEXT,
  calculateGuaranteedWeaponPower,
  selectWeaponAttackPower,
} from "../../shared/domain/weapon-combat";
import { getHeroMainHandWeapon } from "../utils/gameCalculations";

function getDisplayedNormalAttackPower(hero: Hero): number {
  const weapon = getHeroMainHandWeapon(hero);
  const attackProfile = weapon?.attackProfile ?? UNARMED_WEAPON_CONTEXT.attackProfile;
  const attackPower = selectWeaponAttackPower(
    hero.calculatedStats,
    weapon?.scaling ?? UNARMED_WEAPON_CONTEXT.scaling,
  );
  return calculateGuaranteedWeaponPower(attackPower, attackProfile);
}

interface DungeonPanelProps {
  heroes: Hero[];
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  autoExplore: boolean;
  battleLogs: BattleLogEntry[];
  highestFloorReached: number;
  onToggleAutoExplore: () => void;
  activeEncounter: CanonicalActiveDungeonEncounter | null;
  encounterHistory: CanonicalDungeonEncounterRecord[];
  encounterPlayback: {
    encounterId: string;
    visibleCount: number;
    complete: boolean;
  } | null;
  isExploring: boolean;
  onExplore: () => void;
  onChangeFloor: (direction: "prev" | "next") => void;
  onRetreatParty: () => void;
  onClearBattleLogs: () => void;
  onResetLevel: () => void;
}

export default function DungeonPanel({
  heroes,
  activeDungeonFloor,
  activeDungeonRoom,
  autoExplore,
  battleLogs,
  highestFloorReached,
  onToggleAutoExplore,
  activeEncounter,
  encounterHistory,
  encounterPlayback,
  isExploring,
  onExplore,
  onChangeFloor,
  onRetreatParty,
  onClearBattleLogs,
  onResetLevel
}: DungeonPanelProps) {
  const roomCount = getDungeonRoomCount(activeDungeonFloor);
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

  const visibleEncounterHistory = React.useMemo(
    () => logFilter === "colony" ? [] : [...encounterHistory].reverse(),
    [encounterHistory, logFilter],
  );

  const heroNames = React.useMemo(
    () => new Map(heroes.map((hero) => [hero.id, hero.name])),
    [heroes],
  );

  const formatTranscriptEvent = React.useCallback((
    event: CanonicalDungeonEncounterRecord["transcript"][number],
  ) => {
    if (event.message) return event.message;
    const heroName = event.heroName ?? heroNames.get(event.heroId) ?? "Un héros";
    if (event.type === "hero.hit") {
      return `Tour ${event.round} — ${heroName} inflige ${event.damage} dégâts.`;
    }
    return `Tour ${event.round} — L'ennemi inflige ${event.damage} dégâts à ${heroName}.`;
  }, [heroNames]);

  // Keep the newest encounter and its latest revealed transcript line in view.
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;
    container.scrollTop = 0;
  }, [encounterHistory, encounterPlayback, filteredBattleLogs]);

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
    
    let name: string;
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
              Étage {activeDungeonFloor} - Salle {Math.min(activeDungeonRoom, roomCount)}/{roomCount}
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
          {Array.from({ length: roomCount }).map((_, i) => {
            const num = i + 1;
            const isCompleted = num < activeDungeonRoom;
            const isCurrent = num === activeDungeonRoom;
            const isBossRoom = num === roomCount;

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
              onClick={onExplore}
              disabled={activeHeroes.length === 0 || isExploring}
              className="flex-1 bg-[#3b2514] hover:bg-[#5a351b] text-[#f4d28b] border-2 border-[#8c5a2b]/60 py-2.5 px-3 rounded text-[11px] font-bold font-serif tracking-widest transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase"
            >
              {isExploring ? "Exploration en cours…" : "Explorer la salle"}
            </button>
            <button
              onClick={onToggleAutoExplore}
              disabled={!autoExplore && activeHeroes.length === 0}
              title={!autoExplore && activeHeroes.length === 0 ? "Aucun héros actif disponible" : undefined}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-[11px] font-bold transition cursor-pointer font-serif tracking-widest border ${
                autoExplore
                  ? "bg-[#8c5a2b] hover:bg-[#ab733c] text-white border-[#d4af37] shadow-md"
                  : "bg-[#1c140f] text-[#a89078] border-[#5c402b]/60 hover:bg-[#2a1c12]"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {autoExplore ? (
                <>
                  <Pause className="w-4 h-4 text-[#d4af37]" />
                  <span>MARCHE AUTO : ON</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 animate-pulse text-red-500" />
                  <span>{activeHeroes.length === 0 ? "AUTO INDISPONIBLE" : "DÉMARRER L'AUTO"}</span>
                </>
              )}
            </button>

            <button
              onClick={onRetreatParty}
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
              const maxMana = hero.calculatedStats.maxMana;
              const manaPercent = maxMana > 0 ? (hero.currentMana / maxMana) * 100 : 0;
              const xpPercent = (hero.xp / hero.xpNeeded) * 100;
              const heroAtk = getDisplayedNormalAttackPower(hero);
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

                    {/* Mana gauge */}
                    <div className="mb-2 bg-[#1c1109] rounded p-1.5 border border-[#5c402b]/30">
                      <div className="flex justify-between text-[10px] font-serif text-[#a89078] mb-0.5 font-semibold">
                        <span className="text-sky-400">Mana</span>
                        <span>
                          {Math.floor(hero.currentMana)}/{maxMana}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#140b06] rounded-full overflow-hidden border border-[#5c402b]/20">
                        <div
                          className="h-full bg-gradient-to-r from-[#1d4ed8] to-[#38bdf8] transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, manaPercent))}%` }}
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
                    <span className="flex items-center gap-1 text-red-400 font-semibold" title="Puissance garantie de l'attaque normale avant le jet de l'arme">
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
                    <span
                      className="flex items-center gap-1 text-emerald-300 font-semibold"
                      title="DPS estimé de l'attaque normale par cycle, avant défense et résistances"
                    >
                      DPS: <strong className="text-[#dfdbc7]">{hero.calculatedStats.estimatedDps.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeEncounter ? (
        <div
          className="bg-[#18110b] border-2 border-[#5c402b] p-4 rounded-xl flex items-center gap-3.5 shadow-2xl"
          aria-label="Rencontre autoritaire active"
        >
          <div className="text-4xl p-3 bg-[#110b06] border-2 border-red-900/50 rounded-xl select-none">
            ⚔️
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#dfdbc7] uppercase tracking-widest font-serif">
              Rencontre autoritaire prête
            </h4>
            <p className="text-[10px] text-[#a89078] font-sans mt-1">
              Étage {activeEncounter.floor} · Salle {activeEncounter.room}
            </p>
            <p className="text-[10px] text-[#caa050] font-mono mt-1">
              Le serveur déterminera le combat et son résultat à la résolution.
            </p>
          </div>
        </div>
      ) : null}

      {/* 3. REAL-TIME MEDIEVAL LOGS TERMINAL - Medieval Theme */}
      <div className="bg-[#0f0a07] border-2 border-[#5c402b] rounded-xl p-4 flex flex-col flex-1 shadow-inner h-80 min-h-60 relative animate-fade-in">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#5c402b]/40 px-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-[10.5px] text-[#d4af37] font-serif uppercase tracking-widest font-bold">Registre de Combat</span>
          </div>

          <button
            onClick={onClearBattleLogs}
            title="Efface uniquement les notes locales, pas l'historique canonique des combats"
            className="text-[9.5px] font-serif border border-[#5c402b] text-[#dfc3a7] bg-[#22140c] px-2.5 py-1 rounded hover:text-white hover:bg-[#3d2516] flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#ae8650]" /> Effacer les notes
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
          {visibleEncounterHistory.map((encounter) => {
            const playback = encounterPlayback?.encounterId === encounter.encounterId
              ? encounterPlayback
              : null;
            const isComplete = playback?.complete ?? true;
            const visibleTranscript = playback
              ? encounter.transcript.slice(0, playback.visibleCount)
              : encounter.transcript;
            const victory = encounter.outcome === "victory";

            return (
              <div
                key={encounter.encounterId}
                className={`border-l-4 ${
                  isComplete
                    ? victory ? "border-emerald-900/60" : "border-red-950/60"
                    : "border-amber-700/50"
                } bg-gradient-to-r from-[#110b06] to-[#18110b] rounded-r-lg p-3 shadow-md mb-3 border-y border-r border-[#5c402b]/20`}
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#5c402b]/25">
                  <span className="text-[10.5px] font-serif uppercase tracking-wider text-[#dfdbc7] font-bold">
                    {encounter.kind === "fight" ? "⚔️" : "🧭"} Étage {encounter.floor} · Salle {encounter.room}
                  </span>
                  <span className={`text-[9px] font-sans px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${
                    !isComplete
                      ? "text-amber-500 bg-amber-950/30 border-amber-900/40 animate-pulse"
                      : victory
                      ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50"
                      : "text-red-400 bg-red-950/40 border-red-900/50"
                  }`}>
                    {!isComplete
                      ? encounter.kind === "fight" ? "Combat en cours" : "Rencontre en cours"
                      : victory ? "Victoire" : "Défaite"}
                  </span>
                </div>

                <div className="space-y-1.5 pl-2 border-l border-[#5c402b]/15 text-left">
                  {visibleTranscript.length === 0 ? (
                    <p className="text-amber-500 italic text-[10px] font-sans animate-pulse">
                      La rencontre commence…
                    </p>
                  ) : [...visibleTranscript].reverse().map((event) => (
                    <div
                      key={`${encounter.encounterId}-${event.sequence}`}
                      className="flex items-start gap-1.5 text-[11px] leading-relaxed break-words font-sans animate-fade-in"
                    >
                      <span className="text-[#5c402b] select-none text-[9px] mt-0.5 shrink-0">•</span>
                      <span className={
                        event.category === "combat-hero"
                          ? "text-sky-300"
                          : event.category === "combat-enemy" || event.category === "defeat"
                          ? "text-rose-400"
                          : event.category === "victory" || event.category === "loot"
                          ? "text-emerald-400"
                          : "text-[#c9b99a]"
                      }>
                        {formatTranscriptEvent(event)}
                      </span>
                    </div>
                  ))}
                  {isComplete ? (
                    <p className={`pt-1 text-[10.5px] font-bold ${victory ? "text-emerald-400" : "text-red-400"}`}>
                      {victory
                        ? encounter.kind === "fight"
                          ? `Victoire en ${encounter.roundCount} tour(s) · +${encounter.rewards.gold} or`
                          : `Rencontre résolue · +${encounter.rewards.gold} or`
                        : encounter.kind === "fight"
                        ? `Défaite après ${encounter.roundCount} tour(s)`
                        : "Épreuve échouée · l'escouade poursuit sa route"}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}

          {visibleEncounterHistory.length === 0 && filteredBattleLogs.length === 0 ? (
            <p className="text-[#5c402b] italic p-2 text-center font-serif text-xs">
              {logFilter === "all"
                ? "Aucune action inscrite. Activez l'auto-marche pour démarrer le raid !"
                : logFilter === "dungeon"
                ? "Aucune action de combat inscrite. Les affrontements s'afficheront ici !"
                : "Aucun événement de colonie enregistré pour le moment."}
            </p>
          ) : filteredBattleLogs.length > 0 ? (
            (() => {
              const groups = groupLogsByRoom(filteredBattleLogs);
              const reversedGroups = [...groups].reverse();
              return reversedGroups.map((group) => {
                const isSystem = group.roomNum === 0;
                
                let borderColor: string;
                let bgGradient: string;
                let statusBadge: React.ReactNode;
                
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
