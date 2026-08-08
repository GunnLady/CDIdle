import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DungeonProgressBanner, { shouldShowDungeonProgressBanner } from "../src/components/app-shell/DungeonProgressBanner";
import { makeHero } from "./fixtures/game";

afterEach(cleanup);

describe("DungeonProgressBanner", () => {
  it("is present on the four supporting pages and absent from the dungeon", () => {
    expect(["city", "heroes", "storage", "account"].map((tab) =>
      shouldShowDungeonProgressBanner(true, tab as "city" | "heroes" | "storage" | "account"),
    )).toEqual([true, true, true, true]);
    expect(shouldShowDungeonProgressBanner(true, "dungeon")).toBe(false);
    expect(shouldShowDungeonProgressBanner(false, "city")).toBe(false);
  });

  it("offers party preparation when no hero is active", () => {
    const onNavigate = vi.fn();
    render(<DungeonProgressBanner
      heroes={[makeHero({ isActive: false })]}
      floor={2}
      room={3}
      autoExplore={false}
      encounter={null}
      isExploring={false}
      canMutate
      onNavigate={onNavigate}
      onToggleAutoExplore={vi.fn()}
    />);

    expect(screen.getByText(/Aucun groupe/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Préparer le groupe" }));
    expect(onNavigate).toHaveBeenCalledWith("heroes");
  });

  it("projects canonical party health and exposes an unambiguous pause command", () => {
    const onToggleAutoExplore = vi.fn();
    render(<DungeonProgressBanner
      heroes={[makeHero({ name: "Ariane", isActive: true, currentHp: 10, currentMana: 5, calculatedStats: { ...makeHero().calculatedStats, maxHp: 20, maxMana: 10 } })]}
      floor={4}
      room={2}
      autoExplore
      encounter={null}
      isExploring={false}
      canMutate
      onNavigate={vi.fn()}
      onToggleAutoExplore={onToggleAutoExplore}
    />);

    expect(screen.getByText(/Étage 4 · Salle 2\//)).toBeInTheDocument();
    expect(screen.getAllByText("Ariane").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PV 10/20").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PM 5/10").length).toBeGreaterThan(0);
    expect(screen.getByText("Voir le groupe")).toHaveClass("min-h-11", "focus-visible:outline-2");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onToggleAutoExplore).toHaveBeenCalledOnce();
  });
});
