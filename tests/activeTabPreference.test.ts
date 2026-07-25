import { describe, expect, it } from "vitest";
import { ACTIVE_TABS, parseActiveTabPreference } from "../src/domain/activeTabPreference";

describe("active tab preference", () => {
  it("accepts every application tab", () => {
    for (const tab of ACTIVE_TABS) expect(parseActiveTabPreference(tab)).toBe(tab);
  });

  it("falls back safely to city", () => {
    expect(parseActiveTabPreference(null)).toBe("city");
    expect(parseActiveTabPreference("districts")).toBe("city");
  });
});
