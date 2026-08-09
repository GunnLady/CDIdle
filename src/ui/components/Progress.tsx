import { classNames } from "../classNames";

export type ProgressProps = {
  label: string;
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
  size?: "compact" | "default";
  tone?: "accent" | "health" | "mana" | "experience";
};

const toneClasses = {
  accent: "accent-ui-accent",
  health: "accent-ui-success",
  mana: "accent-ui-info",
  experience: "accent-ui-warning",
};

export default function Progress({ label, value, max = 100, className, showValue = true, size = "default", tone = "accent" }: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  return (
    <label className={classNames("grid text-ui-text", size === "compact" ? "gap-1 text-xs" : "gap-1.5 text-sm", className)}>
      <span className="flex justify-between gap-3"><span>{label}</span>{showValue && <span className="font-mono text-ui-text-muted">{safeValue}/{safeMax}</span>}</span>
      <progress aria-label={label} className={classNames("w-full", size === "compact" ? "h-1" : "h-2", toneClasses[tone])} value={safeValue} max={safeMax}>{safeValue}/{safeMax}</progress>
    </label>
  );
}
