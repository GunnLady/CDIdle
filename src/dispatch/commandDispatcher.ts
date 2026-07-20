import { z } from "zod";
import type { GameCommand, CommandEnvelope, CommandError, CommandResult } from "../domain/commands";
import type { GameState } from "../types";
import { validateCommandEnvelope } from "../domain/commands";

const commandTypes = z.enum([
  "onboarding.start", "building.upgrade", "citizens.allocate", "district.unlock",
  "hero.recruit", "hero.dismiss", "hero.equip", "hero.unequip", "inventory.add", "inventory.remove", "inventory.recycle", "forge.start", "forge.finalize", "forge.cancel",
  "dungeon.explore", "dungeon.resolve", "dungeon.auto_explore", "dungeon.retreat",
]);
const commandSchema = z.object({ type: commandTypes }).passthrough();

export type CommitInput = { commandId: string; requestHash: string; expectedRevision: number; command: GameCommand };
export type CommitOutcome =
  | { kind: "applied"; revision: number; state: GameState }
  | { kind: "replayed"; revision: number; state: GameState }
  | { kind: "conflict"; currentRevision: number }
  | { kind: "duplicate" };
export interface CommandStore {
  countCommandsSince(userId: string, since: number): Promise<number>;
  commit(userId: string, input: CommitInput): Promise<CommitOutcome>;
}
export interface CommandClock { now(): number; }
const invalid = (message: string, field?: string): CommandError => ({ code: "INVALID_COMMAND", message, field });

export async function requestHash(envelope: CommandEnvelope): Promise<string> {
  const canonical = JSON.stringify({ commandId: envelope.commandId, idempotencyKey: envelope.idempotencyKey,
    expectedRevision: envelope.expectedRevision, command: envelope.command });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class CommandDispatcher {
  public constructor(private readonly store: CommandStore, private readonly clock: CommandClock = { now: () => Date.now() }, private readonly maxPerMinute = 60) {}

  public async dispatch(userId: string, envelope: CommandEnvelope): Promise<CommandResult> {
    const envelopeErrors = validateCommandEnvelope(envelope);
    if (envelopeErrors.length > 0) return { ok: false, error: envelopeErrors[0], commandId: envelope.commandId };
    if (!commandSchema.safeParse(envelope.command).success) {
      return { ok: false, error: invalid("unsupported command type", "command.type"), commandId: envelope.commandId };
    }
    if (await this.store.countCommandsSince(userId, this.clock.now() - 60_000) >= this.maxPerMinute) {
      return { ok: false, error: { code: "RATE_LIMITED", message: "command rate limit exceeded" }, commandId: envelope.commandId };
    }
    const outcome = await this.store.commit(userId, {
      commandId: envelope.commandId, requestHash: await requestHash(envelope),
      expectedRevision: envelope.expectedRevision, command: envelope.command,
    });
    if (outcome.kind === "conflict") return { ok: false, error: { code: "REVISION_CONFLICT", message: "revision conflict", currentRevision: outcome.currentRevision }, commandId: envelope.commandId };
    if (outcome.kind === "duplicate") return { ok: false, error: { code: "DUPLICATE_COMMAND", message: "command id was already used with a different request" }, commandId: envelope.commandId };
    return { ok: true, revision: outcome.revision, state: outcome.state, commandId: envelope.commandId, replayed: outcome.kind === "replayed" };
  }
}
