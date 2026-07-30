import { describe, expect, it } from "vitest";
import {
  LOCAL_BUILD_VERSION,
  resolveBuildVersion,
  shortBuildVersion,
} from "../src/lib/buildVersion";

describe("build version", () => {
  it.each([undefined, "", "not-a-sha", "secret/value", "abc123"])(
    "uses the deterministic local fallback for %s",
    (value) => {
      expect(resolveBuildVersion(value)).toBe(LOCAL_BUILD_VERSION);
    },
  );

  it("normalizes a controlled Git SHA without exposing other input", () => {
    const sha = "A1234567890BCDEF1234567890ABCDEF12345678";
    expect(resolveBuildVersion(` ${sha} `)).toBe(`git-${sha.toLowerCase()}`);
  });

  it("creates a short display value from the same build identity", () => {
    const version = "git-a1234567890bcdef1234567890abcdef12345678";
    expect(shortBuildVersion(version)).toBe("git-a1234567890b");
    expect(shortBuildVersion(LOCAL_BUILD_VERSION)).toBe(LOCAL_BUILD_VERSION);
  });
});
