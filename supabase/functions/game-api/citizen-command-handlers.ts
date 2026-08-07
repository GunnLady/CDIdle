import { ALLOCATABLE_CITIZEN_ROLES } from "../../../shared/domain/authoritative-town-validation.ts";
import { TownCommandError, type TownCommandHandler } from "./command-handler.ts";

export const allocateCitizens: TownCommandHandler<"citizens.allocate"> = (context, command) => {
  const town = context.town;
  const amount = command.amount;
  if (!Number.isInteger(amount) || amount === 0
    || !(ALLOCATABLE_CITIZEN_ROLES as readonly string[]).includes(command.role)) {
    throw new TownCommandError("INVALID_COMMAND", "invalid citizen allocation");
  }
  if (amount > 0) {
    const required: Record<string, string> = {
      farmers: "ferme",
      woodcutters: "scierie",
      quarrymen: "carriere",
      miners: "mine",
    };
    if (required[command.role] && (town.buildings[required[command.role]] ?? 0) < 1) {
      throw new TownCommandError("BUILDING_REQUIRED", "profession building is missing");
    }
  }
  const next = town.citizens[command.role] + amount;
  const unassigned = town.citizens.unassigned - amount;
  if (next < 0 || unassigned < 0) {
    throw new TownCommandError("INVALID_COMMAND", "invalid citizen allocation");
  }
  return {
    state: { ...town, citizens: { ...town.citizens, [command.role]: next, unassigned } },
    events: [{ type: "citizens.allocated", role: command.role, amount }],
  };
};
