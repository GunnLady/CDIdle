import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthenticationPage from "../src/components/auth/AuthenticationPage";

afterEach(cleanup);

describe("authentication page", () => {
  it("delegates Google authentication without owning Supabase", async () => {
    const onAuthenticate = vi.fn().mockResolvedValue(undefined);
    render(<AuthenticationPage sessionLoading={false} onAuthenticate={onAuthenticate} />);
    expect(screen.getByTestId("authentication-page").querySelector('[data-entry-panel="true"]')).toHaveClass("ui-panel-skin");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Google/i }));
    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledOnce());
  });

  it("reports a rejected authentication without hiding the action", async () => {
    render(<AuthenticationPage sessionLoading={false} onAuthenticate={vi.fn().mockRejectedValue(new Error("refusée"))} />);
    fireEvent.click(screen.getByRole("button", { name: /Google/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("refusée");
    expect(screen.getByRole("button", { name: /Google/i })).toBeEnabled();
  });
});
