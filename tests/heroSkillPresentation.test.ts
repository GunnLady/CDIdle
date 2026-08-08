import { describe, expect, it } from "vitest";
import { createHeroSkillsView } from "../src/domain/heroSkillPresentation";
import { makeHero } from "./fixtures/game";

describe("heroSkillPresentation", () => {
  it("projects active and passive skills without catalog work in React", () => {
    const view = createHeroSkillsView(makeHero({ activeSkills: ["heavy_blow"], passiveSkills: ["survival_instinct"] }));
    expect(view?.active[0]).toMatchObject({ resourceLabel: expect.stringContaining("PM"), targetLabel: "Ennemi unique" });
    expect(view?.passive[0]).toMatchObject({ resourceLabel: "Passif" });
    expect(view?.active[0].effectSummary).toContain("Inflige");
  });
});
