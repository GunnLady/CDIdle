import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DeveloperCheatPanel from "../src/components/app-shell/DeveloperCheatPanel";

afterEach(cleanup);

describe("DeveloperCheatPanel", () => {
  it("stays collapsed and outside document flow by default", () => {
    render(<DeveloperCheatPanel value="" canMutate onChange={vi.fn()} onApply={vi.fn()} />);

    const summary = screen.getByText("Grimoire développeur").closest("summary");
    expect(summary?.parentElement).toHaveClass("fixed");
    expect(summary?.parentElement).not.toHaveAttribute("open");
  });

  it("allows consultation but disables mutations in read-only mode", () => {
    render(<DeveloperCheatPanel value="G 100" canMutate={false} onChange={vi.fn()} onApply={vi.fn()} />);

    fireEvent.click(screen.getByText("Grimoire développeur"));
    expect(screen.getByRole("textbox", { name: "Code développeur" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Invoquer" })).toBeDisabled();
  });
});
