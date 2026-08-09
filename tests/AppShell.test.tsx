import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppShell from "../src/components/app-shell/AppShell";
import CanonicalStatusLayer from "../src/components/app-shell/CanonicalStatusLayer";
import PrimaryNavigation from "../src/components/app-shell/PrimaryNavigation";
import ResourceHeader from "../src/components/app-shell/ResourceHeader";

afterEach(cleanup);

describe("AppShell", () => {
  it("owns the shared frame and viewport without a persistent footer", () => {
    render(<AppShell
      header={<header>Ressources</header>}
      statusLayer={null}
      navigation={<nav>Destinations</nav>}
    ><p>Page Cité</p></AppShell>);

    expect(screen.getByRole("main")).toHaveTextContent("Page Cité");
    expect(screen.getByTestId("app-shell")).toHaveClass("h-screen", "overflow-hidden");
    expect(screen.getByRole("main")).toHaveClass("min-h-0", "overflow-y-auto");
    expect(screen.getByTestId("persistent-page-navigation")).toHaveClass("sticky", "top-0", "xl:flex");
    expect(screen.getByTestId("primary-navigation-slot")).toContainElement(screen.getByText("Destinations"));
    expect(screen.queryByTestId("dungeon-progress-slot")).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("places navigation and dungeon progress in one desktop bar", () => {
    render(<AppShell
      header={null}
      statusLayer={null}
      navigation={<nav>Destinations</nav>}
      progress={<aside>Expédition</aside>}
    ><p>Page Cité</p></AppShell>);

    expect(screen.getByTestId("persistent-page-navigation")).toHaveClass("xl:flex", "xl:border");
    expect(screen.getByTestId("dungeon-progress-slot")).toHaveTextContent("Expédition");
  });

  it("keeps account out of game navigation and locks game pages before authentication", () => {
    const onChange = vi.fn();
    render(<PrimaryNavigation activeTab="account" authenticated={false} onChange={onChange} />);

    expect(screen.getByRole("button", { name: /Cité/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Compte/ })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps resource values as readable DOM text", () => {
    const onOpenAccount = vi.fn();
    render(<ResourceHeader
      cityName="Valbois"
      authenticated
      resources={{ gold: 1250, food: 90, wood: 80, stone: 70, ore: 60 }}
      rates={{ food: 1, wood: 2, stone: 3, ore: 4 }}
      accountActive={false}
      onOpenAccount={onOpenAccount}
    />);

    expect(screen.getByRole("heading", { name: "Valbois" })).toBeInTheDocument();
    expect(screen.getByText(/1.*250/)).toBeInTheDocument();
    expect(screen.getByText("+4/s")).toBeInTheDocument();
    expect(screen.getByLabelText(/Or :/)).toHaveClass("select-text");
    expect(screen.getByTestId("resource-header-content")).toHaveClass("motion-reduce:animate-none");
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le compte" }));
    expect(onOpenAccount).toHaveBeenCalledOnce();
  });

  it("projects cross-tab and connectivity statuses without owning canonical state", () => {
    render(<CanonicalStatusLayer
      authenticated
      failure={null}
      transportOnline={false}
      online={false}
      ready
      automationLeader
      controlTransferPending={false}
      notice="État restauré"
      onOpenAccount={vi.fn()}
      onRequestControl={vi.fn()}
    />);

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByText(/Mode hors connexion/)).toBeInTheDocument();
    expect(screen.getByText("État restauré")).toBeInTheDocument();
  });
});
