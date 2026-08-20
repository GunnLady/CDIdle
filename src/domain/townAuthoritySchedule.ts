import { REST_RECOVERY_RATE_PER_SECOND } from "../../shared/domain/rest-recovery";

export type TownAuthorityRecoveryHero = {
  status: string;
  currentHp: number;
  currentMana: number;
  calculatedStats: { maxHp: number; maxMana: number };
};

const secondsUntilGaugeFull = (current: number, maximum: number): number => {
  if (!Number.isFinite(current) || !Number.isFinite(maximum) || maximum <= 0 || current >= maximum) {
    return 0;
  }
  return (maximum - current) / (maximum * REST_RECOVERY_RATE_PER_SECOND);
};

/**
 * Returns the next useful server reconciliation deadline for resting heroes.
 * Continuous recovery remains a read-only client projection; the server is
 * contacted only when one hero can transition back to the canonical idle state.
 */
export function nextTownAuthorityRecoveryDelayMs(
  heroes: TownAuthorityRecoveryHero[],
): number | null {
  let nextSeconds = Number.POSITIVE_INFINITY;
  for (const hero of heroes) {
    if (hero.status !== "resting") continue;
    const seconds = Math.max(
      secondsUntilGaugeFull(hero.currentHp, hero.calculatedStats.maxHp),
      secondsUntilGaugeFull(hero.currentMana, hero.calculatedStats.maxMana),
    );
    if (seconds > 0) nextSeconds = Math.min(nextSeconds, seconds);
  }
  return Number.isFinite(nextSeconds) ? Math.max(1, Math.ceil(nextSeconds * 1_000)) : null;
}
