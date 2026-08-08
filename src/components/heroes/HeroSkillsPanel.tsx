import type { HeroSkillsView, HeroSkillView } from "../../domain/heroSkillPresentation";
import HeroPanelFrame from "./HeroPanelFrame";

function SkillList({ skills, emptyLabel }: { skills: HeroSkillView[]; emptyLabel: string }) {
  if (skills.length === 0) return <p className="rounded border border-dashed border-[#3a281a] p-3 text-center text-[10px] text-[#8f7a67]">{emptyLabel}</p>;
  return <div className="space-y-2">{skills.map((skill) => <details key={skill.id} className="group rounded-lg border border-[#3a281a] bg-[#120b07]">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]"><strong className="font-serif text-xs text-[#eadabc]">{skill.name}</strong><span className="flex items-center gap-2 text-[9px] text-sky-400"><span>{skill.resourceLabel}</span><span className="text-[#8f7a67] group-open:rotate-180">⌄</span></span></summary>
    <div className="border-t border-[#3a281a] px-3 pb-3 pt-2"><p className="text-[10px] leading-relaxed text-[#9f8872]">{skill.description}</p>
      {skill.targetLabel && <p className="mt-1 text-[9px] text-purple-400">Cible : {skill.targetLabel}</p>}
      <p className="mt-2 rounded bg-[#21150d] p-2 text-[9px] text-[#d9a875]">{skill.effectSummary}</p>
    </div>
  </details>)}</div>;
}

export default function HeroSkillsPanel({ view }: { view: HeroSkillsView | null }) {
  return <HeroPanelFrame title="Compétences" subtitle={view?.heroName} testId="hero-skills-panel" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
    {!view ? <p className="text-center text-xs text-[#8f7a67]">Aucun héros sélectionné.</p> : <div className="space-y-4">
      <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-400">Actives</h4><SkillList skills={view.active} emptyLabel="Aucune compétence active" /></div>
      <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Passives</h4><SkillList skills={view.passive} emptyLabel="Aucune compétence passive" /></div>
    </div>}
  </HeroPanelFrame>;
}
