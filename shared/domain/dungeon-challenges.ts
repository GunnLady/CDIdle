import type { CanonicalHeroBaseStats } from "./hero-stats.ts";

export type DungeonChallengeStat = keyof CanonicalHeroBaseStats;

export type DungeonChallengeKind =
  | "trap"
  | "enigma"
  | "ambush"
  | "ritual"
  | "obstacle"
  | "negotiation";

export type DungeonChallengeDefinition = {
  statA: DungeonChallengeStat;
  statB: DungeonChallengeStat;
  difficultyProfile: "standard" | "luck";
  name: string;
  description: string;
};

export const DUNGEON_CHALLENGE_DEFINITIONS: Readonly<Record<DungeonChallengeKind, DungeonChallengeDefinition>> = {
  trap: {
    statA: "agi",
    statB: "dex",
    difficultyProfile: "standard",
    name: "Salle Piégée",
    description: "La pièce est truffée de plaques de pression, de fléchettes dissimulées et de dalles instables.",
  },
  enigma: {
    statA: "int",
    statB: "wiz",
    difficultyProfile: "standard",
    name: "Chambre des Énigmes",
    description: "Une porte scellée par un ancien mécanisme d'inscription runique magique bloque la voie.",
  },
  ambush: {
    statA: "agi",
    statB: "luk",
    difficultyProfile: "luck",
    name: "Embuscade Impromptue",
    description: "Des créatures rôdent dans l'ombre et s'apprêtent à surprendre l'escouade.",
  },
  ritual: {
    statA: "dex",
    statB: "wiz",
    difficultyProfile: "standard",
    name: "Autel de Rituel",
    description: "Un cercle runique et un cristal de mana instable vibrent d'une énergie occulte.",
  },
  obstacle: {
    statA: "str",
    statB: "agi",
    difficultyProfile: "standard",
    name: "Obstacle de Taille",
    description: "Un éboulement de pierres massives et une grille en fer rouillé bloquent le passage.",
  },
  negotiation: {
    statA: "wiz",
    statB: "luk",
    difficultyProfile: "luck",
    name: "Négociation Mystique",
    description: "Un esprit errant et un marchand suspect proposent un pacte mystérieux.",
  },
};

const STANDARD_DIFFICULTY_ANCHORS = [
  [10, 30], [20, 90], [30, 155], [40, 220], [50, 285],
] as const;

const LUCK_DIFFICULTY_ANCHORS = [
  [10, 30], [20, 65], [30, 103], [40, 141], [50, 180],
] as const;

export type DungeonChallengeCandidate<THero> = {
  hero: THero;
  score: number;
  luck: number;
  successProbability: number;
};

export function getHistoricalDungeonChallengeDifficulty(floor: number): number {
  const safeFloor = Math.max(1, Math.floor(Number.isFinite(floor) ? floor : 1));
  return 10 + safeFloor * 2;
}

function interpolateDifficulty(
  floor: number,
  anchors: readonly (readonly [number, number])[],
): number {
  const upperIndex = anchors.findIndex(([anchorFloor]) => floor <= anchorFloor);
  if (upperIndex < 0) {
    const [previousFloor, previousDifficulty] = anchors.at(-2)!;
    const [lastFloor, lastDifficulty] = anchors.at(-1)!;
    return Math.round(lastDifficulty
      + (floor - lastFloor) * ((lastDifficulty - previousDifficulty) / (lastFloor - previousFloor)));
  }
  const [lowerFloor, lowerDifficulty] = anchors[upperIndex - 1];
  const [upperFloor, upperDifficulty] = anchors[upperIndex];
  const ratio = (floor - lowerFloor) / (upperFloor - lowerFloor);
  return Math.round(lowerDifficulty + (upperDifficulty - lowerDifficulty) * ratio);
}

export function getDungeonChallengeDifficulty(
  floor: number,
  profile: DungeonChallengeDefinition["difficultyProfile"],
): number {
  const safeFloor = Math.max(1, Math.floor(Number.isFinite(floor) ? floor : 1));
  if (safeFloor <= 10) return getHistoricalDungeonChallengeDifficulty(safeFloor);
  return interpolateDifficulty(
    safeFloor,
    profile === "luck" ? LUCK_DIFFICULTY_ANCHORS : STANDARD_DIFFICULTY_ANCHORS,
  );
}

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
