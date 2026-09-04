import type { CanonicalHeroBaseStats } from "./hero-stats.ts";

export type DungeonChallengeStat = keyof CanonicalHeroBaseStats;

export type DungeonChallengeKind =
  | "trap"
  | "enigma"
  | "ambush"
  | "ritual"
  | "obstacle"
  | "negotiation";

export type DungeonChallengeDifficultyResolver = (
  floor: number,
  kind: DungeonChallengeKind,
) => number;

export const DUNGEON_CHALLENGE_DIFFICULTY_MODEL_ID = "party-four-two-thirds-v2" as const;

type DungeonChallengeDifficultyAnchor = { floor: number; difficulty: number };

export const DUNGEON_CHALLENGE_DIFFICULTY_ANCHORS: Readonly<
  Record<DungeonChallengeKind, readonly DungeonChallengeDifficultyAnchor[]>
> = {
  trap: [{ floor: 1, difficulty: 12 }, { floor: 10, difficulty: 29 }, { floor: 20, difficulty: 72 }, { floor: 25, difficulty: 80 }, { floor: 30, difficulty: 93 }, { floor: 40, difficulty: 110 }, { floor: 50, difficulty: 119 }, { floor: 60, difficulty: 133 }, { floor: 65, difficulty: 140 }, { floor: 99, difficulty: 140 }],
  enigma: [{ floor: 1, difficulty: 11 }, { floor: 10, difficulty: 29 }, { floor: 20, difficulty: 58 }, { floor: 25, difficulty: 70 }, { floor: 30, difficulty: 82 }, { floor: 40, difficulty: 100 }, { floor: 50, difficulty: 113 }, { floor: 60, difficulty: 125 }, { floor: 65, difficulty: 130 }, { floor: 70, difficulty: 133 }, { floor: 99, difficulty: 133 }],
  ambush: [{ floor: 1, difficulty: 12 }, { floor: 10, difficulty: 30 }, { floor: 20, difficulty: 53 }, { floor: 25, difficulty: 66 }, { floor: 30, difficulty: 77 }, { floor: 40, difficulty: 92 }, { floor: 50, difficulty: 106 }, { floor: 60, difficulty: 113 }, { floor: 99, difficulty: 113 }],
  ritual: [{ floor: 1, difficulty: 11 }, { floor: 10, difficulty: 28 }, { floor: 20, difficulty: 59 }, { floor: 25, difficulty: 70 }, { floor: 30, difficulty: 80 }, { floor: 40, difficulty: 97 }, { floor: 50, difficulty: 112 }, { floor: 60, difficulty: 126 }, { floor: 70, difficulty: 131 }, { floor: 99, difficulty: 131 }],
  obstacle: [{ floor: 1, difficulty: 12 }, { floor: 10, difficulty: 30 }, { floor: 20, difficulty: 58 }, { floor: 25, difficulty: 73 }, { floor: 30, difficulty: 81 }, { floor: 40, difficulty: 102 }, { floor: 50, difficulty: 116 }, { floor: 60, difficulty: 128 }, { floor: 70, difficulty: 142 }, { floor: 80, difficulty: 145 }, { floor: 99, difficulty: 145 }],
  negotiation: [{ floor: 1, difficulty: 11 }, { floor: 10, difficulty: 29 }, { floor: 20, difficulty: 50 }, { floor: 25, difficulty: 53 }, { floor: 30, difficulty: 62 }, { floor: 40, difficulty: 66 }, { floor: 99, difficulty: 66 }],
};

export const getCanonicalDungeonChallengeDifficulty: DungeonChallengeDifficultyResolver = (floor, kind) => {
  const safeFloor = Math.max(1, Math.floor(Number.isFinite(floor) ? floor : 1));
  const anchors = DUNGEON_CHALLENGE_DIFFICULTY_ANCHORS[kind];
  const upperIndex = anchors.findIndex((anchor) => safeFloor <= anchor.floor);
  if (upperIndex === 0) return anchors[0].difficulty;
  if (upperIndex < 0) {
    const lower = anchors.at(-2)!;
    const upper = anchors.at(-1)!;
    const slope = (upper.difficulty - lower.difficulty) / (upper.floor - lower.floor);
    return Math.round(upper.difficulty + (safeFloor - upper.floor) * slope);
  }
  const lower = anchors[upperIndex - 1];
  const upper = anchors[upperIndex];
  const ratio = (safeFloor - lower.floor) / (upper.floor - lower.floor);
  return Math.round(lower.difficulty + (upper.difficulty - lower.difficulty) * ratio);
};

