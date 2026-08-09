import { describe, expect, it } from "vitest";
import { shouldRenderUiCatalog } from "../src/ui/catalog/catalogAccess";

describe("private UI catalog access", () => {
  it("requires development mode and an explicit query flag", () => {
    expect(shouldRenderUiCatalog(true, "?ui-catalog=1")).toBe(true);
    expect(shouldRenderUiCatalog(true, "")).toBe(false);
    expect(shouldRenderUiCatalog(false, "?ui-catalog=1")).toBe(false);
  });
});
