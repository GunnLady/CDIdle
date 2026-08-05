import { describe, expect, it } from "vitest";
import { applyIdleAuthority, MAX_IDLE_SECONDS } from "../supabase/functions/game-api/idle-authority";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import type { CanonicalGameState } from "../shared/contracts/authoritative";
import type { Hero } from "../src/types";
import { makeHero } from "./fixtures/game";

const base: CanonicalGameState = {
  ...initialTownState(42),
  resources: { ...initialTownState(42).resources, food: 100, wood: 0, stone: 0, ore: 0 },
  buildings: { ...initialTownState(42).buildings, habitation: 2, ferme: 1, maison_chef: 0 },
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

  it("commits multiple immigration thresholds with the exact residual progress", () => {
    const state: CanonicalGameState = {
      ...structuredClone(base),
      resources: { ...base.resources, food: 100 },
      buildings: { ...base.buildings, habitation: 3, ferme: 0 },
      citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
    };
    const now = new Date("2026-07-18T00:00:45.000Z");
    const result = applyIdleAuthority(state, "2026-07-18T00:00:00.000Z", now);

    expect(result.report).toMatchObject({ citizensAdded: 2, foodConsumed: 45 });
    expect(result.state).toMatchObject({
      totalCitizensCount: 5,
      citizenGrowthProgress: 25,
      citizens: { unassigned: 5 },
    });
    expect(result.state.totalCitizensCount).toBeLessThanOrEqual(
      Number(result.state.buildings.habitation) * 3,
    );

    const replay = applyIdleAuthority(result.state, result.lastProcessedAt, now);
    expect(replay.report).toMatchObject({ appliedSeconds: 0, citizensAdded: 0 });
    expect(replay.state).toEqual(result.state);
  });

  it("is idempotent when the authoritative timestamp does not advance", () => {
    const now = new Date("2026-07-18T00:00:20.000Z");
    const first = applyIdleAuthority(base, "2026-07-18T00:00:00.000Z", now);
    const replay = applyIdleAuthority(first.state, first.lastProcessedAt, now);
    expect(replay.state).toEqual(first.state);
    expect(replay.report).toMatchObject({ elapsedSeconds: 0, appliedSeconds: 0, discardedSeconds: 0 });
  });

  it("preserves sub-second time across rapid authoritative treatments", () => {
    const origin = Date.parse("2026-07-18T00:00:00.000Z");
    let state: CanonicalGameState = structuredClone(base);
    let lastProcessedAt = new Date(origin).toISOString();
    let appliedSeconds = 0;

    for (let step = 1; step <= 10; step += 1) {
      const result = applyIdleAuthority(state, lastProcessedAt, new Date(origin + step * 200));
      state = result.state;
      lastProcessedAt = result.lastProcessedAt;
      appliedSeconds += result.report.appliedSeconds;
    }

    expect(appliedSeconds).toBe(2);
    expect(lastProcessedAt).toBe("2026-07-18T00:00:02.000Z");
  });

  it("does not truncate a PostgreSQL microsecond cursor during a rapid command", () => {
    const lastProcessedAt = "2026-07-18T00:00:00.657122+00:00";
    const result = applyIdleAuthority(
      base,
      lastProcessedAt,
      new Date("2026-07-18T00:00:00.900Z"),
    );

    expect(result.report.elapsedSeconds).toBe(0);
    expect(result.lastProcessedAt).toBe(lastProcessedAt);
  });

  it("counts only heroes whose resting gauges actually changed", () => {
    const result = applyIdleAuthority({ ...base, heroes: [
      makeHero({ status: "resting", currentHp: 2, currentMana: 0, calculatedStats: { ...makeHero().calculatedStats, maxHp: 20, maxMana: 10 } }),
      makeHero({ id: "idle-hero", status: "idle", currentHp: 2, currentMana: 0, calculatedStats: { ...makeHero().calculatedStats, maxHp: 20, maxMana: 10 } }),
    ] }, "2026-07-18T00:00:00.000Z", new Date("2026-07-18T00:00:02.000Z"));
    expect(result.report.heroesRecovered).toBe(1);
    expect((result.state.heroes as Array<{ currentHp: number }>)[0].currentHp).toBeCloseTo(2.8);
  });

  it("returns a fully restored hero to idle", () => {
    const result = applyIdleAuthority({ ...base, heroes: [
      makeHero({ status: "resting", currentHp: 19.8, currentMana: 9.8, calculatedStats: { ...makeHero().calculatedStats, maxHp: 20, maxMana: 10 } }),
    ] }, "2026-07-18T00:00:00.000Z", new Date("2026-07-18T00:00:01.000Z"));
    expect(result.state.heroes[0]).toMatchObject({ status: "idle", currentHp: 20, currentMana: 10 });
    expect(result.report).toMatchObject({ heroesRecovered: 1, heroesFullyRecovered: 1 });
  });

  it("recovers a generated novice against persisted authoritative maxima", () => {
    const novice = generateAuthoritativeNovice("idle-novice", "hero-idle") as unknown as Hero;
    const maxHp = novice.calculatedStats.maxHp;
    const maxMana = novice.calculatedStats.maxMana;
    const injured: Hero = { ...novice, status: "resting", currentHp: 1, currentMana: 0 };
    const result = applyIdleAuthority(
      { ...base, heroes: [injured] },
      "2026-07-18T00:00:00.000Z",
      new Date("2026-07-18T00:01:00.000Z"),
    );
    const recovered = result.state.heroes[0];
    expect(recovered.currentHp).toBe(maxHp);
    expect(recovered.currentMana).toBe(maxMana);
    expect(result.report.heroesRecovered).toBe(1);
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
