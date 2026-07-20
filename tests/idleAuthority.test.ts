import { describe, expect, it } from "vitest";
import { applyIdleAuthority, MAX_IDLE_SECONDS } from "../supabase/functions/game-api/idle-authority";

const base = {
  resources: { food: 100, wood: 0, stone: 0, ore: 0 },
  buildings: { habitation: 2, ferme: 1, maison_chef: 0 },
  citizens: { farmers: 1, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
  totalCitizensCount: 3,
  citizenGrowthProgress: 0,
  districts: {},
  heroes: [],
};

describe("server idle authority", () => {
  it("caps elapsed time and reports discarded seconds", () => {
    const result = applyIdleAuthority(base, "2026-07-18T00:00:00.000Z", new Date("2026-07-20T00:00:00.000Z"));
    expect(result.report).toMatchObject({ elapsedSeconds: 172800, appliedSeconds: MAX_IDLE_SECONDS, discardedSeconds: MAX_IDLE_SECONDS });
    expect(result.report.resourcesProduced.food).toBe(MAX_IDLE_SECONDS);
    expect(result.lastProcessedAt).toBe("2026-07-20T00:00:00.000Z");
  });

  it("adds citizens only when food and capacity allow it", () => {
    const result = applyIdleAuthority(base, "2026-07-18T00:00:00.000Z", new Date("2026-07-18T00:00:20.000Z"));
    expect(result.report.citizensAdded).toBe(1);
    expect(result.state.totalCitizensCount).toBe(4);
    expect((result.state.citizens as { unassigned: number }).unassigned).toBe(4);
  });

  it("counts only heroes whose resting gauges actually changed", () => {
    const result = applyIdleAuthority({ ...base, heroes: [
      { status: "resting", currentHp: 2, currentMana: 0, calculatedStats: { maxHp: 20, maxMana: 10 } },
      { status: "idle", currentHp: 2, currentMana: 0, calculatedStats: { maxHp: 20, maxMana: 10 } },
    ] }, "2026-07-18T00:00:00.000Z", new Date("2026-07-18T00:00:02.000Z"));
    expect(result.report.heroesRecovered).toBe(1);
    expect((result.state.heroes as Array<{ currentHp: number }>)[0].currentHp).toBe(14);
  });

  it("rejects a server clock rollback", () => {
    try {
      applyIdleAuthority(base, "2026-07-18T00:00:01.000Z", new Date("2026-07-18T00:00:00.000Z"));
      throw new Error("expected rollback");
    } catch (error) {
      expect(error).toMatchObject({ code: "CLOCK_ROLLBACK" });
    }
  });
});
