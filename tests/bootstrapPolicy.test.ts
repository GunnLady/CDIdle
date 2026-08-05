import { describe, expect, it } from "vitest";
import {
  CANONICAL_BOOTSTRAP_POLICIES,
} from "../src/domain/bootstrapPolicy";

describe("canonical bootstrap policy", () => {
  it("inventories every justified bootstrap trigger", () => {
    expect(Object.keys(CANONICAL_BOOTSTRAP_POLICIES).sort()).toEqual([
      "conflict",
      "heartbeat",
      "initial",
      "leadership",
      "manual",
      "reconnect",
    ]);
    expect(CANONICAL_BOOTSTRAP_POLICIES.heartbeat.skipWhenQueueBusy).toBe(true);
    expect(CANONICAL_BOOTSTRAP_POLICIES.conflict.priority).toBe("user");
    expect(CANONICAL_BOOTSTRAP_POLICIES.leadership.mayReuseRecentSnapshot).toBe(false);
  });

  it("never reuses a snapshot to authorize a new leader", () => {
    expect(CANONICAL_BOOTSTRAP_POLICIES.leadership).toMatchObject({
      skipWhenQueueBusy: false,
      mayReuseRecentSnapshot: false,
    });
  });
});
