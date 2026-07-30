import type { CommandEnvelope, GameCommand } from "./commands";
import { BUILD_VERSION } from "../lib/buildVersion";

export function createCommandEnvelope<C extends GameCommand>(
  commandId: string,
  expectedRevision: number,
  command: C,
  clientVersion = BUILD_VERSION,
): Readonly<CommandEnvelope<C>> {
  return Object.freeze({
    commandId,
    idempotencyKey: commandId,
    clientVersion,
    expectedRevision,
    command,
  });
}
