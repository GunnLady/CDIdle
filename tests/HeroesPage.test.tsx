import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

  it("routes equipment management to the Storage page", () => {
    const onGoToTab = vi.fn();
    render(<HeroesPage
      heroes={[makeHero({ equipment: {} })]}
      resources={makeResources()}
      buildings={{ guilde: 1 }}
      onDismissHero={vi.fn()}
      onToggleHeroActive={vi.fn()}
      onRecruitHero={vi.fn()}
      onUnequipItem={vi.fn()}
      onGoToTab={onGoToTab}
      storedItems={[{ instanceId: "stored-sword", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const, rarity: "common" }]}
      {...navigationProps}
    />);

    expect(screen.queryByRole("button", { name: "Équiper" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Changer" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gérer dans le Coffre" }));
    expect(onGoToTab).toHaveBeenCalledOnce();
    expect(onGoToTab).toHaveBeenCalledWith("storage");
  });
});
