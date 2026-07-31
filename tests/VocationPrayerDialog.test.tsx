import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VocationPrayerDialog from "../src/components/VocationPrayerDialog";
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

describe("VocationPrayerDialog", () => {
  it("shows only persisted candidates and sends the selected vocation", () => {
    const onChoose = vi.fn();
    const onDefer = vi.fn();
    render(<VocationPrayerDialog pending={pending} hero={makeHero({ id: pending.heroId, name: "Sybille" })} onChoose={onChoose} onDefer={onDefer} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("Sybille");
    expect(screen.getByRole("button", { name: /Guerrier/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pugiliste/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mage/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guerrier/i })).toHaveTextContent("Affinité relative 100.0 %");
    expect(screen.getByRole("button", { name: /Pugiliste/i })).toHaveTextContent("Affinité relative 99.5 %");
    fireEvent.click(screen.getByRole("button", { name: /Pugiliste/i }));
    expect(onChoose).toHaveBeenCalledWith("Pugiliste");
    fireEvent.click(screen.getByRole("button", { name: /Décider plus tard/i }));
    expect(onDefer).toHaveBeenCalledOnce();
  });

  it("locks every choice while the canonical command is pending", () => {
    render(<VocationPrayerDialog pending={pending} disabled onChoose={vi.fn()} onDefer={vi.fn()} />);
    expect(screen.getAllByRole("button")).toEqual(expect.arrayContaining([
      expect.objectContaining({ disabled: true }),
    ]));
    expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(true);
  });

  it("shows canonical choices read-only to an observer while allowing local deferral", () => {
    const onChoose = vi.fn();
    const onDefer = vi.fn();
    render(<VocationPrayerDialog pending={pending} readOnly onChoose={onChoose} onDefer={onDefer} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("Mode observateur");
    expect(screen.getByRole("button", { name: /Guerrier/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Pugiliste/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Décider plus tard/i }));
    expect(onDefer).toHaveBeenCalledOnce();
    expect(onChoose).not.toHaveBeenCalled();
  });
});
