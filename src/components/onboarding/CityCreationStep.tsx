import { type FormEvent, useEffect, useState } from "react";
import { Castle, ChevronRight, Sparkles, Sword } from "lucide-react";
import { suggestCityName } from "../../domain/onboardingPresentation";
import EntryScreenFrame from "./EntryScreenFrame";
import OnboardingAccessNotice from "./OnboardingAccessNotice";

export default function CityCreationStep(props: {
  initialName: string;
  canMutate: boolean;
  blockReason?: string;
  controlTransferPending?: boolean;
  onRequestControl?: () => void;
  onContinue: (cityName: string) => Promise<boolean>;
}) {
  const [cityName, setCityName] = useState(props.initialName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (props.initialName) setCityName(props.initialName);
  }, [props.initialName]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = cityName.trim();
    if (!normalizedName) {
      setError("Le nom de votre cité ne peut pas être vide.");
      return;
    }
    if (!props.canMutate) return;
    setPending(true);
    setError(null);
    try {
      if (!await props.onContinue(normalizedName)) {
        setError("Impossible de générer les novices depuis le serveur. Veuillez réessayer.");
      }
    } catch {
      setError("Impossible de générer les novices depuis le serveur. Veuillez réessayer.");
    } finally {
      setPending(false);
    }
  };

  return <EntryScreenFrame testId="city-creation-step">
    <div className="mb-5 text-center">
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8c5a2b]">Fondation · 1/2</span>
      <div className="mx-auto my-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#d4af37] bg-gradient-to-br from-[#ae8650] via-[#86592e] to-[#462d16]"><Castle className="h-8 w-8 text-[#fdf9f2]" /></div>
      <h1 className="font-serif text-2xl font-extrabold uppercase tracking-wider text-[#d4af37]">Fondez votre Royaume</h1>
      <p className="mx-auto mt-2 max-w-xs font-serif text-xs leading-relaxed text-[#a89078]">Donnez un nom à votre premier campement avant de choisir ses fondateurs.</p>
    </div>
    <OnboardingAccessNotice error={error} message={!props.canMutate ? props.blockReason : undefined} controlTransferPending={props.controlTransferPending} onRequestControl={props.onRequestControl} />
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="onboarding-city-name" className="mb-2 block font-serif text-[10px] font-bold uppercase tracking-widest text-[#a89078]">Nom de la Cité ralliée</label>
        <div className="flex gap-2">
          <div className="relative flex-1"><Sword className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c5a2b]" /><input id="onboarding-city-name" type="text" required maxLength={25} value={cityName} onChange={(event) => setCityName(event.target.value)} className="w-full rounded-xl border-2 border-[#45301f] bg-[#0f0a06] py-3 pl-11 pr-4 text-sm text-[#fbf7f0] outline-none focus:border-[#d4af37]" placeholder="Ex. Val-Ombré" /></div>
          <button type="button" aria-label="Générer un nom de cité" onClick={() => { setCityName(suggestCityName()); setError(null); }} className="min-h-11 shrink-0 rounded-xl border-2 border-[#5c402b] bg-[#20150d] px-3.5 text-[#d4af37] hover:border-[#d4af37]"><Sparkles className="h-4 w-4" /></button>
        </div>
        <p className="ml-1 mt-1.5 text-[10px] text-[#8c5a2b]">La cité commencera avec une Cabane de niveau 1 et des provisions de survie.</p>
      </div>
      <button type="submit" disabled={!props.canMutate || pending} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#d4af37] bg-gradient-to-r from-[#8c5a2b] to-[#b3844a] px-4 py-3 text-sm font-bold text-[#fbf7f0] disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? "Préparation des fondateurs…" : <><span>Fonder la Cité</span><ChevronRight className="h-4 w-4" /></>}
      </button>
    </form>
  </EntryScreenFrame>;
}
