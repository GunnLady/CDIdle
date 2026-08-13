import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DungeonProgressBanner, { shouldShowDungeonProgressBanner } from "../src/components/app-shell/DungeonProgressBanner";
import { createDungeonProgressBannerView } from "../src/domain/dungeonPresentation";
import { makeHero } from "./fixtures/game";

afterEach(cleanup);

const createView = (overrides: Partial<Parameters<typeof createDungeonProgressBannerView>[0]> = {}) =>
  createDungeonProgressBannerView({
    heroes: [],
    floor: 1,
    room: 1,
    autoExplore: false,
    encounter: null,
    isExploring: false,
    canMutate: true,
    ...overrides,
  });

describe("DungeonProgressBanner", () => {
  it("is present on every authenticated game page", () => {
    expect(["city", "heroes", "storage", "account"].map((tab) =>
      shouldShowDungeonProgressBanner(true, tab as "city" | "heroes" | "storage" | "account"),
    )).toEqual([true, true, true, true]);
    expect(shouldShowDungeonProgressBanner(true, "dungeon")).toBe(true);
    expect(shouldShowDungeonProgressBanner(false, "city")).toBe(false);
  });

  it("keeps the contextual action visible but disabled when no hero is active", () => {
    render(<DungeonProgressBanner
      view={createView({ heroes: [makeHero({ isActive: false })], floor: 2, room: 3 })}
      onToggleAutoExplore={vi.fn()}
    />);

    expect(screen.getByText(/Aucun groupe/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause" })).toHaveAttribute("title", "Aucun groupe actif");
    expect(screen.getByRole("button", { name: "Pause" }).querySelector("img:last-child")).toHaveAttribute("src", expect.stringContaining("dungeon-auto-pause-v1.png"));
    expect(screen.queryByRole("button", { name: "Voir le Donjon" })).not.toBeInTheDocument();
  });

  it("projects canonical party health and exposes an unambiguous pause command", () => {
    const onToggleAutoExplore = vi.fn();
    render(<DungeonProgressBanner
      view={createView({
        heroes: [makeHero({ name: "Ariane", isActive: true, currentHp: 10, currentMana: 5, calculatedStats: { ...makeHero().calculatedStats, maxHp: 20, maxMana: 10 } })],
        floor: 4,
        room: 2,
        autoExplore: true,
      })}
      onToggleAutoExplore={onToggleAutoExplore}
    />);

    expect(screen.getByText("Étage 4")).toBeInTheDocument();
    expect(screen.getByText(/Salle 2 \/ 20/)).toBeInTheDocument();
    expect(screen.getAllByText("Ariane - Lv 1").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Afficher Ariane - Lv 1")[0]).toHaveAttribute("aria-describedby");
    expect(screen.queryByText("PV 10/20")).not.toBeInTheDocument();
    expect(screen.queryByText("PM 5/10")).not.toBeInTheDocument();
    expect(screen.getAllByRole("progressbar", { name: "Points de vie de Ariane" })[0]).toHaveAttribute("aria-valuenow", "10");
    expect(screen.getAllByRole("progressbar", { name: "Mana de Ariane" })[0]).toHaveAttribute("aria-valuenow", "5");
    expect(screen.getAllByTestId(/^dungeon-banner-vitals-/)[0]).toHaveClass("grid-cols-1");
    expect(screen.getAllByRole("progressbar", { name: /Ariane/ })[0].querySelector("img")).toHaveAttribute("src", expect.stringContaining("dungeon-party-vital-bar-frame-v1.png"));
    const heroSlotImages = screen.getAllByLabelText("Afficher Ariane - Lv 1")[0].parentElement?.querySelectorAll("img");
    expect(Array.from(heroSlotImages ?? []).some((image) => image.getAttribute("src")?.includes("dungeon-class-plaque-novice-v2.png"))).toBe(true);
    expect(Array.from(heroSlotImages ?? []).some((image) => image.getAttribute("src")?.includes("dungeon-party-class-medallion-ring-v3.png"))).toBe(true);
    expect(screen.queryByText("10/20")).not.toBeInTheDocument();
    expect(screen.queryByText("5/10")).not.toBeInTheDocument();
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByRole("complementary", { name: "Progression du groupe dans le donjon" }).firstElementChild).toHaveClass("justify-center", "text-center", "md:text-left", "xl:h-full");
    expect(screen.getByRole("button", { name: "Pause" }).parentElement).toHaveClass("justify-center", "flex-nowrap", "w-full", "md:w-auto");
    expect(screen.getByRole("button", { name: "Pause" }).parentElement).not.toHaveClass("ml-auto");
    expect(screen.getByRole("button", { name: "Pause" }).querySelector("img:last-child")).toHaveAttribute("src", expect.stringContaining("dungeon-auto-pause-v1.png"));
    const groupSummary = screen.getByLabelText("Voir le groupe");
    expect(groupSummary).toHaveClass("min-h-11", "focus-visible:outline-ui-focus");
    expect(groupSummary.closest("details")?.parentElement).toBe(screen.getByRole("button", { name: "Pause" }).parentElement);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onToggleAutoExplore).toHaveBeenCalledOnce();
  });

  it("uses the gold menu treatment for resume and the dark treatment for pause", () => {
    const hero = makeHero({ isActive: true });
    const { rerender } = render(<DungeonProgressBanner
      view={createView({ heroes: [hero], autoExplore: false })}
      onToggleAutoExplore={vi.fn()}
    />);

    const resumeButton = screen.getByRole("button", { name: "Reprendre" });
    expect(resumeButton.querySelector("img:first-child")).toHaveAttribute("src", expect.stringContaining("primary-navigation-button-selected-v2.png"));
    expect(resumeButton.querySelector("img:last-child")).toHaveAttribute("src", expect.stringContaining("dungeon-auto-play-v1.png"));

    rerender(<DungeonProgressBanner
      view={createView({ heroes: [hero], autoExplore: true })}
      onToggleAutoExplore={vi.fn()}
    />);
    const pauseButton = screen.getByRole("button", { name: "Pause" });
    expect(pauseButton.querySelector("img:first-child")).toHaveAttribute("src", expect.stringContaining("primary-navigation-button-normal-v2.png"));
    expect(pauseButton.querySelector("img:last-child")).toHaveClass("grayscale");
  });
});
