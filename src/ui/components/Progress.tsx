import { classNames } from "../classNames";

export type ProgressProps = {
  label: string;
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
};

export default function Progress({ label, value, max = 100, className, showValue = true }: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  return (
    <label className={classNames("grid gap-1.5 text-sm text-ui-text", className)}>
      <span className="flex justify-between gap-3"><span>{label}</span>{showValue && <span className="font-mono text-ui-text-muted">{safeValue}/{safeMax}</span>}</span>
      <progress aria-label={label} className="h-2 w-full accent-ui-accent" value={safeValue} max={safeMax}>{safeValue}/{safeMax}</progress>
    </label>
  );
}
