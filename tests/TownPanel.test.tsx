import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TownPanel from "../src/components/TownPanel";

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
});
