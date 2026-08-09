import { describe, expect, it } from "vitest";
import { createRecruitmentOfferView } from "../src/domain/recruitmentPresentation";
import { recruitmentCost } from "../shared/domain/hero";
import { makeHero } from "./fixtures/game";

describe("recruitment presentation", () => {
  it("projects the shared recruitment cost and canonical candidate summary", () => {
    const offer = createRecruitmentOfferView(makeHero({
      name: "Avant",
      gender: "Female",
      baseStats: { str: 4, agi: 9, end: 6, int: 2, wiz: 1, dex: 7, luk: 3 },
    }), 3, "Après");

    expect(offer).toMatchObject({
      name: "Après",
      cost: recruitmentCost(3),
      genderText: "♀ Femme",
      bestStat: { label: "AGI", value: 9 },
      weakestStat: { label: "SAG", value: 1 },
    });
  });

  it("keeps the legacy gender fallback consistent", () => {
    const offer = createRecruitmentOfferView(makeHero({ gender: undefined }), 0);
    expect(offer.genderText).toBe("♂ Homme");
    expect(offer.portrait.gender).toBe("Male");
  });

  it("preserves the historical recruitment mana fallback", () => {
    const hero = makeHero({ calculatedStats: { ...makeHero().calculatedStats, maxMana: 0 } });
    expect(createRecruitmentOfferView(hero, 0).maxMana).toBe(20);
  });
});
