import { describe, expect, it } from "vitest";
import { createHeroesPageView, createSelectedHeroView, resolveSelectedHeroId } from "../src/domain/heroPresentation";
import { makeHero, makeResources } from "./fixtures/game";

describe("heroPresentation", () => {
  it("selects the first active hero and preserves an existing local selection", () => {
    const reserve = makeHero({ id: "reserve", isActive: false });
    const active = makeHero({ id: "active", isActive: true });
    expect(resolveSelectedHeroId([reserve, active], null)).toBe("active");
    expect(resolveSelectedHeroId([reserve, active], "reserve")).toBe("reserve");
    expect(resolveSelectedHeroId([reserve], "removed")).toBe("reserve");
  });

  it("projects health and the four-member party limit from shared domain rules", () => {
    const active = Array.from({ length: 4 }, (_, index) => makeHero({ id: `active-${index}`, isActive: true }));
    const injured = makeHero({ id: "injured", isActive: false, currentHp: 0 });
    const reserve = makeHero({ id: "reserve", isActive: false, currentHp: 10 });
    const view = createHeroesPageView([...active, injured, reserve], makeResources(), { guilde: 5 });
    expect(view.roster.filter((hero) => hero.isActive)).toHaveLength(4);
    expect(view.party).toHaveLength(4);
    expect(view.party.every((hero) => hero?.isActive)).toBe(true);
    expect(view.roster.find((hero) => hero.id === "injured")).toMatchObject({ canDeploy: false, deploymentBlockReason: "Héros blessé" });
    expect(view.roster.find((hero) => hero.id === "reserve")).toMatchObject({ canDeploy: false, deploymentBlockReason: "Groupe complet" });
  });

  it("projects authoritative recruitment cost and capacity eligibility", () => {
    const view = createHeroesPageView([makeHero()], { ...makeResources(), gold: 10 }, { guilde: 1 });
    expect(view).toMatchObject({ capacity: 3, recruitCost: 250, canRecruit: false, recruitmentBlockReason: "Or insuffisant" });
  });

  it("prepares party slots and health percentages outside React", () => {
    const active = makeHero({ id: "active", isActive: true, currentHp: 5, calculatedStats: { ...makeHero().calculatedStats, maxHp: 20 } });
    const view = createHeroesPageView([active], makeResources(), { guilde: 1 });
    expect(view.party[0]).toMatchObject({ id: "active", healthPercent: 25 });
    expect(view.party.slice(1)).toEqual([null, null, null]);
  });

  it("projects selected hero details outside the React panel", () => {
    const hero = makeHero({ name: "Ariane", classType: "Guerrier", xp: 25, xpNeeded: 100 });
    const view = createSelectedHeroView(hero);
    expect(view).toMatchObject({ name: "Ariane", level: 1, identityLabel: "Humain · Guerrier · Niveau 1", xpPercent: 25 });
    expect(view?.attributes).toHaveLength(7);
    expect(view?.combatStats.find((stat) => stat.label === "DPS estimé")?.value).toBe("6.60");
  });
});
