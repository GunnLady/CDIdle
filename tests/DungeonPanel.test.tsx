import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonPanel from "../src/components/DungeonPanel";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import type React from "react";
import { makeHero } from "./fixtures/game";

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
        isExploring={false}
      />,
    );

    expect(panel.getByRole("button", { name: "Repli au Campement" })).toBeEnabled();

    view.rerender(
      <DungeonPanel
        {...props}
        isExploring
      />,
    );

    expect(panel.getByRole("button", { name: "Repli au Campement" })).toBeEnabled();
  });

  it("shows the canonical active encounter while its resolution is pending", () => {
    render(
      <DungeonPanel
        {...props}
        activeEncounter={{
          encounterId: "encounter-active",
          kind: "pending",
          status: "active",
          floor: 2,
          room: 8,
          commandId: "command-active",
        }}
      />,
    );

    expect(screen.getByLabelText("Rencontre autoritaire active")).toHaveTextContent("Rencontre autoritaire prête");
    expect(screen.getByLabelText("Rencontre autoritaire active")).toHaveTextContent("Étage 2 · Salle 8");
  });

  it("shows the weapon-resolved normal attack power and estimated DPS", () => {
    const hero = makeHero({
      isActive: true,
      equipment: {
        mainHand: { instanceId: "magic-main-hand", itemId: "basic_staff", rarity: "common" },
      },
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 5,
        magicDamage: 99,
        estimatedDps: 123.45,
      },
    });
    render(<DungeonPanel {...props} heroes={[hero]} />);

    expect(screen.getByTitle("Puissance garantie de l'attaque normale avant le jet de l'arme"))
      .toHaveTextContent("123");
    expect(screen.getByTitle("DPS estimé de l'attaque normale par cycle, avant défense et résistances"))
      .toHaveTextContent("123.45");
  });

  it("shows current mana below health for each active hero", () => {
    const hero = makeHero({ isActive: true, currentMana: 4 });
    const view = render(<DungeonPanel {...props} heroes={[hero]} />);
    const card = within(view.container).getByText(hero.name).closest(".rounded-xl");

    expect(card).not.toBeNull();
    const cardContent = within(card as HTMLElement);
    const healthLabel = cardContent.getByText("Vie de l'aventurier");
    const manaLabel = cardContent.getByText("Mana");
    expect(healthLabel.compareDocumentPosition(manaLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cardContent.getByText(`4/${hero.calculatedStats.maxMana}`)).toBeInTheDocument();
  });

  it("shows the latest transcript message first", () => {
    const orderedEncounter: CanonicalDungeonEncounterRecord = {
      ...encounter,
      transcript: [
        { sequence: 0, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", damage: 3, enemyHp: 9 },
        { sequence: 1, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", damage: 9, enemyHp: 0 },
      ],
    };
    render(
      <DungeonPanel
        {...props}
        encounterHistory={[orderedEncounter]}
        encounterPlayback={{ encounterId: orderedEncounter.encounterId, visibleCount: 2, complete: true }}
      />,
    );

    const latestMessage = screen.getByText("Tour 1 — Ragnor inflige 9 dégâts.");
    const oldestMessage = screen.getByText("Tour 1 — Ragnor inflige 3 dégâts.");
    expect(latestMessage.compareDocumentPosition(oldestMessage)
      & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
