import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../src/components/LoginPage";
import { makeHero } from "./fixtures/game";

const authMocks = vi.hoisted(() => ({
  getAuthSnapshot: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock("../src/lib/supabase", () => authMocks);

describe("LoginPage smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getAuthSnapshot.mockReturnValue(new Promise(() => undefined));
    authMocks.signInWithGoogle.mockResolvedValue({ data: { provider: "google" }, error: null });
  });

  it("renders and delegates Google authentication to Supabase", async () => {
    const addLog = vi.fn();
    render(
      <LoginPage
        authoritativeNovices={[]}
        pendingCityName=""
        onGenerateStartingNovices={vi.fn().mockResolvedValue(true)}
        onLoginSuccess={vi.fn().mockResolvedValue(true)}
        addLog={addLog}
      />,
    );
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/mot de passe/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Google/i }));

    await waitFor(() => expect(authMocks.signInWithGoogle).toHaveBeenCalledOnce());
    expect(addLog).toHaveBeenCalledWith(
      "☁️ Connexion établie via Google avec succès !",
      "victory",
    );
  });

  it("shows canonical French stat abbreviations for novice selection", async () => {
    render(
      <LoginPage
        authoritativeNovices={[makeHero({
          baseStats: { str: 10, agi: 8, end: 7, int: 6, wiz: 1, dex: 5, luk: 4 },
        })]}
        pendingCityName="Test"
        onGenerateStartingNovices={vi.fn().mockResolvedValue(true)}
        onLoginSuccess={vi.fn().mockResolvedValue(true)}
        addLog={vi.fn()}
      />,
    );

    expect(await screen.findByText("▲ FOR (10)")).toBeInTheDocument();
    expect(screen.getByText("▼ SAG (1)")).toBeInTheDocument();
  });
});
