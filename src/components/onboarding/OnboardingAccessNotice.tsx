import { ShieldAlert } from "lucide-react";
import Alert from "../../ui/components/Alert";
import Button from "../../ui/primitives/Button";

export default function OnboardingAccessNotice(props: {
  message?: string;
  error?: string | null;
  controlTransferPending?: boolean;
  onRequestControl?: () => void;
}) {
  const text = props.error ?? props.message;
  if (!text) return null;
  return <Alert variant={props.error ? "error" : "locked"} live={props.error ? "assertive" : "polite"} className="mb-4 flex flex-wrap items-center justify-center gap-3">
    <span className="flex min-w-0 items-center gap-2"><ShieldAlert className="h-4 w-4 shrink-0" />{text}</span>
    {!props.error && props.onRequestControl && <Button type="button" size="sm" busy={props.controlTransferPending} onClick={props.onRequestControl} className="uppercase">{props.controlTransferPending ? "Transfert…" : "Prendre le contrôle"}</Button>}
  </Alert>;
}
