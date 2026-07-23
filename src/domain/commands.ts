import type { GameState } from "../types";
import type { CanonicalCommandEnvelope, CanonicalGameCommand } from "../../shared/contracts/authoritative";

export type { CanonicalCommandEnvelope, CanonicalGameCommand } from "../../shared/contracts/authoritative";

export type GameCommand = CanonicalGameCommand;

export interface CommandEnvelope<C extends GameCommand = GameCommand> {
  commandId: string;
  idempotencyKey: string;
  clientVersion: string;
  expectedRevision: number;
  command: C;
}

export type CommandErrorCode =
  | "INVALID_COMMAND"
  | "REVISION_CONFLICT"
  | "DUPLICATE_COMMAND"
  | "NOT_FOUND"
  | "INSUFFICIENT_RESOURCES"
  | "RATE_LIMITED";

export interface CommandError {
  code: CommandErrorCode;
  message: string;
  field?: string;
  currentRevision?: number;
}

export interface CommandSuccess<T = GameState> {
  ok: true;
  revision: number;
  state: T;
  commandId: string;
  replayed: boolean;
}

export interface CommandFailure {
  ok: false;
  error: CommandError;
  commandId?: string;
}

export type CommandResult<T = GameState> = CommandSuccess<T> | CommandFailure;

export function isCommandSuccess<T>(result: CommandResult<T>): result is CommandSuccess<T> {
  return result.ok;
}

export function validateCommandEnvelope(envelope: CommandEnvelope): CommandError[] {
  const errors: CommandError[] = [];
  if (typeof envelope.commandId !== "string" || !envelope.commandId.trim()) errors.push({ code: "INVALID_COMMAND", message: "commandId is required", field: "commandId" });
  if (typeof envelope.idempotencyKey !== "string" || !envelope.idempotencyKey.trim()) errors.push({ code: "INVALID_COMMAND", message: "idempotencyKey is required", field: "idempotencyKey" });
  if (typeof envelope.clientVersion !== "string" || !envelope.clientVersion.trim()) errors.push({ code: "INVALID_COMMAND", message: "clientVersion is required", field: "clientVersion" });
  if (!Number.isInteger(envelope.expectedRevision) || envelope.expectedRevision < 0) {
    errors.push({ code: "INVALID_COMMAND", message: "expectedRevision must be an integer >= 0", field: "expectedRevision" });
  }
  if (!envelope.command?.type) errors.push({ code: "INVALID_COMMAND", message: "command.type is required", field: "command.type" });
  return errors;
}
