import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../src/components/LoginPage";

const authMocks = vi.hoisted(() => ({
  getAuthSnapshot: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
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
    fireEvent.click(screen.getByRole("button", { name: /Google/i }));

    await waitFor(() => expect(authMocks.signInWithGoogle).toHaveBeenCalledOnce());
    expect(addLog).toHaveBeenCalledWith(
      "☁️ Connexion établie via Google avec succès !",
      "victory",
    );
  });
});
