import { applyInventoryCommand } from "./inventory-authority.ts";
import type { TownCommandHandler } from "./command-handler.ts";

export const equipHero: TownCommandHandler<"hero.equip"> = (context, command) =>
  applyInventoryCommand(context.town, command);

export const unequipHero: TownCommandHandler<"hero.unequip"> = (context, command) =>
  applyInventoryCommand(context.town, command);
