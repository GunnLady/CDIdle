import type { DungeonProgressBannerView } from "../domain/dungeonPresentation";

export interface DungeonProgressBannerActionHandlers {
  openDungeon: () => void;
  continueCheckpoint: () => void;
  toggleAutoExplore: () => void;
}

export function handleDungeonProgressBannerAction(
  action: DungeonProgressBannerView["action"],
  handlers: DungeonProgressBannerActionHandlers,
): void {
  if (action === "open_dungeon") {
    handlers.openDungeon();
    return;
  }
  if (action === "continue_checkpoint") {
    handlers.continueCheckpoint();
    return;
  }
  handlers.toggleAutoExplore();
}
