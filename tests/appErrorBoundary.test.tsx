import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppErrorBoundary from "../src/components/AppErrorBoundary";

function BrokenView(): never {
  throw new Error("render failure");
}

describe("AppErrorBoundary", () => {
  it("shows a reload action when a child render fails", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<AppErrorBoundary><BrokenView /></AppErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("La partie doit être rechargée");
    expect(screen.getByRole("button", { name: "Recharger" })).toBeInTheDocument();
    error.mockRestore();
  });
});
