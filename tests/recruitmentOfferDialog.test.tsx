import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RecruitmentOfferDialog from "../src/components/heroes/RecruitmentOfferDialog";
import { makeHero } from "./fixtures/game";

afterEach(cleanup);

function renderDialog(overrides: Partial<ComponentProps<typeof RecruitmentOfferDialog>> = {}) {
  const props: ComponentProps<typeof RecruitmentOfferDialog> = {
    candidate: makeHero({
      name: "Aldric",
      gender: "Male",
      baseStats: { str: 9, agi: 4, end: 7, int: 2, wiz: 1, dex: 5, luk: 3 },
    }),
    editedName: "Aldric",
    heroCount: 2,
    pending: false,
    readOnly: false,
    onNameChange: vi.fn(),
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<RecruitmentOfferDialog {...props} />);
  return props;
}

describe("RecruitmentOfferDialog", () => {
  it("renders the projected offer and delegates local and canonical actions", () => {
    const props = renderDialog();
    expect(screen.getByRole("dialog", { name: "Nouveau Pacte de Recrutement" })).toBeInTheDocument();
    expect(screen.getByText("▲ FOR (9)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /SCELLER.*400/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /SCELLER.*400/ })).toHaveAttribute("data-state", "ready");

    fireEvent.change(screen.getByLabelText("Prénom de l'aventurier"), { target: { value: "Brune" } });
    fireEvent.click(screen.getByRole("button", { name: /SCELLER/ }));
    fireEvent.click(screen.getByRole("button", { name: "Décliner l'Offre" }));

    expect(props.onNameChange).toHaveBeenCalledWith("Brune");
    expect(props.onConfirm).toHaveBeenCalledOnce();
    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it("contains keyboard focus, closes with Escape and restores the previous focus", () => {
    const previous = document.createElement("button");
    document.body.append(previous);
    previous.focus();
    const onCancel = vi.fn();
    const { unmount } = render(<RecruitmentOfferDialog
      candidate={makeHero({ name: "Aldric" })}
      editedName="Aldric"
      heroCount={1}
      pending={false}
      readOnly={false}
      onNameChange={vi.fn()}
      onConfirm={vi.fn()}
      onCancel={onCancel}
    />);

    const nameInput = screen.getByLabelText("Prénom de l'aventurier");
    const confirm = screen.getByRole("button", { name: /SCELLER/ });
    expect(nameInput).toHaveFocus();
    confirm.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(nameInput).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();

    unmount();
    expect(previous).toHaveFocus();
    previous.remove();
  });

  it("keeps the offer consultable but blocks commands in read-only mode", () => {
    const props = renderDialog({ readOnly: true, blockReason: "Mode observateur" });
    expect(screen.getByText("Mode observateur")).toBeVisible();
    expect(screen.getByRole("button", { name: /SCELLER/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Décliner l'Offre" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });
});
