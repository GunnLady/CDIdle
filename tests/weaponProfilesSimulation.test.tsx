import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeroPanel from "../src/components/HeroPanel";
import {
  resolveAuthoritativeDungeonEncounter,
  type AuthoritativeDungeonState,
} from "../src/domain/authoritativeDungeon";
import type { Rng } from "../src/domain/random";
import type { Hero } from "../src/types";
import { getHeroStats, refreshHeroDerivedStats } from "../src/utils/gameCalculations";
import {
  applyTownCommand,
  initialTownState,
} from "../supabase/functions/game-api/town-authority";
import { makeHero, makeResources } from "./fixtures/game";

afterEach(cleanup);

const storedItems = [
  { instanceId: "simulation-sword", itemId: "basic_sword", rarity: "common" as const },
  { instanceId: "simulation-shield", itemId: "wooden_shield", rarity: "common" as const },
  { instanceId: "simulation-spear", itemId: "basic_spear", rarity: "common" as const },
  { instanceId: "simulation-gauntlets", itemId: "basic_gauntlets", rarity: "common" as const },
];

function simulationHero(): Hero {
  return refreshHeroDerivedStats(makeHero({
    id: "hero-weapon-simulation",
    name: "Héros simulation",
    level: 10,
    equipment: {},
  }));
}

function equip(
  current: Record<string, unknown>,
  heroId: string,
  instanceId: string,
): Record<string, unknown> {
  return applyTownCommand(current, {
    type: "hero.equip",
    heroId,
    instanceId,
  }).state;
}

function unequip(
  current: Record<string, unknown>,
  heroId: string,
  slot: "mainHand" | "offHand",
): Record<string, unknown> {
  return applyTownCommand(current, {
    type: "hero.unequip",
    heroId,
    slot,
  }).state;
}

function heroFrom(current: Record<string, unknown>): Hero {
  return (current.heroes as Hero[])[0];
}

function tapeRng(values: number[]) {
  let index = 0;
  const consume = () => {
    if (index >= values.length) throw new Error(`RNG_TAPE_EXHAUSTED:${index}`);
    return values[index++];
  };
  const rng: Rng = {
    next: consume,
    nextInt: (maxExclusive) => Math.floor(consume() * maxExclusive),
  };
  return { rng, draws: () => index };
}

describe("weapon profile integration simulation", () => {
  it("simulates one-hand, two-hand and dual-wield equipment rules", () => {
    const hero = simulationHero();
    let current: Record<string, unknown> = {
      ...initialTownState(),
      heroes: [hero],
      storedItems,
    };

    current = equip(current, hero.id, "simulation-sword");
    current = equip(current, hero.id, "simulation-shield");
    const oneHanded = heroFrom(current);
    expect(oneHanded.equipment).toMatchObject({
      mainHand: { itemId: "basic_sword" },
      offHand: { itemId: "wooden_shield" },
    });
    expect(oneHanded.calculatedStats).toEqual(getHeroStats(oneHanded));

    current = unequip(current, hero.id, "mainHand");
    current = equip(current, hero.id, "simulation-spear");
    const twoHanded = heroFrom(current);
    expect(twoHanded.equipment?.mainHand?.itemId).toBe("basic_spear");
    expect(twoHanded.equipment?.offHand).toBeUndefined();
    expect(current.storedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ instanceId: "simulation-shield" }),
    ]));
    expect(twoHanded.calculatedStats).toEqual(getHeroStats(twoHanded));

    current = unequip(current, hero.id, "mainHand");
    current = equip(current, hero.id, "simulation-shield");
    current = equip(current, hero.id, "simulation-gauntlets");
    const dualWield = heroFrom(current);
    expect(dualWield.equipment?.mainHand?.itemId).toBe("basic_gauntlets");
    expect(dualWield.equipment?.offHand).toBeUndefined();
    expect(current.storedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ instanceId: "simulation-shield" }),
    ]));
    expect(dualWield.calculatedStats).toEqual(getHeroStats(dualWield));
  });

  it("simulates two independent dual-wield strikes through the real dungeon resolver", () => {
    const hero = makeHero({
      id: "hero-dual-combat-simulation",
      equipment: {
        mainHand: {
          instanceId: "simulation-gauntlets",
          itemId: "basic_gauntlets",
          rarity: "common",
        },
      },
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 100,
        speed: 0,
        criticalChance: 50,
      },
    });
    const tape = tapeRng([
      0.10, // combat encounter
      0.00, // first monster
      0.25, // visual monster id
      0.00, // first weapon damage: minimum
      0.99, // first strike: normal
      0.00, // second weapon damage: minimum
      0.00, // second strike: critical
      0.99, // no material
    ]);
    const dungeonState: AuthoritativeDungeonState = {
      ...initialTownState(42),
      activeDungeonFloor: 1,
      activeDungeonRoom: 1,
      highestFloorReached: 1,
      resources: makeResources({ gold: 0 }),
      buildings: { maison_chef: 0 },
      heroes: [hero],
      storedItems: [],
      forgeMaterials: [],
      autoExplore: true,
    };

    const result = resolveAuthoritativeDungeonEncounter(
      dungeonState,
      "weapon-profile-simulation",
      tape.rng,
    );
    const hits = result.encounter.transcript.filter((event) => event.type.startsWith("hero.hit"));

    expect(tape.draws()).toBe(8);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ strike: 1, strikeCount: 2, critical: false, rawDamage: 72 });
    expect(hits[1]).toMatchObject({ strike: 2, strikeCount: 2, critical: true, rawDamage: 72 });
    expect(hits[1].message).toContain("[Seconde arme] [Coup critique]");
    expect(Number(hits[0].damage)).toBeLessThan(Number(hits[0].rawDamage));
    expect(Number(hits[1].damage)).toBeLessThan(Math.floor(Number(hits[1].rawDamage) * 1.5));
  });

  it("rerenders the player-facing DPS and profile after an authoritative equipment update", () => {
    const hero = simulationHero();
    const initialState: Record<string, unknown> = {
      ...initialTownState(),
      heroes: [hero],
      storedItems,
    };
    const equippedState = equip(initialState, hero.id, "simulation-gauntlets");
    const equippedHero = heroFrom(equippedState);
    const commonProps = {
      resources: makeResources(),
      buildings: { guilde: 1 },
      onDismissHero: vi.fn(),
      onToggleHeroActive: vi.fn(),
      onRecruitHero: vi.fn(),
    };
    const view = render(<HeroPanel heroes={[hero]} {...commonProps} />);
    const dpsRow = () => screen.getByText("DPS estimé").parentElement;

    expect(dpsRow()).toHaveTextContent(hero.calculatedStats.estimatedDps.toFixed(2));
    view.rerender(<HeroPanel heroes={[equippedHero]} {...commonProps} />);
    expect(dpsRow()).toHaveTextContent(equippedHero.calculatedStats.estimatedDps.toFixed(2));
    expect(equippedHero.calculatedStats.estimatedDps).not.toBe(hero.calculatedStats.estimatedDps);

    fireEvent.click(screen.getByRole("button", { name: /équipement/i }));
    expect(screen.getByText("Profil: 2 coups × 65 % de puissance")).toBeInTheDocument();
    expect(screen.getByText("Scaling: Puissance (FOR)")).toBeInTheDocument();
  });
});
