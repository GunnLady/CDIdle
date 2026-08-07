import { applyDungeonCommand } from "./dungeon-authority.ts";
import type { TownCommandHandler } from "./command-handler.ts";

export const exploreDungeon: TownCommandHandler<"dungeon.explore"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));

export const selectDungeonFloor: TownCommandHandler<"dungeon.select_floor"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));

export const resolveDungeon: TownCommandHandler<"dungeon.resolve"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command, context.forkRng()));

export const setDungeonAutoExplore: TownCommandHandler<"dungeon.auto_explore"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));

export const retreatDungeon: TownCommandHandler<"dungeon.retreat"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));
