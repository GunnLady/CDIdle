import { BUILDINGS_LIST } from "../data/buildings";
import { getItemById } from "../../shared/domain/items/items.ts";

export type TownEventLog = {
  message: string;
  type: "info" | "victory" | "loot";
};

const ROLE_LABELS: Record<string, string> = {
  farmers: "fermier(s)",
  woodcutters: "bûcheron(s)",
  quarrymen: "tailleur(s) de pierre",
  miners: "mineur(s)",
};

const MODIFIER_LABELS: Record<string, string> = {
  physicalDamage: "dégâts physiques",
  magicDamage: "dégâts magiques",
  criticalChance: "chance de critique",
  speed: "vitesse",
  maxHp: "PV max",
  maxMana: "mana max",
  physicalDefense: "défense physique",
  magicDefense: "défense magique",
  dodgeChance: "esquive",
};

const MATERIAL_LABELS: Record<string, string> = {
  metal_scrap: "débris métalliques",
  refined_metal: "métal raffiné",
  enchanted_fragment: "fragment enchanté",
  arcane_core: "noyau arcanique",
  legendary_essence: "essence légendaire",
};

const RARITY_LABELS: Record<string, string> = {
  common: "commune",
  uncommon: "inhabituelle",
  rare: "rare",
  epic: "épique",
  legendary: "légendaire",
};

export function formatCanonicalTownEvent(event: Record<string, unknown>): TownEventLog | null {
  if (event.type === "building.upgraded") {
    const building = BUILDINGS_LIST.find((entry) => entry.id === event.buildingId);
    if (!building || !Number.isInteger(event.level)) return null;
    return { message: `🏗️ ${building.name} atteint le niveau ${event.level}.`, type: "victory" };
  }
  if (event.type === "citizens.allocated") {
    const role = ROLE_LABELS[String(event.role)];
    const amount = Number(event.amount);
    if (!role || !Number.isInteger(amount) || amount === 0) return null;
    return {
      message: amount > 0
        ? `👷 ${amount} citoyen(s) affecté(s) comme ${role}.`
        : `👷 ${Math.abs(amount)} ${role} rendu(s) disponible(s).`,
      type: "info",
    };
  }
  if (event.type === "forge.preview_created") {
    const item = getItemById(String(event.itemId));
    const opportunity = event.upgradeProc === "rare"
      ? "amélioration rare disponible"
      : event.upgradeProc === "uncommon"
        ? "amélioration inhabituelle disponible"
        : "aucune amélioration détectée";
    return { message: `🔥 Forge : ${item?.name ?? event.itemId} prêt, ${opportunity}.`, type: "info" };
  }
  if (event.type === "forge.finalized") {
    const item = getItemById(String(event.itemId));
    const modifier = typeof event.modifier === "string" ? `, bonus ${MODIFIER_LABELS[event.modifier] ?? event.modifier}` : "";
    const rarity = RARITY_LABELS[String(event.rarity)] ?? event.rarity;
    return { message: `🔨 Forge : ${item?.name ?? event.itemId} obtenu en qualité ${rarity}${modifier}.`, type: "victory" };
  }
  if (event.type === "forge.preview_cancelled") {
    return { message: "🔥 Forge annulée : les matériaux de base restent consumés.", type: "info" };
  }
  if (event.type === "inventory.recycled" && Array.isArray(event.rewards)) {
    const rewards = event.rewards.map((reward) => {
      const entry = reward as Record<string, unknown>;
      return `${entry.count} ${MATERIAL_LABELS[String(entry.materialId)] ?? entry.materialId}`;
    }).join(", ");
    const item = getItemById(String(event.itemId));
    return { message: `♻️ ${item?.name ?? event.itemId} recyclé : ${rewards}.`, type: "loot" };
  }
  return null;
}
