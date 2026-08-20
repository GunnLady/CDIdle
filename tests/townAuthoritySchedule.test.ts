import { describe, expect, it } from "vitest";
import { nextTownAuthorityRecoveryDelayMs } from "../src/domain/townAuthoritySchedule";
import { makeHero } from "./fixtures/game";

describe("town authority schedule", () => {
  it("stays stopped without a resting hero who needs recovery", () => {
    expect(nextTownAuthorityRecoveryDelayMs([])).toBeNull();
    expect(nextTownAuthorityRecoveryDelayMs([makeHero({ status: "idle" })])).toBeNull();
    expect(nextTownAuthorityRecoveryDelayMs([makeHero({ status: "resting" })])).toBeNull();
  });

  it("schedules the earliest complete hero recovery", () => {
    const slow = makeHero({
      status: "resting",
      currentHp: 0,
      currentMana: 0,
    });
    const fast = makeHero({
      status: "resting",
      currentHp: 19,
      currentMana: 19,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 20,
        maxMana: 20,
      },
    });
    expect(nextTownAuthorityRecoveryDelayMs([slow, fast])).toBe(2_500);
  });

  it("waits for both gauges of the same hero", () => {
    const hero = makeHero({
      status: "resting",
      currentHp: 19,
      currentMana: 10,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 20,
        maxMana: 20,
      },
    });
    expect(nextTownAuthorityRecoveryDelayMs([hero])).toBe(25_000);
  });
});
