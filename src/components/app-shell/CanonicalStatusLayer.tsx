import type { CanonicalStateFailure } from "../../lib/supabase";
import CanonicalStateAlert from "../CanonicalStateAlert";

interface CanonicalStatusLayerProps {
  authenticated: boolean;
  failure: CanonicalStateFailure | null;
  transportOnline: boolean;
  online: boolean;
  ready: boolean;
  automationLeader: boolean;
  controlTransferPending: boolean;
  notice: string | null;
  onOpenAccount: () => void;
  onRequestControl: () => void;
}

export default function CanonicalStatusLayer(props: CanonicalStatusLayerProps) {
  const offline = !props.transportOnline && props.authenticated;
  const observer = props.online && props.authenticated && props.ready && !props.automationLeader;
  const notice = Boolean(props.notice && props.authenticated);
  return <>
    {props.failure && props.authenticated && <CanonicalStateAlert requestId={props.failure.requestId} onOpenAccount={props.onOpenAccount} />}
    {(offline || observer || notice) && <div role="status" aria-live="polite">
      {offline && <div className="sticky top-0 z-30 border-b border-amber-700/60 bg-amber-950/95 px-4 py-2 text-center text-sm text-amber-100">📡 Mode hors connexion — cache en lecture seule. Les mutations reprendront après reconnexion.</div>}
      {observer && <div className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-3 border-b border-violet-700/60 bg-violet-950/95 px-4 py-2 text-center text-sm text-violet-100">
        <span>{props.controlTransferPending ? "Transfert du contrôle en cours…" : "Mode observateur — la partie est contrôlée dans un autre onglet."}</span>
        <button type="button" onClick={props.onRequestControl} disabled={props.controlTransferPending} className="min-h-11 rounded border border-violet-400/70 bg-violet-800 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-wait disabled:opacity-60">{props.controlTransferPending ? "Transfert…" : "Prendre le contrôle"}</button>
      </div>}
      {notice && <div className="sticky top-0 z-30 border-b border-sky-700/60 bg-sky-950/95 px-4 py-2 text-center text-sm text-sky-100">{props.notice}</div>}
    </div>}
  </>;
}
