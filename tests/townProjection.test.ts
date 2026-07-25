import { describe, expect, it } from "vitest";
import { projectTownDisplay, projectTownResources } from "../src/domain/townProjection";
import { makeResources } from "./fixtures/game";

describe("town resource display projection", () => {
  it("projects production without mutating the canonical snapshot", () => {
    const resources = makeResources({ food: 50, wood: 20, stone: 0, ore: 0 });
    const projected = projectTownResources({
      resources,
      rates: { food: 0, wood: 1, stone: 2, ore: 0 },
      elapsedSeconds: 3.9,
      totalCitizens: 3,
      habitationLevel: 1,
      citizenGrowthProgress: 0,
    });
    expect(projected).toMatchObject({ food: 50, wood: 23, stone: 6, ore: 0 });
    expect(resources).toMatchObject({ food: 50, wood: 20, stone: 0, ore: 0 });
  });

  it("mirrors authoritative food consumption while immigration is possible", () => {
    expect(projectTownResources({
      resources: makeResources({ food: 50 }),
      rates: { food: 1, wood: 0, stone: 0, ore: 0 },
      elapsedSeconds: 30,
      totalCitizens: 3,
      habitationLevel: 2,
      citizenGrowthProgress: 0,
    }).food).toBe(50);
  });

  it("fills the immigration bar before presenting the new citizen", () => {
    const input = {
      resources: makeResources({ food: 100 }),
      rates: { food: 0, wood: 0, stone: 0, ore: 0 },
      totalCitizens: 3,
      habitationLevel: 2,
      citizenGrowthProgress: 0,
    };
    expect(projectTownDisplay({ ...input, elapsedSeconds: 19 })).toMatchObject({
      totalCitizens: 3,
      citizenGrowthProgress: 95,
    });
    expect(projectTownDisplay({ ...input, elapsedSeconds: 20 })).toMatchObject({
      totalCitizens: 3,
      citizenGrowthProgress: 100,
    });
    expect(projectTownDisplay({ ...input, elapsedSeconds: 21 })).toMatchObject({
      totalCitizens: 4,
      citizenGrowthProgress: 5,
    });
  });
});
