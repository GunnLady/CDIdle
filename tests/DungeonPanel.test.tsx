import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DungeonPanel from "../src/components/DungeonPanel";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import type React from "react";
import { makeHero } from "./fixtures/game";
import {
  createUndercityProgress,
  haltUndercityExpedition,
  selectUndercityFarmZone,
} from "../shared/domain/undercity-progression";

const encounter: CanonicalDungeonEncounterRecord = {
  encounterId: "encounter-test",
  kind: "fight",
  floor: 2,
  room: 7,
  outcome: "victory",
  roundCount: 1,
  enemy: { hp: 0, maxHp: 12 },
  enemies: [{ id: "enemy-1", name: "Rat", hp: 0, maxHp: 12 }],
  transcript: [
    { sequence: 0, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", monsterId: "enemy-1", damage: 6, enemyHp: 6 },
    { sequence: 1, type: "hero.hit", round: 1, heroId: "hero-1", heroName: "Ragnor", monsterId: "enemy-1", damage: 6, enemyHp: 0 },
  ],
  rewards: { gold: 7, loot: [] },
};

const props = {
  heroes: [],
  activeDungeonFloor: 2,
  activeDungeonRoom: 8,
  autoExplore: false,
  dungeonProgress: createUndercityProgress([], 1),
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
  onResume: vi.fn(),
  onSelectFarmZone: vi.fn(),
  onToggleHeroActive: vi.fn(),
  pendingClassTransitions: [],
  onCheckpointDecision: vi.fn(),
} satisfies React.ComponentProps<typeof DungeonPanel>;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
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
    expect(current.getByText("6/12 PV")).toBeInTheDocument();
    expect(current.getByText("Combat en cours")).toBeInTheDocument();
    expect(screen.getByText("Étage 2 · Salle 8/10")).toBeInTheDocument();
    expect(screen.queryByText(/Résoudre/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exploration en cours…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exploration en cours…" })).toHaveAttribute("data-state", "loading");

    rerender(<DungeonPanel {...props} encounterPlayback={{ encounterId: encounter.encounterId, visibleCount: 2, complete: true }} isExploring={false} />);
    expect(within(screen.getByTestId("dungeon-current-encounter")).getAllByText("Tour 1 — Ragnor inflige 6 dégâts.")).toHaveLength(2);
    expect(within(screen.getByTestId("dungeon-current-encounter")).getByText("0/12 PV")).toBeInTheDocument();
    expect(within(screen.getByTestId("dungeon-current-encounter")).getByText("Victoire en 1 tour(s) · +7 or")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explorer la salle" })).toBeDisabled();
  });

  it("integrates the combat scene without duplicate enemy cards and keeps animation preference local", () => {
    render(<DungeonPanel {...props} />);

    const current = within(screen.getByTestId("dungeon-current-encounter"));
    expect(current.getByTestId("dungeon-combat-scene")).toHaveAttribute("data-animations", "enabled");
    expect(current.queryByTestId("dungeon-enemy-group")).not.toBeInTheDocument();
    expect(current.getByText("Journal détaillé")).toBeInTheDocument();

    fireEvent.click(current.getByRole("button", { name: "Animations : actives" }));
    expect(current.getByTestId("dungeon-combat-scene")).toHaveAttribute("data-animations", "disabled");
    expect(window.localStorage.getItem("cdidle:dungeon-animations")).toBe("disabled");
  });

  it("integrates treasure and rest scenes in the current authoritative encounter", () => {
    const hero = makeHero({ id: "non-combat-hero", name: "Ariane", isActive: true });
    const initialActors: NonNullable<CanonicalDungeonEncounterRecord["initialActors"]> = {
      v: 1,
      h: [[hero.id, "Guerrier_Female_1", 10, 20, 2, 10, 0]],
      e: [],
    };
    const treasure = {
      encounterId: "treasure-current",
      dungeonId: "undercity",
      kind: "treasure",
      floor: 2,
      room: 8,
      outcome: "victory",
      roundCount: 0,
      enemy: null,
      initialActors,
      transcript: [
        { sequence: 0, type: "treasure.opened", treasureOutcome: "gold" },
        { sequence: 1, type: "reward.gold", gold: 17 },
      ],
      rewards: { gold: 17, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    const rest = {
      ...treasure,
      encounterId: "rest-current",
      kind: "rest",
      transcript: [{
        sequence: 0,
        type: "party.restored",
        heroes: [{ heroId: hero.id, hpBefore: 10, hpAfter: 14, manaBefore: 2, manaAfter: 4, revived: false }],
      }],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;

    const view = render(<DungeonPanel
      {...props}
      heroes={[hero]}
      encounterHistory={[treasure]}
      encounterPlayback={{ encounterId: treasure.encounterId, visibleCount: 2, complete: true }}
      isExploring={false}
    />);
    let current = within(screen.getByTestId("dungeon-current-encounter"));
    expect(current.getByTestId("dungeon-combat-scene")).toHaveAccessibleName("Scène de rencontre");
    expect(current.getByLabelText("Trésor")).toHaveTextContent("+17 or");
    expect(current.getByText("Journal détaillé")).toBeInTheDocument();

    view.rerender(<DungeonPanel
      {...props}
      heroes={[hero]}
      encounterHistory={[rest]}
      encounterPlayback={{ encounterId: rest.encounterId, visibleCount: 1, complete: true }}
      isExploring={false}
    />);
    current = within(screen.getByTestId("dungeon-current-encounter"));
    expect(current.getByTestId("dungeon-combat-scene")).toHaveAccessibleName("Scène de rencontre");
    expect(current.getByLabelText("PV +4 · 14/20, Ariane")).toHaveAttribute("data-kind", "recovery-health");
    expect(current.getByLabelText("PM +2 · 4/10, Ariane")).toHaveAttribute("data-kind", "recovery-mana");
  });

  it("labels unavailable legacy health instead of reconstructing it from the final record", () => {
    const legacyGroup = {
      ...encounter,
      encounterId: "legacy-health-gap",
      enemies: [
        { id: "enemy-1", name: "Rat touché", hp: 0, maxHp: 12 },
        { id: "enemy-2", name: "Rat non observé", hp: 0, maxHp: 14 },
      ],
      transcript: [{
        sequence: 0,
        type: "hero.hit",
        heroId: "hero-1",
        heroName: "Ragnor",
        monsterId: "enemy-1",
        damage: 6,
        enemyHp: 6,
        enemyMaxHp: 12,
      }],
    } satisfies CanonicalDungeonEncounterRecord;

    render(<DungeonPanel
      {...props}
      encounterHistory={[legacyGroup]}
      encounterPlayback={{ encounterId: legacyGroup.encounterId, visibleCount: 1, complete: false }}
    />);

    const current = within(screen.getByTestId("dungeon-current-encounter"));
    expect(current.getByText("6/12 PV")).toBeInTheDocument();
    expect(current.getByText("PV historiques inconnus")).toBeInTheDocument();
  });

  it("keeps retreat available throughout the dungeon flow", () => {
    const view = render(<DungeonPanel {...props} isExploring={false} />);
    expect(screen.getByRole("button", { name: "Repli au campement" })).toBeEnabled();
    view.rerender(<DungeonPanel {...props} isExploring />);
    expect(screen.getByRole("button", { name: "Repli au campement" })).toBeEnabled();
  });

  it("presents a frozen segment KO as KO in the expedition", () => {
    const hero = makeHero({ id: "segment-ko", name: "Diane", currentHp: 0, isActive: false, status: "resting" });
    const dungeonProgress = createUndercityProgress([hero.id], 4);
    dungeonProgress.expedition = {
      ...dungeonProgress.expedition,
      phase: "running",
      segmentHeroIds: [hero.id],
      knockedOutHeroIds: [hero.id],
    };

    render(<DungeonPanel {...props} heroes={[hero]} dungeonProgress={dungeonProgress} isExploring={false} />);

    expect(screen.getAllByText("KO en expédition").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Au repos")).not.toBeInTheDocument();
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
      equipment: { mainHand: { instanceId: "magic-main-hand", itemId: "basic_staff", itemLevel: 10, powerModelId: "legacy-fixed-v1", rarity: "common" } },
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
    const transcript = within(current.getByTestId("dungeon-encounter-transcript"));
    expect(transcript.getByText("Probable est le héros le plus qualifié (AGI 44 + DEX 43 = 87, 80 % de réussite).")).toBeInTheDocument();
    expect(transcript.getByText("Probable tente l'épreuve avec un jet de LUK compris entre 1 et 10.")).toBeInTheDocument();
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

  it("exposes resume while halted and blocks progression controls", () => {
    const hero = makeHero({ id: "halted-hero", isActive: true });
    const progress = haltUndercityExpedition(createUndercityProgress([hero.id], 5), "wipe");
    const onResume = vi.fn();
    render(<DungeonPanel
      {...props}
      heroes={[hero]}
      activeDungeonFloor={6}
      activeDungeonRoom={1}
      highestFloorReached={6}
      dungeonProgress={progress}
      isExploring={false}
      onResume={onResume}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Reprendre" }));
    expect(onResume).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Exploration auto" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Étage précédent" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Étage suivant" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Réinitialiser l’étage" })).toBeDisabled();
  });

  it("locks floor navigation and zone changes during a farm session", () => {
    const hero = makeHero({ id: "farm-hero", isActive: true });
    const progress = selectUndercityFarmZone(createUndercityProgress([hero.id], 50), [hero.id], "sewers");
    const onSelectFarmZone = vi.fn();
    render(<DungeonPanel
      {...props}
      heroes={[hero]}
      activeDungeonFloor={1}
      activeDungeonRoom={1}
      highestFloorReached={50}
      dungeonProgress={progress}
      isExploring={false}
      onSelectFarmZone={onSelectFarmZone}
    />);

    expect(screen.getByRole("button", { name: "Exploration auto" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Étage précédent" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Étage suivant" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Réinitialiser l’étage" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Galeries des contrebandiers" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Galeries des contrebandiers" }));
    expect(onSelectFarmZone).not.toHaveBeenCalled();
  });

  it("locks composition, navigation and farm selection during an active encounter", () => {
    const active = makeHero({ id: "active-fighter", name: "Ariane", isActive: true });
    const reserve = makeHero({ id: "reserve-fighter", name: "Borin", isActive: false });
    const progress = selectUndercityFarmZone(createUndercityProgress([active.id], 50), [active.id], "sewers");
    render(<DungeonPanel
      {...props}
      heroes={[active, reserve]}
      activeDungeonFloor={1}
      activeDungeonRoom={1}
      highestFloorReached={50}
      dungeonProgress={progress}
      isExploring={false}
      activeEncounter={{
        encounterId: "farm-encounter",
        kind: "pending",
        status: "active",
        dungeonId: "undercity",
        floor: 1,
        room: 1,
        participantHeroIds: [active.id],
        commandId: "farm-command",
      }}
    />);

    expect(screen.getByRole("button", { name: "Retirer Ariane" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Déployer Borin" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Galeries des contrebandiers" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Étage précédent" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Étage suivant" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Réinitialiser l’étage" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Repli au campement" })).toBeEnabled();
  });

  it("shows farm vocations only for heroes in the current segment", () => {
    const member = makeHero({ id: "farm-member", name: "Ariane", isActive: true });
    const townHero = makeHero({ id: "town-hero", name: "Borin", isActive: false });
    const progress = selectUndercityFarmZone(createUndercityProgress([member.id, townHero.id], 50), [member.id], "sewers");
    const pendingClassTransitions = [member, townHero].map((hero) => ({
      heroId: hero.id,
      fromClass: "Novice" as const,
      fromTier: 0 as const,
      toTier: 1 as const,
      originLevel: 10,
      wasActive: hero.isActive,
      previousStatus: hero.status,
      reason: "test",
      candidates: [{ classType: "Guerrier" as const, affinity: 1 }],
    }));

    render(<DungeonPanel
      {...props}
      heroes={[member, townHero]}
      activeDungeonFloor={1}
      activeDungeonRoom={1}
      highestFloorReached={50}
      dungeonProgress={progress}
      pendingClassTransitions={pendingClassTransitions}
    />);

    expect(screen.getByTestId("dungeon-farm-vocation-notice")).toHaveTextContent("Ariane");
    expect(screen.getByTestId("dungeon-farm-vocation-notice")).not.toHaveTextContent("Borin");
  });

  it("allows switching farm zone while the expedition is halted", () => {
    const hero = makeHero({ id: "halted-farmer", isActive: true });
    const progress = haltUndercityExpedition(
      selectUndercityFarmZone(createUndercityProgress([hero.id], 50), [hero.id], "sewers"),
      "wipe",
    );
    const onSelectFarmZone = vi.fn();
    render(<DungeonPanel
      {...props}
      heroes={[hero]}
      activeDungeonFloor={1}
      activeDungeonRoom={1}
      highestFloorReached={50}
      dungeonProgress={progress}
      isExploring={false}
      onSelectFarmZone={onSelectFarmZone}
    />);

    const zoneButton = screen.getByRole("button", { name: "Galeries des contrebandiers" });
    expect(zoneButton).toBeEnabled();
    fireEvent.click(zoneButton);
    expect(onSelectFarmZone).toHaveBeenCalledWith("smugglers");
    expect(screen.getByRole("button", { name: "Reprendre" })).toBeEnabled();
  });

  it("requires a farm choice after the shared Rat King victory", () => {
    const hero = makeHero({ id: "king-slayer-ui", isActive: true });
    const progress = createUndercityProgress([hero.id], 50);
    render(<DungeonPanel
      {...props}
      heroes={[hero]}
      activeDungeonFloor={50}
      activeDungeonRoom={1}
      highestFloorReached={50}
      dungeonProgress={progress}
      isExploring={false}
    />);

    expect(screen.getByRole("button", { name: "Exploration auto" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Explorer la salle" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Étage précédent" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Égouts infestés" })).toBeEnabled();
  });

  it("blocks the next-floor control at the least advanced active hero ceiling", () => {
    const veteran = makeHero({ id: "ui-veteran", name: "Vétéran", isActive: true });
    const novice = makeHero({ id: "ui-novice", name: "Novice", isActive: true });
    const progress = createUndercityProgress([veteran.id, novice.id]);
    progress.heroes[veteran.id].completedFloor = 50;
    progress.heroes[novice.id].completedFloor = 10;
    progress.expedition = { ...progress.expedition, floor: 11, room: 1 };
    render(<DungeonPanel
      {...props}
      heroes={[veteran, novice]}
      activeDungeonFloor={11}
      activeDungeonRoom={1}
      highestFloorReached={50}
      dungeonProgress={progress}
      isExploring={false}
    />);

    expect(screen.getByRole("button", { name: "Étage précédent" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Étage suivant" })).toBeDisabled();
  });
});
