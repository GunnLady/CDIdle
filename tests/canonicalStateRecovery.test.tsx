import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CanonicalStateAlert from "../src/components/CanonicalStateAlert";
import AccountPanel from "../src/components/AccountPanel";

const resources = { gold: 0, food: 0, wood: 0, stone: 0, ore: 0 };

afterEach(cleanup);

describe("canonical save recovery UI", () => {
  it("separates the connected account responsibilities without adding subnavigation", () => {
    render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isSyncing={false}
        canMutate
        canUseDangerActions
        resources={{ gold: 12, food: 10, wood: 8, stone: 6, ore: 4 }}
        buildings={{ farm: 2, sawmill: 1 }}
        totalCitizensCount={7}
        heroesCount={4}
        highestFloorReached={3}
        onRefreshServerState={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        systemLogs={[]}
        onClearSystemLogs={vi.fn()}
        onSignOut={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByTestId("account-identity-panel")).toBeInTheDocument();
    expect(screen.getByTestId("account-sync-panel")).toBeInTheDocument();
    expect(screen.getByTestId("realm-summary-panel")).toHaveTextContent("3 niv.");
    expect(screen.getByTestId("system-history-panel")).toBeInTheDocument();
    expect(screen.getByTestId("account-danger-zone")).toBeInTheDocument();
    expect(screen.getByText("Compte connecté")).toHaveClass("text-ui-success-text");
    expect(screen.getByLabelText("Afficher l’adresse du compte")).toHaveAttribute("aria-describedby");
    expect(screen.getByRole("button", { name: /Fermer la session/i })).toHaveAttribute("data-state", "ready");
    expect(screen.getByRole("button", { name: /Actualiser l’état serveur/i })).toHaveAttribute("data-state", "ready");
    expect(screen.getByRole("button", { name: /Réinitialiser totalement/i })).toHaveAttribute("data-state", "ready");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("shows a foldable system history in Account and clears only through its dedicated callback", () => {
    const onClearSystemLogs = vi.fn();
    render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isSyncing={false}
        canMutate
        canUseDangerActions
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onRefreshServerState={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        systemLogs={[{ id: "system", timestamp: "10:00", message: "Synchronisation terminée", type: "info" }]}
        onClearSystemLogs={onClearSystemLogs}
        onSignOut={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const history = screen.getByTestId("system-history-panel");
    expect(history).toHaveClass("ui-panel-skin");
    expect(within(history).getByText("Synchronisation terminée")).toBeInTheDocument();
    expect(history).toHaveAttribute("open");
    fireEvent.click(history.querySelector("summary")!);
    expect(history).not.toHaveAttribute("open");
    fireEvent.click(history.querySelector("summary")!);
    fireEvent.click(within(history).getByRole("button", { name: /effacer les notes/i }));
    expect(onClearSystemLogs).toHaveBeenCalledOnce();
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

  it("keeps reset recovery available when an incompatible save blocks gameplay mutations", async () => {
    const onHardReset = vi.fn().mockResolvedValue(undefined);
    render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isSyncing={false}
        canMutate={false}
        canUseDangerActions
        mutationBlockReason="Sauvegarde incompatible : les mutations de jeu sont verrouillées."
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onRefreshServerState={vi.fn().mockResolvedValue(undefined)}
        onHardReset={onHardReset}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        systemLogs={[]}
        onClearSystemLogs={vi.fn()}
        onSignOut={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: /Synchronisation indisponible/i })).toBeDisabled();
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
        isSyncing={false}
        canMutate
        canUseDangerActions
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onRefreshServerState={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={onDeleteAccount}
        systemLogs={[]}
        onClearSystemLogs={vi.fn()}
        onSignOut={vi.fn().mockResolvedValue(undefined)}
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
        isSyncing={false}
        canMutate
        canUseDangerActions
        isCommandPending
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onRefreshServerState={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        systemLogs={[]}
        onClearSystemLogs={vi.fn()}
        onSignOut={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const panel = within(container);
    expect(panel.getByRole("button", { name: /Fermer la session/i })).toBeDisabled();
    expect(panel.getByRole("button", { name: /Actualisation serveur/i })).toBeDisabled();
    expect(panel.getByRole("button", { name: /Réinitialiser totalement/i })).toBeDisabled();
    expect(panel.getByRole("button", { name: /Supprimer définitivement/i })).toBeDisabled();
  });

  it("keeps session management available but locks canonical actions in observer mode", () => {
    render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isSyncing={false}
        canMutate={false}
        canUseDangerActions={false}
        mutationBlockReason="Mode observateur : prenez le contrôle pour agir."
        dangerActionBlockReason="Mode observateur : prenez le contrôle pour gérer le royaume."
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onRefreshServerState={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onSignOut={vi.fn().mockResolvedValue(undefined)}
        systemLogs={[]}
        onClearSystemLogs={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Fermer la session/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Synchronisation indisponible/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Réinitialiser totalement/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Supprimer définitivement/i })).toBeDisabled();
    expect(screen.getAllByText(/Mode observateur/).length).toBeGreaterThan(0);
  });

  it("reports a failed sign-out instead of claiming that the session is closed", async () => {
    render(
      <AccountPanel
        currentUser={{ id: "user-1", email: "user@example.test" }}
        isSyncing={false}
        canMutate
        canUseDangerActions
        resources={resources}
        buildings={{}}
        totalCitizensCount={0}
        heroesCount={0}
        highestFloorReached={1}
        onRefreshServerState={vi.fn().mockResolvedValue(undefined)}
        onHardReset={vi.fn().mockResolvedValue(undefined)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onSignOut={vi.fn().mockRejectedValue(new Error("session refusée"))}
        systemLogs={[]}
        onClearSystemLogs={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Fermer la session/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("session refusée"));
  });
});
