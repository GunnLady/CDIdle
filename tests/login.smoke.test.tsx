import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "../src/components/LoginPage";

vi.mock("../src/lib/firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class { setCustomParameters() {} },
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({ doc: vi.fn(), setDoc: vi.fn() }));

describe("LoginPage smoke", () => {
  it("se rend avec Firebase entièrement mocké", () => {
    render(
      <LoginPage
        authoritativeNovices={[]}
        pendingCityName=""
        onGenerateStartingNovices={vi.fn().mockResolvedValue(true)}
        onLoginSuccess={vi.fn().mockResolvedValue(true)}
        addLog={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    expect(screen.getByText(/Google/i)).toBeInTheDocument();
  });
});
