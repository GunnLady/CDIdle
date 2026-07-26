import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TownPanel from "../src/components/TownPanel";

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
  heroes: [],
  forgeMaterials: [
    { materialId: "metal_scrap", rarity: "common" as const, count: 6 },
    { materialId: "refined_metal", rarity: "uncommon" as const, count: 3 },
  ],
  itemBlueprints: [{ itemId: "starter_sword", unlocked: true }],
  addLog: vi.fn(),
  isOnline: true,
  onStartForge: vi.fn(),
  onFinalizeForge: vi.fn(),
  onCancelForge: vi.fn(),
});

describe("TownPanel city controls", () => {
  it("does not expose districts and documents one hero slot per Camp level", () => {
    render(<TownPanel
      resources={{ gold: 1_000, food: 1_000, wood: 1_000, stone: 1_000, ore: 1_000 }}
      buildings={{ habitation: 1, ferme: 1, scierie: 1, carriere: 1, mine: 1, maison_chef: 0, guilde: 1, caserne: 0, temple: 0, academie: 0, cercle: 0, lair: 0, poste_chasse: 0, forge: 0 }}
      citizens={{ farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 }}
      totalCitizensCount={3}
      onUpgradeBuilding={vi.fn()}
      onAllocateCitizen={vi.fn()}
      citizenGrowthProgress={0}
      highestFloorReached={1}
      heroes={[]}
      forgeMaterials={[]}
      itemBlueprints={[]}
      addLog={vi.fn()}
      isOnline
      onStartForge={vi.fn()}
      onFinalizeForge={vi.fn()}
      onCancelForge={vi.fn()}
    />);
    expect(screen.queryByRole("button", { name: /district/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /infrastructures/i }));
    expect(screen.getByText(/ajoute 1 emplacement de héros par niveau/i)).toBeInTheDocument();
  });
  it("finalizes a standard forge preview without treating it as cancellation", async () => {
    const props = baseProps();
    render(<TownPanel {...props} pendingForge={{ previewId: "preview-standard", itemId: "starter_sword", upgradeProc: "none" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("button", { name: /finaliser/i }));
    expect(props.onFinalizeForge).toHaveBeenCalledWith("preview-standard", false, undefined);
    expect(props.onCancelForge).not.toHaveBeenCalled();
  });

  it("sends an explicit modifier for an accepted forge upgrade", async () => {
    const props = baseProps();
    render(<TownPanel {...props} pendingForge={{ previewId: "preview-upgrade", itemId: "starter_sword", upgradeProc: "uncommon" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /finaliser/i }));
    expect(props.onFinalizeForge).toHaveBeenCalledWith("preview-upgrade", true, "physicalDamage");
  });

  it("cancels a forge preview without finalizing it", async () => {
    const props = baseProps();
    render(<TownPanel {...props} pendingForge={{ previewId: "preview-cancel", itemId: "starter_sword", upgradeProc: "none" }} />);
    fireEvent.click(screen.getByRole("button", { name: /forge/i }));
    fireEvent.click(await screen.findByRole("button", { name: /abandonner/i }));
    expect(props.onCancelForge).toHaveBeenCalledWith("preview-cancel");
    expect(props.onFinalizeForge).not.toHaveBeenCalled();
  });
});
