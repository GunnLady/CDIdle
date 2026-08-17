import { classNames } from "../classNames";

export type ProgressProps = {
  label: string;
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
  size?: "compact" | "default";
  tone?: "accent" | "health" | "mana" | "experience";
  variant?: "default" | "immigration";
};

const toneClasses = {
  accent: "accent-ui-accent",
  health: "accent-ui-success",
  mana: "accent-ui-info",
  experience: "accent-ui-warning",
};

export default function Progress({ label, value, max = 100, className, showValue = true, size = "default", tone = "accent", variant = "default" }: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const progress = <progress
    aria-label={label}
    className={classNames("w-full", variant === "immigration" ? "ui-immigration-progress" : size === "compact" ? "h-1" : "h-2", toneClasses[tone])}
    value={safeValue}
    max={safeMax}
  >{safeValue}/{safeMax}</progress>;
  return (
    <label className={classNames("grid text-ui-text", variant === "immigration" ? "gap-2" : size === "compact" ? "gap-1 text-xs" : "gap-1.5 text-sm", className)} data-progress-variant={variant}>
      <span className={classNames("flex justify-between gap-3", variant === "immigration" && "font-serif text-xs font-bold uppercase tracking-[0.14em] text-[#d9bd7a]")}><span>{label}</span>{showValue && <span className={classNames("font-mono", variant === "immigration" ? "text-[#b89b61]" : "text-ui-text-muted")}>{safeValue}/{safeMax}</span>}</span>
      {variant === "immigration" ? <span className="ui-immigration-progress-shell">{progress}</span> : progress}
    </label>
  );
}
