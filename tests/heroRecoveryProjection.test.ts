import { describe, expect, it } from "vitest";
import { projectRestingHeroes } from "../src/domain/heroRecoveryProjection";
import { makeHero } from "./fixtures/game";

describe("resting hero display projection", () => {
  it("animates recovery without mutating the canonical hero", () => {
    const hero = makeHero({ status: "resting", currentHp: 2, currentMana: 0 });
    const projected = projectRestingHeroes([hero], 2)[0];
    expect(projected.currentHp).toBeCloseTo(2.8);
    expect(projected.currentMana).toBeCloseTo(0.4);
    expect(projected.status).toBe("resting");
    expect(hero).toMatchObject({ currentHp: 2, currentMana: 0, status: "resting" });
  });

  it("presents idle once both gauges are full", () => {
    const hero = makeHero({ status: "resting", currentHp: 19.8, currentMana: 9.8 });
    expect(projectRestingHeroes([hero], 1)[0]).toMatchObject({
      currentHp: 20,
      currentMana: 10,
      status: "idle",
    });
  });

  it("does not project active or idle heroes", () => {
    const hero = makeHero({ status: "idle", currentHp: 2, currentMana: 0 });
    expect(projectRestingHeroes([hero], 10)[0]).toBe(hero);
  });
});
