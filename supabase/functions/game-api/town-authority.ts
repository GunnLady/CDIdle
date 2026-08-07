import {
  forkCanonicalRng,
  nextCanonicalSubseed,
  restoreCanonicalRng,
} from "./authoritative-rng.ts";
import type { CanonicalStateTransition } from "../../../shared/contracts/authoritative.ts";
import { dispatchTownCommand, TownCommandError } from "./command-handler.ts";
import { TOWN_COMMAND_HANDLERS } from "./town-command-registry.ts";
import { migrateTownState } from "./town-state.ts";

export { initialTownState, migrateTownState, type TownResources, type TownState } from "./town-state.ts";

export function applyTownCommand(current: Record<string, unknown>, command: Record<string, unknown>, options: { allowCheats?: boolean } = {}): CanonicalStateTransition {
  const town = migrateTownState(current);
  const rng = restoreCanonicalRng(town.rngState);
  const withRng = (transition: CanonicalStateTransition): CanonicalStateTransition => ({
    ...transition,
    state: { ...transition.state, rngState: rng.snapshot() },
  });
  return dispatchTownCommand(TOWN_COMMAND_HANDLERS, {
    town,
    rng,
    allowCheats: Boolean(options.allowCheats),
    forkRng: () => forkCanonicalRng(rng),
    nextSeedKey: (scope) => `${scope}:${nextCanonicalSubseed(rng).toString(16).padStart(8, "0")}`,
    withRng,
  }, command);
}

export { TownCommandError };
