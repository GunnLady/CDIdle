import populationSummaryBar from "../../assets/images/ui/population-summary-frame-v12.png";
import Progress from "../../ui/components/Progress";
import { classNames } from "../../ui/classNames";

type PopulationSummaryBarProps = {
  available: number;
  total: number;
  capacity: number;
  immigrationProgress: number;
  className?: string;
};

export default function PopulationSummaryBar({ available, total, capacity, immigrationProgress, className }: PopulationSummaryBarProps) {
  return <div data-testid="population-summary-bar" className={classNames("relative overflow-hidden", className)}>
    <img src={populationSummaryBar} alt="" className="block h-auto w-full" />
    <div className="absolute left-[2.5%] top-[13%] grid h-[74%] w-[19.9%] min-w-0 translate-y-[3px] grid-rows-[11px_20px] content-center items-center gap-1 text-center text-[#e9dcc2]">
      <span className="font-mono text-[9px] font-bold leading-none uppercase tracking-[0.14em] text-[#bda36e]">Disponibles</span>
      <strong role="status" aria-live="polite" className="font-serif text-xl leading-none text-[#f0d58d]"><span className="sr-only">{available} citoyen{available > 1 ? "s" : ""} disponible{available > 1 ? "s" : ""}</span><span aria-hidden="true">{available}</span></strong>
    </div>
    <div className="absolute left-[24.2%] top-[13%] grid h-[74%] w-[19.6%] min-w-0 translate-y-[3px] grid-rows-[11px_20px] content-center items-center gap-1 text-center text-[#e9dcc2]">
      <span className="font-mono text-[9px] font-bold leading-none uppercase tracking-[0.14em] text-[#bda36e]">Population</span>
      <strong className="font-serif text-xl leading-none text-[#f0d58d]">{capacity}</strong>
    </div>
    <div className="absolute left-[49%] right-[5%] top-1/2 -translate-y-1/2">
      <Progress label="Immigration" value={total >= capacity ? 0 : immigrationProgress} variant="immigration" className="ui-immigration-progress-compact [&>span:first-child]:text-[9px]" />
    </div>
  </div>;
}
