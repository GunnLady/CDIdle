import { describe, expect, it } from "vitest";
import { CommandDispatcher, type CommandStore, type CommitInput, type CommitOutcome } from "../src/dispatch/commandDispatcher";
import { createInitialGameState } from "../src/domain/gameState";

class MemoryCommandStore implements CommandStore {
  public count = 0;
  public last?: CommitInput;
  public outcome: CommitOutcome = { kind: "applied", revision: 1, state: createInitialGameState() };
  async countCommandsSince(): Promise<number> { return this.count; }
  async commit(_userId: string, input: CommitInput): Promise<CommitOutcome> { this.last = input; return this.outcome; }
}
const envelope = { commandId: "cmd-1", idempotencyKey: "idem-1", clientVersion: "test", expectedRevision: 0, command: { type: "dungeon.retreat" as const } };

describe("CommandDispatcher", () => {
  it("hashes and commits a valid command", async () => {
    const store = new MemoryCommandStore();
    const result = await new CommandDispatcher(store).dispatch("user-1", envelope);
    expect(result).toMatchObject({ ok: true, revision: 1, replayed: false });
    expect(store.last?.requestHash).toMatch(/^[a-f0-9]{64}$/);
  });
  it("replays an idempotent command and exposes conflicts", async () => {
    const store = new MemoryCommandStore();
    store.outcome = { kind: "replayed", revision: 1, state: createInitialGameState() };
    await expect(new CommandDispatcher(store).dispatch("user-1", envelope)).resolves.toMatchObject({ replayed: true });
    store.outcome = { kind: "conflict", currentRevision: 3 };
    await expect(new CommandDispatcher(store).dispatch("user-1", envelope)).resolves.toMatchObject({ ok: false, error: { code: "REVISION_CONFLICT", currentRevision: 3 } });
    store.outcome = { kind: "duplicate" };
    await expect(new CommandDispatcher(store).dispatch("user-1", envelope)).resolves.toMatchObject({ ok: false, error: { code: "DUPLICATE_COMMAND" } });
  });
  it("rejects invalid and rate-limited commands before commit", async () => {
    const store = new MemoryCommandStore();
    const dispatcher = new CommandDispatcher(store, undefined, 1);
    await expect(dispatcher.dispatch("user-1", { ...envelope, commandId: "" })).resolves.toMatchObject({ ok: false });
    store.count = 1;
    await expect(dispatcher.dispatch("user-1", envelope)).resolves.toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(store.last).toBeUndefined();
  });
});
