import { describe, expect, it, vi } from "vitest";
import { handleDungeonProgressBannerAction } from "../src/lib/dungeonProgressBannerAction";

describe("dungeon progress banner action wiring", () => {
  it.each(["pause", "resume"] as const)("routes %s through the regular auto-explore control", (action) => {
    const handlers = { openDungeon: vi.fn(), continueCheckpoint: vi.fn(), toggleAutoExplore: vi.fn() };

    handleDungeonProgressBannerAction(action, handlers);

    expect(handlers.toggleAutoExplore).toHaveBeenCalledOnce();
    expect(handlers.openDungeon).not.toHaveBeenCalled();
    expect(handlers.continueCheckpoint).not.toHaveBeenCalled();
  });

  it("opens the Dungeon without deciding a checkpoint that needs attention", () => {
    const handlers = { openDungeon: vi.fn(), continueCheckpoint: vi.fn(), toggleAutoExplore: vi.fn() };

    handleDungeonProgressBannerAction("open_dungeon", handlers);

    expect(handlers.openDungeon).toHaveBeenCalledOnce();
    expect(handlers.continueCheckpoint).not.toHaveBeenCalled();
    expect(handlers.toggleAutoExplore).not.toHaveBeenCalled();
  });

  it("continues a safe automatic checkpoint directly", () => {
    const handlers = { openDungeon: vi.fn(), continueCheckpoint: vi.fn(), toggleAutoExplore: vi.fn() };

    handleDungeonProgressBannerAction("continue_checkpoint", handlers);

    expect(handlers.continueCheckpoint).toHaveBeenCalledOnce();
    expect(handlers.openDungeon).not.toHaveBeenCalled();
    expect(handlers.toggleAutoExplore).not.toHaveBeenCalled();
  });
});
