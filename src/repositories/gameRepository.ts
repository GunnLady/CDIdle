import { z } from "zod";
import { createInitialGameState, validateGameState } from "../domain/gameState";
import type { GameState } from "../types";

export type GameRow = {
  userId: string;
  schemaVersion: 1;
  revision: number;
  state: GameState;
  lastProcessedAt: string;
};

export type GameEnvelope = {
  schemaVersion: 1;
  revision: number;
  serverTime: string;
  lastProcessedAt: string;
  state: GameState;
};

const gameStateSchema = z.custom<GameState>(
  (value) => {
    try {
      return typeof value === "object" && value !== null && validateGameState(value as GameState).length === 0;
    } catch {
      return false;
    }
  },
  "Invalid GameStateV1",
);

export const gameEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().nonnegative(),
  serverTime: z.string().datetime({ offset: true }),
  lastProcessedAt: z.string().datetime({ offset: true }),
  state: gameStateSchema,
});

export interface GameStore {
  findByUserId(userId: string): Promise<GameRow | null>;
  createInitial(row: GameRow): Promise<GameRow>;
}

export class GameRepository {
  public constructor(private readonly store: GameStore, private readonly now: () => Date = () => new Date()) {}

  public async loadOrCreate(userId: string): Promise<GameEnvelope> {
    if (!userId.trim()) throw new Error("USER_ID_REQUIRED");
    const existing = await this.store.findByUserId(userId);
    const row = existing ?? await this.createWithRaceRecovery(userId);
    return this.toEnvelope(row);
  }

  private async createWithRaceRecovery(userId: string): Promise<GameRow> {
    const now = this.now().toISOString();
    const initial: GameRow = {
      userId,
      schemaVersion: 1,
      revision: 0,
      state: createInitialGameState(),
      lastProcessedAt: now,
    };
    try {
      return await this.store.createInitial(initial);
    } catch (error) {
      const concurrent = await this.store.findByUserId(userId);
      if (concurrent) return concurrent;
      throw error;
    }
  }

  private toEnvelope(row: GameRow): GameEnvelope {
    return gameEnvelopeSchema.parse({
      schemaVersion: row.schemaVersion,
      revision: row.revision,
      serverTime: this.now().toISOString(),
      lastProcessedAt: row.lastProcessedAt,
      state: row.state,
    });
  }
}
