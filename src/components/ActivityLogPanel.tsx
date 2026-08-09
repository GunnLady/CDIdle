import { RotateCcw } from "lucide-react";
import type { BattleLogEntry } from "../types";
import ActivityLog from "../ui/patterns/ActivityLog";
import Button from "../ui/primitives/Button";

export interface ActivityLogPanelProps {
  title: string;
  subtitle: string;
  testId: string;
  entries: BattleLogEntry[];
  emptyMessage: string;
  onClear?: () => void;
}

export default function ActivityLogPanel(props: ActivityLogPanelProps) {
  return <ActivityLog
    testId={props.testId}
    title={props.title}
    subtitle={props.subtitle}
    entries={props.entries.map((entry) => ({ id: entry.id, timestamp: entry.timestamp, content: entry.message }))}
    emptyMessage={props.emptyMessage}
    action={props.onClear && <Button type="button" size="sm" onClick={props.onClear}><RotateCcw className="h-3 w-3" />Effacer les notes</Button>}
  />;
}
