import type { ReactNode } from "react";
import { classNames } from "../classNames";

export type MetricProps = { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; className?: string };

export default function Metric({ label, value, detail, icon, className }: MetricProps) {
  return (
    <div className={classNames("flex min-w-0 items-center gap-3 rounded-ui-control border border-ui-border-subtle bg-ui-surface p-3", className)}>
      {icon && <span aria-hidden="true" className="shrink-0 text-ui-accent">{icon}</span>}
      <dl className="min-w-0"><dt className="text-xs text-ui-text-muted">{label}</dt><dd className="font-mono font-bold text-ui-text">{value}</dd>{detail && <dd className="text-xs text-ui-text-muted">{detail}</dd>}</dl>
    </div>
  );
}
