import { type FormEvent, useEffect, useState } from "react";
import { Castle, ChevronRight, Sparkles, Sword } from "lucide-react";
import { suggestCityName } from "../../domain/onboardingPresentation";
import EntryScreenFrame from "./EntryScreenFrame";
import OnboardingAccessNotice from "./OnboardingAccessNotice";
import Button from "../../ui/primitives/Button";
import IconButton from "../../ui/primitives/IconButton";
import TextField from "../../ui/primitives/TextField";

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
        <div className="flex items-end gap-2">
          <TextField id="onboarding-city-name" label="Nom de la Cité ralliée" type="text" required maxLength={25} value={cityName} onChange={(event) => setCityName(event.target.value)} wrapperClassName="flex-1" leading={<Sword className="h-4 w-4" />} placeholder="Ex. Val-Ombré" />
          <IconButton type="button" label="Générer un nom de cité" onClick={() => { setCityName(suggestCityName()); setError(null); }} className="shrink-0"><Sparkles className="h-4 w-4" /></IconButton>
        </div>
        <p className="ml-1 mt-1.5 text-xs text-ui-text-muted">La cité commencera avec une Cabane de niveau 1 et des provisions de survie.</p>
      </div>
      <Button type="submit" variant="primary" block busy={pending} disabled={!props.canMutate}>
        {pending ? "Préparation des fondateurs…" : <><span>Fonder la Cité</span><ChevronRight className="h-4 w-4" /></>}
      </Button>
    </form>
  </EntryScreenFrame>;
}
