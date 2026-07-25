export type TownHeartbeatInput = {
  rates: { food: number; wood: number; stone: number; ore: number };
  food: number;
  totalCitizens: number;
  habitationLevel: number;
  heroes: Array<{
    status: string;
    currentHp: number;
    currentMana: number;
    calculatedStats: { maxHp: number; maxMana: number };
  }>;
};

export function shouldRefreshTownAuthority(input: TownHeartbeatInput): boolean {
  const producesResources = input.rates.food > 0
    || input.rates.wood > 0
    || input.rates.stone > 0
    || input.rates.ore > 0;
  const hasImmigration = input.totalCitizens < Math.max(0, input.habitationLevel) * 3
    && (input.food >= 1 || input.rates.food > 0);
  const hasRecoveringHero = input.heroes.some((hero) =>
    hero.status === "resting"
    && (hero.currentHp < hero.calculatedStats.maxHp || hero.currentMana < hero.calculatedStats.maxMana));
  return producesResources || hasImmigration || hasRecoveringHero;
}