export type DungeonChallengeDefinition = {
  statA: DungeonChallengeStat;
  statB: DungeonChallengeStat;
  name: string;
  description: string;
};

export const DUNGEON_CHALLENGE_DEFINITIONS: Readonly<Record<DungeonChallengeKind, DungeonChallengeDefinition>> = {
  trap: {
    statA: "agi",
    statB: "dex",
    name: "Salle Piégée",
    description: "La pièce est truffée de plaques de pression, de fléchettes dissimulées et de dalles instables.",
  },
  enigma: {
    statA: "int",
    statB: "wiz",
    name: "Chambre des Énigmes",
    description: "Une porte scellée par un ancien mécanisme d'inscription runique magique bloque la voie.",
  },
  ambush: {
    statA: "agi",
    statB: "luk",
    name: "Embuscade Impromptue",
    description: "Des créatures rôdent dans l'ombre et s'apprêtent à surprendre l'escouade.",
  },
  ritual: {
    statA: "dex",
    statB: "wiz",
    name: "Autel de Rituel",
    description: "Un cercle runique et un cristal de mana instable vibrent d'une énergie occulte.",
  },
  obstacle: {
    statA: "str",
    statB: "agi",
    name: "Obstacle de Taille",
    description: "Un éboulement de pierres massives et une grille en fer rouillé bloquent le passage.",
  },
  negotiation: {
    statA: "wiz",
    statB: "luk",
    name: "Négociation Mystique",
    description: "Un esprit errant et un marchand suspect proposent un pacte mystérieux.",
  },
};

export type DungeonChallengeCandidate<THero> = {
  hero: THero;
  score: number;
  luck: number;
  successProbability: number;
};

export function getDungeonChallengeSuccessProbability(
  score: number,
  luck: number,
  difficulty: number,
): number {
  const safeLuck = Math.max(1, Math.floor(Number.isFinite(luck) ? luck : 1));
  const minimumSuccessfulRoll = Math.ceil(difficulty - score);
  if (minimumSuccessfulRoll <= 1) return 1;
  if (minimumSuccessfulRoll > safeLuck) return 0;
  return (safeLuck - minimumSuccessfulRoll + 1) / safeLuck;
}

export function evaluateDungeonChallengeCandidate<THero extends { baseStats: CanonicalHeroBaseStats }>(
  hero: THero,
  statA: DungeonChallengeStat,
  statB: DungeonChallengeStat,
  difficulty: number,
): DungeonChallengeCandidate<THero> {
  const score = hero.baseStats[statA] + hero.baseStats[statB];
  const luck = Math.max(1, hero.baseStats.luk);
  return {
    hero,
    score,
    luck,
    successProbability: getDungeonChallengeSuccessProbability(score, luck, difficulty),
  };
}

export function selectBestDungeonChallengeCandidate<THero extends { baseStats: CanonicalHeroBaseStats }>(
  heroes: readonly THero[],
  statA: DungeonChallengeStat,
  statB: DungeonChallengeStat,
  difficulty: number,
): DungeonChallengeCandidate<THero> | null {
  let best: DungeonChallengeCandidate<THero> | null = null;
  for (const hero of heroes) {
    const candidate = evaluateDungeonChallengeCandidate(hero, statA, statB, difficulty);
    if (
      best === null
      || candidate.successProbability > best.successProbability
      || (
        candidate.successProbability === best.successProbability
        && candidate.score > best.score
      )
      || (
        candidate.successProbability === best.successProbability
        && candidate.score === best.score
        && candidate.luck > best.luck
      )
    ) {
      best = candidate;
    }
  }
  return best;
}

export function rollDungeonChallenge(
  candidate: Pick<DungeonChallengeCandidate<unknown>, "score" | "luck">,
  difficulty: number,
  rng: { nextInt(maxExclusive: number): number },
): { luckRoll: number; success: boolean } {
  const luckRoll = rng.nextInt(candidate.luck) + 1;
  return {
    luckRoll,
    success: luckRoll + candidate.score >= difficulty,
  };
}
