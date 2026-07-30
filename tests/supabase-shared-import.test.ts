import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { acceptsSharedGameState } from "../supabase/shared-import-proof";
import { CANONICAL_GAME_STATE_REQUIRED_FIELDS } from "../shared/contracts/authoritative";

describe("Supabase shared contract boundary", () => {
  it("imports the canonical GameState contract", () => {
    expect(CANONICAL_GAME_STATE_REQUIRED_FIELDS).toContain("rngState");
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
