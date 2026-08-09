import type { SelectedHeroView } from "../../domain/heroPresentation";
import Disclosure from "../../ui/components/Disclosure";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import Progress from "../../ui/components/Progress";
import Button from "../../ui/primitives/Button";
import HeroPortrait from "../HeroPortrait";

export default function SelectedHeroPanel({ view, canMutate, onDismissHero }: {
  view: SelectedHeroView | null;
  canMutate: boolean;
  onDismissHero: (heroId: string) => void;
}) {
  if (!view) return <Panel title="Héros sélectionné" testId="selected-hero-panel" className="xl:min-h-0" contentClassName="xl:min-h-0"><EmptySlot className="min-h-32">Recrutez un aventurier pour consulter sa fiche.</EmptySlot></Panel>;

  return <Panel title="Héros sélectionné" subtitle={view.statusLabel} testId="selected-hero-panel" className="xl:min-h-0" contentClassName="xl:min-h-0">
    <div className="flex flex-col items-center gap-3 border-b border-[#3c291a] pb-4 text-center">
      <HeroPortrait hero={view.portrait} size="lg" noBorder noBg noPadding />
      <div><h4 className="font-serif text-lg font-bold text-[#f3e5ca]">{view.name}</h4><p className="text-[10px] uppercase tracking-wider text-[#caa050]">{view.identityLabel}</p></div>
      <div className="grid w-full grid-cols-2 gap-2 text-[10px] font-mono"><span className="rounded border border-emerald-900/50 bg-emerald-950/20 p-2 text-emerald-400">PV {view.currentHp}/{view.maxHp}</span><span className="rounded border border-sky-900/50 bg-sky-950/20 p-2 text-sky-400">PM {view.currentMana}/{view.maxMana}</span></div>
      <Progress label="Expérience" value={view.xp} max={view.xpNeeded} className="w-full text-xs" />
    </div>

    <div className="mt-4">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#ae8650]">Attributs</h4>
      <div className="grid grid-cols-7 gap-1">{view.attributes.map((attribute) => <div key={attribute.key} title={attribute.name} className={`rounded border p-1.5 text-center ${attribute.isPrimary ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-[#3a281a] bg-[#120b07] text-[#dfdbc7]"}`}><span className="block text-[8px] text-[#8f7a67]">{attribute.short}</span><strong className="font-mono text-xs">{attribute.value}</strong></div>)}</div>
    </div>

    <div className="mt-4">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#ae8650]">Synthèse de combat</h4>
      <dl className="grid grid-cols-2 gap-2 text-[10px]">{view.combatStats.map(({ label, value }) => <div key={label} className="rounded border border-[#342317] bg-[#110a06] p-2"><dt className="text-[#8f7a67]">{label}</dt><dd className="mt-1 font-mono font-bold text-[#dfdbc7]">{value}</dd></div>)}</dl>
    </div>

    {view.descriptions.length > 0 && <div className="mt-4 space-y-2 text-[10px] leading-relaxed text-[#9f8872]">{view.descriptions.map((description) => <p key={description.label}><strong className="text-[#caa050]">{description.label} :</strong> {description.description}</p>)}</div>}
    {view.resistances.length > 0 && <Disclosure title="Résistances particulières" className="mt-4"><div className="grid grid-cols-2 gap-1">{view.resistances.map(({ name, value }) => <span key={name} className="rounded bg-[#110a06] p-2 text-[9px] text-[#9f8872]">{name} : <strong className="text-[#dfdbc7]">{value}</strong></span>)}</div></Disclosure>}
    <Button type="button" variant="danger" block disabled={!canMutate} onClick={() => onDismissHero(view.id)} className="mt-4">Congédier définitivement</Button>
  </Panel>;
}
