import { describe, expect, it } from "vitest";
import { createHeroEquipmentView } from "../src/domain/heroEquipmentPresentation";
import { refreshHeroDerivedStats } from "../src/utils/gameCalculations";
import { makeHero } from "./fixtures/game";

describe("heroEquipmentPresentation", () => {
  it("prepares an atomic replacement comparison", () => {
    const hero = refreshHeroDerivedStats(makeHero({
      level: 10,
      equipment: {
        mainHand: { instanceId: "old-sword", itemId: "starter_sword", rarity: "common" },
        offHand: { instanceId: "old-shield", itemId: "wooden_shield", rarity: "common" },
        armor: null,
        accessory: null,
      },
    }));
    const view = createHeroEquipmentView(hero, [{ instanceId: "new-greatsword", itemId: "basic_greatsword", rarity: "common" }]);
    const candidate = view?.slots.find((slot) => slot.key === "mainHand")?.candidates[0];
    expect(candidate?.displacedItems).toEqual(["Épée de départ", "Bouclier en bois"]);
    expect(candidate?.statDeltas.length).toBeGreaterThan(0);
  });

  it("blocks off-hand candidates behind a two-handed main hand", () => {
    const hero = makeHero({
      level: 10,
      equipment: { mainHand: { instanceId: "greatsword", itemId: "basic_greatsword", rarity: "common" }, offHand: null, armor: null, accessory: null },
    });
    const slot = createHeroEquipmentView(hero, [{ instanceId: "shield", itemId: "wooden_shield", rarity: "common" }])?.slots.find((entry) => entry.key === "offHand");
    expect(slot).toMatchObject({ blocked: true, candidates: [] });
  });
});
