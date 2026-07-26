import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StoragePanel from "../src/components/StoragePanel";
import { makeHero } from "./fixtures/game";

afterEach(cleanup);

describe("StoragePanel modifier stacks", () => {
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

    const recycleButtons = screen.getAllByRole("button", { name: /recycler/i });
    expect(recycleButtons).toHaveLength(2);
    fireEvent.click(recycleButtons[1]);
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
    expect(onEquipItem).toHaveBeenCalledOnce();
    expect(onEquipItem).toHaveBeenCalledWith("hero-target", "item-second");
  });
});
