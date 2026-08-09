import { describe, expect, it } from "vitest";
import { createFounderCandidateView, createStartingFounderChoices, suggestCityName, toggleStartingFounder } from "../src/domain/onboardingPresentation";
import { makeHero } from "./fixtures/game";

describe("onboarding presentation", () => {
  it("projects canonical stat labels without mutating the authoritative hero", () => {
    const hero = makeHero({ name: "Avant", baseStats: { str: 10, agi: 8, end: 7, int: 6, wiz: 1, dex: 5, luk: 4 } });
    expect(createFounderCandidateView(hero, "Après")).toMatchObject({ name: "Après", bestStat: { label: "FOR", value: 10 }, weakestStat: { label: "SAG", value: 1 } });
    expect(hero.name).toBe("Avant");
  });

  it("uses one consistent male fallback when a legacy candidate has no gender", () => {
    const candidate = createFounderCandidateView(makeHero({ gender: undefined }));
    expect(candidate.genderLabel).toBe("Homme");
    expect(candidate.genderSymbol).toBe("♂");
    expect(candidate.portrait.gender).toBe("Male");
  });

  it("keeps exactly two rolling selections", () => {
    expect(toggleStartingFounder(["a", "b"], "c")).toEqual(["b", "c"]);
    expect(toggleStartingFounder(["a", "b"], "a")).toEqual(["b"]);
  });

  it("creates the minimal payload and deterministic suggestions", () => {
    const heroes = [makeHero({ id: "a", name: "A" }), makeHero({ id: "b", name: "B" })];
    expect(createStartingFounderChoices(heroes, ["b"], { b: "  Brune  " })).toEqual([{ id: "b", name: "Brune" }]);
    const draws = [0.5, 0, 0];
    expect(suggestCityName(() => draws.shift() ?? 0)).toBe("Val-Ombré");
  });
});
