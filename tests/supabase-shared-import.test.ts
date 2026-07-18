import { describe, expect, it } from "vitest";
import { acceptsSharedGameState } from "../supabase/shared-import-proof";
import { GAME_STATE_SCHEMA_VERSION } from "../shared/contracts/game-state";

describe("Supabase shared contract boundary", () => {
  it("imports the canonical GameState contract", () => {
    expect(GAME_STATE_SCHEMA_VERSION).toBe(1);
    expect(acceptsSharedGameState).toBeTypeOf("function");
  });
});
