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
    expect(screen.getByTestId("app-shell")).toHaveClass("app-shell-background", "min-h-screen", "xl:h-screen", "xl:overflow-hidden");
    expect(screen.getByTestId("app-shell")).not.toHaveClass("h-screen", "overflow-hidden");
    expect(screen.getByRole("main")).toHaveClass("min-h-0", "overflow-visible", "xl:overflow-x-hidden", "xl:overflow-y-auto");
    expect(screen.getByRole("main").firstElementChild).toHaveClass("min-h-full", "max-w-[1440px]", "gap-3", "sm:gap-4", "sm:py-4", "xl:pt-2.5");
    expect(screen.getByTestId("page-content-scroll-region")).toHaveClass("h-full");
    expect(screen.getByTestId("page-content-scroll-region")).not.toHaveClass("xl:overflow-y-auto");
    expect(screen.getByTestId("persistent-page-navigation")).toHaveClass("z-30", "xl:flex");
    expect(screen.getByTestId("persistent-page-navigation")).not.toHaveClass("xl:sticky", "xl:top-0");
    expect(screen.getByTestId("persistent-page-navigation")).toHaveClass("min-[1440px]:-mx-6", "min-[1440px]:-mt-[10px]", "min-[1440px]:h-[178px]", "min-[1440px]:w-[1440px]");
    expect(screen.getByTestId("persistent-page-navigation")).not.toHaveClass("xl:rounded-xl", "xl:border", "xl:bg-[#18100a]", "xl:p-1.5", "xl:shadow-lg");
    expect(screen.getByTestId("persistent-page-navigation")).not.toHaveClass("sticky", "top-0");
    expect(screen.getByTestId("secondary-navigation-rail-frame").querySelectorAll("img")).toHaveLength(1);
    expect(screen.getByTestId("secondary-navigation-rail-frame")).toHaveClass("z-20", "min-[1440px]:block");
    expect(screen.getByTestId("primary-navigation-slot")).toHaveClass("min-[1440px]:left-[113px]", "min-[1440px]:top-[36px]", "min-[1440px]:h-[105px]", "min-[1440px]:w-[496px]");
    expect(screen.getByTestId("primary-navigation-slot")).not.toHaveClass("z-10");
    expect(screen.queryByTestId("secondary-rail-concept-preview")).not.toBeInTheDocument();
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

    expect(screen.getByTestId("persistent-page-navigation")).toHaveClass("xl:flex");
    expect(screen.getByTestId("persistent-page-navigation")).not.toHaveClass("xl:border", "xl:bg-[#18100a]", "xl:shadow-lg");
    expect(screen.getByTestId("dungeon-progress-slot")).toHaveTextContent("Expédition");
    expect(screen.getByTestId("dungeon-progress-slot")).toHaveClass("z-30", "min-[1440px]:left-[645px]", "min-[1440px]:top-[35px]", "min-[1440px]:h-[102px]", "min-[1440px]:w-[600px]");
  });

  it("keeps account out of game navigation and locks game pages before authentication", () => {
    const onChange = vi.fn();
    render(<PrimaryNavigation activeTab="account" authenticated={false} onChange={onChange} />);

    expect(screen.getByRole("button", { name: /Cité/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Compte/ })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps navigation labels and state in the DOM above the rail background", () => {
    render(<PrimaryNavigation activeTab="city" authenticated onChange={vi.fn()} />);

    const cityButton = screen.getByRole("button", { name: "Cité" });
    const heroesButton = screen.getByRole("button", { name: "Aventuriers" });
    expect(cityButton.querySelector("img")).toHaveAttribute("src", expect.stringContaining("primary-navigation-button-selected-v2"));
    expect(heroesButton.querySelector("img")).toHaveAttribute("src", expect.stringContaining("primary-navigation-button-normal-v2"));
    expect(screen.getByTestId("primary-navigation-city-icon")).toHaveAttribute("src", expect.stringContaining("primary-navigation-city-v2"));
    expect(screen.getByTestId("primary-navigation-city-icon")).toHaveAttribute("alt", "");
    expect(screen.getByTestId("primary-navigation-city-icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("primary-navigation-city-icon")).toHaveClass("h-5", "w-5", "object-fill", "min-[1440px]:h-[55px]", "min-[1440px]:w-[60px]", "min-[1440px]:-translate-x-[2px]", "min-[1440px]:-translate-y-1");
    expect(screen.getByTestId("primary-navigation-heroes-icon")).toHaveAttribute("src", expect.stringContaining("primary-navigation-heroes-v2"));
    expect(screen.getByTestId("primary-navigation-heroes-icon")).toHaveAttribute("alt", "");
    expect(screen.getByTestId("primary-navigation-heroes-icon")).toHaveClass("h-5", "w-5", "object-contain", "min-[1440px]:h-16", "min-[1440px]:w-16", "min-[1440px]:translate-x-[3px]", "min-[1440px]:-translate-y-[9px]");
    expect(screen.getByTestId("primary-navigation-dungeon-icon")).toHaveAttribute("src", expect.stringContaining("primary-navigation-dungeon-v1"));
    expect(screen.getByTestId("primary-navigation-dungeon-icon")).toHaveClass("h-5", "w-5", "object-contain", "min-[1440px]:h-16", "min-[1440px]:w-16", "min-[1440px]:-translate-x-[2px]", "min-[1440px]:translate-y-[3px]");
    expect(screen.getByTestId("primary-navigation-storage-icon")).toHaveAttribute("src", expect.stringContaining("primary-navigation-storage-v1"));
    expect(screen.getByTestId("primary-navigation-storage-icon")).toHaveClass("h-5", "w-5", "object-contain", "min-[1440px]:h-16", "min-[1440px]:w-16", "min-[1440px]:translate-x-[3px]", "min-[1440px]:translate-y-px");
    expect(screen.getByTestId("primary-navigation-city-icon").parentElement).toHaveClass("relative", "shrink-0");
    expect(screen.getByTestId("primary-navigation-city-icon").parentElement).not.toHaveClass("min-[1440px]:absolute");
    expect(screen.getByText("Cité")).toHaveClass("relative", "min-[1440px]:leading-none");
    expect(screen.getByText("Cité")).not.toHaveClass("min-[1440px]:absolute");
    expect(screen.getByText("Cité")).toHaveClass("min-[1440px]:-translate-y-1");
    expect(screen.getByText("Aventuriers")).toHaveClass("min-[1440px]:-translate-y-[7px]");
    expect(screen.getByText("Donjon")).toHaveClass("min-[1440px]:-translate-y-[7px]");
    expect(screen.getByText("Coffre")).toHaveClass("min-[1440px]:-translate-y-[7px]");
    expect(cityButton.querySelector("img")).toHaveClass("hidden", "min-[1440px]:block", "min-[1440px]:-top-0.5", "min-[1440px]:h-[calc(100%+2px)]", "object-fill");
    expect(cityButton.querySelector("img")).toHaveAttribute("aria-hidden", "true");
    expect(cityButton).toHaveClass("min-[1440px]:bg-transparent");
    expect(heroesButton).toHaveClass("min-[1440px]:bg-transparent");
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toHaveClass("min-[1440px]:p-0");
    expect(cityButton.parentElement).toHaveClass("min-[1440px]:gap-0");
    const junctionOrnaments = screen.getByTestId("navigation-junction-ornaments");
    const junctionImages = junctionOrnaments.querySelectorAll("img");
    expect(junctionOrnaments).toHaveClass("hidden", "min-[1440px]:block");
    expect(junctionImages).toHaveLength(6);
    expect(junctionImages[0]).toHaveAttribute("src", expect.stringContaining("primary-navigation-junction-upper-v2"));
    expect(junctionImages[1]).toHaveAttribute("src", expect.stringContaining("primary-navigation-junction-lower-v2"));
    expect(junctionImages[0]).toHaveClass("h-[25px]", "w-[38px]");
    expect(junctionImages[1]).toHaveClass("h-[25px]", "w-[38px]");
    expect(junctionImages[0]).toHaveClass("-top-[6px]");
    expect(junctionImages[1]).toHaveClass("-bottom-[3px]");
    expect(junctionImages[0]).toHaveClass("z-20");
    expect(junctionImages[1]).toHaveClass("z-0");
    expect(cityButton.parentElement).toHaveClass("relative", "z-10");
    expect(cityButton).toHaveTextContent("Cité");
    expect(cityButton).toHaveAttribute("aria-current", "page");
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
    expect(screen.getByRole("heading", { name: "Valbois" })).toHaveClass("font-city", "relative", "uppercase", "text-[1.35rem]", "sm:-left-[35px]", "sm:top-[7px]", "sm:text-[1.2rem]", "xl:-left-[3px]", "xl:text-[1.65rem]", "bg-clip-text", "text-transparent");
    expect(screen.queryByText("Domaine")).not.toBeInTheDocument();
    expect(screen.getByRole("banner")).not.toHaveClass("sticky", "top-0");
    expect(screen.getByRole("banner")).not.toHaveClass("bg-[#090604]", "shadow-[0_8px_22px_rgba(0,0,0,0.85)]");
    expect(screen.getByText(/1.*250/)).toBeInTheDocument();
    expect(screen.getByText("+4/s")).toBeInTheDocument();
    expect(screen.getByLabelText(/Or :/)).toHaveClass("select-text");
    expect(screen.getByTestId("resource-header-frame")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("resource-header-frame")).toHaveClass("max-w-[1440px]", "left-1/2", "-translate-x-1/2");
    expect(screen.getByTestId("resource-header-frame").querySelectorAll("img")).toHaveLength(4);
    expect(screen.getByTestId("resource-header-mobile-panel")).toHaveClass("h-full", "w-full", "object-fill", "sm:hidden");
    expect(screen.getByTestId("resource-header-mobile-crest")).toHaveClass("hidden", "sm:block", "lg:hidden");
    expect(screen.getByTestId("resource-header-wood-rail")).toHaveClass("absolute", "inset-x-0", "hidden", "sm:block", "lg:left-[6.65rem]", "lg:right-[2.3rem]");
    expect(screen.getByTestId("resource-header-ornament-left")).toHaveClass("absolute", "left-0", "z-10", "h-full", "object-contain", "lg:block");
    expect(screen.getByTestId("resource-header-ornament-right")).toHaveClass("absolute", "right-[5px]", "top-[calc(50%+5px)]", "z-10", "h-[94%]", "-translate-y-1/2", "object-contain", "lg:block");
    expect(screen.getByTestId("resource-header-ornament-right")).toHaveAttribute("src", expect.stringContaining("header-menu-ornament-right-v3"));
    expect(screen.getByTestId("resource-strip")).toHaveTextContent("1/s");
    expect(screen.getByTestId("resource-strip")).not.toHaveClass("border", "bg-[#100905]/80", "lg:bg-black/15", "backdrop-blur-[1px]");
    expect(screen.getByTestId("resource-header-content")).toHaveClass("motion-reduce:animate-none", "max-w-[1440px]", "px-7", "sm:px-5", "lg:pl-[15rem]", "lg:pr-[7rem]");
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
