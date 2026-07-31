import { describe, expect, it, vi } from "vitest";
import {
  OptimisticCommandBuffer,
  keepLatestCommand,
  mergeBuildingLevels,
  mergeSummedAmount,
  shouldRetryOptimisticConflict,
} from "../src/lib/optimisticCommandBuffer";

describe("OptimisticCommandBuffer", () => {
  it("applies immediately and condenses compatible clicks into one request", async () => {
    vi.useFakeTimers();
    const sent: unknown[] = [];
    const projections: unknown[][] = [];
    const buffer = new OptimisticCommandBuffer({
      onChange: (commands) => projections.push(commands),
      send: async (command, acknowledge) => { sent.push(command); acknowledge(); return true; },
    });
    buffer.enqueue("farmers", { type: "citizens.allocate", role: "farmers", amount: 1 }, mergeSummedAmount);
    buffer.enqueue("farmers", { type: "citizens.allocate", role: "farmers", amount: 1 }, mergeSummedAmount);
    buffer.enqueue("farmers", { type: "citizens.allocate", role: "farmers", amount: -1 }, mergeSummedAmount);
    expect(projections.at(-1)).toEqual([{ type: "citizens.allocate", role: "farmers", amount: 1 }]);
    await vi.runAllTimersAsync();
    expect(sent).toEqual([{ type: "citizens.allocate", role: "farmers", amount: 1 }]);
    expect(buffer.pendingCount).toBe(0);
    vi.useRealTimers();
  });

  it("condenses a human-speed double click separated by 250 ms", async () => {
    vi.useFakeTimers();
    const sent: unknown[] = [];
    const buffer = new OptimisticCommandBuffer({
      onChange: vi.fn(),
      send: async (command, acknowledge) => { sent.push(command); acknowledge(); return true; },
    });
    buffer.enqueue("building:ferme", { type: "building.upgrade", buildingId: "ferme" }, mergeBuildingLevels);
    await vi.advanceTimersByTimeAsync(250);
    buffer.enqueue("building:ferme", { type: "building.upgrade", buildingId: "ferme" }, mergeBuildingLevels);
    await vi.advanceTimersByTimeAsync(399);
    expect(sent).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(sent).toEqual([{ type: "building.upgrade", buildingId: "ferme", levels: 2 }]);
    vi.useRealTimers();
  });

  it("limits each action family to five clicks per rolling second", () => {
    vi.useFakeTimers();
    const buffer = new OptimisticCommandBuffer({ onChange: vi.fn(), send: async () => true });
    for (let index = 0; index < 5; index += 1) {
      expect(buffer.enqueue("floor", { type: "dungeon.select_floor", floor: index + 1 }, keepLatestCommand)).toBe(true);
    }
    expect(buffer.enqueue("floor", { type: "dungeon.select_floor", floor: 6 }, keepLatestCommand)).toBe(false);
    vi.useRealTimers();
  });

  it("disposes pending work without allowing a late request to update the UI", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const send = vi.fn(async () => true);
    const buffer = new OptimisticCommandBuffer({ onChange, send });
    buffer.enqueue("floor", { type: "dungeon.select_floor", floor: 2 }, keepLatestCommand);
    buffer.dispose();
    await vi.runAllTimersAsync();
    expect(send).not.toHaveBeenCalled();
    expect(buffer.enqueue("floor", { type: "dungeon.select_floor", floor: 3 }, keepLatestCommand)).toBe(false);
    vi.useRealTimers();
  });

  it("keeps at most one next batch while a request is in flight", async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const sent: unknown[] = [];
    const buffer = new OptimisticCommandBuffer({
      onChange: vi.fn(),
      send: async (command, acknowledge) => {
        sent.push(command);
        await new Promise<void>((resolve) => { release = resolve; });
        acknowledge();
        return true;
      },
    });
    buffer.enqueue("auto", { type: "dungeon.auto_explore", enabled: true }, keepLatestCommand);
    await vi.advanceTimersByTimeAsync(400);
    buffer.enqueue("auto", { type: "dungeon.auto_explore", enabled: false }, keepLatestCommand);
    buffer.enqueue("auto", { type: "dungeon.auto_explore", enabled: true }, keepLatestCommand);
    release();
    await vi.runAllTimersAsync();
    expect(sent).toEqual([
      { type: "dungeon.auto_explore", enabled: true },
      { type: "dungeon.auto_explore", enabled: true },
    ]);
    vi.useRealTimers();
  });

  it("rolls back the projection when the server refuses a batch", async () => {
    vi.useFakeTimers();
    const projections: unknown[][] = [];
    const buffer = new OptimisticCommandBuffer({
      onChange: (commands) => projections.push(commands),
      send: async () => false,
    });
    buffer.enqueue("farmers", { type: "citizens.allocate", role: "farmers", amount: 1 }, mergeSummedAmount);
    expect(projections.at(-1)).toHaveLength(1);
    await vi.runAllTimersAsync();
    expect(projections.at(-1)).toEqual([]);
    expect(buffer.pendingCount).toBe(0);
    vi.useRealTimers();
  });

  it("retries revision conflicts but never a command already in progress", () => {
    expect(shouldRetryOptimisticConflict("REVISION_CONFLICT")).toBe(true);
    expect(shouldRetryOptimisticConflict("COMMAND_IN_PROGRESS")).toBe(false);
    expect(shouldRetryOptimisticConflict(undefined)).toBe(false);
  });

  it("caps a queued building batch at five while another request is in flight", async () => {
    vi.useFakeTimers();
    let release!: () => void;
    let now = 0;
    const sent: unknown[] = [];
    const buffer = new OptimisticCommandBuffer({
      now: () => now,
      onChange: vi.fn(),
      send: async (command, acknowledge) => {
        sent.push(command);
        if (sent.length === 1) await new Promise<void>((resolve) => { release = resolve; });
        acknowledge();
        return true;
      },
    });
    buffer.enqueue("building:ferme", { type: "building.upgrade", buildingId: "ferme" }, mergeBuildingLevels);
    await vi.advanceTimersByTimeAsync(400);

    for (let index = 0; index < 5; index += 1) {
      now += 1_001;
      expect(buffer.enqueue("building:ferme", { type: "building.upgrade", buildingId: "ferme" }, mergeBuildingLevels)).toBe(true);
    }
    now += 1_001;
    expect(buffer.enqueue("building:ferme", { type: "building.upgrade", buildingId: "ferme" }, mergeBuildingLevels)).toBe(false);

    release();
    await vi.runAllTimersAsync();
    expect(sent).toEqual([
      { type: "building.upgrade", buildingId: "ferme" },
      { type: "building.upgrade", buildingId: "ferme", levels: 5 },
    ]);
    vi.useRealTimers();
  });
});
