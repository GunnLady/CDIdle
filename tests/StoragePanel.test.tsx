import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StoragePanel from "../src/components/StoragePanel";
import { makeHero } from "./fixtures/game";

afterEach(cleanup);

describe("StoragePanel modifier stacks", () => {
  it("displays the guaranteed dual-wield profile from the catalog", () => {
    render(<StoragePanel
      storedItems={[{ instanceId: "dual-profile", itemId: "basic_gauntlets", rarity: "common" }]}
    />);

    expect(screen.getByText("Profil : 2 coups × 65 % de puissance")).toBeInTheDocument();
  });

  it("filters items by required-level bands and resets the level filter", () => {
    render(<StoragePanel
      storedItems={[
        { instanceId: "item-level-1", itemId: "starter_sword", rarity: "common" },
        { instanceId: "item-level-10", itemId: "basic_sword", rarity: "common" },
        { instanceId: "item-level-20", itemId: "steel_sword", rarity: "uncommon" },
        { instanceId: "item-level-33", itemId: "eclipse_heart_spellbook", rarity: "legendary" },
      ]}
    />);

    const levelRange = screen.getByRole("combobox", { name: "Tranche de niveau requis" });
    const expectedByRange = [
      ["1-9", "Épée de départ"],
      ["10-19", "Épée simple"],
      ["20-29", "Épée en acier"],
      ["30+", "Grimoire du cœur d’éclipse"],
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
        { instanceId: "item-basic", itemId: "basic_sword", rarity: "legendary" },
        { instanceId: "item-starter", itemId: "starter_sword", rarity: "rare" },
        { instanceId: "item-steel", itemId: "steel_sword", rarity: "common" },
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
        { instanceId: "item-physical", itemId: "starter_sword", rarity: "uncommon", modifiers: physical },
        { instanceId: "item-critical", itemId: "starter_sword", rarity: "uncommon", modifiers: critical },
      ]}
      isForgeUnlocked
      onScrapItem={onScrapItem}
    />);

    expect(screen.getAllByText(/épée de départ/i)).toHaveLength(2);
    expect(screen.getByText("+2 Dégâts Phys")).toBeInTheDocument();
    expect(screen.getByText("+1 Coup Critique")).toBeInTheDocument();
    expect(screen.queryByText(/item-physical|item-critical/)).not.toBeInTheDocument();

    expect(screen.getAllByText(/Scaling : Puissance \(FOR\)/)).toHaveLength(2);
    expect(screen.getAllByText(/Profil : 1 coup × 100 % de puissance/)).toHaveLength(2);

    const recycleButtons = screen.getAllByRole("button", { name: /recycler/i });
    expect(recycleButtons).toHaveLength(2);
    fireEvent.click(recycleButtons[1]);
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onScrapItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /recycler/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));
    expect(onScrapItem).toHaveBeenCalledOnce();
    expect(onScrapItem).toHaveBeenCalledWith("item-critical");
  });

  it("equips the selected instance when identical items are listed", () => {
    const onEquipItem = vi.fn();
    render(<StoragePanel
      storedItems={[
        { instanceId: "item-first", itemId: "starter_sword", rarity: "common" },
        { instanceId: "item-second", itemId: "starter_sword", rarity: "common" },
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
      storedItems={[{ instanceId: "item-lute", itemId: "basic_lute", rarity: "common" }]}
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
      storedItems={[{ instanceId: "item-readonly", itemId: "starter_sword", rarity: "common" }]}
      heroes={[makeHero({ id: "hero-readonly", name: "Observatrice" })]}
      onEquipItem={onEquipItem}
      canMutate={false}
    />);

    fireEvent.click(within(screen.getByTestId("storage-item-item-readonly")).getByRole("button", { name: /Épée de départ/ }));
    const decision = screen.getByTestId("storage-equipment-decision");
    expect(within(decision).getByText("Observatrice")).toBeInTheDocument();
    expect(within(decision).getByRole("button", { name: "Équiper" })).toBeDisabled();
    expect(onEquipItem).not.toHaveBeenCalled();
  });

  it("distinguishes an empty storage from an empty filtered result", () => {
    const { rerender } = render(<StoragePanel storedItems={[]} />);
    expect(screen.getByText("Votre coffre est vide.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Réinitialiser les filtres" })).not.toBeInTheDocument();

    rerender(<StoragePanel storedItems={[{ instanceId: "filtered", itemId: "starter_sword", rarity: "common" }]} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Rechercher un objet" }), { target: { value: "introuvable" } });
    expect(screen.getByText("Aucun objet ne correspond aux filtres.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réinitialiser les filtres" })).toBeInTheDocument();
  });
});
