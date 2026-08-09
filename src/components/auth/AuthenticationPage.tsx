import { useState } from "react";
import { Cloud, ShieldAlert } from "lucide-react";
import EntryScreenFrame from "../onboarding/EntryScreenFrame";

export default function AuthenticationPage(props: {
  sessionLoading: boolean;
  onAuthenticate: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = async () => {
    setPending(true);
    setError(null);
    try {
      await props.onAuthenticate();
    } catch (reason) {
      const failure = reason as { code?: string; message?: string };
      if (failure.code !== "provider-canceled") {
        setError(`Impossible de s’authentifier via Google : ${failure.message ?? "erreur inconnue"}`);
      }
    } finally {
      setPending(false);
    }
  };

  const loading = props.sessionLoading || pending;
  return <EntryScreenFrame testId="authentication-page">
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#d4af37] bg-gradient-to-br from-[#caa050] via-[#86592e] to-[#462d16] shadow-md"><Cloud className="h-7 w-7 text-[#110905]" /></div>
      <h1 className="font-serif text-xl font-bold uppercase tracking-widest text-[#d4af37]">Idle City Donjon</h1>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#a89078]">Alpha privée — accès Google autorisé</p>
    </div>
    {error && <div role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-red-900/50 bg-rose-950/40 p-3 text-xs text-red-300"><ShieldAlert className="h-4 w-4 shrink-0" />{error}</div>}
    <button type="button" onClick={() => { void authenticate(); }} disabled={loading} className="mt-6 min-h-11 w-full rounded-xl border border-[#5c402b] bg-[#1e140d] px-4 text-xs font-bold text-[#dfdbc7] transition hover:bg-[#2e2015] disabled:cursor-wait disabled:opacity-50">
      {loading ? "Vérification de la session…" : "S’identifier avec Google"}
    </button>
    <p className="mt-5 border-t border-[#5c402b]/25 pt-4 text-center text-[11px] text-[#a89078]">L’accès à l’alpha est réservé aux comptes Google autorisés.</p>
  </EntryScreenFrame>;
}
