import { describe, expect, it } from "vitest";
import { resolveCombatRound, type CombatState } from "../src/domain/combat";
import { seededRng } from "../src/domain/random";

function combatState(): CombatState {
  const combatant = (id: string, hp: number, attack: number) => ({
    id, hp, maxHp: hp, attackSpeed: 1, speed: 0, attack,
    damageMin: 1, damageMax: 2, criticalChance: 0,
    damageTypes: ["physical" as const], physicalDefense: 0, resistances: {},
  });
  return { round: 0, heroes: [combatant("hero", 100, 10)], enemy: combatant("enemy", 100, 5), outcome: "active", transcript: [] };
}

describe("combat performance budget", () => {
  it("resolves 1000 authoritative rounds under 500ms", () => {
    const rng = seededRng(34034);
    const started = performance.now();
    for (let index = 0; index < 1000; index += 1) {
      expect(resolveCombatRound(combatState(), rng).ok).toBe(true);
    }
    expect(performance.now() - started).toBeLessThan(500);
  });
});
