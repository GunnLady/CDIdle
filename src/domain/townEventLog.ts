import { BUILDINGS_LIST } from "../data/buildings";

export type TownEventLog = {
  message: string;
  type: "info" | "victory";
};

const ROLE_LABELS: Record<string, string> = {
  farmers: "fermier(s)",
  woodcutters: "bûcheron(s)",
  quarrymen: "tailleur(s) de pierre",
  miners: "mineur(s)",
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
  return null;
}
