import { describe, expect, it } from "vitest";
import { shouldRefreshTownAuthority } from "../src/domain/townHeartbeat";
import { makeHero } from "./fixtures/game";

const idleInput = () => ({
  rates: { food: 0, wood: 0, stone: 0, ore: 0 },
  food: 0,
  totalCitizens: 3,
  habitationLevel: 1,
  heroes: [],
});

describe("authoritative town heartbeat", () => {
  it("stays stopped when canonical time cannot change the state", () => {
    expect(shouldRefreshTownAuthority(idleInput())).toBe(false);
  });

  it("runs for production or viable immigration", () => {
    expect(shouldRefreshTownAuthority({
      ...idleInput(),
      rates: { food: 0, wood: 1, stone: 0, ore: 0 },
    })).toBe(true);
    expect(shouldRefreshTownAuthority({
      ...idleInput(),
      food: 1,
      habitationLevel: 2,
    })).toBe(true);
  });

  it("runs only while a resting hero still needs recovery", () => {
    expect(shouldRefreshTownAuthority({
      ...idleInput(),
      heroes: [makeHero({ status: "resting", currentHp: 19 })],
    })).toBe(true);
    expect(shouldRefreshTownAuthority({
      ...idleInput(),
      heroes: [makeHero({ status: "resting" })],
    })).toBe(false);
  });
});
