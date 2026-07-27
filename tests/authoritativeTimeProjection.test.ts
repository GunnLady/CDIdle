import { describe, expect, it } from "vitest";
import {
  createAuthoritativeTimeAnchor,
  projectAuthoritativeElapsedSeconds,
} from "../src/domain/authoritativeTimeProjection";

describe("authoritative time projection", () => {
  it("combines the PostgreSQL remainder with monotonic local elapsed time", () => {
    const anchor = createAuthoritativeTimeAnchor(
      "2026-07-26T12:00:02.750Z",
      "2026-07-26T12:00:02.000Z",
      10_000,
    );
    expect(projectAuthoritativeElapsedSeconds(anchor, 11_250)).toBe(2);
  });

  it("ignores wall-clock changes because projection receives only monotonic time", () => {
    const anchor = createAuthoritativeTimeAnchor(
      "2026-07-26T12:00:00.250Z",
      "2026-07-26T12:00:00.000Z",
      5_000,
    );
    expect(projectAuthoritativeElapsedSeconds(anchor, 6_000)).toBe(1.25);
    expect(projectAuthoritativeElapsedSeconds(anchor, 4_000)).toBe(0.25);
  });

  it("rejects invalid authoritative timestamps", () => {
    expect(createAuthoritativeTimeAnchor("invalid", "2026-07-26T12:00:00.000Z", 0)).toBeNull();
    expect(projectAuthoritativeElapsedSeconds(null, 1_000)).toBe(0);
  });
});
