/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Search, Sparkles, AlertCircle, Eye } from "lucide-react";
import { StoredItemStack, StoredForgeMaterialStack, Rarity, ItemInfo, Hero, Modifier } from "../types";
import { getItemById } from "../data/items";
import { applyItemRarityScaling, FORGE_MATERIALS, areModifiersEqual } from "../utils/gameCalculations";

interface StoragePanelProps {
  storedItems: StoredItemStack[];
  heroes?: Hero[];
  onEquipItem?: (heroId: string, itemId: string, rarity: Rarity, modifiers?: Modifier[]) => void;
  isForgeUnlocked?: boolean;
  onScrapItem?: (itemId: string, rarity: Rarity, modifiers?: Modifier[]) => void;
  forgeMaterials?: StoredForgeMaterialStack[];
}

export default function StoragePanel({
  storedItems = [],
  heroes = [],
  onEquipItem,
  isForgeUnlocked = false,
  onScrapItem,
  forgeMaterials = []
}: StoragePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [equippingItemId, setEquippingItemId] = useState<{ itemId: string; rarity: Rarity; modifiers?: Modifier[] } | null>(null);

  // Helper to translate item type
  const translateItemType = (type: string) => {
    switch (type) {
      case "weapon": return "Arme";
      case "offhand": return "Main gauche / Bouclier";
      case "armor": return "Armure";
      case "accessory": return "Accessoire";
      default: return type;
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-amber-950/80 text-amber-400 border-amber-900/60";
      case "epic":
        return "bg-purple-950/80 text-purple-400 border-purple-900/60";
      case "rare":
        return "bg-blue-950/80 text-blue-400 border-blue-900/60";
      case "uncommon":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-900/60";
      default:
        return "bg-slate-950/80 text-gray-400 border-slate-900/60";
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
      case "criticalChance": return "Coup Critique";
      case "blockChance": return "Blocage";
      case "healthRegen": return "Régén. PV";
      case "manaRegen": return "Régén. PM";
      default: return key;
    }
  };

  const formatModifier = (mod: { stat: string; type: string; value: number }) => {
    const sign = mod.value >= 0 ? "+" : "";
    const unit = mod.type === "percent" ? "%" : "";
    return `${sign}${mod.value}${unit} ${translateStatKey(mod.stat)}`;
  };

  // Resolve stored stacks to displayable items
  const resolvedStacks = useMemo(() => {
    return storedItems
      .map((stack) => {
        const baseItem = getItemById(stack.itemId);
        if (!baseItem) return null;
        const scaledItem = applyItemRarityScaling(baseItem, stack.rarity);
        if (stack.modifiers && stack.modifiers.length > 0) {
          scaledItem.modifiers = stack.modifiers;
        }
        return {
          ...stack,
          item: scaledItem
        };
      })
      .filter((stack): stack is { itemId: string; rarity: Rarity; count: number; modifiers?: Modifier[]; item: ItemInfo } => stack !== null);
  }, [storedItems]);

  // Filter stacks based on search and selected filters
  const filteredStacks = useMemo(() => {
    return resolvedStacks.filter((stack) => {
      const matchSearch = stack.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stack.item.description && stack.item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchRarity = selectedRarity === "all" || stack.rarity === selectedRarity;
      const matchType = selectedType === "all" || stack.item.itemType === selectedType;
      return matchSearch && matchRarity && matchType;
    });
  }, [resolvedStacks, searchTerm, selectedRarity, selectedType]);

  const itemTypes = ["weapon", "offhand", "armor", "accessory"];
  const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-[#1c120a] p-4 rounded-xl border border-[#5c402b]/40 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2c1d12] rounded-lg flex items-center justify-center border border-[#caa050] text-xl shadow-inner">
              📦
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#caa050] tracking-wide uppercase">
                Coffre Fort de la Cité
              </h3>
              <p className="text-[10.5px] text-[#a89078] font-sans">
                Conservez vos trésors et vos équipements durement acquis. Vos champions peuvent y puiser depuis le Campement.
              </p>
            </div>
          </div>
          <div className="bg-[#100805] px-3.5 py-1.5 rounded-lg border border-[#3e2b1f] text-center font-mono">
            <span className="text-[11px] text-[#8c7460] uppercase mr-2 font-serif block sm:inline">Emplacements occupés :</span>
            <span className="text-[#caa050] font-bold text-sm">
              {resolvedStacks.reduce((acc, s) => acc + s.count, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Forge Materials Inventory */}
      {isForgeUnlocked && (
        <div className="bg-[#18110b] p-4 rounded-2xl border border-[#caa050]/20 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#3e2b1f]/60 pb-2">
            <span className="text-sm font-serif font-bold text-[#caa050] tracking-wide uppercase">
              ⚙️ Réserve de Matériaux de Forge
            </span>
          </div>
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
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#150d08] p-4 rounded-2xl border border-[#3e2b1f] space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8c7460]" />
            <input
              type="text"
              placeholder="Rechercher un objet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#100805] text-[#fbf7f0] border border-[#5c402b]/40 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#caa050] focus:ring-1 focus:ring-[#caa050] placeholder-[#5a483a] font-sans"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#100805] text-[#fbf7f0] border border-[#5c402b]/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#caa050] font-serif cursor-pointer"
            >
              <option value="all">Tous les types</option>
              {itemTypes.map((type) => (
                <option key={type} value={type}>
                  {translateItemType(type)}
                </option>
              ))}
            </select>

            {/* Rarity selector */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="bg-[#100805] text-[#fbf7f0] border border-[#5c402b]/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#caa050] font-serif cursor-pointer"
            >
              <option value="all">Toutes les raretés</option>
              {rarities.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Storage Items Grid */}
      {filteredStacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStacks.map((stack) => {
            const item = stack.item;
            const itemIcon = item.itemType === "weapon" ? "🗡️" : item.itemType === "offhand" ? "🛡️" : item.itemType === "armor" ? "👕" : "💍";
            const rarityBadgeClass = getRarityBadge(stack.rarity);

            return (
              <div
                key={`${stack.itemId}-${stack.rarity}`}
                className="p-3.5 rounded-2xl bg-[#1c120a] border border-[#3e2b1f] hover:border-[#caa050]/40 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-md group relative overflow-hidden"
              >
                {/* Decorative glow for legendary */}
                {stack.rarity === "legendary" && (
                  <div className="absolute -inset-4 px-2 py-2 bg-gradient-to-tr from-amber-500/0 to-amber-500/5 group-hover:to-amber-500/10 pointer-events-none transition-all duration-300 rounded-full blur-xl" />
                )}

                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 font-semibold text-[#dfdbc7] font-serif">
                      <span className="text-lg bg-[#2c1d12] p-1.5 rounded-lg border border-[#3e2b1f]">{itemIcon}</span>
                      <div>
                        <span className="text-xs text-[#a89078] uppercase block text-[9px] tracking-wider">
                          {translateItemType(item.itemType)}
                        </span>
                        <span className="text-[#caa050] font-bold text-sm tracking-wide block leading-tight font-serif">
                          {item.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${rarityBadgeClass} font-bold`}>
                        {stack.rarity}
                      </span>
                      <span className="text-[10px] text-amber-500/90 font-mono bg-[#110a06] border border-[#302117] px-1.5 py-0.5 rounded font-bold">
                        x{stack.count}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-[#a89078] font-mono bg-[#110a06]/80 p-2 rounded border border-[#302117]">
                    {item.requiredLevel !== undefined && (
                      <span>Niv. requis : {item.requiredLevel}</span>
                    )}
                    {item.itemType === "weapon" && item.damageRange && (
                      <span className="text-red-400">Dégâts : {item.damageRange.min}-{item.damageRange.max}</span>
                    )}
                    {item.itemType === "weapon" && item.attackSpeed !== undefined && (
                      <span className="text-sky-400">Vit. Atk : {item.attackSpeed}s</span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-[#8c7460] italic leading-relaxed font-sans pl-1 border-l border-[#5c402b]/30">
                      {item.description}
                    </p>
                  )}

                  {item.modifiers && item.modifiers.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {item.modifiers.map((mod: any, idx: number) => (
                        <span
                          key={idx}
                          className="bg-[#24170e]/50 text-amber-500/90 border border-[#caa050]/20 text-[9.5px] px-2 py-0.5 rounded-md font-mono font-bold"
                        >
                          {formatModifier(mod)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Optional Quick Equip & Recycle Actions */}
                {(onEquipItem || (isForgeUnlocked && onScrapItem)) && (
                  <div className="pt-2 border-t border-[#3e2b1f]/50 mt-1">
                    {onEquipItem && heroes.length > 0 && equippingItemId?.itemId === stack.itemId && equippingItemId?.rarity === stack.rarity && areModifiersEqual(equippingItemId?.modifiers, stack.modifiers) ? (
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-[#caa050] font-bold uppercase tracking-wider block font-serif">
                          Équiper sur quel aventurier ?
                        </span>
                        <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                          {heroes.map((hero) => {
                            const requiredLevel = getItemById(stack.itemId)?.requiredLevel ?? 1;
                            const isLevelTooLow = hero.level < requiredLevel;
                            return (
                              <button
                                key={hero.id}
                                disabled={isLevelTooLow}
                                onClick={() => {
                                  if (isLevelTooLow) return;
                                  onEquipItem(hero.id, stack.itemId, stack.rarity, stack.modifiers);
                                  setEquippingItemId(null);
                                }}
                                className={`text-[10px] text-left p-1 rounded font-serif transition-all duration-150 ${
                                  isLevelTooLow
                                    ? "bg-[#18110e]/60 border border-[#2a1d15] text-[#7c6d5f] cursor-not-allowed opacity-60"
                                    : "bg-[#100805] hover:bg-[#caa050]/20 border border-[#3e2b1f] hover:border-[#caa050]/60 text-[#dfdbc7] cursor-pointer"
                                }`}
                                title={isLevelTooLow ? `Niveau requis : ${requiredLevel}` : undefined}
                              >
                                <span className="block truncate">
                                  {isLevelTooLow ? "🚫 " : "⚔️ "}{hero.name} (Niv.{hero.level})
                                </span>
                                {isLevelTooLow && (
                                  <span className="text-[8px] text-red-400 font-sans italic block mt-0.5">
                                    (Req. Niv.{requiredLevel})
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setEquippingItemId(null)}
                          className="w-full text-center text-[9px] text-red-400 hover:text-red-300 uppercase tracking-widest font-bold pt-1 cursor-pointer block"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {onEquipItem && heroes.length > 0 && (
                          <button
                            onClick={() => setEquippingItemId({ itemId: stack.itemId, rarity: stack.rarity, modifiers: stack.modifiers })}
                            className="flex-1 bg-[#331c10] hover:bg-[#48281a] border border-[#5c402b]/40 text-amber-500/90 hover:text-amber-400 text-[10.5px] font-bold font-serif py-1 px-2 rounded-lg transition-all duration-200 cursor-pointer text-center"
                          >
                            Équiper
                          </button>
                        )}
                        {isForgeUnlocked && onScrapItem && (
                          <button
                            onClick={() => onScrapItem(stack.itemId, stack.rarity, stack.modifiers)}
                            className="flex-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 text-red-400 hover:text-red-300 text-[10.5px] font-bold font-serif py-1 px-2 rounded-lg transition-all duration-200 cursor-pointer text-center"
                            title="Recycler cet équipement en matériaux"
                          >
                            ♻️ Recycler
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#1c120a] border border-[#3e2b1f] text-center max-w-lg mx-auto space-y-3.5">
          <div className="text-4xl text-[#8c7460] animate-pulse">📦</div>
          <h4 className="text-sm font-serif font-bold text-[#caa050] uppercase tracking-wide">
            Votre coffre est vide
          </h4>
          <p className="text-xs text-[#8c7460] font-sans leading-relaxed">
            {searchTerm || selectedRarity !== "all" || selectedType !== "all"
              ? "Aucun objet ne correspond à vos filtres actuels de recherche."
              : "Partez explorer les profondeurs du donjon ! Vos héros y dénicheront d'extraordinaires équipements à stocker ici."}
          </p>
          {(searchTerm || selectedRarity !== "all" || selectedType !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedRarity("all");
                setSelectedType("all");
              }}
              className="text-xs text-[#caa050] hover:text-[#d9b363] underline font-serif cursor-pointer font-bold"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
