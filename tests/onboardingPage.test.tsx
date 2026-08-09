import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OnboardingPage from "../src/components/onboarding/OnboardingPage";
import { makeHero } from "./fixtures/game";

const candidates = Array.from({ length: 5 }, (_, index) => makeHero({
  id: `founder-${index}`,
  name: `Novice ${index + 1}`,
  gender: index % 2 === 0 ? "Male" : "Female",
  baseStats: { str: 10 - index, agi: 4, end: 7, int: 3, wiz: 1, dex: 5, luk: 2 },
}));

afterEach(cleanup);

describe("OnboardingPage", () => {
  it("starts with city creation and delegates only the normalized name", async () => {
    const onRequestCandidates = vi.fn().mockResolvedValue(true);
    render(<OnboardingPage candidates={[]} pendingCityName="" canMutate onRequestCandidates={onRequestCandidates} onConfirmFounders={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Nom de la Cité ralliée"), { target: { value: "  Valbois  " } });
    fireEvent.submit(screen.getByLabelText("Nom de la Cité ralliée").closest("form")!);
    await waitFor(() => expect(onRequestCandidates).toHaveBeenCalledWith("Valbois"));
  });

  it("keeps local naming available in read-only mode while blocking the canonical command", () => {
    const onRequestCandidates = vi.fn();
    const onRequestControl = vi.fn();
    render(<OnboardingPage candidates={[]} pendingCityName="" canMutate={false} mutationBlockReason="Mode observateur" onRequestControl={onRequestControl} onRequestCandidates={onRequestCandidates} onConfirmFounders={vi.fn()} />);
    const input = screen.getByLabelText("Nom de la Cité ralliée");
    fireEvent.change(input, { target: { value: "Valbois" } });
    expect(input).toHaveValue("Valbois");
    expect(screen.getByRole("button", { name: "Fonder la Cité" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Prendre le contrôle" }));
    expect(onRequestControl).toHaveBeenCalledOnce();
    expect(onRequestCandidates).not.toHaveBeenCalled();
  });

  it("keeps founder selection and renaming local in read-only mode", () => {
    const onConfirmFounders = vi.fn();
    render(<OnboardingPage candidates={candidates} pendingCityName="Valbois" canMutate={false} mutationBlockReason="Mode observateur" onRequestCandidates={vi.fn()} onConfirmFounders={onConfirmFounders} />);
    fireEvent.click(screen.getByRole("button", { name: "Sélectionner Novice 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Sélectionner Novice 2" }));
    fireEvent.change(screen.getByLabelText("Nom de Novice 1"), { target: { value: "Ariane" } });

    expect(screen.getByText("Sélectionné : 2 / 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom de Ariane")).toHaveValue("Ariane");
    expect(screen.getByRole("button", { name: /Fonder la Cité et commencer/i })).toBeDisabled();
    expect(onConfirmFounders).not.toHaveBeenCalled();
  });

  it("preserves local founder choices across equivalent canonical projections", async () => {
    const onConfirmFounders = vi.fn().mockResolvedValue(true);
    const { rerender } = render(<OnboardingPage candidates={candidates} pendingCityName="Valbois" canMutate onRequestCandidates={vi.fn()} onConfirmFounders={onConfirmFounders} />);
    expect(screen.getByText("▲ FOR (10)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sélectionner Novice 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Sélectionner Novice 2" }));
    fireEvent.click(screen.getByLabelText("Nom de Novice 1"));
    expect(screen.getByText("Sélectionné : 2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Désélectionner Novice 1" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(screen.getByLabelText("Nom de Novice 1"), { target: { value: "Ariane" } });
    expect(screen.getByRole("button", { name: "Désélectionner Ariane" })).toHaveAttribute("aria-pressed", "true");
    rerender(<OnboardingPage candidates={candidates.map((hero) => ({ ...hero }))} pendingCityName="Valbois" canMutate onRequestCandidates={vi.fn()} onConfirmFounders={onConfirmFounders} />);
    expect(screen.getByText("Sélectionné : 2 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Fonder la Cité et commencer/i }));
    await waitFor(() => expect(onConfirmFounders).toHaveBeenCalledWith([
      { id: "founder-0", name: "Ariane" },
      { id: "founder-1", name: "Novice 2" },
    ]));
  });
});
