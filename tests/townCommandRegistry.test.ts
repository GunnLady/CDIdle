import { describe, expect, it } from "vitest";
import { CANONICAL_COMMAND_TYPES } from "../shared/contracts/authoritative";
import { TOWN_COMMAND_HANDLERS } from "../supabase/functions/game-api/town-command-registry";
import { applyTownCommand, initialTownState } from "../supabase/functions/game-api/town-authority";

describe("authoritative town command handler registry", () => {
  it("maps every canonical command exactly once", () => {
    const registeredTypes = Object.keys(TOWN_COMMAND_HANDLERS);

    expect(new Set(registeredTypes).size).toBe(registeredTypes.length);
    expect([...registeredTypes].sort()).toEqual([...CANONICAL_COMMAND_TYPES].sort());
    expect(Object.values(TOWN_COMMAND_HANDLERS).every((handler) => typeof handler === "function")).toBe(true);
  });

  it("rejects a command absent from the canonical registry", () => {
    expect(() => applyTownCommand(initialTownState(42), { type: "town.unsupported" }))
      .toThrowError(expect.objectContaining({
        code: "INVALID_COMMAND",
        message: "unsupported town command",
      }));
  });
});
