import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CityDashboard from "../src/components/city/CityDashboard";

afterEach(cleanup);

const baseProps = () => ({
  resources: { gold: 1_000, food: 1_000, wood: 1_000, stone: 1_000, ore: 1_000 },
  buildings: { habitation: 1, ferme: 1, scierie: 1, carriere: 1, mine: 1, maison_chef: 0, guilde: 1, caserne: 0, temple: 0, academie: 0, cercle: 0, lair: 0, poste_chasse: 0, forge: 1 },
  citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
  totalCitizensCount: 3,
  onUpgradeBuilding: vi.fn(),
  onAllocateCitizen: vi.fn(),
  citizenGrowthProgress: 0,
  highestFloorReached: 1,
  forgeMaterials: [
    { materialId: "metal_scrap", rarity: "common" as const, count: 6 },
    { materialId: "refined_metal", rarity: "uncommon" as const, count: 3 },
  ],
  itemBlueprints: [{ itemId: "starter_sword", unlocked: true }],
  canMutate: true,
  onStartForge: vi.fn(),
  onFinalizeForge: vi.fn(),
  onCancelForge: vi.fn(),
});

describe("CityDashboard city controls", () => {
  it("allows keyboard users to select a building without triggering a mutation", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<CityDashboard {...props} />);

    const habitation = screen.getByTestId("building-habitation");
    const farm = screen.getByTestId("building-ferme");
    habitation.focus();
    await user.tab();

    expect(farm).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(farm).toHaveAttribute("aria-pressed", "true");
    expect(props.onUpgradeBuilding).not.toHaveBeenCalled();
  });

  it("exposes the shared panel and control semantics across the city", () => {
    const props = baseProps();
    render(<CityDashboard {...props} />);

    for (const testId of ["selected-building-panel", "building-list-panel", "assignment-panel"]) {
      const panel = screen.getByTestId(testId);
      const titleId = panel.getAttribute("aria-labelledby");
      expect(titleId).toBeTruthy();
      expect(document.getElementById(String(titleId))).toBeInTheDocument();
    }

    const assignmentPanel = screen.getByTestId("assignment-panel");
    expect(within(assignmentPanel).getByRole("progressbar", { name: /immigration/i })).toBeInTheDocument();
    expect(within(assignmentPanel).getByRole("status")).toHaveTextContent(/citoyen.*disponible/i);
    expect(within(assignmentPanel).getByRole("button", { name: /ajouter un fermier/i })).toHaveAttribute("data-state", "ready");

    expect(within(screen.getByTestId("selected-building-panel")).getByRole("button", { name: /améliorer/i })).toHaveAttribute("data-state", "ready");

    fireEvent.click(screen.getByTestId("building-forge"));
    expect(screen.getByTestId("selected-building-panel")).toHaveAttribute("aria-labelledby");
    expect(within(screen.getByTestId("selected-building-panel")).getByRole("button", { name: /forger/i })).toHaveAttribute("data-state", "ready");
  });

  it("keeps the selected building, assignments and building list visible without nested tabs", () => {
    const onUpgradeBuilding = vi.fn();
    render(<CityDashboard
      resources={{ gold: 1_000, food: 1_000, wood: 1_000, stone: 1_000, ore: 1_000 }}
      buildings={{ habitation: 1, ferme: 1, scierie: 1, carriere: 1, mine: 1, maison_chef: 0, guilde: 1, caserne: 0, temple: 0, academie: 0, cercle: 0, lair: 0, poste_chasse: 0, forge: 0 }}
      citizens={{ farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 }}
      totalCitizensCount={3}
      onUpgradeBuilding={onUpgradeBuilding}
      onAllocateCitizen={vi.fn()}
      citizenGrowthProgress={0}
      highestFloorReached={1}
      forgeMaterials={[]}
      itemBlueprints={[]}
      canMutate
      onStartForge={vi.fn()}
      onFinalizeForge={vi.fn()}
      onCancelForge={vi.fn()}
    />);
    expect(screen.queryByRole("button", { name: /district/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /population/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /infrastructures/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Vue de la Cité")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Cité" })).toHaveClass("sr-only");

    const selectedBuildingPanel = screen.getByTestId("selected-building-panel");
    expect(within(selectedBuildingPanel).getByText("Cabane")).toBeInTheDocument();
    expect(within(selectedBuildingPanel).getByText(/augmente la population maximale/i)).toBeInTheDocument();
    expect(screen.getByText("Affectations")).toBeInTheDocument();
    expect(screen.getByTestId("building-ferme")).toBeInTheDocument();
    expect(screen.getByTestId("building-ferme")).toHaveClass("min-h-11");
    expect(selectedBuildingPanel).toHaveClass("order-1");
    expect(screen.getByTestId("building-list-panel")).toHaveClass("order-2");
    expect(screen.getByTestId("assignment-panel")).toHaveClass("order-3");
    expect(screen.getByTestId("building-list-panel")).toHaveClass("xl:col-start-2");
    expect(screen.getByTestId("assignment-panel")).toHaveClass("xl:col-start-3");
    expect(selectedBuildingPanel.parentElement).toHaveClass("xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]", "xl:items-stretch");
    expect(Array.from(selectedBuildingPanel.parentElement?.children ?? []).map((element) => element.getAttribute("data-testid"))).toEqual([
      "selected-building-panel",
      "building-list-panel",
      "assignment-panel",
    ]);

    fireEvent.click(screen.getByTestId("building-ferme"));
    expect(within(selectedBuildingPanel).getByText("Ferme")).toBeInTheDocument();
    expect(onUpgradeBuilding).not.toHaveBeenCalled();
    fireEvent.click(within(selectedBuildingPanel).getByRole("button", { name: /améliorer/i }));
    expect(onUpgradeBuilding).toHaveBeenCalledWith("ferme");
  });

  it("shows a locked Forge inside the selected-building panel", () => {
    const props = baseProps();
    render(<CityDashboard {...props} buildings={{ ...props.buildings, forge: 0 }} />);

    fireEvent.click(screen.getByTestId("building-forge"));

    expect(within(screen.getByTestId("selected-building-panel")).getByText(/Campement Niv\. 1, Mine Niv\. 1 et Étage atteint 3/i)).toBeInTheDocument();
    expect(screen.getByTestId("assignment-panel")).toBeInTheDocument();
    expect(screen.getByTestId("building-list-panel")).toBeInTheDocument();
  });

  it("constructs the Forge from the standard selected-building panel once prerequisites are met", () => {
    const props = baseProps();
    render(<CityDashboard
      {...props}
      buildings={{ ...props.buildings, guilde: 1, mine: 1, forge: 0 }}
      highestFloorReached={3}
    />);

    fireEvent.click(screen.getByTestId("building-forge"));
    const selectedBuildingPanel = screen.getByTestId("selected-building-panel");
    fireEvent.click(within(selectedBuildingPanel).getByRole("button", { name: /bâtir/i }));

    expect(props.onUpgradeBuilding).toHaveBeenCalledWith("forge");
    expect(within(selectedBuildingPanel).queryByRole("button", { name: /forger/i })).not.toBeInTheDocument();
  });

  it("keeps local building selection available in read-only mode without exposing mutations", () => {
    const props = baseProps();
    render(<CityDashboard {...props} canMutate={false} />);

    fireEvent.click(screen.getByTestId("building-ferme"));

    const selectedBuildingPanel = screen.getByTestId("selected-building-panel");
    expect(within(selectedBuildingPanel).getByText("Ferme")).toBeInTheDocument();
    expect(within(selectedBuildingPanel).getByRole("button", { name: /améliorer/i })).toBeDisabled();
    expect(props.onUpgradeBuilding).not.toHaveBeenCalled();
  });

  it("does not invoke any canonical mutation callback for a local building selection", () => {
    const props = baseProps();
    render(<CityDashboard {...props} />);

    fireEvent.click(screen.getByTestId("building-forge"));

    expect(props.onUpgradeBuilding).not.toHaveBeenCalled();
    expect(props.onAllocateCitizen).not.toHaveBeenCalled();
    expect(props.onStartForge).not.toHaveBeenCalled();
    expect(props.onFinalizeForge).not.toHaveBeenCalled();
    expect(props.onCancelForge).not.toHaveBeenCalled();
  });

  it("shows only colony actions in the city history and clears only through its dedicated callback", () => {
    const props = baseProps();
    const onClearCityLogs = vi.fn();
    render(<CityDashboard
      {...props}
      battleLogs={[
        { id: "colony", timestamp: "10:00", message: "La ferme produit 12 nourriture.", type: "info", category: "colony" },
        { id: "dungeon", timestamp: "10:01", message: "Le groupe gagne un combat.", type: "victory", category: "dungeon" },
      ]}
      onClearCityLogs={onClearCityLogs}
    />);

    const history = screen.getByTestId("city-history-panel");
    expect(within(history).getByText("La ferme produit 12 nourriture.")).toBeInTheDocument();
    expect(within(history).queryByText("Le groupe gagne un combat.")).not.toBeInTheDocument();
    fireEvent.click(within(history).getByRole("button", { name: /effacer les notes/i }));
    expect(onClearCityLogs).toHaveBeenCalledOnce();
  });

  it("lets the player fold and unfold the city history", () => {
    render(<CityDashboard {...baseProps()} />);
    const history = screen.getByTestId("city-history-panel");
    expect(history).toHaveAttribute("open");
    fireEvent.click(history.querySelector("summary")!);
    expect(history).not.toHaveAttribute("open");
    fireEvent.click(history.querySelector("summary")!);
    expect(history).toHaveAttribute("open");
  });

  it("finalizes a standard forge preview without treating it as cancellation", async () => {
    const props = baseProps();
    render(<CityDashboard {...props} pendingForge={{ previewId: "preview-standard", itemId: "starter_sword", upgradeProc: "none" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("button", { name: /finaliser/i }));
    expect(props.onFinalizeForge).toHaveBeenCalledWith("preview-standard", false, undefined);
    expect(props.onCancelForge).not.toHaveBeenCalled();
  });

  it("displays the selected weapon scaling in the forge catalog", async () => {
    render(<CityDashboard {...baseProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    expect(await screen.findByText(/Scaling : Puissance \(FOR\)/)).toBeInTheDocument();
    expect(screen.getByText(/Profil : 1 coup × 100 % de puissance/)).toBeInTheDocument();
    expect(screen.getByText(/Indice de vitesse : 1/)).toBeInTheDocument();
  });

  it("does not start a forge command for a locked blueprint", () => {
    const props = baseProps();
    render(<CityDashboard {...props} itemBlueprints={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));

    expect(screen.getByRole("button", { name: /forger/i })).toBeDisabled();
    expect(props.onStartForge).not.toHaveBeenCalled();
  });

  it("sends an explicit modifier for an accepted forge upgrade", async () => {
    const props = baseProps();
    render(<CityDashboard {...props} pendingForge={{ previewId: "preview-upgrade", itemId: "starter_sword", upgradeProc: "uncommon" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /finaliser/i }));
    expect(props.onFinalizeForge).toHaveBeenCalledWith("preview-upgrade", true, "physicalDamage");
  });

  it("preserves elemental infusion choices for non-weapon equipment", async () => {
    const props = baseProps();
    render(<CityDashboard
      {...props}
      itemBlueprints={[{ itemId: "traveler_clothes", unlocked: true }]}
      pendingForge={{ previewId: "preview-armor-upgrade", itemId: "traveler_clothes", upgradeProc: "uncommon" }}
    />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("checkbox"));

    expect(screen.getByRole("option", { name: /Résistance Feu/ })).toBeInTheDocument();
  });

  it("cancels a forge preview without finalizing it", async () => {
    const props = baseProps();
    render(<CityDashboard {...props} pendingForge={{ previewId: "preview-cancel", itemId: "starter_sword", upgradeProc: "none" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("button", { name: /abandonner/i }));
    expect(props.onCancelForge).toHaveBeenCalledWith("preview-cancel");
    expect(props.onFinalizeForge).not.toHaveBeenCalled();
  });

  it("displays the catalog minimum rarity in a high-tier forge preview", async () => {
    const props = baseProps();
    render(<CityDashboard
      {...props}
      itemBlueprints={[{ itemId: "embercleaver_greataxe", unlocked: true }]}
      pendingForge={{ previewId: "preview-epic", itemId: "embercleaver_greataxe", upgradeProc: "none" }}
    />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    expect(await screen.findByText(/Épique/)).toBeInTheDocument();
    expect(screen.queryByText("Commune")).not.toBeInTheDocument();
  });
});
