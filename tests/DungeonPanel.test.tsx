import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonPanel from "../src/components/DungeonPanel";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import type React from "react";

const encounter: CanonicalDungeonEncounterRecord = {
  encounterId: "encounter-test",
  kind: "fight",
  floor: 2,
  room: 7,
  outcome: "victory",
  roundCount: 1,
  enemy: { hp: 0, maxHp: 12 },
  transcript: [
    { sequence: 0, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", damage: 6, enemyHp: 6 },
    { sequence: 1, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", damage: 6, enemyHp: 0 },
  ],
  rewards: { gold: 7, loot: [] },
};

const props = {
  heroes: [],
  activeDungeonFloor: 2,
  activeDungeonRoom: 8,
  autoExplore: false,
  battleLogs: [],
  highestFloorReached: 2,
  onToggleAutoExplore: vi.fn(),
  activeEncounter: null,
  encounterHistory: [encounter],
  encounterPlayback: { encounterId: encounter.encounterId, visibleCount: 1, complete: false },
  isExploring: true,
  onExplore: vi.fn(),
  onChangeFloor: vi.fn(),
  onRetreatParty: vi.fn(),
  onClearBattleLogs: vi.fn(),
  onResetLevel: vi.fn(),
} satisfies React.ComponentProps<typeof DungeonPanel>;

describe("DungeonPanel authoritative encounter history", () => {
  it("reveals transcript lines progressively without a manual resolve action", () => {
    const { rerender } = render(<DungeonPanel {...props} />);

    expect(screen.getByText("Tour 1 — Ragnor inflige 6 dégâts.")).toBeInTheDocument();
    expect(screen.getAllByText("Tour 1 — Ragnor inflige 6 dégâts.")).toHaveLength(1);
    expect(screen.getByText("Combat en cours")).toBeInTheDocument();
    expect(screen.getByText("Étage 2 - Salle 8/10")).toBeInTheDocument();
    expect(screen.queryByText(/Résoudre/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exploration en cours…" })).toBeDisabled();

    rerender(
      <DungeonPanel
        {...props}
        encounterPlayback={{ encounterId: encounter.encounterId, visibleCount: 2, complete: true }}
        isExploring={false}
      />,
    );

    expect(screen.getAllByText("Tour 1 — Ragnor inflige 6 dégâts.")).toHaveLength(2);
    expect(screen.getByText("Victoire en 1 tour(s) · +7 or")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explorer la salle" })).toBeDisabled();
  });

  it("keeps retreat available throughout the dungeon flow", () => {
    const view = render(<DungeonPanel {...props} isExploring={false} />);
    const panel = within(view.container);

    expect(panel.getByRole("button", { name: "Repli au Campement" })).toBeEnabled();

    view.rerender(
      <DungeonPanel
        {...props}
        activeEncounter={{ encounterId: "encounter-active", floor: 2, room: 8 }}
        isExploring={false}
      />,
    );

    expect(panel.getByRole("button", { name: "Repli au Campement" })).toBeEnabled();

    view.rerender(
      <DungeonPanel
        {...props}
        activeEncounter={{ encounterId: "encounter-active", floor: 2, room: 8 }}
        isExploring
      />,
    );

    expect(panel.getByRole("button", { name: "Repli au Campement" })).toBeEnabled();
  });
});
