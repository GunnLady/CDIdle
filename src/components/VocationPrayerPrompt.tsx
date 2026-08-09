import { useEffect, useState } from "react";
import type { ClassType, Hero, PendingClassTransition } from "../types";
import FloatingPrompt from "../ui/patterns/FloatingPrompt";
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
      <FloatingPrompt
        type="button"
        onClick={() => setDeferred(false)}
        icon="🙏"
        className="fixed bottom-4 left-4 z-[var(--ui-layer-floating)]"
      >
        Choisir la vocation de {hero?.name ?? "ce héros"}
      </FloatingPrompt>
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
