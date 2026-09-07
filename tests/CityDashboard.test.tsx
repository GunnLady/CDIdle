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
  itemBlueprints: [{ itemId: "progression_sword", unlocked: true }],
  canMutate: true,
  onStartForge: vi.fn(),
  onFinalizeForge: vi.fn(),
  onCancelForge: vi.fn(),
});

describe('Forge workshop interaction', () => {
  it('filters the catalog without mutating the game, and resets empty searches', () => {
    const props = baseProps();
    render(<CityDashboard {...props} />);
    fireEvent.click(screen.getByTestId('building-forge'));
    const catalog = within(screen.getByRole('region', { name: 'Catalogue des plans' }));
    expect(screen.getByRole('heading', { name: 'Composants de boss' })).toBeInTheDocument();
    expect(screen.getByText('Roi des Rats')).toBeInTheDocument();
    expect(catalog.getByRole('status')).toHaveTextContent('1 plan affiché');
    fireEvent.click(catalog.getByRole('checkbox', { name: 'Plans connus uniquement' }));
    expect(catalog.getByRole('status')).toHaveTextContent('51 plans affichés');
    fireEvent.click(catalog.getByRole('button', { name: 'Armures' }));
    expect(catalog.getByRole('status')).toHaveTextContent('6 plans affichés');
    fireEvent.change(catalog.getByRole('searchbox'), { target: { value: 'zzzintrouvable' } });
    expect(catalog.getByText('Aucun plan ne correspond à ces filtres.')).toBeInTheDocument();
    fireEvent.click(catalog.getByRole('button', { name: 'Voir tous les plans' }));
    expect(catalog.getByRole('status')).toHaveTextContent('51 plans affichés');
    expect(props.onStartForge).not.toHaveBeenCalled();
  });

  it('lets keyboard users inspect locked plans while blocking their craft', async () => {
    const props = baseProps();
    const user = userEvent.setup();
    render(<CityDashboard {...props} />);
    fireEvent.click(screen.getByTestId('building-forge'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Plans connus uniquement' }));
    const locked = screen.getAllByRole('button', { name: /plan verrouillé/ })[0];
    locked.focus();
    await user.keyboard('{Enter}');
    expect(locked).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Ce plan est consultable/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forger' })).toBeDisabled();
    expect(props.onStartForge).not.toHaveBeenCalled();
  });

  it('sends the selected level band and updates material requirements', () => {
    const props = baseProps();
    render(<CityDashboard {...props} buildings={{ ...props.buildings, forge: 3 }} forgeMaterials={props.forgeMaterials.map((entry) => ({ ...entry, count: 30 }))} />);
    fireEvent.click(screen.getByTestId('building-forge'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Tranche de niveau' }), { target: { value: '11' } });
    expect(screen.getByLabelText('30 possédés sur 12 requis')).toBeInTheDocument();
    expect(screen.getByText(/^Dégâts niv. 11/)).toBeInTheDocument();
    expect(screen.getByText(/^Dégâts niv. 15/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Forger' }));
    expect(props.onStartForge).toHaveBeenCalledWith('progression_sword', 11);
  });

  it('explains missing materials and preserves browsing in read-only mode', () => {
    const props = baseProps();
    render(<CityDashboard {...props} forgeMaterials={[]} canMutate={false} />);
    fireEvent.click(screen.getByTestId('building-forge'));
    expect(screen.getByText('Il manque 6')).toBeInTheDocument();
    expect(screen.getByText(/Lecture seule/)).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Forger' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Améliorer' })).toBeDisabled();
  });

  it('keeps the base result recoverable when the proposed rarity is unaffordable', () => {
    const props = baseProps();
    render(<CityDashboard {...props} forgeMaterials={[]} pendingForge={{ previewId: 'rare', itemId: 'progression_sword', offeredRarity: 'rare', itemLevel: 4 }} />);
    expect(screen.getByRole('checkbox', { name: 'Accepter l’amélioration' })).toBeDisabled();
    expect(screen.getByText('Qualité finale : Commune')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finaliser · Commune' }));
    expect(props.onFinalizeForge).toHaveBeenCalledWith('rare', false, undefined);
  });

  it('revalidates upgrade materials and allows declining a previously selected upgrade', () => {
    const props = baseProps();
    const pendingForge = { previewId: 'upgrade', itemId: 'progression_sword', offeredRarity: 'uncommon' as const, itemLevel: 2 };
    const { rerender } = render(<CityDashboard {...props} pendingForge={pendingForge} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Accepter l’amélioration' }));
    expect(screen.getByText('Qualité finale : Inhabituelle')).toBeInTheDocument();
    rerender(<CityDashboard {...props} pendingForge={pendingForge} forgeMaterials={[]} />);
    expect(screen.getByRole('button', { name: 'Finaliser · Inhabituelle' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Accepter l’amélioration' }));
    expect(screen.getByRole('button', { name: 'Finaliser · Commune' })).toBeEnabled();
    expect(props.onFinalizeForge).not.toHaveBeenCalled();
  });

  it('resets upgrade and cancellation choices when a new preview arrives', () => {
    const props = baseProps();
    const pendingForge = { previewId: 'first', itemId: 'progression_sword', offeredRarity: 'uncommon' as const, itemLevel: 2 };
    const { rerender } = render(<CityDashboard {...props} pendingForge={pendingForge} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Accepter l’amélioration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner la fabrication' }));
    rerender(<CityDashboard {...props} pendingForge={{ ...pendingForge, previewId: 'second' }} />);
    expect(screen.getByRole('checkbox', { name: 'Accepter l’amélioration' })).not.toBeChecked();
    expect(screen.queryByRole('button', { name: 'Confirmer l’abandon' })).not.toBeInTheDocument();
  });

  it('allows backing out of abandonment without any mutation', () => {
    const props = baseProps();
    render(<CityDashboard {...props} pendingForge={{ previewId: 'keep', itemId: 'starter_sword', offeredRarity: 'common' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner la fabrication' }));
    fireEvent.click(screen.getByRole('button', { name: 'Garder l’objet' }));
    expect(screen.queryByRole('button', { name: 'Confirmer l’abandon' })).not.toBeInTheDocument();
    expect(props.onCancelForge).not.toHaveBeenCalled();
    expect(props.onFinalizeForge).not.toHaveBeenCalled();
  });

  it('blocks result mutations in read-only mode', () => {
    const props = baseProps();
    render(<CityDashboard {...props} canMutate={false} pendingForge={{ previewId: 'readonly', itemId: 'progression_sword', offeredRarity: 'uncommon', itemLevel: 1 }} />);
    expect(screen.getByRole('checkbox', { name: 'Accepter l’amélioration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Finaliser/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Abandonner la fabrication' })).toBeDisabled();
  });

  it('shows the maximum forge without an upgrade action', () => {
    const props = baseProps();
    render(<CityDashboard {...props} buildings={{ ...props.buildings, forge: 8 }} />);
    fireEvent.click(screen.getByTestId('building-forge'));
    const panel = within(screen.getByTestId('selected-building-panel'));
    expect(panel.getByText('Maîtrise maximale')).toBeInTheDocument();
    expect(panel.queryByRole('button', { name: 'Améliorer' })).not.toBeInTheDocument();
    expect(panel.getAllByRole('option')).toHaveLength(8);
  });
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
    const immigrationProgress = within(assignmentPanel).getByRole("progressbar", { name: /immigration/i });
    expect(immigrationProgress).toHaveClass("ui-immigration-progress");
    expect(immigrationProgress.closest("label")).toHaveAttribute("data-progress-variant", "immigration");
    expect(within(assignmentPanel).getByRole("status")).toHaveTextContent(/citoyen.*disponible/i);
    expect(within(assignmentPanel).getByRole("button", { name: /ajouter un fermier/i })).toHaveAttribute("data-state", "ready");

    expect(within(screen.getByTestId("selected-building-panel")).getByRole("button", { name: /améliorer/i })).toHaveAttribute("data-state", "ready");

    fireEvent.click(screen.getByTestId("building-forge"));
    expect(screen.getByTestId("selected-building-panel")).toHaveAttribute("aria-labelledby");
    expect(screen.getByText("Tranche ouverte : niveaux 1–5")).toBeInTheDocument();
    expect(screen.getByText("Prochaine : niveaux 6–10 · étage 8")).toBeInTheDocument();
    expect(screen.getByText(/Coût : 600 or · 150 nourriture/)).toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: /^population$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /infrastructures/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Vue de la Cité")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Cité" })).toHaveClass("sr-only");

    const selectedBuildingPanel = screen.getByTestId("selected-building-panel");
    expect(within(selectedBuildingPanel).getByText("Cabane")).toBeInTheDocument();
    expect(within(selectedBuildingPanel).getByText(/augmente la population maximale/i)).toBeInTheDocument();
    const selectedBuildingImage = selectedBuildingPanel.querySelector("[data-selected-building-illustration] img")!;
    expect(selectedBuildingImage).toHaveAttribute("src", expect.stringContaining("building-detail-habitation-v1.jpg"));
    expect(selectedBuildingImage).toHaveClass("object-cover", "object-center");
    expect(selectedBuildingImage).not.toHaveClass("object-contain");
    const costVellum = selectedBuildingPanel.querySelector<HTMLElement>(".ui-building-cost-vellum")!;
    expect(costVellum).toHaveClass("sm:flex-1");
    expect(costVellum.parentElement).toHaveClass("sm:flex-row", "sm:items-stretch");
    expect(selectedBuildingPanel.querySelector("[data-building-description]")?.closest(".ui-building-cost-vellum")).toBe(costVellum);
    expect(within(costVellum).getByText(/^Or 25$/i)).toBeInTheDocument();
    expect(within(costVellum).getByText(/^Nourriture 15$/i)).toBeInTheDocument();
    expect(within(costVellum).queryByText(/^gold /i)).not.toBeInTheDocument();
    expect(screen.getByText("Affectations")).toBeInTheDocument();
    expect(screen.getByTestId("building-ferme")).toBeInTheDocument();
    expect(screen.getByTestId("building-ferme")).toHaveClass("h-[156px]");
    const woodcutterCard = screen.getByTestId("building-scierie");
    expect(woodcutterCard.querySelector(".ui-building-card-copy")).toBeInTheDocument();
    const woodcutterName = woodcutterCard.querySelector("[data-building-card-name]")!;
    const woodcutterLevel = woodcutterCard.querySelector("[data-building-card-level]")!;
    const woodcutterCategory = woodcutterCard.querySelector("[data-building-card-category]")!;
    expect(woodcutterName).toHaveTextContent("Maison de bûcheron");
    expect(woodcutterName).not.toHaveClass("truncate");
    expect(Array.from(woodcutterName.parentElement?.children ?? [])).toEqual([woodcutterName, woodcutterLevel, woodcutterCategory]);
    expect(screen.getByTestId("building-habitation")).toHaveAttribute("data-building-state", "selected");
    expect(selectedBuildingPanel).toHaveClass("order-1");
    expect(screen.getByTestId("assignment-panel")).toHaveClass("order-3");
    const buildingColumn = screen.getByTestId("city-building-column");
    expect(buildingColumn).toHaveClass("city-building-column", "order-2", "xl:relative", "xl:flex-[1_1_0%]", "xl:self-stretch");
    const primaryColumn = screen.getByTestId("city-primary-column");
    expect(primaryColumn).toHaveClass("contents", "xl:flex", "xl:flex-[2.2_1_0%]", "xl:flex-col", "xl:gap-4");
    expect(primaryColumn.parentElement).toHaveClass("xl:flex", "xl:items-stretch");
    expect(Array.from(primaryColumn.children).map((element) => element.getAttribute("data-testid"))).toEqual([
      "selected-building-panel",
      "assignment-panel",
    ]);
    expect(Array.from(primaryColumn.parentElement?.children ?? []).map((element) => element.getAttribute("data-testid"))).toEqual([
      "city-primary-column",
      "city-building-column",
    ]);

    fireEvent.click(screen.getByTestId("building-ferme"));
    expect(within(selectedBuildingPanel).getByText("Ferme")).toBeInTheDocument();
    expect(selectedBuildingPanel.querySelector("[data-selected-building-illustration] img")).toHaveAttribute("src", expect.stringContaining("building-detail-ferme-v1.jpg"));
    expect(onUpgradeBuilding).not.toHaveBeenCalled();
    const upgradeButton = within(selectedBuildingPanel).getByRole("button", { name: /améliorer/i });
    expect(upgradeButton).toHaveClass("ui-building-upgrade-button", "sm:min-h-14", "sm:w-48", "sm:self-end");
    expect(upgradeButton).not.toHaveClass("sm:self-stretch");
    fireEvent.click(upgradeButton);
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
    render(<CityDashboard {...props} pendingForge={{ previewId: "preview-standard", itemId: "starter_sword", offeredRarity: "common" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("button", { name: /finaliser/i }));
    expect(props.onFinalizeForge).toHaveBeenCalledWith("preview-standard", false, undefined);
    expect(props.onCancelForge).not.toHaveBeenCalled();
  });

  it("displays the selected weapon scaling in the forge catalog", async () => {
    render(<CityDashboard {...baseProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    expect(await screen.findByText(/Caractéristique : Force/)).toBeInTheDocument();
    expect(screen.getByText(/Profil d’attaque : 1 × 100 %/)).toBeInTheDocument();
    expect(screen.getByText(/Vitesse d’attaque : 1/)).toBeInTheDocument();
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
    render(<CityDashboard {...props} pendingForge={{ previewId: "preview-upgrade", itemId: "starter_sword", offeredRarity: "uncommon" }} />);
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
      pendingForge={{ previewId: "preview-armor-upgrade", itemId: "traveler_clothes", offeredRarity: "uncommon" }}
    />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("checkbox"));

    expect(screen.getByRole("option", { name: /Résistance Feu/ })).toBeInTheDocument();
  });

  it("cancels a forge preview without finalizing it", async () => {
    const props = baseProps();
    render(<CityDashboard {...props} pendingForge={{ previewId: "preview-cancel", itemId: "starter_sword", offeredRarity: "common" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("button", { name: /abandonner/i }));
    expect(props.onCancelForge).not.toHaveBeenCalled();
    expect(screen.getByText(/ne seront pas remboursés/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer l’abandon' }));
    expect(props.onCancelForge).toHaveBeenCalledWith("preview-cancel");
    expect(props.onFinalizeForge).not.toHaveBeenCalled();
  });

  it("displays the catalog minimum rarity in a high-tier forge preview", async () => {
    const props = baseProps();
    render(<CityDashboard
      {...props}
      itemBlueprints={[{ itemId: "embercleaver_greataxe", unlocked: true }]}
      pendingForge={{ previewId: "preview-epic", itemId: "embercleaver_greataxe", offeredRarity: "epic" }}
    />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    expect(await screen.findByText('Qualité finale : Épique')).toBeInTheDocument();
    expect(screen.queryByText("Commune")).not.toBeInTheDocument();
  });
});
