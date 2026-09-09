import type { SelectedHeroView } from "../../domain/heroPresentation";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import Progress from "../../ui/components/Progress";
import Button from "../../ui/primitives/Button";
import HeroPortrait from "../HeroPortrait";
import HeroDetailFrame from "./HeroDetailFrame";

export default function SelectedHeroPanel({ view, canMutate, mutationBlockReason, onDismissHero }: {
  view: SelectedHeroView | null;
  canMutate: boolean;
  mutationBlockReason?: string;
  onDismissHero: (heroId: string) => void;
}) {
  if (!view) return <Panel title="Héros sélectionné" testId="selected-hero-panel" typography="large" className="xl:min-h-0" contentClassName="xl:min-h-0"><EmptySlot className="min-h-32">Recrutez un aventurier pour consulter sa fiche.</EmptySlot></Panel>;

  return <Panel title="Héros sélectionné" subtitle={view.statusLabel} testId="selected-hero-panel" typography="large" className="flex h-full min-h-0 flex-col" contentClassName="flex min-h-0 flex-1 flex-col pb-14">
    <div className="flex flex-col items-center gap-3 border-b border-[#3c291a] pb-4 text-center">
      <HeroPortrait hero={view.portrait} size="xl" noBorder noBg noPadding />
      <div><h4 className="font-serif text-[19px] font-bold text-[#f3e5ca]">{view.name}</h4><p className="text-[11px] uppercase tracking-wider text-[#caa050]">{view.identityLabel}</p></div>
      <div className="grid w-full grid-cols-2 gap-2 text-[11px] font-mono"><span className="rounded border border-emerald-900/50 bg-emerald-950/20 p-2 text-emerald-400">PV {view.currentHp}/{view.maxHp}</span><span className="rounded border border-sky-900/50 bg-sky-950/20 p-2 text-sky-400">PM {view.currentMana}/{view.maxMana}</span></div>
      {view.isMaxLevel
        ? <p className="w-full rounded border border-amber-900/50 bg-amber-950/20 p-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">Niveau maximum</p>
        : <Progress label="Expérience" value={view.xp} max={view.xpNeeded} variant="immigration" className="w-full" labelClassName="text-[13px]" />}
    </div>

    <div className="mt-4">
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#ae8650]">Attributs</h4>
      <div className="grid grid-cols-7 gap-2">{view.attributes.map((attribute) => <div key={attribute.key} title={attribute.name}><HeroDetailFrame compact className={`text-center ${attribute.isPrimary ? "text-amber-300" : "text-[#dfdbc7]"}`}><span className="block text-[9px] text-[#8f7a67]">{attribute.short}</span><strong className="font-mono text-[13px]">{attribute.value}</strong></HeroDetailFrame></div>)}</div>
    </div>

    <div className="mt-4">
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#ae8650]">Synthèse de combat</h4>
      <dl className="grid grid-cols-2 gap-2">{view.combatStats.map(({ label, value }) => <div key={label}><HeroDetailFrame compact><div className="flex items-center justify-between gap-3 text-[11px]"><dt className="text-left text-[#9f8872]">{label}</dt><dd className="shrink-0 text-right font-mono text-xs font-bold text-[#dfdbc7]">{value}</dd></div></HeroDetailFrame></div>)}</dl>
    </div>

    {view.descriptions.length > 0 && <div className="mt-4 space-y-2 text-[11px] leading-relaxed text-[#9f8872]">{view.descriptions.map((description) => <p key={description.label}><strong className="text-[#caa050]">{description.label} :</strong> {description.description}</p>)}</div>}
    {view.resistances.length > 0 && <div className="mt-4">
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#ae8650]">Résistances</h4>
      <dl className="grid grid-cols-2 gap-2">{view.resistances.map(({ name, value }) => <div key={name}><HeroDetailFrame compact><div className="flex items-center justify-between gap-3 text-[11px]"><dt className="text-left capitalize text-[#9f8872]">{name}</dt><dd className="shrink-0 text-right font-mono text-xs font-bold text-[#dfdbc7]">{value}</dd></div></HeroDetailFrame></div>)}</dl>
    </div>}
    {mutationBlockReason && <p role="status" className="mt-4 rounded border border-amber-800/50 bg-amber-950/30 p-2 text-center text-[11px] font-semibold text-amber-300">{mutationBlockReason}</p>}
    <div className="absolute bottom-0 left-0 z-10"><Button type="button" size="sm" variant="danger" disabled={!canMutate} onClick={() => onDismissHero(view.id)}>Congédier définitivement</Button></div>
  </Panel>;
}
