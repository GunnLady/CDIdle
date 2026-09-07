import { applyDungeonCommand, DungeonCommandError } from "./dungeon-authority.ts";
import type { TownCommandHandler } from "./command-handler.ts";

export const exploreDungeon: TownCommandHandler<"dungeon.explore"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));

export const advanceDungeonAutomation: TownCommandHandler<"dungeon.auto_advance"> = (context, command) => {
  if (!context.town.autoExplore) throw new DungeonCommandError("AUTO_EXPLORE_DISABLED", "automatic exploration is disabled");
  const explored = applyDungeonCommand(context.town, {
    type: "dungeon.explore", dungeonId: command.dungeonId, floor: command.floor, commandId: command.commandId,
  });
  const resolved = applyDungeonCommand(
    explored.state,
    { type: "dungeon.resolve", dungeonId: command.dungeonId, commandId: command.commandId },
    context.forkRng(),
  );
  return context.withRng({ state: resolved.state, events: [...explored.events, ...resolved.events] });
};

export const selectDungeonFloor: TownCommandHandler<"dungeon.select_floor"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));
export const resolveDungeon: TownCommandHandler<"dungeon.resolve"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command, context.forkRng()));
export const setDungeonAutoExplore: TownCommandHandler<"dungeon.auto_explore"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));
export const retreatDungeon: TownCommandHandler<"dungeon.retreat"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));
export const resumeDungeon: TownCommandHandler<"dungeon.resume"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));
export const selectDungeonFarmZone: TownCommandHandler<"dungeon.select_farm_zone"> = (context, command) =>
  context.withRng(applyDungeonCommand(context.town, command));
