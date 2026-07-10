import React from "react";
import { Coins, Grape, Trees, Hammer, Pickaxe, Castle } from "lucide-react";

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
    <div className="w-7 h-7 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-center justify-center" title="Or">
      <Coins className="w-4 h-4 text-[#fbbf24]" />
    </div>
  );
}

export function FoodIconDetail() {
  return (
    <div className="w-7 h-7 rounded-lg bg-[#59ba59]/10 border border-[#59ba59]/30 flex items-center justify-center" title="Nourriture">
      <Grape className="w-4 h-4 text-[#59ba59]" />
    </div>
  );
}

export function WoodIconDetail() {
  return (
    <div className="w-7 h-7 rounded-lg bg-[#d26d36]/10 border border-[#d26d36]/30 flex items-center justify-center" title="Bois">
      <Trees className="w-4 h-4 text-[#d26d36]" />
    </div>
  );
}

export function StoneIconDetail() {
  return (
    <div className="w-7 h-7 rounded-lg bg-[#cdcdcd]/10 border border-[#cdcdcd]/30 flex items-center justify-center" title="Pierre">
      <Hammer className="w-4 h-4 text-[#cdcdcd]" />
    </div>
  );
}

export function OreIconDetail() {
  return (
    <div className="w-7 h-7 rounded-lg bg-[#9653ec]/10 border border-[#9653ec]/30 flex items-center justify-center" title="Minerai">
      <Pickaxe className="w-4 h-4 text-[#9653ec]" />
    </div>
  );
}
