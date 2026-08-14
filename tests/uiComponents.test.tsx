import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Alert from "../src/ui/components/Alert";
import Card from "../src/ui/components/Card";
import Dialog from "../src/ui/components/Dialog";
import Panel from "../src/ui/components/Panel";
import Progress from "../src/ui/components/Progress";
import Tooltip from "../src/ui/components/Tooltip";
import Badge from "../src/ui/components/Badge";
import Disclosure from "../src/ui/components/Disclosure";
import EmptySlot from "../src/ui/components/EmptySlot";
import Metric from "../src/ui/components/Metric";
import SelectableCard from "../src/ui/components/SelectableCard";
import StatusBanner from "../src/ui/components/StatusBanner";
import NavigationTabs from "../src/ui/patterns/NavigationTabs";
import Button from "../src/ui/primitives/Button";
import Checkbox from "../src/ui/primitives/Checkbox";
import IconButton from "../src/ui/primitives/IconButton";
import Select from "../src/ui/primitives/Select";
import TextField from "../src/ui/primitives/TextField";

describe("UI components", () => {
  it("exposes unavailable states and supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<><Button disabled>Locked</Button><Button busy>Saving</Button><Button onClick={onActivate}>Continue</Button></>);
    expect(screen.getByRole("button", { name: "Locked" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute("data-state", "loading");
    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass("ui-button-skin", "inline-flex", "items-center", "justify-center", "gap-2");
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("data-button-variant", "secondary");
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("data-button-size", "md");
    await user.tab();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("maps every button intent to a dedicated oak skin", () => {
    render(<><Button variant="primary">Primary</Button><Button>Secondary</Button><Button variant="danger">Danger</Button><Button variant="ghost">Ghost</Button><IconButton label="Icon" size="sm">+</IconButton></>);
    expect(screen.getByRole("button", { name: "Primary" })).toHaveAttribute("data-button-variant", "primary");
    expect(screen.getByRole("button", { name: "Secondary" })).toHaveAttribute("data-button-variant", "secondary");
    expect(screen.getByRole("button", { name: "Danger" })).toHaveAttribute("data-button-variant", "danger");
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveAttribute("data-button-variant", "ghost");
    expect(screen.getByRole("button", { name: "Icon" })).toHaveAttribute("data-button-size", "sm");
  });

  it("associates labels, help and errors with text fields", () => {
    render(<><TextField label="Village" description="Public name" /><TextField label="Invite" error="Invalid code" /></>);
    expect(screen.getByLabelText("Village")).toHaveAccessibleDescription("Public name");
    expect(screen.getByLabelText("Invite")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Invite")).toHaveAccessibleDescription("Invalid code");
  });

  it("renders panels and semantic feedback without business rules", () => {
    render(<><Panel title="Inventory" titleAs="h2" testId="panel" variant="strong">Content</Panel><Alert variant="error" role="alert">Failure</Alert><Progress label="Build" value={150} max={100} /></>);
    expect(screen.getByTestId("panel")).toHaveTextContent("Inventory");
    expect(screen.getByTestId("panel")).toHaveClass("ui-panel-skin");
    expect(screen.getByTestId("panel")).toHaveAttribute("data-panel-variant", "strong");
    expect(screen.getByRole("alert")).toHaveTextContent("Failure");
    expect(screen.getByRole("progressbar", { name: "Build" })).toHaveAttribute("value", "100");
    expect(screen.getByRole("heading", { level: 2, name: "Inventory" })).toBeInTheDocument();
  });

  it("keeps navigation and status content contractible on compact viewports", () => {
    render(<><NavigationTabs label="Main" activeId="city" onChange={vi.fn()} items={[{ id: "city", label: "City", icon: "C" }, { id: "dungeon", label: "Dungeon", icon: "D" }]} /><StatusBanner>Persistent status with a long message</StatusBanner></>);
    expect(screen.getByRole("navigation", { name: "Main" })).toHaveClass("min-w-0", "max-w-full");
    expect(screen.getByRole("button", { name: "Dungeon" }).querySelector("span:last-child")).toHaveClass("hidden", "sm:inline", "min-w-0");
    expect(screen.getByText("Persistent status with a long message")).toHaveClass("min-w-0", "break-words");
  });

  it("keeps static alerts silent and exposes cards, icon buttons and tooltips", () => {
    render(<><Alert variant="success">Saved</Alert><Card selected>Selected item</Card><IconButton label="Generate">+</IconButton><Tooltip label="Contextual help" content="More information">Info</Tooltip></>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Selected item").closest("article")).toHaveAttribute("data-selected", "true");
    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
    expect(screen.getByLabelText("Contextual help")).toHaveAccessibleDescription("More information");
    expect(screen.getByRole("tooltip")).toHaveTextContent("More information");
  });

  it("traps dialog focus and dismisses with Escape", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Dialog title="Confirm" onDismiss={onDismiss} footer={<><Button>Cancel</Button><Button>Accept</Button></>}>Body</Dialog>);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Accept" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("associates select and checkbox labels, help, errors and unavailable states", () => {
    render(<><Select label="Rarity" description="Filter items"><option>Rare</option></Select><Select label="Invalid choice" error="Required"><option>None</option></Select><Checkbox label="Upgrade" description="Costs ore" /><Checkbox label="Locked option" disabled /></>);
    expect(screen.getByLabelText("Rarity")).toHaveAccessibleDescription("Filter items");
    expect(screen.getByLabelText("Invalid choice")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Invalid choice")).toHaveAccessibleDescription("Required");
    expect(screen.getByLabelText("Upgrade")).toHaveAccessibleDescription("Costs ore");
    expect(screen.getByLabelText("Locked option")).toBeDisabled();
  });

  it("exposes selectable cards, disclosures, badges, metrics and empty slots", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<><SelectableCard selected onClick={onSelect}>Forge</SelectableCard><Disclosure title="Details">Hidden content</Disclosure><Badge tone="warning">Elite</Badge><Metric label="Gold" value="120" /><EmptySlot>Free slot</EmptySlot></>);
    expect(screen.getByRole("button", { name: "Forge" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Forge" }));
    expect(onSelect).toHaveBeenCalledOnce();
    const disclosure = screen.getByText("Details").closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    await user.click(screen.getByText("Details"));
    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByText("Elite")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("Free slot")).toBeInTheDocument();
  });

  it("keeps a default-open disclosure under user control across rerenders", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Disclosure title="History" defaultOpen>First entry</Disclosure>);
    const disclosure = screen.getByText("History").closest("details");
    expect(disclosure).toHaveAttribute("open");
    await user.click(screen.getByText("History"));
    expect(disclosure).not.toHaveAttribute("open");
    rerender(<Disclosure title="History" defaultOpen>Second entry</Disclosure>);
    expect(disclosure).not.toHaveAttribute("open");
  });

  it("keeps status banners silent unless explicitly live", () => {
    render(<><StatusBanner>Static notice</StatusBanner><StatusBanner live>Dynamic notice</StatusBanner></>);
    expect(screen.getByText("Static notice").closest("div")).not.toHaveAttribute("role");
    expect(screen.getByRole("status")).toHaveTextContent("Dynamic notice");
  });

  it("supports compact semantic progress and optional backdrop dismissal", () => {
    const onDismiss = vi.fn();
    render(<><Progress label="Health" value={20} max={40} size="compact" tone="health" /><Dialog title="Picker" dismissOnBackdrop onDismiss={onDismiss}>Body</Dialog></>);
    expect(screen.getByRole("progressbar", { name: "Health" })).toHaveAttribute("max", "40");
    const backdrop = screen.getByRole("dialog", { name: "Picker" }).parentElement;
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
