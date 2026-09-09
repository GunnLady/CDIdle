import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DungeonCheckpointDecision from "../src/components/dungeon/DungeonCheckpointDecision";
import DungeonFarmVocationNotice from "../src/components/dungeon/DungeonFarmVocationNotice";
import { makeHero } from "./fixtures/game";

const heroes = [
  makeHero({ id: "ready", name: "Aldric", currentHp: 20 }),
  makeHero({ id: "ko", name: "Diane", currentHp: 0, isActive: false, status: "resting" }),
];

afterEach(cleanup);

describe("dungeon checkpoint presentation harness", () => {
  it("H09 — shows the frozen roster, KO state and both decisions", () => {
    const onDecision = vi.fn();
    render(<DungeonCheckpointDecision
      floor={5}
      heroIds={["ready", "ko"]}
      knockedOutHeroIds={["ko"]}
      heroes={heroes}
      pendingClassTransitions={[]}
      canMutate
      onDecision={onDecision}
    />);
    expect(screen.getByText("Jalon 5 atteint")).toBeInTheDocument();
    expect(screen.getByText("Diane").closest("li")).toHaveTextContent("Diane — KO, conserve sa place");
    fireEvent.click(screen.getByRole("button", { name: "Continuer avec la même équipe" }));
    expect(onDecision).toHaveBeenCalledWith("continue");
    fireEvent.click(screen.getByRole("button", { name: "Retourner en ville et gérer l’équipe" }));
    expect(onDecision).toHaveBeenCalledWith("return_to_town");
  });

  it("H10 — explains a pending vocation without removing Continue", () => {
    render(<DungeonCheckpointDecision
      floor={10}
      heroIds={["ready"]}
      knockedOutHeroIds={[]}
      heroes={heroes}
      pendingClassTransitions={[{
        heroId: "ready", fromClass: "Novice", fromTier: 0, toTier: 1,
        originLevel: 10, wasActive: true, previousStatus: "idle", reason: "level",
        candidates: [{ classType: "Guerrier", affinity: 1 }],
      }]}
      canMutate
      onDecision={vi.fn()}
    />);
    expect(screen.getByText("Vocation disponible :").parentElement).toHaveTextContent(
      "Vocation disponible : Aldric. Retournez en ville pour la choisir.",
    );
    expect(screen.getByRole("button", { name: "Continuer avec la même équipe" })).toBeEnabled();
  });

  it("H17 — renders a non-blocking farm vocation notice", () => {
    render(<DungeonFarmVocationNotice heroNames={["Aldric"]} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Vocation disponible : Aldric. Arrêtez le farm et retournez en ville pour la choisir.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
