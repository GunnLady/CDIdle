import { render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateCanonicalGameState, type CanonicalGameState } from "../shared/contracts/authoritative";
import { createGameApiHandler, type ApiServices } from "../supabase/functions/game-api/index";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import {
  canonicalReactMappingErrors,
  projectCanonicalState,
} from "../src/domain/canonicalStateProjection";
import { deleteGameCache, readGameCache, writeGameCache } from "../src/lib/gameCache";
import { callGameApi, supabase } from "../src/lib/supabase";
import { createIndexedDbMock } from "./helpers/indexedDbMock";

type GameEnvelope = {
  schemaVersion: 1;
  revision: number;
  serverTime: string;
  lastProcessedAt: string;
  state: CanonicalGameState;
};

const USER_ID = "e2e-user";
const NOW = "2026-07-27T12:00:00.000Z";

function BootstrapProbe() {
  const [summary, setSummary] = useState("chargement");

  useEffect(() => {
    void callGameApi<GameEnvelope>("/bootstrap", { method: "POST" }).then(async (envelope) => {
      const contractErrors = validateCanonicalGameState(envelope.state);
      if (contractErrors.length > 0) throw new Error(contractErrors.join("; "));
      const projected = projectCanonicalState(envelope.state);
      await writeGameCache(USER_ID, { ...envelope.state, revision: envelope.revision });
      const resources = projected.resources as { gold: number };
      setSummary(`${String(projected.cityName)}:${resources.gold}:${envelope.revision}`);
    });
  }, []);

  return <output aria-label="canonical-bootstrap">{summary}</output>;
}

describe("authoritative React to persistence pipeline", () => {
  let rows: Map<string, GameEnvelope>;

  beforeEach(() => {
    vi.stubGlobal("indexedDB", createIndexedDbMock().indexedDb);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: { access_token: "e2e-token" } },
    } as never);

    rows = new Map([[USER_ID, {
      schemaVersion: 1,
      revision: 7,
      serverTime: NOW,
      lastProcessedAt: NOW,
      state: { ...initialTownState(42), cityName: "Pipeline" },
    }]]);
    const services: ApiServices = {
      authenticate: async (request) => request.headers.get("authorization") === "Bearer e2e-token" ? USER_ID : null,
      bootstrap: async (userId) => structuredClone(rows.get(userId)),
      commands: async () => ({ ok: true }),
      reportError: async () => undefined,
      reset: async (userId) => {
        const previous = rows.get(userId);
        const reset: GameEnvelope = {
          schemaVersion: 1,
          revision: Number(previous?.revision ?? 0) + 1,
          serverTime: NOW,
          lastProcessedAt: NOW,
          state: initialTownState(42),
        };
        rows.set(userId, reset);
        return structuredClone(reset);
      },
      deleteAccount: async (userId) => { rows.delete(userId); },
    };
    const handler = createGameApiHandler({ allowedOrigins: [], services });
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      return handler(request);
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("bootstraps React through game-api and persists the canonical snapshot in IndexedDB", async () => {
    render(<BootstrapProbe />);

    await waitFor(() => expect(screen.getByLabelText("canonical-bootstrap")).toHaveTextContent("Pipeline:75:7"));
    await expect(readGameCache(USER_ID)).resolves.toMatchObject({
      cityName: "Pipeline",
      revision: 7,
      resources: { gold: 75 },
    });
  });

  it("keeps reset and account deletion aligned between API storage and the local cache", async () => {
    await writeGameCache(USER_ID, { ...rows.get(USER_ID)?.state, revision: 7 });

    const reset = await callGameApi<GameEnvelope>("/reset", { method: "POST" });
    await deleteGameCache(USER_ID);
    await writeGameCache(USER_ID, { ...reset.state, revision: reset.revision });
    await expect(readGameCache(USER_ID)).resolves.toMatchObject({ revision: 8, resources: { gold: 75 } });

    await callGameApi("/account", { method: "DELETE" });
    await deleteGameCache(USER_ID);
    expect(rows.has(USER_ID)).toBe(false);
    await expect(readGameCache(USER_ID)).resolves.toBeNull();
  });

  it("fails when a required canonical field has no React or cache classification", () => {
    expect(canonicalReactMappingErrors()).toEqual([]);
    expect(canonicalReactMappingErrors(["resources", "newServerField"])).toEqual([
      "canonical field newServerField is not mapped or explicitly cache-only",
    ]);
  });
});
