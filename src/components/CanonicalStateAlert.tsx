type CanonicalStateAlertProps = {
  requestId?: string;
  onOpenAccount: () => void;
};

export default function CanonicalStateAlert({
  requestId,
  onOpenAccount,
}: CanonicalStateAlertProps) {
  return (
    <div
      role="alert"
      className="sticky top-0 z-30 border-b border-red-700/70 bg-red-950/95 px-4 py-2 text-center text-sm text-red-100"
    >
      <span>
        Sauvegarde incompatible — mutations verrouillées. Réinitialisez la
        partie ou contactez l’assistance.
        {requestId ? ` Référence : ${requestId}.` : ""}
      </span>
      <button
        type="button"
        onClick={onOpenAccount}
        className="ml-3 rounded border border-red-300/60 px-2 py-1 font-semibold hover:bg-red-900"
      >
        Ouvrir le compte
      </button>
    </div>
  );
}
