import type { ReactNode } from "react";
import Disclosure from "../components/Disclosure";
import EmptySlot from "../components/EmptySlot";

export type ActivityLogEntry = { id: string; timestamp?: string; content: ReactNode; tone?: "default" | "success" | "danger" };

const toneClasses = { default: "border-ui-border-subtle", success: "border-ui-success-border", danger: "border-ui-danger-border" };

export default function ActivityLog(props: { title: string; subtitle?: string; entries: ActivityLogEntry[]; emptyMessage: string; action?: ReactNode; testId?: string }) {
  return (
    <Disclosure title={props.title} subtitle={props.subtitle} defaultOpen testId={props.testId}>
      {props.action && <div className="mb-3 flex justify-end">{props.action}</div>}
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {props.entries.map((entry) => <article key={entry.id} className={`rounded-ui-control border-l-4 bg-ui-surface p-3 text-sm text-ui-text-muted ${toneClasses[entry.tone ?? "default"]}`}>{entry.timestamp && <span className="mr-2 font-mono text-xs text-ui-text-disabled">[{entry.timestamp}]</span>}{entry.content}</article>)}
        {props.entries.length === 0 && <EmptySlot>{props.emptyMessage}</EmptySlot>}
      </div>
    </Disclosure>
  );
}
