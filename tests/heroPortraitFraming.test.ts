import { describe, expect, it } from "vitest";
import {
  findHeroPortraitOpaqueBounds,
  fitHeroPortraitToFrame,
} from "../src/assets/heroPortraitFraming";

describe("hero portrait framing", () => {
  it("finds the exact visible bounds in an RGBA buffer", () => {
    const pixels = new Uint8ClampedArray(4 * 3 * 4);
    for (const pixel of [5, 6, 9, 10]) pixels[(pixel * 4) + 3] = 255;
    expect(findHeroPortraitOpaqueBounds(pixels, 4, 3)).toEqual({ x: 1, y: 1, width: 2, height: 2 });
  });

  it("returns no bounds for a fully transparent portrait", () => {
    expect(findHeroPortraitOpaqueBounds(new Uint8ClampedArray(2 * 2 * 4), 2, 2)).toBeNull();
  });

  it("uses a uniform scale, centers the silhouette and grounds it", () => {
    const placement = fitHeroPortraitToFrame({ x: 10, y: 20, width: 100, height: 200 }, 180, 280);
    expect(placement.source).toEqual({ x: 10, y: 20, width: 100, height: 200 });
    expect(placement.destination.width / placement.source.width)
      .toBeCloseTo(placement.destination.height / placement.source.height);
    expect(placement.destination.x + (placement.destination.width / 2)).toBeCloseTo(90);
    expect(placement.destination.y + placement.destination.height).toBeCloseTo(275.8);
  });

  it("keeps wide silhouettes inside the horizontal frame budget", () => {
    const placement = fitHeroPortraitToFrame({ x: 0, y: 0, width: 200, height: 100 }, 180, 280);
    expect(placement.destination.width).toBeCloseTo(169.2);
    expect(placement.destination.height).toBeCloseTo(84.6);
  });
});
