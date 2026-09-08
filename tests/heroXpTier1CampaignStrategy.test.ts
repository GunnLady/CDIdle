import { describe, expect, it } from "vitest";
import { shouldReviewEquipment } from "./helpers/heroXpTier1Campaign";

describe("Tier 1 equipment simulation profiles", () => {
  it("reviews every profitable drop for the optimized profile", () => {
    expect(shouldReviewEquipment("optimized", {
      bossCompleted: false,
      itemLooted: true,
      progressionChanged: false,
      resumed: false,
    })).toBe(true);
  });

  it.each([
    ["level-up", { progressionChanged: true }],
    ["boss", { bossCompleted: true }],
    ["resume", { resumed: true }],
  ])("reviews on %s for the average profile", (_label, override) => {
    expect(shouldReviewEquipment("average", {
      bossCompleted: false,
      itemLooted: false,
      progressionChanged: false,
      resumed: false,
      ...override,
    })).toBe(true);
  });

  it("does not micromanage an ordinary drop for the average profile", () => {
    expect(shouldReviewEquipment("average", {
      bossCompleted: false,
      itemLooted: true,
      progressionChanged: false,
      resumed: false,
    })).toBe(false);
  });
});
