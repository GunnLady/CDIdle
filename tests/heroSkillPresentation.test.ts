import { describe, expect, it } from "vitest";
import { createHeroSkillsView } from "../src/domain/heroSkillPresentation";
import { makeHero } from "./fixtures/game";

describe("heroSkillPresentation", () => {
  it("projects active and passive skills without catalog work in React", () => {
    const view = createHeroSkillsView(makeHero({ activeSkills: ["heavy_blow"], passiveSkills: ["survival_instinct"] }));
    expect(view?.active[0]).toMatchObject({ resourceLabel: "Coût en mana : 14 · Temps de recharge : 3 tours", targetLabel: "Ennemi unique" });
    expect(view?.passive[0]).toMatchObject({ resourceLabel: "+3% PV max", effectSummary: undefined });
    expect(view?.active[0].effectSummary).toContain("Inflige");
  });
});
