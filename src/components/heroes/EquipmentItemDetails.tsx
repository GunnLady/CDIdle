import type { EquipmentItemView } from "../../domain/heroEquipmentPresentation";

const rarityClass = (rarity?: string) => ({ legendary: "text-amber-400", epic: "text-purple-400", rare: "text-blue-400", uncommon: "text-emerald-400" } as Record<string, string>)[rarity ?? ""] ?? "text-gray-400";

export default function EquipmentItemDetails({ item, showDescription = false, levelBlocked = false }: { item: EquipmentItemView; showDescription?: boolean; levelBlocked?: boolean }) {
  return <>
    <span className="flex items-baseline justify-between gap-3"><strong className="font-serif text-[13px] text-[#eadabc]">{item.name}</strong>{item.rarity && <span className={`shrink-0 text-[10px] uppercase ${rarityClass(item.rarity)}`}>{item.rarityLabel}</span>}</span>
    {showDescription && item.description && <p className="mt-1 text-[11px] leading-relaxed text-[#8f7a67]">{item.description}</p>}
    {item.facts.length > 0 && <dl className="mt-2 grid gap-1 text-[10px]">{item.facts.map((fact) => {
      const blockedLevel = levelBlocked && fact.id === "required-level";
      return <div key={fact.id} className="flex items-start justify-between gap-3"><dt className={blockedLevel ? "font-bold text-red-400" : "text-[#9f8872]"}>{fact.label}</dt><dd className={`text-right font-medium ${blockedLevel ? "text-red-400" : "text-[#dfdbc7]"}`}>{fact.value}</dd></div>;
    })}</dl>}
    {item.modifiers.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{item.modifiers.map((modifier) => <span key={modifier.id} className="rounded border border-[#63451f] bg-[#26190f] px-1.5 py-0.5 text-[10px] text-amber-400">{modifier.value} {modifier.label}</span>)}</div>}
  </>;
}
