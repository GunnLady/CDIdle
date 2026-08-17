import { Minus, Plus } from "lucide-react";
import type { CityDashboardView, CityJobId } from "../../domain/cityPresentation";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Progress from "../../ui/components/Progress";
import IconButton from "../../ui/primitives/IconButton";
import { CityIcon } from "./cityIcons";

const jobIcons: Record<CityJobId, string> = { farmers: "Grape", woodcutters: "Trees", quarrymen: "Hammer", miners: "Pickaxe" };

export default function AssignmentPanel({ view, canMutate, onAllocate }: { view: CityDashboardView; canMutate: boolean; onAllocate: (role: CityJobId, amount: number) => void }) {
  return <Panel title="Affectations" subtitle="Citoyens libres et répartition des rôles de production." testId="assignment-panel" className="order-3" contentClassName="space-y-4">
    <Progress
      label={`Immigration · ${view.totalCitizens}/${view.maxCitizens}`}
      value={view.totalCitizens >= view.maxCitizens ? 0 : view.citizenGrowthProgress}
      showValue={false}
      variant="immigration"
    />
    {view.unassignedCitizens > 0 && <Alert variant="warning" live="polite">⚠️ {view.unassignedCitizens} citoyen(s) disponible(s)</Alert>}
    <div className="grid gap-3 xl:grid-cols-2">{view.jobs.map((job) => <div key={job.id} className="flex items-center justify-between gap-4 rounded-lg border border-ui-border bg-ui-surface p-3"><div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ui-panel-strong"><CityIcon name={jobIcons[job.id]} /></div><div><h4 className="font-serif text-xs font-bold text-ui-text">{job.label}</h4><span className="font-mono text-[9.5px] text-ui-text-muted">{job.buildingLabel} Niv. {job.buildingLevel}</span></div></div><div className="flex items-center gap-2.5 font-mono"><IconButton type="button" size="sm" label={`Retirer un ${job.label}`} onClick={() => onAllocate(job.id, -1)} disabled={!canMutate || !job.canRemove}><Minus className="h-3.5 w-3.5" /></IconButton><span className="w-6 text-center text-sm font-bold">{job.count}</span><IconButton type="button" size="sm" label={`Ajouter un ${job.label}`} onClick={() => onAllocate(job.id, 1)} disabled={!canMutate || !job.canAdd}><Plus className="h-3.5 w-3.5" /></IconButton></div></div>)}</div>
  </Panel>;
}
