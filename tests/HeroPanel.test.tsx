import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeroPanel from "../src/components/HeroPanel";
import { makeHero, makeResources } from "./fixtures/game";

afterEach(cleanup);

describe("HeroPanel item instances", () => {
  it("keeps the equipped instance technical while targeting it on unequip", () => {
    const onUnequipItem = vi.fn();
    const hero = makeHero({
      equipment: {
        mainHand: {
          instanceId: "item-equipped-12345678",
          itemId: "starter_sword",
          rarity: "uncommon",
          modifiers: [{ stat: "criticalChance", type: "flat", value: 1 }],
        },
        offHand: null,
        armor: null,
        accessory: null,
      },
    });
    render(<HeroPanel
      heroes={[hero]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      onUnequipItem={onUnequipItem}
      storedItems={[]}
    />);

    fireEvent.click(screen.getByRole("button", { name: /équipement/i }));
    expect(screen.queryByText(/item-equipped-12345678/)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /^retirer$/i })[0]);
    expect(onUnequipItem).toHaveBeenCalledWith(hero.id, "mainHand");
  });

  it("equips the selected stored instance", () => {
    const hero = makeHero({ equipment: {} });
    const onEquipItem = vi.fn();
    render(<HeroPanel
      heroes={[hero]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      onEquipItem={onEquipItem}
      storedItems={[
        { instanceId: "item-first", itemId: "starter_sword", rarity: "common" },
        { instanceId: "item-second", itemId: "starter_sword", rarity: "common" },
      ]}
    />);

    fireEvent.click(screen.getByRole("button", { name: /équipement/i }));
    fireEvent.click(screen.getByRole("button", { name: /Main principale.*Vide/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Équiper$/i })[1]);
    expect(onEquipItem).toHaveBeenCalledOnce();
    expect(onEquipItem).toHaveBeenCalledWith(hero.id, "item-second");
  });
});
