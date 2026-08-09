import { describe, expect, it } from "vitest";
import { createStorageEquipmentDecisionView, createStorageInventoryItemViews, createStorageSummaryView, filterAndSortStorageItems, resolveStorageItems } from "../src/domain/storagePresentation";
import { makeHero } from "./fixtures/game";

describe("storage presentation", () => {
  it("projects current equipment, displaced items and before/after statistics", () => {
    const selected = { instanceId: "lute", itemId: "basic_lute", rarity: "common" as const };
    const hero = makeHero({
      id: "target",
      name: "Cible",
      level: 20,
      equipment: {
        mainHand: { instanceId: "old-main", itemId: "starter_sword", rarity: "common" },
        offHand: { instanceId: "old-off", itemId: "wooden_shield", rarity: "common" },
        armor: null,
        accessory: null,
      },
    });
    const view = createStorageEquipmentDecisionView(selected, [hero]);
    expect(view?.targets[0].currentItem?.name).toBe("Épée de départ");
    expect(view?.targets[0].candidate?.displacedItems).toEqual(expect.arrayContaining(["Épée de départ", "Bouclier en bois"]));
    for (const delta of view?.targets[0].candidate?.statDeltas ?? []) {
      expect(delta.after - delta.before).toBeCloseTo(delta.value, 2);
    }
  });

  it("filters a display copy without changing canonical storage order", () => {
    const canonical = [
      { instanceId: "late", itemId: "basic_sword", rarity: "legendary" as const },
      { instanceId: "early", itemId: "starter_sword", rarity: "common" as const },
    ];
    const result = filterAndSortStorageItems(resolveStorageItems(canonical), {
      searchTerm: "",
      rarity: "all",
      itemType: "all",
      levelRange: "all",
      sortKey: "requiredLevel",
      sortDirection: "asc",
    });
    expect(result.map((item) => item.instanceId)).toEqual(["early", "late"]);
    expect(canonical.map((item) => item.instanceId)).toEqual(["late", "early"]);
  });

  it("explains an off-hand blocked by a two-handed main weapon", () => {
    const selected = { instanceId: "shield", itemId: "wooden_shield", rarity: "common" as const };
    const hero = makeHero({
      level: 20,
      equipment: {
        mainHand: { instanceId: "lute-equipped", itemId: "basic_lute", rarity: "common" },
        offHand: null,
        armor: null,
        accessory: null,
      },
    });
    const target = createStorageEquipmentDecisionView(selected, [hero])?.targets[0];
    expect(target?.candidate).toBeNull();
    expect(target?.blockedReason).toBe("Bloquée par l’arme principale");
  });

  it("prepares inventory and forge summary models outside presentation panels", () => {
    const inventory = createStorageInventoryItemViews(resolveStorageItems([
      { instanceId: "sword", itemId: "starter_sword", rarity: "common" },
    ]));
    expect(inventory[0]).toMatchObject({ instanceId: "sword", itemTypeLabel: "Arme" });
    expect(inventory[0].item.facts).toContain("Profil : 1 coup × 100 % de puissance");

    const summary = createStorageSummaryView(1, true, [
      { materialId: "metal_scrap", rarity: "common", count: 7 },
    ]);
    expect(summary.itemCount).toBe(1);
    expect(summary.materials.find((material) => material.id === "metal_scrap")?.count).toBe(7);
  });
});
