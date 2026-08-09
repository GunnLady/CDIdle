import React from "react";
import { Coins, Grape, Trees, Hammer, Pickaxe, Castle } from "lucide-react";
import Tooltip from "../ui/components/Tooltip";

export function formatResourceValue(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  if (val >= 1000000) {
    return (val / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (val >= 10000) {
    return (val / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return Math.floor(val).toLocaleString("fr-FR");
}

export function CrestBadge() {
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#caa050] to-[#8c6523] flex items-center justify-center shadow-lg border border-[#ebd7a0]/40">
      <Castle className="w-5 h-5 text-[#110905]" />
    </div>
  );
}

export function GoldIconDetail() {
  return (
    <Tooltip label="Détail de ressource" content="Or"><span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/10">
      <Coins className="w-4 h-4 text-[#fbbf24]" />
    </span></Tooltip>
  );
}

export function FoodIconDetail() {
  return (
    <Tooltip label="Détail de ressource" content="Nourriture"><span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#59ba59]/30 bg-[#59ba59]/10">
      <Grape className="w-4 h-4 text-[#59ba59]" />
    </span></Tooltip>
  );
}

export function WoodIconDetail() {
  return (
    <Tooltip label="Détail de ressource" content="Bois"><span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d26d36]/30 bg-[#d26d36]/10">
      <Trees className="w-4 h-4 text-[#d26d36]" />
    </span></Tooltip>
  );
}

export function StoneIconDetail() {
  return (
    <Tooltip label="Détail de ressource" content="Pierre"><span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#cdcdcd]/30 bg-[#cdcdcd]/10">
      <Hammer className="w-4 h-4 text-[#cdcdcd]" />
    </span></Tooltip>
  );
}

export function OreIconDetail() {
  return (
    <Tooltip label="Détail de ressource" content="Minerai"><span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#9653ec]/30 bg-[#9653ec]/10">
      <Pickaxe className="w-4 h-4 text-[#9653ec]" />
    </span></Tooltip>
  );
}
