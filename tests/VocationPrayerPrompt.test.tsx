import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VocationPrayerPrompt from "../src/components/VocationPrayerPrompt";
import { makeHero } from "./fixtures/game";

const pending = {
  heroId: "hero-prayer",
  fromClass: "Novice" as const,
  fromTier: 0,
  toTier: 1,
  originLevel: 10,
  wasActive: true,
  previousStatus: "idle" as const,
  reason: "Prière",
  candidates: [
    { classType: "Guerrier" as const, affinity: 0.91 },
    { classType: "Pugiliste" as const, affinity: 0.905 },
  ],
};

afterEach(cleanup);

describe("VocationPrayerPrompt", () => {
  it("keeps a deferred vocation accessible and reopens its canonical choices", () => {
    render(
      <VocationPrayerPrompt
        pending={pending}
        hero={makeHero({ id: pending.heroId, name: "Sybille" })}
        onChoose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Décider plus tard/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Choisir la vocation de Sybille/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guerrier/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pugiliste/i })).toBeInTheDocument();
  });

  it("opens the next hero prayer even when the previous one was deferred", () => {
    const { rerender } = render(
      <VocationPrayerPrompt
        pending={pending}
        hero={makeHero({ id: pending.heroId, name: "Sybille" })}
        onChoose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Décider plus tard/i }));

    const nextPending = { ...pending, heroId: "hero-next" };
    rerender(
      <VocationPrayerPrompt
        pending={nextPending}
        hero={makeHero({ id: nextPending.heroId, name: "Berik" })}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent("Berik");
  });
});
