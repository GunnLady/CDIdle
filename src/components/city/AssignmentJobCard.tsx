import { Minus, Plus } from "lucide-react";
import farmCard from "../../assets/images/ui/assignment-production-farm-v4.png";
import mineCard from "../../assets/images/ui/assignment-production-mine-v4.png";
import quarryCard from "../../assets/images/ui/assignment-production-quarry-v4.png";
import woodcuttersCard from "../../assets/images/ui/assignment-production-woodcutters-v4.png";
import type { CityJobId, CityJobView } from "../../domain/cityPresentation";
import IconButton from "../../ui/primitives/IconButton";

const jobCards: Record<CityJobId, string> = {
  farmers: farmCard,
  woodcutters: woodcuttersCard,
  quarrymen: quarryCard,
  miners: mineCard,
};

type AssignmentJobCardProps = {
  job: CityJobView;
  canMutate: boolean;
  onAllocate: (amount: -1 | 1) => void;
  testId?: string;
};

export default function AssignmentJobCard({ job, canMutate, onAllocate, testId }: AssignmentJobCardProps) {
  return <article data-testid={testId} className="relative min-h-[150px] overflow-hidden">
    <img src={jobCards[job.id]} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
    <div className="relative z-10 grid min-h-[150px] grid-cols-[23%_49%_28%] items-center py-[8%]">
      <div aria-hidden="true" />
      <div className="min-w-0 px-4">
        <h3 className="font-serif text-sm font-bold leading-tight text-[#efe0bf]">{job.buildingLabel}</h3>
        <p className="mt-1 font-mono text-[8.5px] uppercase tracking-wider text-[#bda77f]">{job.label} · Niv. {job.buildingLevel}</p>
        <p className="mt-2 font-mono text-[10px] font-bold text-[#f0d58d]">{job.productionLabel}</p>
      </div>
      <div className="flex min-w-0 -translate-x-[6px] translate-y-[3px] flex-col items-center justify-center px-2 font-mono text-[#efe0bf]">
        <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#a99063]">Affectés</span>
        <strong className="my-1 text-xl leading-none">{job.count}</strong>
        <div className="flex items-center justify-center gap-1">
          <IconButton type="button" size="sm" className="scale-[0.9025]" label={`Retirer un ${job.label}`} onClick={() => onAllocate(-1)} disabled={!canMutate || !job.canRemove}><Minus className="h-3.5 w-3.5" /></IconButton>
          <IconButton type="button" size="sm" className="scale-[0.9025]" label={`Ajouter un ${job.label}`} onClick={() => onAllocate(1)} disabled={!canMutate || !job.canAdd}><Plus className="h-3.5 w-3.5" /></IconButton>
        </div>
      </div>
    </div>
  </article>;
}
