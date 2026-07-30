import { describe, expect, it } from "vitest";
import { createCommandEnvelope } from "../src/domain/commandEnvelope";

describe("versioned command envelope", () => {
  it("keeps one build version and payload across retries", () => {
    const envelope = createCommandEnvelope(
      "command-1",
      42,
      { type: "dungeon.retreat" },
      "git-a1234567890bcdef1234567890abcdef12345678",
    );
    const firstAttempt = JSON.stringify(envelope);
    const retry = JSON.stringify(envelope);

    expect(retry).toBe(firstAttempt);
    expect(envelope).toMatchObject({
      commandId: "command-1",
      idempotencyKey: "command-1",
      clientVersion: "git-a1234567890bcdef1234567890abcdef12345678",
      expectedRevision: 42,
    });
    expect(Object.isFrozen(envelope)).toBe(true);
  });
});
