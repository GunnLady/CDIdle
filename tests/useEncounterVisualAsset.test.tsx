import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const visualState = vi.hoisted(() => ({ scale: 1.4 }));

vi.mock("../src/assets/encounterVisuals", () => {
  const descriptor = (key: string) => ({
    key,
    kind: "enemy",
    version: 1,
    provenance: "test",
    anchor: { x: 0.5, y: 0.93 },
    scale: visualState.scale,
    fallbackGlyph: "L",
    fallback: false,
  });

  return {
    resolveEncounterVisualDescriptor: descriptor,
    loadEncounterVisualAsset: async (key: string) => ({
      descriptor: descriptor(key),
      url: "/sworn-blade.png",
      status: "ready",
    }),
  };
});

import { useEncounterVisualAsset } from "../src/hooks/useEncounterVisualAsset";

describe("useEncounterVisualAsset", () => {
  it("refreshes presentation metadata when the visual key stays unchanged", async () => {
    const { result, rerender } = renderHook(() => useEncounterVisualAsset("undercity:smuggler-captain:a"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.descriptor.scale).toBe(1.4);

    visualState.scale = 1.36;
    rerender();

    expect(result.current.descriptor.scale).toBe(1.36);
    expect(result.current.url).toBe("/sworn-blade.png");
  });
});
