import { describe, expect, it } from "vitest";
import { formatCanonicalIdleReport } from "../src/domain/idleReport";

describe("canonical idle report", () => {
  it("hides short reconciliation noise and summarizes meaningful returns", () => {
    expect(formatCanonicalIdleReport({
      elapsedSeconds: 5,
      appliedSeconds: 5,
      discardedSeconds: 0,
      resourcesProduced: { food: 5, wood: 0, stone: 0, ore: 0 },
      foodConsumed: 0,
      citizensAdded: 0,
      heroesRecovered: 0,
      heroesFullyRecovered: 0,
    })).toBeNull();
    expect(formatCanonicalIdleReport({
      elapsedSeconds: 90_000,
      appliedSeconds: 86_400,
      discardedSeconds: 3_600,
      resourcesProduced: { food: 42, wood: 5, stone: 0, ore: 0 },
      foodConsumed: 20,
      citizensAdded: 1,
      heroesRecovered: 2,
      heroesFullyRecovered: 1,
    })).toContain("+1 citoyen(s)");
  });

  it("reports only completed recovery during a short reconciliation", () => {
    const report = {
      elapsedSeconds: 30,
      appliedSeconds: 30,
      discardedSeconds: 0,
      resourcesProduced: { food: 0, wood: 0, stone: 0, ore: 0 },
      foodConsumed: 0,
      citizensAdded: 0,
      heroesRecovered: 1,
    };
    expect(formatCanonicalIdleReport({ ...report, heroesFullyRecovered: 0 })).toBeNull();
    expect(formatCanonicalIdleReport({ ...report, heroesFullyRecovered: 1 })).toContain("entièrement rétabli");
  });
});
