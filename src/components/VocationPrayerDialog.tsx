import type { ClassType, Hero, PendingClassTransition } from "../types";
import { CLASS_INFO_LIST } from "../data/heroes";

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
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vocation-prayer-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border-2 border-amber-500/70 bg-[#160f0a] shadow-2xl">
        <div className="border-b border-amber-800/60 bg-gradient-to-r from-amber-950 to-violet-950 px-6 py-5 text-center">
          <div className="mb-2 text-3xl" aria-hidden="true">🙏</div>
          <h2 id="vocation-prayer-title" className="font-serif text-xl font-bold text-amber-300">
            {confirmationOnly ? "L'appel d'une vocation" : "Prière aux dieux"}
          </h2>
          <p className="mt-2 text-sm text-amber-100/80">
            {confirmationOnly
              ? `${hero?.name ?? "Ce héros"} ressent enfin l'appel de sa vocation.`
              : `${hero?.name ?? "Ce héros"} hésite entre plusieurs voies compatibles avec son parcours.`}
          </p>
        </div>

        <div className="space-y-3 p-5">
          {pending.candidates.map((candidate) => {
            const info = CLASS_INFO_LIST.find((entry) => entry.type === candidate.classType);
            return (
              <button
                key={candidate.classType}
                type="button"
                disabled={disabled || readOnly}
                onClick={() => onChoose(candidate.classType)}
                className="w-full rounded-xl border border-amber-700/60 bg-[#21150d] px-4 py-3 text-left transition hover:border-amber-400 hover:bg-[#302015] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex items-center justify-between gap-3">
                  <strong className="font-serif text-base text-amber-300">{info?.name ?? candidate.classType}</strong>
                  <span className="text-xs font-bold text-violet-300">
                    {confirmationOnly
                      ? "Affinité dominante"
                      : `Affinité relative ${bestAffinity > 0 ? ((candidate.affinity / bestAffinity) * 100).toFixed(1) : "100.0"} %`}
                  </span>
                </span>
                {info?.description && (
                  <span className="mt-1 block text-xs leading-relaxed text-stone-300/80">{info.description}</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="border-t border-amber-900/50 px-5 py-3 text-center text-xs text-stone-400">
          {readOnly
            ? "Mode observateur : prenez le contrôle avant de choisir."
            : disabled ? "La réponse des dieux est en cours…" : "Ce choix est définitif."}
        </p>
        <div className="border-t border-amber-900/50 px-5 py-3 text-center">
          <button
            type="button"
            disabled={disabled}
            onClick={onDefer}
            className="rounded-lg border border-stone-600 px-4 py-2 text-xs font-bold text-stone-300 transition hover:border-amber-500 hover:text-amber-200 disabled:cursor-wait disabled:opacity-60"
          >
            Décider plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
