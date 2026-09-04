import { describe, expect, it } from "vitest";
import { createHeroEquipmentView } from "../src/domain/heroEquipmentPresentation";
import { refreshHeroDerivedStats } from "../src/utils/gameCalculations";
import { makeHero } from "./fixtures/game";

describe("heroEquipmentPresentation", () => {
  it("prepares an atomic replacement comparison", () => {
    const hero = refreshHeroDerivedStats(makeHero({
      level: 10,
      equipment: {
        mainHand: { instanceId: "old-sword", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" },
        offHand: { instanceId: "old-shield", itemId: "wooden_shield", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" },
        armor: null,
        accessory: null,
      },
    }));
    const view = createHeroEquipmentView(hero, [{
      instanceId: "new-greatsword",
      itemId: "basic_greatsword",
      itemLevel: 10,
      powerModelId: "legacy-fixed-v1",
      rarity: "common",
    }]);
    const candidate = view?.slots.find((slot) => slot.key === "mainHand")?.candidates[0];
    expect(candidate?.displacedItems).toEqual(["Épée de départ", "Bouclier en bois"]);
    expect(candidate?.statDeltas.length).toBeGreaterThan(0);
    expect(candidate?.item.rarityLabel).toBe("Commune");
    expect(candidate?.item.facts.map((fact) => fact.label)).toEqual([
      "Niveau requis",
      "Dégâts",
      "Vitesse d’attaque",
      "Type de dégâts",
      "Caractéristique",
      "Profil d’attaque",
    ]);
    expect(candidate?.item.facts.find((fact) => fact.id === "damage-types")?.value).toBe("Physiques");
  });

  it("blocks off-hand candidates behind a two-handed main hand", () => {
    const hero = makeHero({
      level: 10,
      equipment: {
        mainHand: {
          instanceId: "greatsword",
          itemId: "basic_greatsword",
          itemLevel: 10,
          powerModelId: "legacy-fixed-v1",
          rarity: "common",
        },
        offHand: null,
        armor: null,
        accessory: null,
      },
    });
    const slot = createHeroEquipmentView(hero, [{ instanceId: "shield", itemId: "wooden_shield", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" }])?.slots.find((entry) => entry.key === "offHand");
    expect(slot).toMatchObject({ blocked: true, candidates: [] });
  });
});
