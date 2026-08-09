import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import UiCatalog from "../src/ui/catalog/UiCatalog";

describe("UI catalog", () => {
  it("renders representative production component states", async () => {
    const user = userEvent.setup();
    render(<UiCatalog />);
    expect(screen.getByTestId("ui-catalog-root")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chargement" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Code d'invitation")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Construction" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Boutons" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ouvrir le dialogue" }));
    expect(screen.getByRole("dialog", { name: "Confirmer l'action" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvrir le dialogue" })).toHaveFocus();
  });
});
