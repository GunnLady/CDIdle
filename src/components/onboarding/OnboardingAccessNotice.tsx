import { ShieldAlert } from "lucide-react";

export default function OnboardingAccessNotice(props: {
  message?: string;
  error?: string | null;
  controlTransferPending?: boolean;
  onRequestControl?: () => void;
}) {
  const text = props.error ?? props.message;
  if (!text) return null;
  return <div role={props.error ? "alert" : "status"} className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-200">
    <span className="flex min-w-0 items-center gap-2"><ShieldAlert className="h-4 w-4 shrink-0" />{text}</span>
    {!props.error && props.onRequestControl && <button type="button" onClick={props.onRequestControl} disabled={props.controlTransferPending} className="min-h-11 rounded-lg border border-violet-400/70 bg-violet-800 px-3 text-[10px] font-bold uppercase text-white disabled:cursor-wait disabled:opacity-60">{props.controlTransferPending ? "Transfert…" : "Prendre le contrôle"}</button>}
  </div>;
}
