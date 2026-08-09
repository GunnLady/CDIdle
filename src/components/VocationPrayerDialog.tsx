import type { ClassType, Hero, PendingClassTransition } from "../types";
import { CLASS_INFO_LIST } from "../data/heroes";
import Dialog from "../ui/components/Dialog";
import SelectableCard from "../ui/components/SelectableCard";
import Button from "../ui/primitives/Button";

type Props = {
  pending: PendingClassTransition;
  hero?: Hero;
  disabled?: boolean;
  readOnly?: boolean;
  onChoose: (classType: ClassType) => void;
  onDefer: () => void;
};

export default function VocationPrayerDialog({ pending, hero, disabled = false, readOnly = false, onChoose, onDefer }: Props) {
  const confirmationOnly = pending.candidates.length === 1;
  const bestAffinity = Math.max(...pending.candidates.map((candidate) => candidate.affinity));
  const title = confirmationOnly ? "L'appel d'une vocation" : "Prière aux dieux";
  const description = confirmationOnly
    ? `${hero?.name ?? "Ce héros"} ressent enfin l'appel de sa vocation.`
    : `${hero?.name ?? "Ce héros"} hésite entre plusieurs voies compatibles avec son parcours.`;
  const status = readOnly
    ? "Mode observateur : prenez le contrôle avant de choisir."
    : disabled ? "La réponse des dieux est en cours…" : "Ce choix est définitif.";
  return (
    <Dialog title={title} description={description} onDismiss={onDefer} dismissDisabled={disabled} className="max-w-xl" footer={<div className="flex w-full flex-col items-stretch gap-3"><p className="text-center text-xs text-ui-text-muted">{status}</p><Button type="button" disabled={disabled} onClick={onDefer}>Décider plus tard</Button></div>}>
        <div className="mb-3 text-center text-3xl" aria-hidden="true">🙏</div>
        <div className="space-y-3">
          {pending.candidates.map((candidate) => {
            const info = CLASS_INFO_LIST.find((entry) => entry.type === candidate.classType);
            return (
              <SelectableCard
                key={candidate.classType}
                selected={false}
                disabled={disabled || readOnly}
                onClick={() => onChoose(candidate.classType)}
              >
                <span className="flex items-center justify-between gap-3">
                  <strong className="font-serif text-base text-ui-accent">{info?.name ?? candidate.classType}</strong>
                  <span className="text-xs font-bold text-violet-300">
                    {confirmationOnly
                      ? "Affinité dominante"
                      : `Affinité relative ${bestAffinity > 0 ? ((candidate.affinity / bestAffinity) * 100).toFixed(1) : "100.0"} %`}
                  </span>
                </span>
                {info?.description && (
                  <span className="mt-1 block text-xs leading-relaxed text-ui-text-muted">{info.description}</span>
                )}
              </SelectableCard>
            );
          })}
        </div>

    </Dialog>
  );
}
