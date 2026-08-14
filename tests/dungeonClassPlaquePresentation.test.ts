import { describe, expect, it } from "vitest";
import { CANONICAL_HERO_CLASSES } from "../shared/domain/hero-classes";
import { getDungeonClassPlaque } from "../src/domain/dungeonClassPlaquePresentation";

describe("dungeon class plaque presentation", () => {
  it("maps every canonical class to its runtime plaque", () => {
    for (const classType of CANONICAL_HERO_CLASSES) {
      expect(getDungeonClassPlaque(classType)).toContain(`dungeon-class-plaque-${classType === "Aède" ? "aede" : classType.toLowerCase()}-`);
    }
  });
});
