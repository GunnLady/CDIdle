import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  canMutate: true,
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
  onToggleHeroActive: vi.fn(),
} satisfies React.ComponentProps<typeof DungeonPanel>;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DungeonPanel authoritative structure", () => {
  it("renders the four validated page zones", () => {
    render(<DungeonPanel {...props} />);
    expect(screen.getByTestId("dungeon-progression-panel")).toBeInTheDocument();
    expect(screen.getByTestId("dungeon-current-encounter")).toBeInTheDocument();
    expect(screen.getByTestId("dungeon-party-panel")).toBeInTheDocument();
    expect(screen.getByTestId("dungeon-history-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exploration auto" })).toHaveAttribute("data-state", "disabled");
    const retreatButton = screen.getByRole("button", { name: "Repli au campement" });
    expect(retreatButton).toHaveAttribute("data-state", "ready");
    expect(retreatButton.parentElement).toHaveClass("grid-cols-1", "sm:grid-cols-3");
    expect(screen.getByRole("button", { name: "Réinitialiser l’étage" })).toHaveClass("w-full", "whitespace-nowrap");
  });

  it("lets the player fold and unfold the dungeon history", () => {
    render(<DungeonPanel {...props} />);
    const history = screen.getByTestId("dungeon-history-panel");
    expect(history).toHaveAttribute("open");
    fireEvent.click(history.querySelector("summary")!);
    expect(history).not.toHaveAttribute("open");
    fireEvent.click(history.querySelector("summary")!);
    expect(history).toHaveAttribute("open");
  });

  it("reveals the current transcript progressively without a manual resolve action", () => {
    const { rerender } = render(<DungeonPanel {...props} />);
    const current = within(screen.getByTestId("dungeon-current-encounter"));
    expect(current.getAllByText("Tour 1 — Ragnor inflige 6 dégâts.")).toHaveLength(1);
    expect(current.getByText("Combat en cours")).toBeInTheDocument();
    expect(screen.getByText("Étage 2 · Salle 8/10")).toBeInTheDocument();
    expect(screen.queryByText(/Résoudre/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exploration en cours…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exploration en cours…" })).toHaveAttribute("data-state", "loading");

    rerender(<DungeonPanel {...props} encounterPlayback={{ encounterId: encounter.encounterId, visibleCount: 2, complete: true }} isExploring={false} />);
    expect(within(screen.getByTestId("dungeon-current-encounter")).getAllByText("Tour 1 — Ragnor inflige 6 dégâts.")).toHaveLength(2);
    expect(within(screen.getByTestId("dungeon-current-encounter")).getByText("Victoire en 1 tour(s) · +7 or")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explorer la salle" })).toBeDisabled();
  });

  it("keeps retreat available throughout the dungeon flow", () => {
    const view = render(<DungeonPanel {...props} isExploring={false} />);
    expect(screen.getByRole("button", { name: "Repli au campement" })).toBeEnabled();
    view.rerender(<DungeonPanel {...props} isExploring />);
    expect(screen.getByRole("button", { name: "Repli au campement" })).toBeEnabled();
  });

  it("shows the canonical active encounter while its resolution is pending", () => {
    render(<DungeonPanel {...props} activeEncounter={{ encounterId: "encounter-active", kind: "pending", status: "active", floor: 2, room: 8, commandId: "command-active" }} />);
    expect(screen.getByLabelText("Rencontre autoritaire active")).toHaveTextContent("Rencontre autoritaire prête");
    expect(screen.getByLabelText("Rencontre autoritaire active")).toHaveTextContent("Étage 2 · Salle 8");
  });

  it("shows weapon-resolved attack power, DPS and mana in the party", () => {
    const hero = makeHero({
      isActive: true,
      currentMana: 4,
      equipment: { mainHand: { instanceId: "magic-main-hand", itemId: "basic_staff", rarity: "common" } },
      calculatedStats: { ...makeHero().calculatedStats, physicalDamage: 5, magicDamage: 99, estimatedDps: 123.45 },
    });
    render(<DungeonPanel {...props} heroes={[hero]} />);
    const party = within(screen.getByTestId("dungeon-party-panel"));
    expect(party.getByTitle("Puissance garantie de l'attaque normale avant le jet de l'arme")).toHaveTextContent("123");
    expect(party.getByTitle("DPS estimé de l'attaque normale par cycle, avant défense et résistances")).toHaveTextContent("123.45");
    const heroButton = party.getAllByText(hero.name)[0].closest("button");
    expect(heroButton).not.toBeNull();
    expect(within(heroButton as HTMLElement).getByText(`4/${hero.calculatedStats.maxMana}`)).toBeInTheDocument();
  });

  it("shows the latest current transcript message first", () => {
    const orderedEncounter = { ...encounter, transcript: [
      { sequence: 0, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", damage: 3, enemyHp: 9 },
      { sequence: 1, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", damage: 9, enemyHp: 0 },
    ] } satisfies CanonicalDungeonEncounterRecord;
    render(<DungeonPanel {...props} encounterHistory={[orderedEncounter]} encounterPlayback={{ encounterId: orderedEncounter.encounterId, visibleCount: 2, complete: true }} />);
    const current = within(screen.getByTestId("dungeon-current-encounter"));
    const latest = current.getByText("Tour 1 — Ragnor inflige 9 dégâts.");
    const oldest = current.getByText("Tour 1 — Ragnor inflige 3 dégâts.");
    expect(latest.compareDocumentPosition(oldest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows authoritative non-combat messages without recomputing them", () => {
    const challengeEncounter: CanonicalDungeonEncounterRecord = { ...encounter, encounterId: "challenge-front", kind: "trap", enemy: null, roundCount: 0, transcript: [
      { sequence: 0, type: "challenge.hero_selected", message: "Probable est le héros le plus qualifié (AGI 44 + DEX 43 = 87, 80 % de réussite).", heroId: "probable", heroName: "Probable", score: 87, probabilityPercent: 80 },
      { sequence: 1, type: "challenge.attempted", message: "Probable tente l'épreuve avec un jet de LUK compris entre 1 et 10.", luck: 10, difficulty: 90 },
    ] };
    render(<DungeonPanel {...props} encounterHistory={[challengeEncounter]} encounterPlayback={{ encounterId: challengeEncounter.encounterId, visibleCount: 2, complete: true }} isExploring={false} />);
    const current = within(screen.getByTestId("dungeon-current-encounter"));
    expect(current.getByText("Probable est le héros le plus qualifié (AGI 44 + DEX 43 = 87, 80 % de réussite).")).toBeInTheDocument();
    expect(current.getByText("Probable tente l'épreuve avec un jet de LUK compris entre 1 et 10.")).toBeInTheDocument();
  });

  it("keeps local consultation available in read-only mode while blocking commands", () => {
    const reserve = makeHero({ id: "reserve", name: "Réserve", isActive: false });
    render(<DungeonPanel {...props} heroes={[reserve]} canMutate={false} battleLogs={[{ id: "dungeon-note", timestamp: "10:00", message: "Note donjon", type: "info", category: "dungeon" }, { id: "colony-note", timestamp: "10:01", message: "Note colonie", type: "info", category: "colony" }]} />);
    const party = within(screen.getByTestId("dungeon-party-panel"));
    fireEvent.click(party.getByRole("button", { name: /^Réserve/ }));
    const sheetElement = screen.getByTestId("dungeon-hero-sheet");
    const sheet = within(sheetElement);
    expect(sheet.getByText(/Réserve · Lv 1/)).toBeInTheDocument();
    expect(sheet.queryByText(/Humain · Novice/)).not.toBeInTheDocument();
    expect(sheetElement.querySelector('[id^="hero-portrait-"]')).not.toBeNull();
    expect(sheet.getByText("Défense magique")).toBeInTheDocument();
    fireEvent.click(party.getByRole("button", { name: "Compétences" }));
    expect(party.getByTestId("dungeon-hero-skills")).toBeInTheDocument();
    fireEvent.click(party.getByRole("button", { name: "Équipement" }));
    expect(party.getByTestId("dungeon-hero-equipment")).toBeInTheDocument();
    expect(party.getByRole("button", { name: "Déployer Réserve" })).toBeDisabled();
    expect(party.getByLabelText("Pourquoi Réserve ne peut pas être déployé")).toHaveAccessibleDescription("Lecture seule");
    expect(screen.getByText("Note donjon")).toBeInTheDocument();
    expect(screen.queryByText("Note colonie")).not.toBeInTheDocument();
    expect(screen.queryByText("Donjon", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exploration en cours…" })).toBeDisabled();
    expect(screen.getByLabelText("Pourquoi l’exploration est indisponible")).toHaveAccessibleDescription("Lecture seule");
  });

  it("dispatches party deployment from the dungeon page", () => {
    const reserve = makeHero({ id: "reserve", name: "Réserve", isActive: false });
    const onToggleHeroActive = vi.fn();
    render(<DungeonPanel {...props} heroes={[reserve]} onToggleHeroActive={onToggleHeroActive} />);
    fireEvent.click(screen.getByRole("button", { name: "Déployer Réserve" }));
    expect(onToggleHeroActive).toHaveBeenCalledWith("reserve");
  });
});
