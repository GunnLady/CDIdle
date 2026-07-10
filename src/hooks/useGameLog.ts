import { useState, useCallback, useRef } from "react";
import { BattleLogEntry } from "../types";

export function useGameLog() {
  const [battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([]);
  const battleLogsRef = useRef<BattleLogEntry[]>(battleLogs);
  battleLogsRef.current = battleLogs;

  const addLog = useCallback((
    message: string,
    type: BattleLogEntry["type"] = "info",
    category: "dungeon" | "colony" = "dungeon"
  ) => {
    const now = new Date();
    const ts = now.toTimeString().split(" ")[0];
    const newEntry: BattleLogEntry = {
      id: Math.random().toString(36).substring(3, 10),
      timestamp: ts,
      message,
      type,
      category
    };
    setBattleLogs((prev) => [...prev.slice(-45), newEntry]); // retain last 50 logs for scroll performance
  }, []);

  const clearBattleLogs = useCallback(() => {
    setBattleLogs([]);
  }, []);

  return {
    battleLogs,
    battleLogsRef,
    setBattleLogs,
    addLog,
    clearBattleLogs
  };
}
