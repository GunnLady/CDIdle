import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppErrorBoundary from "../src/components/AppErrorBoundary";

function BrokenView(): never {
  throw new Error("render failure");
}

describe("AppErrorBoundary", () => {
  it("shows a reload action when a child render fails", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const report = vi.fn(async () => undefined);
    render(<AppErrorBoundary onError={report}><BrokenView /></AppErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("La partie doit être rechargée");
    expect(screen.getByRole("button", { name: "Recharger" })).toBeInTheDocument();
    expect(report).toHaveBeenCalledWith(expect.objectContaining({
      category: "react",
      stack: expect.stringContaining("BrokenView"),
      surface: "app",
    }));
    error.mockRestore();
  });
});
