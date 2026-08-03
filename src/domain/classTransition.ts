import { CLASS_INFO_LIST } from "../data/gameData.ts";
import type { ClassType, Hero, PendingClassTransition, StoredItemInstance } from "../types.ts";
import type { Rng } from "./random.ts";
import { applyTier1ClassTransition } from "./tier1ClassTransition.ts";
import type { ClassEquipmentReward } from "./tier1ClassEquipmentReward.ts";
import { selectTier1VocationCandidates } from "./classAffinity.ts";

export type ClassTransition = {
  fromClass: ClassType;
  toClass: ClassType;
  fromTier: number;
  toTier: number;
  reason: string;
};

export type ClassTransitionResolution = {
  transition: ClassTransition | null;
  pendingTransition?: PendingClassTransition;
  reason?: string;
};

type AppliedClassTransition = {
  hero: Hero;
  storedItems: StoredItemInstance[];
  equipmentReward?: ClassEquipmentReward;
};

type ClassTransitionResolver = (
  hero: Hero,
  buildings: Record<string, number>,
) => ClassTransitionResolution | null;

type ClassTransitionPolicy = (
  hero: Hero,
  transition: ClassTransition,
  rng: Rng,
  storedItems: StoredItemInstance[],
) => AppliedClassTransition;

function requiredClassTier(classType: ClassType): number {
  const classInfo = CLASS_INFO_LIST.find((entry) => entry.type === classType);
  if (!classInfo) throw new Error(`INVALID_HERO_CLASS:${classType}`);
  return classInfo.tier;
}

const resolveTier0ToTier1: ClassTransitionResolver = (
  hero: Hero,
  buildings: Record<string, number>,
): ClassTransitionResolution | null => {
  if (hero.classType !== "Novice" || hero.level < 10) return null;
  const candidates = selectTier1VocationCandidates(hero, buildings);
  if (candidates.length === 0) {
    return { transition: null, reason: "Aucun bâtiment de métier débloqué dans la colonie" };
  }
  if (candidates.length === 1) {
    const candidate = candidates[0];
    return {
      transition: {
        fromClass: hero.classType,
        toClass: candidate.classType,
        fromTier: requiredClassTier(hero.classType),
        toTier: requiredClassTier(candidate.classType),
        reason: `Affinité dominante (${candidate.affinity.toFixed(1)})`,
      },
      reason: "Une vocation dominante s'impose naturellement",
    };
  }
  return {
    transition: null,
    pendingTransition: createPendingClassTransition(hero, candidates),
    reason: "Plusieurs vocations répondent à la prière du héros",
  };
};

export function createPendingClassTransition(
  hero: Hero,
  candidates: ReturnType<typeof selectTier1VocationCandidates>,
): PendingClassTransition {
  if (hero.classType !== "Novice" || hero.level < 10 || candidates.length === 0) {
    throw new Error("INVALID_PENDING_CLASS_TRANSITION");
  }
  return {
    heroId: hero.id,
    fromClass: hero.classType,
    fromTier: requiredClassTier(hero.classType),
    toTier: requiredClassTier(candidates[0].classType),
    originLevel: hero.level,
    wasActive: hero.isActive,
    previousStatus: hero.status,
    reason: candidates.length === 1
      ? "Vocation antérieure à confirmer"
      : "Plusieurs vocations répondent à la prière du héros",
    candidates: candidates.map(({ classType, affinity }) => ({ classType, affinity })),
  };
}

export function createExistingHeroPendingTransition(
  hero: Hero,
  buildings: Record<string, number>,
): PendingClassTransition | null {
  const candidates = selectTier1VocationCandidates(hero, buildings);
  return candidates.length > 0 ? createPendingClassTransition(hero, candidates) : null;
}

const TRANSITION_RESOLVERS: readonly ClassTransitionResolver[] = [
  resolveTier0ToTier1,
];

export function resolveClassTransition(
  hero: Hero,
  buildings: Record<string, number>,
): ClassTransitionResolution {
  for (const resolver of TRANSITION_RESOLVERS) {
    const resolution = resolver(hero, buildings);
    if (resolution) return resolution;
  }
  return { transition: null };
}

const TRANSITION_POLICIES = new Map<string, ClassTransitionPolicy>([
  ["0->1", (hero, transition, rng, storedItems) =>
    applyTier1ClassTransition(hero, transition.toClass, rng, storedItems)],
]);

export function applyClassTransition(
  hero: Hero,
  transition: ClassTransition,
  rng: Rng,
  storedItems: StoredItemInstance[],
): AppliedClassTransition {
  if (hero.classType !== transition.fromClass
    || requiredClassTier(transition.fromClass) !== transition.fromTier
    || requiredClassTier(transition.toClass) !== transition.toTier) {
    throw new Error("INVALID_CLASS_TRANSITION");
  }
  const policy = TRANSITION_POLICIES.get(`${transition.fromTier}->${transition.toTier}`);
  if (!policy) {
    throw new Error(`UNSUPPORTED_CLASS_TRANSITION:${transition.fromTier}->${transition.toTier}`);
  }
  return policy(hero, transition, rng, storedItems);
}
