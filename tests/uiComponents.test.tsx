import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Alert from "../src/ui/components/Alert";
import Card from "../src/ui/components/Card";
import Dialog from "../src/ui/components/Dialog";
import Panel from "../src/ui/components/Panel";
import Progress from "../src/ui/components/Progress";
import Tooltip from "../src/ui/components/Tooltip";
import Button from "../src/ui/primitives/Button";
import IconButton from "../src/ui/primitives/IconButton";
import TextField from "../src/ui/primitives/TextField";

describe("UI components", () => {
  it("exposes unavailable states and supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<><Button disabled>Locked</Button><Button busy>Saving</Button><Button onClick={onActivate}>Continue</Button></>);
    expect(screen.getByRole("button", { name: "Locked" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true");
    await user.tab();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onActivate).toHaveBeenCalledOnce();
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
    expect(screen.getByRole("alert")).toHaveTextContent("Failure");
    expect(screen.getByRole("progressbar", { name: "Build" })).toHaveAttribute("value", "100");
    expect(screen.getByRole("heading", { level: 2, name: "Inventory" })).toBeInTheDocument();
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
});
