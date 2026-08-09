import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameLog } from "../src/hooks/useGameLog";

describe("useGameLog", () => {
  it("stores and clears dungeon, colony and system channels independently", () => {
    const { result } = renderHook(() => useGameLog());

    act(() => {
      result.current.addLog("Action du donjon", "info", "dungeon");
      result.current.addLog("Action de la cité", "info", "colony");
      result.current.addLog("Synchronisation", "info");
    });
    act(() => result.current.clearBattleLogs("dungeon"));

    expect(result.current.dungeonLogs).toEqual([]);
    expect(result.current.colonyLogs.map((entry) => entry.message)).toEqual(["Action de la cité"]);
    expect(result.current.systemLogs.map((entry) => entry.message)).toEqual(["Synchronisation"]);

    act(() => result.current.clearBattleLogs("colony"));
    expect(result.current.colonyLogs).toEqual([]);
    expect(result.current.systemLogs).toHaveLength(1);
  });

  it("keeps the global reset behavior when no category is supplied", () => {
    const { result } = renderHook(() => useGameLog());

    act(() => {
      result.current.addLog("Donjon", "info", "dungeon");
      result.current.addLog("Cité", "info", "colony");
      result.current.addLog("Système");
    });
    act(() => result.current.clearBattleLogs());

    expect(result.current.dungeonLogs).toEqual([]);
    expect(result.current.colonyLogs).toEqual([]);
    expect(result.current.systemLogs).toEqual([]);
  });

  it("retains the latest 25 entries in every channel without cross-eviction", () => {
    const { result } = renderHook(() => useGameLog());

    act(() => {
      for (let index = 0; index < 30; index += 1) {
        result.current.addLog(`Donjon ${index}`, "info", "dungeon");
        result.current.addLog(`Cité ${index}`, "info", "colony");
        result.current.addLog(`Système ${index}`);
      }
    });

    expect(result.current.dungeonLogs).toHaveLength(25);
    expect(result.current.colonyLogs).toHaveLength(25);
    expect(result.current.systemLogs).toHaveLength(25);
    expect(result.current.dungeonLogs[0]?.message).toBe("Donjon 5");
    expect(result.current.colonyLogs[0]?.message).toBe("Cité 5");
    expect(result.current.systemLogs[0]?.message).toBe("Système 5");
  });
});
