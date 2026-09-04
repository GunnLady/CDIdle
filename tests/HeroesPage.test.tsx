import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeroesPage from "../src/components/heroes/HeroesPage";
import { makeHero, makeResources } from "./fixtures/game";

afterEach(cleanup);

const navigationProps = {
  canMutate: true,
};

describe("HeroesPage", () => {
  it("keeps roster, selected hero, equipment and skills simultaneously available", () => {
    const active = makeHero({ id: "active", name: "Ariane", isActive: true });
    const reserve = makeHero({ id: "reserve", name: "Borin", isActive: false });
    render(<HeroesPage
      heroes={[active, reserve]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      {...navigationProps}
    />);

    expect(screen.queryByTestId("dungeon-party-manager")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-roster-panel")).toBeInTheDocument();
    expect(screen.getByTestId("selected-hero-panel")).toHaveTextContent("Ariane");
    expect(screen.getByTestId("hero-equipment-panel")).toBeInTheDocument();
    expect(screen.getByTestId("hero-skills-panel")).toBeInTheDocument();
    const experienceProgress = within(screen.getByTestId("selected-hero-panel")).getByRole("progressbar", { name: "Expérience" });
    expect(experienceProgress.parentElement).toHaveClass("ui-immigration-progress-shell");
    const resistanceHeading = within(screen.getByTestId("selected-hero-panel")).getByRole("heading", { name: "Résistances" });
    expect(resistanceHeading.nextElementSibling?.querySelectorAll(".ui-hero-detail-frame")).toHaveLength(14);
    expect(screen.getByRole("button", { name: /Recruter/ })).toHaveAttribute("data-state", "disabled");
    expect(screen.getByTestId("hero-skills-panel")).toHaveClass("xl:min-h-64");
    expect(screen.getByTestId("selected-hero-panel").lastElementChild).not.toHaveClass("xl:overflow-y-auto");
    expect(screen.getByTestId("hero-roster-active").closest("article")).toHaveAttribute("data-selected", "true");
    fireEvent.click(screen.getByTestId("hero-roster-reserve"));
    expect(screen.getByTestId("selected-hero-panel")).toHaveTextContent("Borin");
  });

  it("keeps local consultation active while canonical actions are read-only", () => {
    const onToggle = vi.fn();
    render(<HeroesPage
      heroes={[makeHero({ id: "active", name: "Ariane", isActive: true }), makeHero({ id: "reserve", name: "Borin", isActive: false })]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={onToggle}
      onRecruitHero={vi.fn()}
      {...navigationProps}
      canMutate={false}
    />);

    fireEvent.click(screen.getByTestId("hero-roster-reserve"));
    expect(screen.getByTestId("selected-hero-panel")).toHaveTextContent("Borin");
    expect(screen.getByRole("button", { name: "Déployer Borin" })).toBeDisabled();
    expect(screen.getByLabelText("Pourquoi Borin ne peut pas être déployé")).toHaveAccessibleDescription("Lecture seule");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("routes recruitment, deployment and dismissal through page callbacks", () => {
    const onRecruitHero = vi.fn();
    const onToggleHeroActive = vi.fn();
    const onDismissHero = vi.fn();
    render(<HeroesPage
      heroes={[makeHero({ id: "active", name: "Ariane", isActive: true }), makeHero({ id: "reserve", name: "Borin", isActive: false })]}
      resources={makeResources({ gold: 1_000 })}
      buildings={{ guilde: 3 }}
      onDismissHero={onDismissHero}
      onToggleHeroActive={onToggleHeroActive}
      onRecruitHero={onRecruitHero}
      {...navigationProps}
    />);

    fireEvent.click(screen.getByRole("button", { name: /Recruter/ }));
    fireEvent.click(screen.getByRole("button", { name: "Déployer Borin" }));
    fireEvent.click(screen.getByRole("button", { name: "Congédier définitivement" }));
    expect(onRecruitHero).toHaveBeenCalledOnce();
    expect(onToggleHeroActive).toHaveBeenCalledWith("reserve");
    expect(onDismissHero).toHaveBeenCalledWith("active");
  });

  it("keeps the equipped instance technical while targeting it on unequip", () => {
    const onUnequipItem = vi.fn();
    const hero = makeHero({
      equipment: {
        mainHand: {
          instanceId: "item-equipped-12345678",
          itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const,
          rarity: "uncommon",
          modifiers: [{ stat: "criticalChance", type: "flat", value: 1 }],
        },
        offHand: null,
        armor: null,
        accessory: null,
      },
    });
    render(<HeroesPage
      heroes={[hero]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      onUnequipItem={onUnequipItem}
      storedItems={[]}
      {...navigationProps}
    />);

    expect(screen.getByText("DPS estimé")).toBeInTheDocument();
    expect(screen.getByText("LUK")).toBeInTheDocument();
    expect(screen.getByText("Caractéristique")).toBeInTheDocument();
    expect(screen.getByText("Force")).toBeInTheDocument();
    expect(screen.getByText("Profil d’attaque")).toBeInTheDocument();
    expect(screen.getByText("1 × 100 %")).toBeInTheDocument();
    expect(screen.queryByText(/item-equipped-12345678/)).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId("hero-equipment-panel")).getByRole("button", { name: /^retirer$/i }));
    expect(onUnequipItem).toHaveBeenCalledWith(hero.id, "mainHand");
  });

  it("equips the selected stored instance", () => {
    const hero = makeHero({ equipment: {} });
    const onEquipItem = vi.fn();
    render(<HeroesPage
      heroes={[hero]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      onEquipItem={onEquipItem}
      onUnequipItem={vi.fn()}
      storedItems={[
        { instanceId: "item-first", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const, rarity: "common" },
        { instanceId: "item-second", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const, rarity: "common" },
      ]}
      {...navigationProps}
    />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Équiper$/i })[0]);
    fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: /^Équiper$/i })[1]);
    expect(onEquipItem).toHaveBeenCalledOnce();
    expect(onEquipItem).toHaveBeenCalledWith(hero.id, "item-second");
  });

  it("shows and submits an atomic occupied-slot replacement", () => {
    const hero = makeHero({
      equipment: {
        mainHand: { instanceId: "old-sword", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const, rarity: "common" },
        offHand: null,
        armor: null,
        accessory: null,
      },
    });
    const onEquipItem = vi.fn();
    render(<HeroesPage
      heroes={[hero]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      onEquipItem={onEquipItem}
      onUnequipItem={vi.fn()}
      storedItems={[{ instanceId: "new-dagger", itemId: "quick_dagger", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const, rarity: "common" }]}
      {...navigationProps}
    />);

    const changeButton = screen.getByRole("button", { name: "Changer" });
    const removeButton = within(screen.getByTestId("hero-equipment-panel")).getByRole("button", { name: "Retirer" });
    expect(changeButton.compareDocumentPosition(removeButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(changeButton.parentElement).toHaveClass("self-stretch", "justify-center");
    fireEvent.click(changeButton);
    expect(screen.getByText("Retour au Coffre")).toBeInTheDocument();
    expect(screen.getAllByText("Épée de départ").length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByRole("button", { name: "Remplacer" }));
    expect(onEquipItem).toHaveBeenCalledWith(hero.id, "new-dagger");
  });

  it("closes the equipment dialog with Escape and restores the trigger focus", async () => {
    const user = userEvent.setup();
    render(<HeroesPage
      heroes={[makeHero({ equipment: {} })]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      onEquipItem={vi.fn()}
      storedItems={[]}
      {...navigationProps}
    />);

    const trigger = screen.getAllByRole("button", { name: "Équiper" })[0];
    fireEvent.click(trigger);
    const closeButton = screen.getByRole("button", { name: "Fermer la sélection d’équipement" });
    expect(closeButton).toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(closeButton).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("preserves dialog focus across an unrelated page rerender", () => {
    const hero = makeHero({ equipment: {} });
    const baseProps = {
      heroes: [hero],
      buildings: { guilde: 1 },
      onDismissHero: vi.fn(),
      onToggleHeroActive: vi.fn(),
      onRecruitHero: vi.fn(),
      onEquipItem: vi.fn(),
      storedItems: [{ instanceId: "stored-sword", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const, rarity: "common" as const }],
      ...navigationProps,
    };
    const { rerender } = render(<HeroesPage {...baseProps} resources={makeResources({ gold: 100 })} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Équiper" })[0]);
    const candidate = within(screen.getByRole("dialog")).getByRole("button", { name: "Équiper" });
    candidate.focus();
    rerender(<HeroesPage {...baseProps} resources={makeResources({ gold: 101 })} />);
    expect(candidate).toHaveFocus();
  });
});
