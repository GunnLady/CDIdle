import type { ClassType, Hero, PendingClassTransition, StoredItemInstance } from "../contracts/game.ts";
import { applyHeroExperienceLevels } from "./hero.ts";
import type { Rng } from "./random.ts";
import {
  applyClassTransition,
  resolveClassTransition,
  type ClassTransition,
} from "./class-transition.ts";
import type { ClassEquipmentReward } from "./tier1-class-equipment-reward.ts";

import {
  CURRENT_XP_PROGRESSION_CURVE,
  refreshHeroProgressionThreshold,
  type XpProgressionCurve,
} from "./game-calculations.ts";

export type HeroProgressionResult = {
  hero: Hero;
  storedItems: StoredItemInstance[];
  levels: number[];
  classChange?: ClassTransition & { equipmentReward?: ClassEquipmentReward };
  classStayed?: { classType: ClassType; reason: string };
  pendingTransition?: PendingClassTransition;
};

export function applyHeroProgression(input: {
  hero: Hero;
  xpEarned: number;
  rng: Rng;
  buildings: Record<string, number>;
  storedItems: StoredItemInstance[];
  xpCurve?: XpProgressionCurve;
}): HeroProgressionResult {
  const xpCurve = input.xpCurve ?? CURRENT_XP_PROGRESSION_CURVE;
  const experience = applyHeroExperienceLevels(input.hero, input.xpEarned, input.rng, xpCurve);
  const storedItems = input.storedItems;
  if (experience.levels.length === 0) {
    return { ...experience, storedItems };
  }

  const resolution = resolveClassTransition(experience.hero, input.buildings);
  if (!resolution.transition) {
    if (resolution.pendingTransition) {
      return {
        ...experience,
        storedItems,
        pendingTransition: resolution.pendingTransition,
      };
    }
    return {
      ...experience,
      storedItems,
      ...(resolution.reason
        ? { classStayed: { classType: experience.hero.classType, reason: resolution.reason } }
        : {}),
    };
  }

  const applied = applyClassTransition(
    experience.hero,
    resolution.transition,
    input.rng,
    storedItems,
  );
  return {
    hero: refreshHeroProgressionThreshold(applied.hero, xpCurve),
    storedItems: applied.storedItems,
    levels: experience.levels,
    classChange: {
      ...resolution.transition,
      equipmentReward: applied.equipmentReward,
    },
  };
}
