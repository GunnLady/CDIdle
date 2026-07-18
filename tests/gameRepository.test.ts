import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/domain/gameState";
import { GameRepository, type GameRow, type GameStore } from "../src/repositories/gameRepository";

class MemoryGameStore implements GameStore {
  private row: GameRow | null = null;
  public createCalls = 0;
  public conflictOnCreate = false;

  async findByUserId(): Promise<GameRow | null> {
    return this.row;
  }

  async createInitial(row: GameRow): Promise<GameRow> {
    this.createCalls += 1;
    if (this.conflictOnCreate) {
      this.row = row;
      this.conflictOnCreate = false;
      throw new Error("duplicate key");
    }
    this.row ??= row;
    return this.row;
  }
}

describe("GameRepository", () => {
  it("creates a valid initial game lazily and remains idempotent", async () => {
    const store = new MemoryGameStore();
    const repository = new GameRepository(store, () => new Date("2026-07-18T12:00:00.000Z"));
    const first = await repository.loadOrCreate("user-1");
    const second = await repository.loadOrCreate("user-1");

    expect(first.schemaVersion).toBe(1);
    expect(first.revision).toBe(0);
    expect(first.state).toEqual(createInitialGameState());
    expect(second).toEqual(first);
    expect(store.createCalls).toBe(1);
  });

  it("recovers from a concurrent first creation", async () => {
    const store = new MemoryGameStore();
    const repository = new GameRepository(store);
    store.conflictOnCreate = true;
    await expect(repository.loadOrCreate("user-1")).resolves.toMatchObject({ revision: 0 });
  });

  it("rejects an empty user id", async () => {
    const repository = new GameRepository(new MemoryGameStore());
    await expect(repository.loadOrCreate("  ")).rejects.toThrow("USER_ID_REQUIRED");
  });
});
