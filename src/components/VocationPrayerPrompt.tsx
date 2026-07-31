import { useEffect, useState } from "react";
import type { ClassType, Hero, PendingClassTransition } from "../types";
import VocationPrayerDialog from "./VocationPrayerDialog";

type Props = {
  pending: PendingClassTransition;
  hero?: Hero;
  disabled?: boolean;
  readOnly?: boolean;
  onChoose: (classType: ClassType) => void;
};

export default function VocationPrayerPrompt({ pending, hero, disabled = false, readOnly = false, onChoose }: Props) {
  const [deferred, setDeferred] = useState(false);

  useEffect(() => {
    setDeferred(false);
  }, [pending.heroId]);

  if (deferred) {
    return (
      <button
        type="button"
        onClick={() => setDeferred(false)}
        className="fixed bottom-4 left-4 z-[60] rounded-xl border-2 border-amber-500 bg-[#21150d] px-4 py-3 text-sm font-bold text-amber-200 shadow-2xl hover:bg-[#302015]"
      >
        🙏 Choisir la vocation de {hero?.name ?? "ce héros"}
      </button>
    );
  }

  return (
    <VocationPrayerDialog
      pending={pending}
      hero={hero}
      disabled={disabled}
      readOnly={readOnly}
      onDefer={() => setDeferred(true)}
      onChoose={onChoose}
    />
  );
}
