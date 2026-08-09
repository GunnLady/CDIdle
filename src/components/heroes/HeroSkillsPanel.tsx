import type { HeroSkillsView, HeroSkillView } from "../../domain/heroSkillPresentation";
import Disclosure from "../../ui/components/Disclosure";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";

function SkillList({ skills, emptyLabel }: { skills: HeroSkillView[]; emptyLabel: string }) {
  if (skills.length === 0) return <EmptySlot className="text-[10px]">{emptyLabel}</EmptySlot>;
  return <div className="space-y-2">{skills.map((skill) => <div key={skill.id}><Disclosure title={skill.name} subtitle={skill.resourceLabel}>
    <div><p className="text-[10px] leading-relaxed text-[#9f8872]">{skill.description}</p>
      {skill.targetLabel && <p className="mt-1 text-[9px] text-purple-400">Cible : {skill.targetLabel}</p>}
      <p className="mt-2 rounded bg-[#21150d] p-2 text-[9px] text-[#d9a875]">{skill.effectSummary}</p>
    </div>
  </Disclosure></div>)}</div>;
}

export default function HeroSkillsPanel({ view }: { view: HeroSkillsView | null }) {
  return <Panel title="Compétences" subtitle={view?.heroName} testId="hero-skills-panel" className="xl:flex xl:min-h-64 xl:flex-1 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
    {!view ? <p className="text-center text-xs text-[#8f7a67]">Aucun héros sélectionné.</p> : <div className="space-y-4">
      <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-400">Actives</h4><SkillList skills={view.active} emptyLabel="Aucune compétence active" /></div>
      <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Passives</h4><SkillList skills={view.passive} emptyLabel="Aucune compétence passive" /></div>
    </div>}
  </Panel>;
}
