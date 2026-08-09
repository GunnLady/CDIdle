import Alert from "../ui/components/Alert";
import Button from "../ui/primitives/Button";

type CanonicalStateAlertProps = {
  requestId?: string;
  onOpenAccount: () => void;
};

export default function CanonicalStateAlert({
  requestId,
  onOpenAccount,
}: CanonicalStateAlertProps) {
  return (
    <Alert
      variant="error"
      role="alert"
      className="sticky top-0 z-[var(--ui-layer-status)] rounded-none border-x-0 border-t-0 py-2 text-center"
    >
      <span>
        Sauvegarde incompatible — mutations verrouillées. Réinitialisez la
        partie ou contactez l’assistance.
        {requestId ? ` Référence : ${requestId}.` : ""}
      </span>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={onOpenAccount}
        className="ml-3 py-1 normal-case tracking-normal"
      >
        Ouvrir le compte
      </Button>
    </Alert>
  );
}
