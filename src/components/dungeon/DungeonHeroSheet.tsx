import { Shield, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import type { HeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import type { SelectedHeroView } from "../../domain/heroPresentation";
import type { HeroSkillsView, HeroSkillView } from "../../domain/heroSkillPresentation";
import Card from "../../ui/components/Card";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import NavigationTabs from "../../ui/patterns/NavigationTabs";
import EquipmentItemDetails from "../heroes/EquipmentItemDetails";
import HeroPortrait from "../HeroPortrait";

type SheetTab = "profile" | "skills" | "equipment";

function SkillList({ title, skills }: { title: string; skills: HeroSkillView[] }) {
  return <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">{title}</h4>
    {skills.length === 0 ? <EmptySlot className="text-[9px]">Aucune compétence</EmptySlot> : <div className="grid gap-2 sm:grid-cols-2">{skills.map((skill) => <Card key={skill.id} className="p-2">
      <div className="flex items-start justify-between gap-2"><strong className="font-serif text-xs text-[#eadabc]">{skill.name}</strong><span className="shrink-0 text-[9px] text-purple-400">{skill.resourceLabel}</span></div>
      <p className="mt-1 text-[9px] leading-relaxed text-[#9f8872]">{skill.description}</p>
      {skill.targetLabel && <p className="mt-1 text-[9px] text-purple-400">Cible : {skill.targetLabel}</p>}
      <p className="mt-2 rounded bg-[#21150d] p-2 text-[9px] text-[#d9a875]">{skill.effectSummary}</p>
    </Card>)}</div>}
  </section>;
}

export default function DungeonHeroSheet({ hero, equipment, skills }: { hero: SelectedHeroView | null; equipment: HeroEquipmentView | null; skills: HeroSkillsView | null }) {
  const [tab, setTab] = useState<SheetTab>("profile");
  return <Panel title="Fiche du héros" subtitle={hero ? `${hero.name} · Lv ${hero.level}` : "Aucun héros sélectionné"} testId="dungeon-hero-sheet" variant="strong" className="h-full min-w-0">
    {!hero ? <EmptySlot className="min-h-64">Sélectionnez un héros.</EmptySlot> : <>
      <div className="mb-3 flex items-center gap-3"><HeroPortrait hero={hero.portrait} size="lg" noBorder noBg noPadding /><div className="min-w-0 flex-1"><p className="mb-2 text-[10px] uppercase tracking-wider text-[#caa050]">{hero.statusLabel}</p><div className="flex flex-wrap gap-1.5 text-[9px]"><span className="rounded bg-[#1c1109] px-2 py-1 text-emerald-400">PV <strong>{hero.currentHp}/{hero.maxHp}</strong></span><span className="rounded bg-[#1c1109] px-2 py-1 text-sky-400">PM <strong>{hero.currentMana}/{hero.maxMana}</strong></span><span className="rounded bg-[#1c1109] px-2 py-1 text-amber-400">XP <strong>{hero.xp}/{hero.xpNeeded}</strong></span></div></div></div>
      <NavigationTabs label="Sections de la fiche héros" items={[
        { id: "profile", label: "Profil", icon: <UserRound className="h-4 w-4" /> },
        { id: "skills", label: "Compétences", icon: <Sparkles className="h-4 w-4" /> },
        { id: "equipment", label: "Équipement", icon: <Shield className="h-4 w-4" /> },
      ]} activeId={tab} onChange={setTab} className="mb-3" />

      {tab === "profile" && <div data-testid="dungeon-hero-profile" className="space-y-3">
        <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Caractéristiques</h4><div className="grid grid-cols-4 gap-1.5 text-[9px] sm:grid-cols-7">{hero.attributes.map((stat) => <span key={stat.key} title={stat.name} className={`rounded border px-2 py-1.5 text-center ${stat.isPrimary ? "border-[#8a642c] bg-[#2a1b0e] text-amber-300" : "border-[#342317] bg-[#1c1109] text-[#9f8872]"}`}><span className="block text-[8px]">{stat.short}</span><strong className="text-[#dfdbc7]">{stat.value}</strong></span>)}</div></section>
        <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Combat</h4><dl className="grid grid-cols-2 gap-1.5 text-[9px] sm:grid-cols-4">{hero.combatStats.map((stat) => <div key={stat.label} className="rounded bg-[#1c1109] px-2 py-1.5"><dt className="text-[#9f8872]">{stat.label}</dt><dd className="font-bold text-[#dfdbc7]">{stat.value}</dd></div>)}</dl></section>
        {hero.resistances.length > 0 && <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Résistances</h4><div className="flex flex-wrap gap-1.5 text-[9px]">{hero.resistances.map((value) => <span key={value.name} className="rounded border border-[#342317] px-2 py-1 text-[#9f8872]">{value.name} <strong className="text-[#dfdbc7]">{value.value}</strong></span>)}</div></section>}
        {hero.descriptions.length > 0 && <div className="space-y-1 text-[9px] leading-relaxed text-[#9f8872]">{hero.descriptions.map((value) => <p key={value.label}><strong className="text-[#caa050]">{value.label} :</strong> {value.description}</p>)}</div>}
      </div>}
      {tab === "skills" && <div data-testid="dungeon-hero-skills" className="space-y-3"><SkillList title="Actives" skills={skills?.active ?? []} /><SkillList title="Passives" skills={skills?.passive ?? []} /></div>}
      {tab === "equipment" && <div data-testid="dungeon-hero-equipment">{equipment ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{equipment.slots.map((slot) => <div key={slot.key} className="rounded border border-[#342317] p-2"><span className="text-[8px] uppercase tracking-wider text-[#8f7a67]">{slot.icon} {slot.label}</span>{slot.item ? <div className="mt-1"><EquipmentItemDetails item={slot.item} showDescription /></div> : <p className="mt-1 text-[9px] italic text-[#756353]">Emplacement vide</p>}</div>)}</div> : <EmptySlot>Aucun équipement disponible.</EmptySlot>}</div>}
    </>}
  </Panel>;
}
