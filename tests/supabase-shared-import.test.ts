import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { acceptsSharedGameState } from "../supabase/shared-import-proof";
import { GAME_STATE_SCHEMA_VERSION } from "../shared/contracts/game-state";

describe("Supabase shared contract boundary", () => {
  it("imports the canonical GameState contract", () => {
    expect(GAME_STATE_SCHEMA_VERSION).toBe(1);
    expect(acceptsSharedGameState).toBeTypeOf("function");
  });

  it("keeps Edge-reachable shared imports explicit for the Deno runtime", () => {
    const queue = [resolve("src/domain/authoritativeDungeon.ts")];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const path = queue.shift()!;
      if (visited.has(path)) continue;
      visited.add(path);
      const source = readFileSync(path, "utf8");
      for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
        const specifier = match[1];
        expect(extname(specifier), `${path}: ${specifier}`).toMatch(/^\.(?:ts|tsx|json)$/);
        const dependency = resolve(dirname(path), specifier);
        if (existsSync(dependency) && /\.(?:ts|tsx)$/.test(dependency)) queue.push(dependency);
      }
    }
    expect(visited.size).toBeGreaterThan(20);
  });
});
