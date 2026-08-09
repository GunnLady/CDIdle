import { classNames } from "../classNames";

export type RoomStep = { id: string; label: string; state: "completed" | "current" | "upcoming"; boss?: boolean };

export default function RoomProgress({ label, steps }: { label: string; steps: RoomStep[] }) {
  return (
    <ol aria-label={label} className="flex flex-wrap gap-2">
      {steps.map((step) => <li key={step.id} aria-current={step.state === "current" ? "step" : undefined} className={classNames(
        "flex h-8 min-w-8 items-center justify-center rounded-ui-control border px-2 font-mono text-xs",
        step.state === "current" ? "border-ui-danger bg-ui-danger-surface text-ui-danger-text" : step.state === "completed" ? "border-ui-success-border bg-ui-success-surface text-ui-success-text" : "border-ui-border-subtle bg-ui-surface text-ui-text-disabled",
      )} title={step.boss ? "Salle du boss" : step.label}>{step.boss ? "☠" : step.label}</li>)}
    </ol>
  );
}
