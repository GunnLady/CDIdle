import { useCallback, useMemo, useState } from "react";
import type { BattleLogEntry } from "../types";

export type GameLogChannel = "dungeon" | "colony" | "system";

const MAX_LOGS_PER_CHANNEL = 25;

type GameLogsByChannel = Record<GameLogChannel, BattleLogEntry[]>;

const emptyLogs = (): GameLogsByChannel => ({ dungeon: [], colony: [], system: [] });

export function useGameLog() {
  const [logsByChannel, setLogsByChannel] = useState<GameLogsByChannel>(emptyLogs);

  const addLog = useCallback((
    message: string,
    type: BattleLogEntry["type"] = "info",
    channel: GameLogChannel = "system",
  ) => {
    const now = new Date();
    const newEntry: BattleLogEntry = {
      id: Math.random().toString(36).substring(3, 10),
      timestamp: now.toTimeString().split(" ")[0],
      message,
      type,
      ...(channel === "system" ? {} : { category: channel }),
    };
    setLogsByChannel((current) => ({
      ...current,
      [channel]: [...current[channel].slice(-(MAX_LOGS_PER_CHANNEL - 1)), newEntry],
    }));
  }, []);

  const clearBattleLogs = useCallback((channel?: GameLogChannel) => {
    setLogsByChannel((current) => channel
      ? { ...current, [channel]: [] }
      : emptyLogs());
  }, []);

  return useMemo(() => ({
    dungeonLogs: logsByChannel.dungeon,
    colonyLogs: logsByChannel.colony,
    systemLogs: logsByChannel.system,
    addLog,
    clearBattleLogs,
  }), [addLog, clearBattleLogs, logsByChannel]);
}
