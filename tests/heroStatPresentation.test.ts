import { describe, expect, it } from "vitest";
import {
  CANONICAL_HERO_STAT_PRESENTATION,
  formatCanonicalHeroStatLabel,
  isCanonicalHeroStat,
} from "../shared/domain/hero-stats";

describe("canonical hero stat presentation", () => {
  it("uses one French label set across domain and front", () => {
    expect(Object.fromEntries(Object.entries(CANONICAL_HERO_STAT_PRESENTATION).map(([key, value]) => [
      key,
      value.short,
    ]))).toEqual({
      str: "FOR",
      agi: "AGI",
      end: "END",
      int: "INT",
      wiz: "SAG",
      dex: "DEX",
      luk: "LUK",
    });
    expect(formatCanonicalHeroStatLabel("str")).toBe("Force (FOR)");
    expect(formatCanonicalHeroStatLabel("wiz")).toBe("Sagesse (SAG)");
    expect(isCanonicalHeroStat("luk")).toBe(true);
    expect(isCanonicalHeroStat("cha")).toBe(false);
  });
});
