import type { GameState } from "../types";

export type GameCommand =
  | { type: "onboarding.start"; cityName: string }
  | { type: "building.upgrade"; buildingId: string }
  | { type: "citizens.allocate"; role: "farmers" | "woodcutters" | "quarrymen" | "miners" | "unassigned"; amount: number }
  | { type: "district.unlock"; districtId: string }
  | { type: "hero.recruit" }
  | { type: "hero.dismiss"; heroId: string }
  | { type: "hero.equip"; heroId: string; itemId: string }
  | { type: "inventory.recycle"; itemId: string; count: number }
  | { type: "forge.start"; recipeId: string }
  | { type: "dungeon.explore"; floor: number }
  | { type: "dungeon.retreat" };

export interface CommandEnvelope<C extends GameCommand = GameCommand> {
  commandId: string;
  idempotencyKey: string;
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
  if (!envelope.commandId.trim()) errors.push({ code: "INVALID_COMMAND", message: "commandId is required", field: "commandId" });
  if (!envelope.idempotencyKey.trim()) errors.push({ code: "INVALID_COMMAND", message: "idempotencyKey is required", field: "idempotencyKey" });
  if (!Number.isInteger(envelope.expectedRevision) || envelope.expectedRevision < 0) {
    errors.push({ code: "INVALID_COMMAND", message: "expectedRevision must be an integer >= 0", field: "expectedRevision" });
  }
  if (!envelope.command?.type) errors.push({ code: "INVALID_COMMAND", message: "command.type is required", field: "command.type" });
  return errors;
}
