import { RotateCcw } from "lucide-react";
import type { DungeonHistoryView } from "../../domain/dungeonPresentation";
import ActivityLog from "../../ui/patterns/ActivityLog";
import Button from "../../ui/primitives/Button";

export default function DungeonHistoryPanel(props: {
  view: DungeonHistoryView;
  onClearBattleLogs: () => void;
}) {
  const entries = [
    ...props.view.encounters.map((encounter) => ({
      id: `encounter-${encounter.encounterId}`,
      tone: encounter.state === "victory" ? "success" as const : encounter.state === "defeat" ? "danger" as const : "default" as const,
      content: <div>
        <div className="flex justify-between gap-2"><div><h4 className="font-serif text-[11px] font-bold text-ui-text">{encounter.title}</h4><p className="text-[9px] text-ui-text-muted">{encounter.location}</p></div><span className="text-[9px] uppercase text-ui-accent">{encounter.statusLabel}</span></div>
        <div className="mt-2 space-y-1">{encounter.transcript.length === 0 ? <p className="text-[10px] italic text-ui-text-disabled">La rencontre commence…</p> : [...encounter.transcript].reverse().map((event) => <p key={event.id} className="text-[10px] text-ui-text-muted">{event.message}</p>)}</div>
        {encounter.result && <p className="mt-2 text-[10px] font-bold text-ui-accent">{encounter.result}</p>}
      </div>,
    })),
    ...props.view.notes.map((note) => ({ id: `note-${note.id}`, timestamp: note.timestamp, content: note.message })),
  ];

  return <ActivityLog
    testId="dungeon-history-panel"
    title="Historique"
    subtitle="Rencontres canoniques et notes locales"
    entries={entries}
    emptyMessage={props.view.emptyMessage}
    action={<Button type="button" size="sm" onClick={props.onClearBattleLogs} title="Efface uniquement les notes locales"><RotateCcw className="h-3 w-3" />Effacer les notes</Button>}
  />;
}
