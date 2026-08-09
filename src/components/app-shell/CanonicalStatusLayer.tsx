import type { CanonicalStateFailure } from "../../domain/canonicalStateFailure";
import StatusBanner from "../../ui/components/StatusBanner";
import Button from "../../ui/primitives/Button";
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
      {offline && <StatusBanner tone="warning" sticky>📡 Mode hors connexion — cache en lecture seule. Les mutations reprendront après reconnexion.</StatusBanner>}
      {observer && <StatusBanner tone="observer" sticky action={<Button type="button" size="sm" busy={props.controlTransferPending} onClick={props.onRequestControl}>{props.controlTransferPending ? "Transfert…" : "Prendre le contrôle"}</Button>}>
        {props.controlTransferPending ? "Transfert du contrôle en cours…" : "Mode observateur — la partie est contrôlée dans un autre onglet."}
      </StatusBanner>}
      {notice && <StatusBanner tone="info" sticky>{props.notice}</StatusBanner>}
    </div>}
  </>;
}
