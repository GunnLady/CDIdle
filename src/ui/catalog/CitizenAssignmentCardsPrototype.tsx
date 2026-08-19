import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import farmCard from "../../assets/images/ui/assignment-production-farm-v4.png";
import mineCard from "../../assets/images/ui/assignment-production-mine-v4.png";
import quarryCard from "../../assets/images/ui/assignment-production-quarry-v4.png";
import woodcuttersCard from "../../assets/images/ui/assignment-production-woodcutters-v4.png";
import IconButton from "../primitives/IconButton";
import PopulationSummaryBar from "../../components/city/PopulationSummaryBar";

type PrototypeJob = {
  id: "farmers" | "woodcutters" | "quarrymen" | "miners";
  building: string;
  buildingLevel: number;
  profession: string;
  resource: string;
  card: string;
  count: number;
};

const initialJobs: PrototypeJob[] = [
  { id: "farmers", building: "Ferme", buildingLevel: 3, profession: "Fermiers", resource: "Nourriture", card: farmCard, count: 3 },
  { id: "woodcutters", building: "Maison de bûcheron", buildingLevel: 2, profession: "Bûcherons", resource: "Bois", card: woodcuttersCard, count: 2 },
  { id: "quarrymen", building: "Carrière", buildingLevel: 1, profession: "Tailleurs de pierre", resource: "Pierre", card: quarryCard, count: 1 },
  { id: "miners", building: "Mine", buildingLevel: 0, profession: "Mineurs", resource: "Minerai", card: mineCard, count: 0 },
];

export default function CitizenAssignmentCardsPrototype() {
  const [available, setAvailable] = useState(2);
  const [jobs, setJobs] = useState(initialJobs);
  const total = available + jobs.reduce((sum, job) => sum + job.count, 0);
  const capacity = 12;

  const allocate = (id: PrototypeJob["id"], amount: -1 | 1) => {
    const job = jobs.find((candidate) => candidate.id === id);
    if (!job || job.buildingLevel === 0 || (amount === 1 && available === 0) || (amount === -1 && job.count === 0)) return;
    setAvailable((current) => current - amount);
    setJobs((current) => current.map((candidate) => candidate.id === id ? { ...candidate, count: candidate.count + amount } : candidate));
  };

  return <div className="grid min-w-0 gap-4">
    <PopulationSummaryBar available={available} total={total} capacity={capacity} immigrationProgress={62} className="mx-3 mt-3 sm:mx-5 sm:mt-5" />

    <div className="grid min-w-0 gap-3 lg:grid-cols-2">
      {jobs.map((job) => {
        const production = job.buildingLevel > 0 ? `+${job.count * job.buildingLevel} ${job.resource}/s` : "Bâtiment non construit";
        return <article key={job.id} data-testid={`catalog-assignment-${job.id}`} className="relative min-h-[150px] overflow-hidden">
          <img src={job.card} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
          <div className="relative z-10 grid min-h-[150px] grid-cols-[23%_49%_28%] items-center py-[8%]">
            <div aria-hidden="true" />
            <div className="min-w-0 px-4">
              <h3 className="font-serif text-sm font-bold leading-tight text-[#efe0bf]">{job.building}</h3>
              <p className="mt-1 font-mono text-[8.5px] uppercase tracking-wider text-[#bda77f]">{job.profession} · Niv. {job.buildingLevel}</p>
              <p className="mt-2 font-mono text-[10px] font-bold text-[#f0d58d]">{production}</p>
            </div>
            <div className="flex min-w-0 -translate-x-[6px] translate-y-[3px] flex-col items-center justify-center px-2 font-mono text-[#efe0bf]">
              <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#a99063]">Affectés</span>
              <strong className="my-1 text-xl leading-none">{job.count}</strong>
              <div className="flex items-center justify-center gap-1">
                <IconButton type="button" size="sm" className="scale-[0.9025]" label={`Retirer un ${job.profession}`} onClick={() => allocate(job.id, -1)} disabled={job.count === 0}><Minus className="h-3.5 w-3.5" /></IconButton>
                <IconButton type="button" size="sm" className="scale-[0.9025]" label={`Ajouter un ${job.profession}`} onClick={() => allocate(job.id, 1)} disabled={available === 0 || job.buildingLevel === 0}><Plus className="h-3.5 w-3.5" /></IconButton>
              </div>
            </div>
          </div>
        </article>;
      })}
    </div>
  </div>;
}
