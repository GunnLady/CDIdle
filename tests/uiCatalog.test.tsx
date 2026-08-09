import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import UiCatalog from "../src/ui/catalog/UiCatalog";

afterEach(cleanup);

describe("UI catalog", () => {
  it("renders representative production component states", async () => {
    const user = userEvent.setup();
    render(<UiCatalog />);
    expect(screen.getByTestId("ui-catalog-root")).toBeInTheDocument();
    expect(screen.getByTestId("ui-catalog-root").firstElementChild).toHaveClass("w-full", "min-w-0", "max-w-5xl");
    expect(screen.getByRole("button", { name: "Chargement" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Code d'invitation")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("progressbar", { name: "Construction" })).toBeInTheDocument();
    expect(within(screen.getByTestId("catalog-control-variants")).getByRole("combobox", { name: "Type d’objet" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Accepter l’amélioration" })).toBeInTheDocument();
    expect(screen.getByTestId("catalog-selection-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-navigation-status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Boutons" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));
    expect(screen.getByRole("dialog", { name: "Confirmer l'action" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvrir le dialogue" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Ouvrir un choix" }));
    expect(screen.getByRole("dialog", { name: "Choisir une vocation" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Simuler une notification" }));
    expect(screen.getByText("La synchronisation est terminée.").closest("[role=status]")).toBeInTheDocument();
  });

  it("covers the remaining product compositions with real interactive components", async () => {
    const user = userEvent.setup();
    render(<UiCatalog />);

    const shell = screen.getByTestId("catalog-product-shell");
    expect(within(shell).getByTestId("resource-header-content")).toBeInTheDocument();
    expect(within(shell).getAllByRole("navigation", { name: "Navigation principale" })).toHaveLength(2);
    expect(within(shell).getAllByRole("button", { name: "Cité" }).some((button) => button.hasAttribute("disabled"))).toBe(true);
    expect(within(shell).getAllByRole("complementary", { name: "Progression du groupe dans le donjon" })).toHaveLength(2);
    await user.click(within(shell).getByRole("button", { name: "Pause" }));
    expect(within(shell).getByRole("button", { name: "Reprendre" })).toBeInTheDocument();

    const heroEquipment = screen.getByTestId("catalog-product-hero-equipment");
    expect(within(heroEquipment).getByLabelText("Tailles de portraits de héros")).toBeInTheDocument();
    expect(within(heroEquipment).getAllByText("Lame du guet").length).toBeGreaterThanOrEqual(1);
    expect(within(heroEquipment).getByText("Niveau 12 requis")).toBeInTheDocument();

    const city = screen.getByTestId("catalog-product-city");
    await user.click(within(city).getByTestId("building-forge"));
    expect(within(city).getByTestId("building-forge")).toHaveAttribute("aria-pressed", "true");
    const availableAssignments = within(city).getByTestId("catalog-assignment-available");
    const fullAssignments = within(city).getByTestId("catalog-assignment-full");
    expect(within(availableAssignments).getByRole("button", { name: "Retirer un Carriers" })).toBeDisabled();
    expect(within(availableAssignments).getByRole("button", { name: "Ajouter un Mineurs" })).toBeDisabled();
    await user.click(within(availableAssignments).getByRole("button", { name: "Ajouter un Fermiers" }));
    expect(within(availableAssignments).getByRole("button", { name: "Ajouter un Bûcherons" })).toBeDisabled();
    expect(within(fullAssignments).getByRole("button", { name: "Ajouter un Fermiers" })).toBeDisabled();

    const dungeon = screen.getByTestId("catalog-product-dungeon");
    expect(within(dungeon).getAllByTestId("dungeon-current-encounter")).toHaveLength(5);
    expect(within(dungeon).getAllByTestId("dungeon-party-slot")).toHaveLength(4);
    expect(within(dungeon).getByTestId("dungeon-reserves-list")).toBeInTheDocument();
    expect(within(dungeon).getByTestId("dungeon-hero-sheet")).toBeInTheDocument();

    const onboarding = screen.getByTestId("catalog-product-onboarding-account");
    await user.click(within(onboarding).getByRole("button", { name: "Désélectionner Maëlys" }));
    expect(within(onboarding).getByRole("button", { name: "Sélectionner Maëlys" })).toBeInTheDocument();
    await user.click(within(onboarding).getByRole("button", { name: /Réinitialiser totalement/ }));
    expect(within(onboarding).getByRole("alertdialog", { name: "Confirmation requise" })).toBeInTheDocument();
    await user.click(within(onboarding).getByRole("button", { name: "Annuler" }));
    await user.click(within(onboarding).getByRole("button", { name: "Ouvrir l’offre" }));
    expect(screen.getByRole("dialog", { name: "Nouveau Pacte de Recrutement" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Décliner l'Offre" }));

    const storage = screen.getByTestId("catalog-product-storage");
    expect(within(storage).getByRole("combobox", { name: "Direction du tri" })).toBeDisabled();
    await user.click(within(storage).getByRole("button", { name: "Filtres" }));
    await user.type(within(storage).getByRole("searchbox", { name: "Rechercher un objet" }), "lame");
    expect(within(storage).getByRole("button", { name: "Réinitialiser" })).toBeEnabled();
  });
});
