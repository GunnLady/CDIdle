/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  ShieldAlert,
  Sword,
  Shield,
  Heart,
  Plus,
  X,
  ShoppingBag,
  ArrowUp,
  Sparkles,
  Info,
  ChevronDown,
  Zap
} from "lucide-react";
import { Hero, ClassType, RaceType, Resources, HeroEquipment, StoredItemStack, Rarity, ItemInfo, ElementalDamageType, Modifier } from "../types";
import { CLASS_INFO_LIST, RACE_INFO_LIST } from "../data/gameData";
import { getSkillById } from "../data/skills";
import { getItemById } from "../data/items";
import { getHeroStats, getHeroAttributes, getAvailableTier1Classes, resolveEquippedItem, isMainHandTwoHanded, resolveWeaponDamageTypes, applyItemRarityScaling } from "../utils/gameCalculations";
import HeroPortrait from "./HeroPortrait";

function getTargetLabel(target?: string): string {
  if (!target) return "";
  switch (target) {
    case "single_enemy": return "Ennemi unique";
    case "all_enemies": return "Tous les ennemis";
    case "self": return "Soi-même";
    case "single_ally": return "Allié unique";
    case "all_allies": return "Tous les alliés";
    default: return target;
  }
}

function getEffectSummary(effect: any): string {
  if (!effect) return "";
  const translateStat = (stat: string) => {
    switch (stat) {
      case "physicalDamage": return "Dégâts Physiques";
      case "magicDamage": return "Dégâts Magiques";
      case "physicalDefense": return "Défense Physique";
      case "magicDefense": return "Défense Magique";
      case "maxHp": return "PV Max";
      case "maxMana": return "PM Max";
      case "speed": return "Vitesse";
      case "dodgeChance": return "Esquive";
      case "criticalChance": return "Critique";
      case "forcedTarget": return "Cible Forcée";
      case "goldGain": return "Gain d'or";
      case "healingPower": return "Soins";
      default: return stat;
    }
  };

  switch (effect.type) {
    case "damage": {
      const dmgTypeDesc = effect.damageType === "physical" ? "physiques" : effect.damageType;
      const countStr = effect.hitCount > 1 ? ` x${effect.hitCount}` : "";
      return `Inflige ${Math.round(effect.power * 100)}% de ${translateStat(effect.scalingStat)} (${dmgTypeDesc})${countStr}`;
    }
    case "buff": {
      const mods = effect.modifiers
        ?.map((m: any) => `+${m.value}% ${translateStat(m.stat)}`)
        .join(", ");
      return `Augmente : ${mods} pendant ${effect.durationRounds} tours`;
    }
    case "debuff": {
      const mods = effect.modifiers
        ?.map((m: any) => `${m.value}% ${translateStat(m.stat)}`)
        .join(", ");
      return `Réduit : ${mods} pendant ${effect.durationRounds} tours`;
    }
    case "heal": {
      return `Soigne à hauteur de ${Math.round(effect.power * 100)}% de ${translateStat(effect.scalingStat)}`;
    }
    case "stat_modifier": {
      const mods = effect.modifiers
        ?.map((m: any) => `+${m.value}% ${translateStat(m.stat)}`)
        .join(", ");
      return `Bonus permanent : ${mods}`;
    }
    case "loot_modifier": {
      const mods = effect.modifiers
        ?.map((m: any) => `+${m.value}% ${translateStat(m.stat)}`)
        .join(", ");
      return `Bonus de butin permanent : ${mods}`;
    }
    default:
      return "Effet spécial";
  }
}

