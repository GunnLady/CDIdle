import type { EquipmentItemView } from "../../domain/heroEquipmentPresentation";

const rarityClass = (rarity?: string) => ({ legendary: "text-amber-400", epic: "text-purple-400", rare: "text-blue-400", uncommon: "text-emerald-400" } as Record<string, string>)[rarity ?? ""] ?? "text-gray-400";

export default function EquipmentItemDetails({ item, showDescription = false }: { item: EquipmentItemView; showDescription?: boolean }) {
  return <>
    <strong className="font-serif text-xs text-[#eadabc]">{item.name}</strong>
    {item.rarity && <span className={`ml-2 text-[9px] uppercase ${rarityClass(item.rarity)}`}>{item.rarity}</span>}
    {showDescription && item.description && <p className="mt-1 text-[10px] leading-relaxed text-[#8f7a67]">{item.description}</p>}
    {item.facts.length > 0 && <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-[#9f8872]">{item.facts.map((fact, index) => <span key={`${fact}-${index}`}>{index > 0 ? "· " : ""}{fact}</span>)}</div>}
    {item.modifiers.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{item.modifiers.map((modifier) => <span key={modifier.id} className="rounded border border-[#63451f] bg-[#26190f] px-1.5 py-0.5 text-[9px] text-amber-400">{modifier.label}</span>)}</div>}
  </>;
}
