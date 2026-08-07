import { applyForgeCommand } from "./forge-authority.ts";
import type { TownCommandHandler } from "./command-handler.ts";

export const startForge: TownCommandHandler<"forge.start"> = (context, command) =>
  context.withRng(applyForgeCommand(context.town, command, context.rng));

export const finalizeForge: TownCommandHandler<"forge.finalize"> = (context, command) =>
  applyForgeCommand(context.town, command, context.rng);

export const cancelForge: TownCommandHandler<"forge.cancel"> = (context, command) =>
  applyForgeCommand(context.town, command, context.rng);

export const recycleInventory: TownCommandHandler<"inventory.recycle"> = (context, command) =>
  applyForgeCommand(context.town, command, context.rng);
