import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CanonicalStateAlert from "../src/components/CanonicalStateAlert";
import AccountPanel from "../src/components/AccountPanel";

const resources = { gold: 0, food: 0, wood: 0, stone: 0, ore: 0 };

describe("canonical save recovery UI", () => {
  it("offers Google as the only authentication method", () => {
    render(
      <AccountPanel
        currentUser={null}
        isAuthLoading={false}
        isSyncing={false}
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onSaveCloud={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        addLog={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Google/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/mot de passe/i)).not.toBeInTheDocument();
  });

  it("shows an incompatible-save alert without claiming the app is offline", () => {
    const onOpenAccount = vi.fn();
    render(
      <CanonicalStateAlert
        requestId="request-rng-1"
        onOpenAccount={onOpenAccount}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Sauvegarde incompatible");
    expect(screen.getByRole("alert")).toHaveTextContent("request-rng-1");
    expect(screen.queryByText(/Mode hors connexion/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le compte" }));
    expect(onOpenAccount).toHaveBeenCalledOnce();
  });

  it("keeps the explicit reset recovery action available in the account panel", async () => {
    const onHardReset = vi.fn().mockResolvedValue(undefined);
    render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isAuthLoading={false}
        isSyncing={false}
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onSaveCloud={vi.fn().mockResolvedValue(undefined)}
        onHardReset={onHardReset}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        addLog={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: /Réinitialiser totalement le Royaume/i,
    }));
    fireEvent.click(screen.getByRole("button", {
      name: /Oui, TOUT supprimer/i,
    }));
    await waitFor(() => expect(onHardReset).toHaveBeenCalledOnce());
  });

  it("keeps the explicit account deletion action available in the account panel", async () => {
    const onDeleteAccount = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isAuthLoading={false}
        isSyncing={false}
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onSaveCloud={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={onDeleteAccount}
        addLog={vi.fn()}
      />,
    );

    fireEvent.click(within(container).getByRole("button", {
      name: /Supprimer définitivement le compte/i,
    }));
    fireEvent.click(within(container).getByRole("button", {
      name: /^Supprimer le compte$/i,
    }));
    await waitFor(() => expect(onDeleteAccount).toHaveBeenCalledOnce());
  });

  it("locks account mutations and sign-out while a canonical command is pending", () => {
    const { container } = render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isAuthLoading={false}
        isSyncing={false}
        isCommandPending
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onSaveCloud={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        addLog={vi.fn()}
      />,
    );

    const panel = within(container);
    expect(panel.getByRole("button", { name: /Fermer la session/i })).toBeDisabled();
    expect(panel.getByRole("button", { name: /Actualisation serveur/i })).toBeDisabled();
    expect(panel.getByRole("button", { name: /Réinitialiser totalement/i })).toBeDisabled();
    expect(panel.getByRole("button", { name: /Supprimer définitivement/i })).toBeDisabled();
  });
});
