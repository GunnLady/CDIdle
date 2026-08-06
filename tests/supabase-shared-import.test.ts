import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { acceptsSharedGameState } from "../supabase/shared-import-proof";
import { CANONICAL_GAME_STATE_REQUIRED_FIELDS } from "../shared/contracts/authoritative";

function listTypeScriptFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("Supabase shared contract boundary", () => {
  it("imports the canonical GameState contract", () => {
    expect(CANONICAL_GAME_STATE_REQUIRED_FIELDS).toContain("rngState");
    expect(acceptsSharedGameState).toBeTypeOf("function");
  });

  it("keeps the complete Edge graph outside src with explicit Deno imports", () => {
    const projectRoot = resolve(".");
    const edgeRoot = resolve("supabase/functions/game-api");
    const queue = readdirSync(edgeRoot)
      .filter((name) => name.endsWith(".ts"))
      .map((name) => resolve(edgeRoot, name));
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
        const projectPath = relative(projectRoot, dependency).replaceAll("\\", "/");
        expect(projectPath, `${path}: ${specifier}`).not.toMatch(/^src\//);
        if (existsSync(dependency) && /\.(?:ts|tsx)$/.test(dependency)) {
          queue.push(dependency);
        }
      }
    }
    expect(visited.size).toBeGreaterThan(40);
  });

  it("keeps every shared module neutral to frontend and backend runtimes", () => {
    const projectRoot = resolve(".");
    const files = listTypeScriptFiles(resolve("shared"));

    expect(files.length).toBeGreaterThan(20);
    for (const path of files) {
      const source = readFileSync(path, "utf8");
      expect(source, path).not.toMatch(/(?:from\s+|import\s*)["']react(?:\/[^"']*)?["']/);
      expect(source, path).not.toMatch(/\b(?:window|document|localStorage|sessionStorage)\b/);
      expect(source, path).not.toMatch(/\b(?:Deno|process)\.env\b|Math\.random\s*\(/);

      for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
        const dependency = resolve(dirname(path), match[1]);
        const projectPath = relative(projectRoot, dependency).replaceAll("\\", "/");
        expect(projectPath, `${path}: ${match[1]}`).not.toMatch(/^(?:src|supabase\/functions)\//);
      }
    }
  });
});
