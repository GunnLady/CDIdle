import type {
  CanonicalGameCommand,
  CanonicalGameState,
  CanonicalStateTransition,
} from "../../../shared/contracts/authoritative.ts";
import type { CanonicalRng } from "./authoritative-rng.ts";

export type CanonicalCommandType = CanonicalGameCommand["type"];
export type AuthoritativeCommand<T extends CanonicalCommandType = CanonicalCommandType> =
  Extract<CanonicalGameCommand, { type: T }> & { commandId?: string };

export class TownCommandError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly reason?: string,
  ) {
    super(message);
  }
}

export interface TownCommandContext {
  town: CanonicalGameState;
  rng: CanonicalRng;
  allowCheats: boolean;
  forkRng(): CanonicalRng;
  nextSeedKey(scope: string): string;
  withRng(transition: CanonicalStateTransition): CanonicalStateTransition;
}

export type TownCommandHandler<T extends CanonicalCommandType> = (
  context: TownCommandContext,
  command: AuthoritativeCommand<T>,
) => CanonicalStateTransition;

export type TownCommandHandlerRegistry = {
  [T in CanonicalCommandType]: TownCommandHandler<T>;
};

export function dispatchTownCommand(
  registry: TownCommandHandlerRegistry,
  context: TownCommandContext,
  command: Record<string, unknown>,
): CanonicalStateTransition {
  const type = command.type as CanonicalCommandType;
  const handler = registry[type] as TownCommandHandler<CanonicalCommandType> | undefined;
  if (!handler) throw new TownCommandError("INVALID_COMMAND", "unsupported town command");
  return handler(context, command as AuthoritativeCommand);
}
