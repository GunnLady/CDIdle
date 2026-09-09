import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StoragePanel from "../src/components/StoragePanel";
import { makeHero } from "./fixtures/game";

afterEach(cleanup);

describe("StoragePanel modifier stacks", () => {
  it("exposes shared panel and control semantics", () => {
    render(<StoragePanel storedItems={[{ instanceId: "shared-control", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" }]} />);
    for (const testId of ["storage-summary", "storage-toolbar", "item-inventory-panel", "storage-equipment-decision"]) {
      expect(screen.getByTestId(testId)).toHaveAttribute("aria-labelledby");
    }
    expect(screen.getByRole("button", { name: "Réinitialiser" })).toHaveAttribute("data-state", "disabled");
    expect(within(screen.getByTestId("storage-item-shared-control")).getByRole("button", { name: "Équiper" })).toHaveAttribute("data-state", "ready");
  });

  it("groups boss components separately from ordinary forge materials", () => {
    render(<StoragePanel
      storedItems={[]}
      isForgeUnlocked
      forgeMaterials={[{ materialId: "rat_king_mark", rarity: "epic", count: 3 }]}
    />);

    expect(screen.getByRole("heading", { name: "Composants de boss" })).toBeInTheDocument();
    expect(screen.getByText("Roi des Rats")).toBeInTheDocument();
    expect(screen.getByText("Marque du Roi")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
  it("displays the guaranteed dual-wield profile from the catalog", () => {
    render(<StoragePanel
      storedItems={[{ instanceId: "dual-profile", itemId: "basic_gauntlets", itemLevel: 10, powerModelId: "legacy-fixed-v1", rarity: "common" }]}
    />);

    expect(screen.getByText("2 × 65 %")).toBeInTheDocument();
  });

  it("filters items by required-level bands and resets the level filter", () => {
    render(<StoragePanel
      storedItems={[
        { instanceId: "item-level-1", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" },
        { instanceId: "item-level-10", itemId: "basic_sword", itemLevel: 10, powerModelId: "legacy-fixed-v1", rarity: "common" },
        { instanceId: "item-level-20", itemId: "steel_sword", itemLevel: 20, powerModelId: "legacy-fixed-v1", rarity: "uncommon" },
        { instanceId: "item-level-33", itemId: "eclipse_heart_spellbook", itemLevel: 33, powerModelId: "legacy-fixed-v1", rarity: "legendary" },
      ]}
    />);

    const levelRange = screen.getByRole("combobox", { name: "Tranche de niveau requis" });
    const expectedByRange = [
      ["1-5", "Épée de départ"],
      ["6-10", "Épée simple"],
      ["16-20", "Épée en acier"],
      ["31-35", "Grimoire du cœur d’éclipse"],
    ];

    for (const [range, expectedName] of expectedByRange) {
      fireEvent.change(levelRange, { target: { value: range } });
      expect(screen.getAllByText(/^(Épée de départ|Épée simple|Épée en acier|Grimoire du cœur d’éclipse)$/))
        .toHaveLength(1);
      expect(screen.getByText(expectedName)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(levelRange).toHaveValue("all");
    expect(screen.getAllByText(/^(Épée de départ|Épée simple|Épée en acier|Grimoire du cœur d’éclipse)$/))
      .toHaveLength(4);
  });

  it("sorts the displayed copy in both directions and resets the controls", () => {
    render(<StoragePanel
      storedItems={[
        { instanceId: "item-basic", itemId: "basic_sword", itemLevel: 10, powerModelId: "legacy-fixed-v1", rarity: "legendary" },
        { instanceId: "item-starter", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "rare" },
        { instanceId: "item-steel", itemId: "steel_sword", itemLevel: 20, powerModelId: "legacy-fixed-v1", rarity: "common" },
      ]}
    />);

    const displayedNames = () => screen.getAllByText(/^(Épée simple|Épée de départ|Épée en acier)$/)
      .map((element) => element.textContent);
    const sortCriterion = screen.getByRole("combobox", { name: "Critère de tri" });
    const sortDirection = screen.getByRole("combobox", { name: "Direction du tri" });

    fireEvent.change(sortCriterion, { target: { value: "rarity" } });
    expect(displayedNames()).toEqual(["Épée en acier", "Épée de départ", "Épée simple"]);
    fireEvent.change(sortDirection, { target: { value: "desc" } });
    expect(displayedNames()).toEqual(["Épée simple", "Épée de départ", "Épée en acier"]);

    fireEvent.change(sortCriterion, { target: { value: "requiredLevel" } });
    expect(displayedNames()).toEqual(["Épée en acier", "Épée simple", "Épée de départ"]);
    fireEvent.change(sortDirection, { target: { value: "asc" } });
    expect(displayedNames()).toEqual(["Épée de départ", "Épée simple", "Épée en acier"]);

    fireEvent.change(sortCriterion, { target: { value: "name" } });
    expect(displayedNames()).toEqual(["Épée de départ", "Épée en acier", "Épée simple"]);
    fireEvent.change(sortDirection, { target: { value: "desc" } });
    expect(displayedNames()).toEqual(["Épée simple", "Épée en acier", "Épée de départ"]);

    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(displayedNames()).toEqual(["Épée simple", "Épée de départ", "Épée en acier"]);
    expect(sortCriterion).toHaveValue("none");
    expect(sortDirection).toHaveValue("asc");
  });

  it("renders and recycles same-item stacks independently", () => {
    const onScrapItem = vi.fn();
    const physical = [{ stat: "physicalDamage", type: "flat" as const, value: 2 }];
    const critical = [{ stat: "criticalChance", type: "flat" as const, value: 1 }];

    render(<StoragePanel
      storedItems={[
        { instanceId: "item-physical", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "uncommon", modifiers: physical },
        { instanceId: "item-critical", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "uncommon", modifiers: critical },
      ]}
      isForgeUnlocked
      onScrapItem={onScrapItem}
    />);

    expect(screen.getAllByText(/épée de départ/i)).toHaveLength(2);
    expect(screen.getByText("+2 Dégâts Phys")).toBeInTheDocument();
    expect(screen.getByText("+1 Coup Critique")).toBeInTheDocument();
    expect(screen.queryByText(/item-physical|item-critical/)).not.toBeInTheDocument();

    expect(screen.getAllByText("Force")).toHaveLength(2);
    expect(screen.getAllByText("1 × 100 %")).toHaveLength(2);

    const recycleButtons = screen.getAllByRole("button", { name: /recycler/i });
    expect(recycleButtons).toHaveLength(2);
    const recycledCard = screen.getByTestId("storage-item-item-critical");
    fireEvent.click(recycleButtons[1]);
    expect(within(recycledCard).queryByRole("button", { name: "Équiper" })).not.toBeInTheDocument();
    expect(within(recycledCard).queryByRole("button", { name: "Recycler" })).not.toBeInTheDocument();
    expect(within(recycledCard).getAllByRole("button", { name: /^(Oui|Non)$/ })).toHaveLength(2);
    expect(within(recycledCard).getByRole("button", { name: "Oui" })).toHaveAttribute("data-button-variant", "primary");
    expect(within(recycledCard).getByRole("button", { name: "Non" })).toHaveAttribute("data-button-variant", "danger");
    fireEvent.click(within(recycledCard).getByRole("button", { name: "Non" }));
    expect(onScrapItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /recycler/i })[1]);
    expect(within(recycledCard).queryByRole("button", { name: "Équiper" })).not.toBeInTheDocument();
    fireEvent.click(within(recycledCard).getByRole("button", { name: "Oui" }));
    expect(onScrapItem).toHaveBeenCalledOnce();
    expect(onScrapItem).toHaveBeenCalledWith("item-critical");
  });

  it("equips the selected instance when identical items are listed", () => {
    const onEquipItem = vi.fn();
    render(<StoragePanel
      storedItems={[
        { instanceId: "item-first", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" },
        { instanceId: "item-second", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" },
      ]}
      heroes={[makeHero({ id: "hero-target", name: "Cible" })]}
      onEquipItem={onEquipItem}
    />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Équiper$/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /Cible/ }));
    fireEvent.click(within(screen.getByTestId("storage-equipment-decision")).getByRole("button", { name: "Équiper" }));
    expect(onEquipItem).toHaveBeenCalledOnce();
    expect(onEquipItem).toHaveBeenCalledWith("hero-target", "item-second");
  });

  it("allows a Tier 1 reward for a class outside its vocation pool", () => {
    const onEquipItem = vi.fn();
    render(<StoragePanel
      storedItems={[{ instanceId: "item-lute", itemId: "basic_lute", itemLevel: 10, powerModelId: "legacy-fixed-v1", rarity: "common" }]}
      heroes={[makeHero({ id: "hero-warrior", name: "Guerrier test", classType: "Guerrier", level: 10 })]}
      onEquipItem={onEquipItem}
    />);

    fireEvent.click(screen.getByRole("button", { name: /quiper$/i }));
    const heroButton = screen.getByRole("button", { name: /Guerrier test/ });
    expect(heroButton).not.toBeDisabled();
    fireEvent.click(heroButton);
    fireEvent.click(within(screen.getByTestId("storage-equipment-decision")).getByRole("button", { name: "Équiper" }));
    expect(onEquipItem).toHaveBeenCalledWith("hero-warrior", "item-lute");
  });

  it("keeps item and hero consultation local in read-only mode", () => {
    const onEquipItem = vi.fn();
    render(<StoragePanel
      storedItems={[{ instanceId: "item-readonly", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" }]}
      heroes={[makeHero({ id: "hero-readonly", name: "Observatrice" })]}
      onEquipItem={onEquipItem}
      canMutate={false}
    />);

    fireEvent.click(within(screen.getByTestId("storage-item-item-readonly")).getByRole("button", { name: /Épée de départ/ }));
    const decision = screen.getByTestId("storage-equipment-decision");
    expect(within(decision).getByText("Observatrice")).toBeInTheDocument();
    const targetCard = within(decision).getByRole("button", { name: /Observatrice/ });
    fireEvent.click(targetCard);
    for (const [short, name] of [["FOR", "Force"], ["AGI", "Agilité"], ["END", "Endurance"], ["INT", "Intelligence"], ["SAG", "Sagesse"], ["DEX", "Dextérité"], ["LUK", "Chance"]]) {
      expect(within(targetCard).getByText(short)).toBeInTheDocument();
      expect(within(targetCard).getByTitle(name)).toHaveTextContent("5");
    }
    expect(within(targetCard).getByText("Caractéristiques")).toBeInTheDocument();
    expect(within(targetCard).getByText("Statistiques de combat")).toBeInTheDocument();
    expect(within(targetCard).getByText("PV")).toBeInTheDocument();
    expect(within(targetCard).getByText("20/20")).toBeInTheDocument();
    expect(within(targetCard).getByText("DPS")).toBeInTheDocument();
    expect(within(targetCard).getByText("6.60")).toBeInTheDocument();
    for (const label of ["Héros cible", "Équipement actuel", "Équipement sélectionné", "Gains et pertes", "Action"]) {
      expect(within(decision).getByText(label)).toBeInTheDocument();
    }
    expect(within(decision).getByRole("button", { name: "Équiper" })).toBeDisabled();
    expect(onEquipItem).not.toHaveBeenCalled();
  });

  it("supports hero-first equipment inside Storage and keeps heroes one per row", () => {
    const onEquipItem = vi.fn();
    render(<StoragePanel
      storedItems={[{ instanceId: "hero-first-sword", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" }]}
      heroes={[makeHero({ id: "hero-first", name: "Ariane" }), makeHero({ id: "hero-second", name: "Borin" })]}
      onEquipItem={onEquipItem}
    />);

    const decision = screen.getByTestId("storage-equipment-decision");
    expect(within(decision).getByRole("heading", { name: "Équipement des héros" })).toBeInTheDocument();
    expect(screen.getByTestId("storage-hero-list")).toHaveClass("grid", "gap-2");
    fireEvent.click(within(decision).getByRole("button", { name: /Ariane/ }));
    const picker = screen.getByTestId("storage-hero-item-picker");
    fireEvent.click(within(picker).getByRole("button", { name: /Épée de départ/ }));
    expect(within(decision).getByText("Équipement actuel")).toBeInTheDocument();
    expect(within(decision).getByText("Équipement sélectionné")).toBeInTheDocument();
    expect(within(decision).getByText("Gains et pertes")).toBeInTheDocument();
    fireEvent.click(within(decision).getByRole("button", { name: "Équiper" }));
    expect(onEquipItem).toHaveBeenCalledWith("hero-first", "hero-first-sword");
  });

  it("distinguishes an empty storage from an empty filtered result", () => {
    const { rerender } = render(<StoragePanel storedItems={[]} />);
    expect(screen.getByText("Votre coffre est vide.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Réinitialiser les filtres" })).not.toBeInTheDocument();

    rerender(<StoragePanel storedItems={[{ instanceId: "filtered", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" }]} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Rechercher un objet" }), { target: { value: "introuvable" } });
    expect(screen.getByText("Aucun objet ne correspond aux filtres.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réinitialiser les filtres" })).toBeInTheDocument();
  });
});
