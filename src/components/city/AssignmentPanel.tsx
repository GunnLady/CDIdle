import type { CityDashboardView, CityJobId } from "../../domain/cityPresentation";
import Panel from "../../ui/components/Panel";
import AssignmentJobCard from "./AssignmentJobCard";
import PopulationSummaryBar from "./PopulationSummaryBar";

export default function AssignmentPanel({ view, canMutate, onAllocate }: { view: CityDashboardView; canMutate: boolean; onAllocate: (role: CityJobId, amount: number) => void }) {
  return <Panel title="Affectations" subtitle="Citoyens libres et répartition des rôles de production." testId="assignment-panel" className="order-3" contentClassName="space-y-4">
    <PopulationSummaryBar
      available={view.unassignedCitizens}
      total={view.totalCitizens}
      capacity={view.maxCitizens}
      immigrationProgress={view.citizenGrowthProgress}
    />
    <div className="grid min-w-0 gap-3 lg:grid-cols-2">{view.jobs.map((job) => <div key={job.id} className="contents"><AssignmentJobCard job={job} canMutate={canMutate} onAllocate={(amount) => onAllocate(job.id, amount)} testId={`assignment-${job.id}`} /></div>)}</div>
  </Panel>;
}
