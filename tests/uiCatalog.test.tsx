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
    expect(within(screen.getByTestId("catalog-buttons")).getByRole("button", { name: "Chargement" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Code d'invitation")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("progressbar", { name: "Points de vie" })).toBeInTheDocument();
    expect(within(screen.getByTestId("catalog-control-variants")).getByRole("combobox", { name: "Type d’objet" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Accepter l’amélioration" })).toBeInTheDocument();
    expect(screen.getByTestId("catalog-selection-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-navigation-status")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-dungeon-scene-prototype")).toBeInTheDocument();
    expect(screen.getAllByTestId("dungeon-scene-actor")).toHaveLength(7);
    expect(screen.getByTestId("dungeon-scene-prototype-stage")).toHaveAttribute("data-kind", "battle");
    expect(screen.getByTestId("dungeon-scene-prototype-stage")).toHaveAttribute("data-phase", "impact");
    expect(screen.getByText("−11")).toBeInTheDocument();
    expect(screen.getByText("Prototype de présentation · aucune commande de jeu")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Boss" }));
    expect(screen.getByTestId("dungeon-scene-prototype-stage")).toHaveAttribute("data-kind", "boss");
    expect(screen.getByText("Roi des Rats")).toBeInTheDocument();
    expect(screen.getAllByText(/Protection/)).toHaveLength(2);
    await user.click(screen.getByText("Consulter le journal de la fixture"));
    expect(screen.getByText("Les Lames du Roi prennent position.")).toBeVisible();
  });

  it("keeps the primitive catalog interactive without product compositions", async () => {
    const user = userEvent.setup();
    render(<UiCatalog />);

    const panelSurfaces = screen.getByTestId("catalog-panel-surfaces");
    expect(within(panelSurfaces).getByTestId("catalog-panel-surface-wood")).toHaveAttribute("data-panel-material", "wood");
    expect(within(panelSurfaces).getByTestId("catalog-panel-surface-slate")).toHaveAttribute("data-panel-material", "slate");

    const selection = screen.getByTestId("catalog-selection-metrics");
    const mine = within(selection).getByRole("button", { name: /Mine de pierre/ });
    await user.click(mine);
    expect(mine).toHaveAttribute("aria-pressed", "true");

    const disclosure = within(screen.getByTestId("catalog-disclosure-log")).getByText("Filtres avancés");
    await user.click(disclosure);
    expect(screen.getByRole("combobox", { name: "Rareté" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ouvrir une opération bloquée" }));
    expect(screen.getByRole("dialog", { name: "Synchronisation en cours" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Terminer la simulation" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