interface HeroPanelProps {
  heroes: Hero[];
  resources: Resources;
  buildings: { [key: string]: number };
  onDismissHero: (heroId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
  onRecruitHero: () => void;
  onUnequipItem?: (heroId: string, slot: keyof HeroEquipment) => void;
  onEquipItem?: (heroId: string, itemId: string, rarity: Rarity, modifiers?: Modifier[]) => void;
  storedItems?: StoredItemStack[];
  onGoToTab?: (tab: string) => void;
}

export default function HeroPanel({
  heroes,
  resources,
  buildings,
  onDismissHero,
  onToggleHeroActive,
  onRecruitHero,
  onUnequipItem,
  onEquipItem,
  storedItems,
  onGoToTab
}: HeroPanelProps) {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [heroActiveTabs, setHeroActiveTabs] = useState<Record<string, "overview" | "skills" | "equipment">>({});
  const [activeEquipSelector, setActiveEquipSelector] = useState<{ heroId: string; slotKey: keyof HeroEquipment } | null>(null);

  const guildLevel = buildings["guilde"] || 0;
  const maxHeroCapacity = guildLevel + 2; // default 2 slots + 1 per guild level

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-amber-950 text-amber-400 border-amber-900";
      case "epic":
        return "bg-purple-950 text-purple-400 border-purple-900";
      case "rare":
        return "bg-blue-950 text-blue-400 border-blue-900";
      case "uncommon":
        return "bg-emerald-950 text-emerald-400 border-emerald-900";
      default:
        return "bg-slate-950 text-gray-400 border-slate-900";
    }
  };

  const translateStatKey = (key: string): string => {
    switch (key) {
      case "physicalDamage": return "Dégâts Phys";
      case "magicDamage": return "Dégâts Mag";
      case "physicalDefense": return "Défense Phys";
      case "magicDefense": return "Défense Mag";
      case "maxHp": return "PV Max";
      case "maxMana": return "PM Max";
      case "speed": return "Vitesse";
      case "dodgeChance": return "Esquive";
      case "criticalChance": return "Critique";
      default: return key;
    }
  };

  const formatModifier = (mod: { stat: string; type: string; value: number }) => {
    const sign = mod.value >= 0 ? "+" : "";
    const unit = mod.type === "percent" ? "%" : "";
    return `${sign}${mod.value}${unit} ${translateStatKey(mod.stat)}`;
  };

  const getCompatibleItemsForSlot = (slotKey: keyof HeroEquipment): { item: ItemInfo; count: number; rarity: Rarity; modifiers?: Modifier[] }[] => {
    if (!storedItems || storedItems.length === 0) return [];
    
    return storedItems
      .map((stack) => {
        const baseItem = getItemById(stack.itemId);
        if (!baseItem) return null;
        const hydrated = applyItemRarityScaling(baseItem, stack.rarity);
        if (stack.modifiers && stack.modifiers.length > 0) {
          hydrated.modifiers = stack.modifiers;
        }
        return {
          item: hydrated,
          count: stack.count,
          rarity: stack.rarity,
          modifiers: stack.modifiers
        };
      })
      .filter((entry): entry is { item: ItemInfo; count: number; rarity: Rarity; modifiers: Modifier[] | undefined } => {
        if (!entry) return false;
        const { item, count } = entry;
        if (count <= 0) return false;
        
        // Slot filtering
        if (slotKey === "mainHand") {
          return item.itemType === "weapon";
        }
        if (slotKey === "offHand") {
          return item.itemType === "offhand";
        }
        if (slotKey === "armor") {
          return item.itemType === "armor";
        }
        if (slotKey === "accessory") {
          return item.itemType === "accessory";
        }
        return false;
      });
  };

  const renderEquipModal = () => {
    if (!activeEquipSelector) return null;
    const { heroId, slotKey } = activeEquipSelector;
    const hero = heroes.find((h) => h.id === heroId);
    if (!hero) return null;

    let slotLabel = "Équipement";
    let slotIcon = "💼";
    if (slotKey === "mainHand") { slotLabel = "Main principale"; slotIcon = "🗡️"; }
    else if (slotKey === "offHand") { slotLabel = "Main gauche"; slotIcon = "🛡️"; }
    else if (slotKey === "armor") { slotLabel = "Armure"; slotIcon = "👕"; }
    else if (slotKey === "accessory") { slotLabel = "Accessoire"; slotIcon = "💍"; }

    // 1. Off-hand restriction check
    const isBlocked = slotKey === "offHand" && isMainHandTwoHanded(hero);
    const compatibleEntries = isBlocked ? [] : getCompatibleItemsForSlot(slotKey);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        onClick={() => setActiveEquipSelector(null)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-[#17100b] border border-[#caa050]/50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#3e2b1f] bg-[#110a06]/85">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{slotIcon}</span>
              <div>
                <h3 className="text-[#dfdbc7] font-serif font-bold text-sm">
                  Équiper {hero.name}
                </h3>
                <p className="text-[10px] text-[#ae8650] font-serif uppercase tracking-wider font-semibold">
                  Emplacement : {slotLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveEquipSelector(null)}
              className="text-[#8c7460] hover:text-[#dfc3a7] transition p-1.5 hover:bg-[#331c10]/45 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {isBlocked ? (
              <div className="p-4 rounded-xl bg-[#2a1212]/90 border border-[#6b2121]/60 text-xs text-[#fca5a5] space-y-2 font-sans text-center">
                <div className="font-bold font-serif flex items-center justify-center gap-1.5 text-red-400 text-sm">
                  <span>🚫 Emplacement bloqué</span>
                </div>
                <p className="text-xs text-[#fca5a5]/80 leading-relaxed max-w-md mx-auto">
                  Votre héros équipe une arme à deux mains ou à double maniement en main principale. Cet emplacement ne peut pas recevoir d'équipement secondaire.
                </p>
              </div>
            ) : compatibleEntries.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#140e0a] border border-[#3e2b1f]/60 text-xs text-[#8c7460] italic text-center font-serif space-y-1.5">
                <p className="text-sm font-semibold">📦 No available item</p>
                <p className="text-[11px] text-[#8c7460]/75 font-sans">
                  Il n'y a aucun équipement compatible pour cet emplacement dans votre coffre.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-[#8c7460] italic font-sans px-1">
                  Sélectionnez un équipement compatible disponible dans votre coffre :
                </p>
                {compatibleEntries.map((entry, idx) => {
                  const { item, count, rarity } = entry;
                  const rarityColorClass = getRarityBadge(item.rarity);
                  
                  let typeIdLabel = "";
                  if (item.itemType === "weapon") {
                    typeIdLabel = `Type: ${item.weaponTypeId}`;
                  } else if (item.itemType === "offhand") {
                    typeIdLabel = `Type: ${item.offHandTypeId}`;
                  } else if (item.itemType === "armor") {
                    typeIdLabel = `Type: ${item.armorTypeId}`;
                  } else if (item.itemType === "accessory") {
                    typeIdLabel = `Type: ${item.accessoryTypeId}`;
                  }

                  return (
                    <div 
                      key={`${item.id}-${rarity}-${idx}`} 
                      className="p-3.5 rounded-xl bg-[#1c120c] border border-[#302117] hover:border-[#ae8650]/40 transition space-y-2 text-xs relative"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#caa050] font-serif font-semibold text-sm">{item.name}</span>
                          <span className="text-[10px] text-[#8c7460] font-mono">{typeIdLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#ae8650] bg-[#331c10]/50 border border-[#5c402b]/40 px-1.5 py-0.5 rounded font-mono font-bold">
                            Qté: {count}
                          </span>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${rarityColorClass}`}>
                            {item.rarity}
                          </span>
                          {onEquipItem && (() => {
                            const isLevelTooLow = hero.level < (item.requiredLevel ?? 1);
                            return (
                              <button
                                type="button"
                                disabled={isLevelTooLow}
                                onClick={() => {
                                  if (isLevelTooLow) return;
                                  onEquipItem(hero.id, item.id, rarity, entry.modifiers);
                                  setActiveEquipSelector(null);
                                }}
                                className={`text-[10px] border px-2.5 py-1 rounded-lg transition font-serif font-semibold ${
                                  isLevelTooLow
                                    ? "bg-[#18110e]/60 border-[#2a1d15] text-[#7c6d5f] cursor-not-allowed opacity-60"
                                    : "bg-[#8c5a2b] hover:bg-[#ab733c] text-white border-[#caa050]/50 cursor-pointer select-none"
                                }`}
                                title={isLevelTooLow ? `Niveau requis : ${item.requiredLevel}` : undefined}
                              >
                                {isLevelTooLow ? "Niveau insuffisant" : "Équiper"}
                              </button>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-[#a89078] font-mono bg-[#110a06]/80 p-1.5 rounded border border-[#302117]">
                        {item.requiredLevel !== undefined && (
                          <span>Niv. requis: {item.requiredLevel}</span>
                        )}
                        {item.itemType === "weapon" && item.damageRange && (
                          <span className="text-red-400 font-semibold">Dégâts: {item.damageRange.min}-{item.damageRange.max}</span>
                        )}
                        {item.itemType === "weapon" && item.attackSpeed !== undefined && (
                          <span className="text-sky-400 font-semibold">Vit. Atk: {item.attackSpeed}s</span>
                        )}
                        {item.itemType === "weapon" && (
                          <span className="text-amber-400 font-semibold">Type: {resolveWeaponDamageTypes(item as any).join(", ")}</span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-[#8c7460] italic leading-relaxed font-sans">
                          {item.description}
                        </p>
                      )}

                      {item.modifiers && item.modifiers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.modifiers.map((mod: any, mIdx: number) => (
                            <span
                              key={mIdx}
                              className="bg-[#24170e]/50 text-amber-500/90 border border-[#caa050]/20 text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold"
                            >
                              {formatModifier(mod)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center px-4 py-3 border-t border-[#3e2b1f] bg-[#110a06]/40 gap-2">
            <button
              type="button"
              onClick={() => setActiveEquipSelector(null)}
              className="text-xs font-serif bg-[#24170e] hover:bg-[#331c10] text-[#a89078] hover:text-[#dfc3a7] border border-[#5c402b]/40 hover:border-[#ae8650]/40 px-4 py-1.5 rounded-lg transition cursor-pointer select-none"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderItemSlot = (slotKey: keyof HeroEquipment, slotLabel: string, rawItem: any, slotIcon: string, hero: Hero) => {
    const item = rawItem && "itemId" in rawItem ? resolveEquippedItem(rawItem) : rawItem;

    if (!item) {
      return (
        <button
          type="button"
          onClick={() => {
            setActiveEquipSelector({ heroId: hero.id, slotKey });
          }}
          className="w-full flex items-center justify-between p-2 rounded-xl border text-xs font-serif transition-all duration-200 cursor-pointer select-none text-left bg-[#18110b]/40 hover:bg-[#201610]/60 border-[#5c402b]/15 hover:border-[#ae8650]/30 text-[#8c7460] hover:text-[#dfc3a7]"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm">{slotIcon}</span>
            <span className="font-semibold text-[#a89078]">{slotLabel} :</span>
            <span className="text-xs text-[#8c7460]/70 italic font-sans">(Vide)</span>
          </span>
          <span className="text-[10px] text-[#ae8650] hover:text-[#dfc3a7] font-semibold bg-[#331c10]/30 px-2 py-0.5 rounded border border-[#5c402b]/20 flex items-center gap-1 transition">
            ➕ Équiper
          </span>
        </button>
      );
    }

    let typeIdLabel = "";
    if (item.itemType === "weapon") {
      typeIdLabel = `Type: ${item.weaponTypeId}`;
    } else if (item.itemType === "offhand") {
      typeIdLabel = `Type: ${item.offHandTypeId}`;
    } else if (item.itemType === "armor") {
      typeIdLabel = `Type: ${item.armorTypeId}`;
    } else if (item.itemType === "accessory") {
      typeIdLabel = `Type: ${item.accessoryTypeId}`;
    }

    const rarityColorClass = getRarityBadge(item.rarity);

    return (
      <div className="p-2.5 rounded-lg bg-[#1a120d] border border-[#3e2b1f] space-y-1.5 text-xs">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-[#dfdbc7] font-serif">
            <span>{slotIcon}</span>
            <span>{slotLabel} :</span>
            <span className="text-[#caa050] font-serif">{item.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${rarityColorClass}`}>
              {item.rarity}
            </span>
            {onUnequipItem && (
              <button
                type="button"
                onClick={() => onUnequipItem(hero.id, slotKey)}
                className="text-[9.5px] bg-[#991b1b]/35 hover:bg-[#991b1b]/60 text-red-200 border border-red-900/40 hover:border-red-600/50 px-2 py-0.5 rounded transition font-mono hover:text-white cursor-pointer"
              >
                Retirer
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-[#a89078] font-mono bg-[#110a06]/80 p-1.5 rounded border border-[#302117]">
          {typeIdLabel && <span className="text-amber-500/90 font-serif">{typeIdLabel}</span>}
          {item.requiredLevel !== undefined && (
            <span>Niv. requis: {item.requiredLevel}</span>
          )}
          {item.itemType === "weapon" && item.damageRange && (
            <span className="text-red-400">Dégâts: {item.damageRange.min}-{item.damageRange.max}</span>
          )}
          {item.itemType === "weapon" && item.attackSpeed !== undefined && (
            <span className="text-sky-400">Vit. Atk: {item.attackSpeed}s</span>
          )}
          {item.itemType === "weapon" && (
            <span className="text-amber-400 font-semibold">Type: {resolveWeaponDamageTypes(item as any).join(", ")}</span>
          )}
        </div>

        {item.description && (
          <p className="text-[11px] text-[#8c7460] italic leading-relaxed font-sans">
            {item.description}
          </p>
        )}

        {item.modifiers && item.modifiers.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {item.modifiers.map((mod: any, idx: number) => (
              <span
                key={idx}
                className="bg-[#24170e]/50 text-amber-500/90 border border-[#caa050]/20 text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold"
              >
                {formatModifier(mod)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  // Cost to level up or train hero using custom materials

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-1">
      {/* Recrutement Section */}
      <div className="p-4 rounded-xl bg-[#1c120a] border border-[#5c402b]/40 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2c1d12] rounded-lg flex items-center justify-center border border-[#caa050] text-xl">
            🤝
          </div>
          <div>
            <h4 className="text-xs font-serif font-bold text-[#caa050] tracking-wide uppercase">
              Recrutement d'Aventuriers
            </h4>
            <p className="text-[10.5px] text-[#a89078] font-sans">
              {guildLevel > 0 
                ? `Effectifs : ${heroes.length} / ${maxHeroCapacity} Aventuriers`
                : "🔒 Recrutement verrouillé : Bâtissez le Campement dans l'onglet Cité pour recruter !"}
            </p>
          </div>
        </div>

        <div>
          {guildLevel > 0 ? (
            <button
              onClick={onRecruitHero}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-b from-[#caa050] to-[#ab813a] hover:from-[#d9b363] hover:to-[#be9348] text-[#110905] font-serif font-black text-xs uppercase tracking-wider rounded-lg border border-[#ebd7a0]/40 shadow-md cursor-pointer transition w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Recruter ({100 + heroes.length * 150} 💰)</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#160f0a] text-[#5c4b3f] border border-[#2c1d15] text-xs uppercase tracking-wider rounded-lg opacity-50 cursor-not-allowed"
            >
              <span>🔒 Campement requis</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HERO SQUAD DETAILED MANAGEMENT - Sleek Theme */}
      <div>
        <div className="mb-4 px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ae8650]" />
            <h3 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase font-serif">Compagnons d'Armes & Classes</h3>
          </div>
          <span className="text-xs text-[#a89078] font-serif">
            Campement de niveau {guildLevel}
          </span>
        </div>

        {heroes.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#a89078] border-2 border-dashed border-[#5c402b]/40 rounded-xl bg-[#1f1610]/30 font-mono">
            Aucun aventurier inscrit au registre de votre Campement. Signez un contrat d'hébergement pour monter une escouade !
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {heroes.map((hero) => {
              const raceBonus = RACE_INFO_LIST.find((r) => r.name === hero.race);
              const classBonus = CLASS_INFO_LIST.find((c) => c.type === hero.classType);

              const stats = hero.calculatedStats;
              const attributes = getHeroAttributes(hero);
              const hpPercent = (hero.currentHp / stats.maxHp) * 100;
              const manaPercent = stats.maxMana > 0 ? (hero.currentMana / stats.maxMana) * 100 : 0;
              const isPartyLeader = hero.isActive;
              const heroActiveSkills = (hero.activeSkills || []).map(getSkillById).filter(Boolean);
              const heroPassiveSkills = (hero.passiveSkills || []).map(getSkillById).filter(Boolean);

              // Compute XP percentage
              const xpPercent = Math.min(100, (hero.xp / hero.xpNeeded) * 100);
              const activeTab = heroActiveTabs[hero.id] || "overview";

              // Setup 7 primary stats list
              const primaryStats: { key: "str" | "agi" | "end" | "int" | "wiz" | "dex" | "luk"; label: string; fullLabel: string }[] = [
                { key: "str", label: "FOR", fullLabel: "Force" },
                { key: "agi", label: "AGI", fullLabel: "Agilité" },
                { key: "end", label: "END", fullLabel: "Endurance" },
                { key: "int", label: "INT", fullLabel: "Intelligence" },
                { key: "wiz", label: "SAG", fullLabel: "Sagesse" },
                { key: "dex", label: "DEX", fullLabel: "Dextérité" },
                { key: "luk", label: "CHA", fullLabel: "Chance" }
              ];

              return (
                <div
                  key={hero.id}
                  className={`relative p-5 rounded-2xl border-2 transition duration-200 flex flex-col justify-between ${
                    isPartyLeader
                      ? "bg-[#21140c] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                      : "bg-[#16100c] border-[#3a271c] hover:border-[#5c402b]/80"
                  }`}
                >
                  <div>
                    {/* Identity & Header Row */}
                    <div className="flex justify-between items-start gap-4 mb-3 pb-3 border-b border-[#3a271c]">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base font-bold text-[#f7eedc] font-serif tracking-wide flex items-center gap-1.5">
                            {hero.name}
                            <span
                              className={`text-sm font-bold ${hero.gender === "Female" ? "text-pink-400" : "text-sky-400"}`}
                              title={hero.gender === "Female" ? "Femme" : "Homme"}
                            >
                              {hero.gender === "Female" ? "♀" : "♂"}
                            </span>
                          </h4>

                          {/* Hero Elite Indicator */}
                          {hero.isElite && (
                            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 rounded uppercase select-none font-serif tracking-wider">
                              ⭐ Élite
                            </span>
                          )}
                        </div>

                        {/* Badges and status */}
                        <div className="flex gap-1.5 items-center flex-wrap mt-1.5">
                          <span
                            className="text-[10px] font-bold rounded px-1.5 py-0.5 uppercase text-[#f7eedc] border select-none font-serif"
                            style={{ borderColor: classBonus?.color || "#5c402b", backgroundColor: `${classBonus?.color || "#5c402b"}15` }}
                          >
                            {hero.race}
                          </span>
                          <span className="text-[10px] font-bold bg-[#29170d] text-[#caa050] border border-[#5c402b]/60 px-1.5 py-0.5 rounded uppercase select-none font-serif">
                            {hero.classType}
                          </span>

                          {/* Status Badge */}
                          {isPartyLeader || hero.status === "exploring" ? (
                            <span className="inline-flex items-center gap-1 bg-red-950/40 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-serif uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              En Donjon
                            </span>
                          ) : hero.status === "resting" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-serif uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Repos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-900/40 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded text-[10px] font-bold font-serif uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              Disponible
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Level and XP visual display */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-serif font-black block text-amber-500 select-none">
                          Niv. {hero.level}
                        </span>
                        <div className="mt-1" title={`${Math.floor(hero.xp)} / ${hero.xpNeeded} XP`}>
                          <span className="text-[10px] text-[#a89078] font-mono font-semibold block">
                            {Math.floor(hero.xp)} / {hero.xpNeeded} XP
                          </span>
                          <div className="w-16 h-1 bg-[#261710] rounded-full mt-0.5 overflow-hidden border border-[#5c402b]/20">
                            <div className="h-full bg-amber-500" style={{ width: `${xpPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                              {/* Tab Navigation */}
                    <div className="flex border-b border-[#3a271c] mb-4 text-xs font-serif font-semibold">
                      {(["overview", "skills", "equipment"] as const).map((tab) => {
                        const isActive = activeTab === tab;
                        const label = {
                          overview: "Aperçu",
                          skills: "Compétences",
                          equipment: "Équipement"
                        }[tab];
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => {
                              setHeroActiveTabs((prev) => ({ ...prev, [hero.id]: tab }));
                            }}
                            className={`flex-1 text-center py-2 transition-all cursor-pointer border-b-2 -mb-[2px] uppercase tracking-wider text-[10px] sm:text-[11px] ${
                              isActive
                                ? "text-[#caa050] border-[#caa050] font-bold"
                                : "text-[#8c7460] border-transparent hover:text-[#a89078]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab Body */}
                    <div className="min-h-[220px]">
                      {activeTab === "overview" && (
                        <div className="space-y-4">
                          {/* Large Portrait Showcase */}
                          <div className="flex flex-col items-center justify-center p-4 bg-[#110a06]/40 rounded-2xl border border-[#302117]/60">
                            <HeroPortrait hero={hero} size="lg" noBorder={true} noBg={true} noPadding={true} className="shadow-lg" />
                            <span className="text-[10px] text-[#caa050]/70 font-serif tracking-widest uppercase mt-2">Profil de {hero.name}</span>
                            <p className="text-xs sm:text-[13px] leading-relaxed text-[#dfdbc7] italic text-center px-1 mt-2.5 max-w-[280px]">
                              « {raceBonus?.description} »
                            </p>
                          </div>

                          {/* Specialization info for Novices */}
                          {hero.classType === "Novice" && (
                            <div className="bg-[#24170e]/40 p-3 rounded-xl border border-amber-500/20 text-xs">
                              <div className="flex items-center gap-1.5 mb-1.5 text-[#caa050] font-serif font-bold uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500/80" />
                                <span>Vocation Automatique</span>
                              </div>
                              <p className="text-xs text-[#a89078] leading-relaxed font-sans">
                                Ce héros s'orientera automatiquement vers une spécialisation de Tier 1 dès le <span className="text-amber-500 font-semibold">Niveau 10</span>, si les infrastructures requises sont bâties dans votre Colonie et qu'une affinité claire se dessine dans ses statistiques.
                              </p>
                            </div>
                          )}

                          {/* Compact HP & MP Vitals row */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Health points bar */}
                            <div className={stats.maxMana > 0 ? "col-span-1" : "col-span-2"}>
                              <div className="flex justify-between text-xs font-serif mb-1 text-[#dfdbc7] font-semibold">
                                <span className="flex items-center gap-1">❤️ PV</span>
                                <span className="text-red-400 font-bold">
                                  {Math.floor(hero.currentHp)}/{stats.maxHp}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-[#1f1008] rounded-full overflow-hidden border border-[#5c402b]/25">
                                <div
                                  className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300"
                                  style={{ width: `${Math.max(0, hpPercent)}%` }}
                                />
                              </div>
                            </div>

                            {/* Mana points bar (only visible if hero has mana pool) */}
                            {stats.maxMana > 0 && (
                              <div className="col-span-1">
                                <div className="flex justify-between text-xs font-serif mb-1 text-[#dfdbc7] font-semibold">
                                  <span className="flex items-center gap-1">🔮 Mana</span>
                                  <span className="text-blue-400 font-bold">
                                    {Math.floor(hero.currentMana)}/{stats.maxMana}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-[#1f1008] rounded-full overflow-hidden border border-[#5c402b]/25">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-800 to-blue-500 transition-all duration-300"
                                    style={{ width: `${Math.max(0, manaPercent)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* RPG Character Sheet: 7 Primary Attributes Box */}
                          <div className="bg-[#110a06] p-3 rounded-2xl border border-[#302117] hover:border-[#ae8650]/30 transition duration-200">
                            <span className="text-[10px] text-[#ae8650] font-bold uppercase tracking-widest block mb-2 font-serif">
                              Attributs
                            </span>
                            
                            {/* 7-Column Grid of Attributes */}
                            <div className="grid grid-cols-7 gap-1">
                              {primaryStats.map(({ key, label, fullLabel }) => {
                                const val = attributes[key] || 0;
                                const isMainStat = classBonus?.mainStats?.includes(key);

                                return (
                                  <div
                                    key={key}
                                    title={`${fullLabel} ${isMainStat ? "(Statistique de Classe Principale)" : ""}`}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded transition ${
                                      isMainStat
                                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                                        : "bg-[#18110b]/60 border border-[#5c402b]/15 text-[#dfdbc7]"
                                    }`}
                                  >
                                    <span className="text-[9px] font-bold text-[#8c7460] block font-serif tracking-tight">
                                      {label}
                                    </span>
                                    <span className="text-xs font-black font-mono mt-0.5">
                                      {val}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Combat Core Values - 7 Individual Stats with Short Labels */}
                          <div className="bg-[#110a06] p-3.5 rounded-xl border border-[#302117] hover:border-[#ae8650]/20 transition duration-200">
                            <span className="text-[10px] text-[#ae8650] font-bold uppercase tracking-widest block mb-2 font-serif">
                              Combat
                            </span>

                            <div className="space-y-1.5 text-xs font-sans">
                              <div className="flex items-center justify-between py-0.5 border-b border-[#3e2b1f]/20">
                                <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif">
                                  ⚔️ Atk. Phys
                                </span>
                                <span className="text-[#dfdbc7] font-mono font-bold">
                                  {stats.physicalDamage}
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-0.5 border-b border-[#3e2b1f]/20">
                                <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif">
                                  🔮 Atk. Mag
                                </span>
                                <span className="text-[#dfdbc7] font-mono font-bold">
                                  {stats.magicDamage}
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-0.5 border-b border-[#3e2b1f]/20">
                                <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif">
                                  🛡️ Def. Phys
                                </span>
                                <span className="text-[#dfdbc7] font-mono font-bold">
                                  {stats.physicalDefense}
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-0.5 border-b border-[#3e2b1f]/20">
                                <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif">
                                  🌌 Def. Mag
                                </span>
                                <span className="text-[#dfdbc7] font-mono font-bold">
                                  {stats.magicDefense}
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-0.5 border-b border-[#3e2b1f]/20">
                                <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif">
                                  🎯 Critique
                                </span>
                                <span className="text-[#dfdbc7] font-mono font-bold">
                                  {stats.criticalChance}%
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-0.5 border-b border-[#3e2b1f]/20">
                                <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif">
                                  💨 Esquive
                                </span>
                                <span className="text-[#dfdbc7] font-mono font-bold">
                                  {stats.dodgeChance}%
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-0.5">
                                <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif">
                                  ⚡ Vitesse
                                </span>
                                <span className="text-[#dfdbc7] font-mono font-bold">
                                  {stats.speed}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Elemental Resistances Box */}
                          {stats.resistances && (() => {
                            const differentResistances = Object.entries(stats.resistances).filter(
                              ([_, val]) => val !== stats.magicDefense
                            );
                            if (differentResistances.length === 0) return null;

                            return (
                              <div className="bg-[#110a06] p-3 rounded-2xl border border-[#302117] hover:border-[#ae8650]/30 transition duration-200">
                                <span className="text-[10px] text-[#ae8650] font-bold uppercase tracking-widest block mb-2.5 font-serif">
                                  Résistances Élémentaires
                                </span>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-sans">
                                  {differentResistances.map(([elemKey, val]) => {
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
                                    const emoji = elementEmoji[elemKey] || "🛡️";
                                    const label = elementFrench[elemKey] || elemKey;
                                    return (
                                      <div key={elemKey} className="flex items-center justify-between py-0.5 border-b border-[#3e2b1f]/20">
                                        <span className="text-[#8c7460] font-medium flex items-center gap-1 font-serif text-[11px]">
                                          {emoji} {label}
                                        </span>
                                        <span className={`font-mono font-bold ${val > stats.magicDefense ? 'text-emerald-400 font-semibold' : val < stats.magicDefense ? 'text-red-400 font-semibold' : 'text-[#dfdbc7]'}`}>
                                          {val}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {activeTab === "skills" && (
                        <div className="space-y-3 bg-[#110a06] p-3 rounded-2xl border border-[#302117] hover:border-[#ae8650]/20 transition duration-200">
                          {/* Active Skills List */}
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold tracking-wider text-[#caa050] uppercase block border-b border-[#caa050]/15 pb-1 font-serif">
                              Compétences Actives
                            </span>
                            {heroActiveSkills.length > 0 ? (
                              heroActiveSkills.map((skill) => (
                                <div key={skill.id} className="p-2 rounded bg-[#1e130c]/30 border border-[#ff7830]/15 text-xs">
                                  <div className="flex justify-between items-start mb-1 flex-wrap gap-1">
                                    <span className="font-serif font-black text-[#f7eedc]">
                                      {skill.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {skill.manaCost !== undefined && skill.manaCost > 0 && (
                                        <span className="bg-sky-950/45 text-sky-400 border border-sky-900/35 text-[9px] px-1 py-0.5 rounded font-mono font-bold" title="Coût en Mana">
                                          {skill.manaCost} PM
                                        </span>
                                      )}
                                      {skill.cooldownRounds !== undefined && skill.cooldownRounds > 0 && (
                                        <span className="bg-amber-950/45 text-amber-400 border border-amber-900/35 text-[9px] px-1 py-0.5 rounded font-mono font-bold" title="Temps de recharge">
                                          ⏳ {skill.cooldownRounds} t.
                                        </span>
                                      )}
                                      {skill.target && (
                                        <span className="bg-purple-950/45 text-purple-400 border border-purple-900/35 text-[9px] px-1 py-0.5 rounded font-serif font-medium" title="Cible de la compétence">
                                          🎯 {getTargetLabel(skill.target)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-[#a89078] italic leading-relaxed mb-1.5 font-sans">
                                    {skill.description}
                                  </p>
                                  {skill.effect && (
                                    <div className="text-[10.5px] text-[#ff9d63] bg-[#22150d] p-1.5 rounded border border-[#ff7830]/10 font-sans">
                                      <strong className="text-[#ff8e53] text-[9.5px] uppercase font-bold tracking-wide mr-1 font-serif">Effet :</strong>
                                      {getEffectSummary(skill.effect)}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-[#8c7460] text-xs italic p-2.5 bg-[#18110b]/30 border border-[#5c402b]/15 rounded text-center font-sans">
                                Aucune compétence active
                              </div>
                            )}
                          </div>

                          {/* Passive Skills List */}
                          <div className="space-y-2 pt-2">
                            <span className="text-[9px] font-bold tracking-wider text-emerald-500/80 uppercase block border-b border-emerald-500/15 pb-1 font-serif">
                              Compétences Passives
                            </span>
                            {heroPassiveSkills.length > 0 ? (
                              heroPassiveSkills.map((skill) => (
                                <div key={skill.id} className="p-2 rounded bg-[#131d16]/20 border border-[#3dd882]/15 text-xs">
                                  <div className="flex justify-between items-start mb-1 flex-wrap gap-1">
                                    <span className="font-serif font-black text-[#f7eedc]">
                                      {skill.name}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#a89078] italic leading-relaxed mb-1.5 font-sans">
                                    {skill.description}
                                  </p>
                                  {skill.effect && (
                                    <div className="text-[10.5px] text-[#5df3a0] bg-[#111913] p-1.5 rounded border border-[#3dd882]/10 font-sans">
                                      <strong className="text-[#3dd882] text-[9.5px] uppercase font-bold tracking-wide mr-1 font-serif">Effet :</strong>
                                      {getEffectSummary(skill.effect)}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-[#8c7460] text-xs italic p-2.5 bg-[#18110b]/30 border border-[#5c402b]/15 rounded text-center font-sans">
                                Aucune compétence passive
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "equipment" && (
                        <div className="bg-[#110a06] p-3 rounded-2xl border border-[#302117] hover:border-[#ae8650]/20 transition duration-200">
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="text-[10px] text-[#ae8650] font-bold uppercase tracking-widest font-serif">
                              Équipement
                            </span>
                            {onGoToTab && (
                              <button
                                onClick={() => onGoToTab("storage")}
                                className="text-[10px] text-[#ae8650] hover:text-[#dfc3a7] font-semibold flex items-center gap-1 transition cursor-pointer select-none bg-[#331c10]/40 px-2 py-0.5 rounded border border-[#5c402b]/40 hover:border-[#ae8650]/60"
                              >
                                📦 Ouvrir le Coffre
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {renderItemSlot("mainHand", "Main principale", hero.equipment?.mainHand, "🗡️", hero)}
                            {renderItemSlot("offHand", "Main gauche", hero.equipment?.offHand, "🛡️", hero)}
                            {renderItemSlot("armor", "Armure", hero.equipment?.armor, "👕", hero)}
                            {renderItemSlot("accessory", "Accessoire", hero.equipment?.accessory, "💍", hero)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-2 mt-4 pt-3.5 border-t border-[#3a271c]">
                    <button
                      onClick={() => onToggleHeroActive(hero.id)}
                      className={`flex-1 text-[11px] font-bold font-serif py-2 rounded-xl border uppercase tracking-wider transition cursor-pointer select-none ${
                        isPartyLeader
                          ? "bg-[#331c10] text-[#dfc3a7] border-[#5c402b]/60 hover:bg-[#48281a]"
                          : "bg-[#8c5a2b] hover:bg-[#ab733c] text-white border-[#d4af37] shadow-sm"
                      }`}
                    >
                      {isPartyLeader ? "Retirer" : "DÉPÊCHER"}
                    </button>

                    <button
                      onClick={() => onDismissHero(hero.id)}
                      className="text-[10px] font-serif text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-[#a13232]/20 hover:border-red-900/50 px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
                      title="Congédier cet aventurier définitivement"
                    >
                      Bannir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <AnimatePresence>
        {activeEquipSelector && renderEquipModal()}
      </AnimatePresence>
    </div>
  );
}
