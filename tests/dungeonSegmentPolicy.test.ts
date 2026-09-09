import { describe, expect, it } from "vitest";
import {
  decideDungeonHeroMutation,
  DUNGEON_PARTY_LOCK_CODE,
  type DungeonHeroMutation,
} from "../shared/domain/dungeon-segment";
import { createUndercityProgress } from "../shared/domain/undercity-progression";
import { createDungeonPartyLockView, dungeonMutationReason } from "../src/domain/heroPresentation";

const mutations: DungeonHeroMutation[] = [
  "join_party",
  "leave_party",
  "equip",
  "unequip",
  "dismiss",
  "choose_vocation",
];

describe("dungeon segment mutation policy", () => {
  it("allows hero management while the expedition is preparing", () => {
    const state = { dungeonProgress: createUndercityProgress(["hero-1"]) };
    for (const mutation of mutations) {
      expect(decideDungeonHeroMutation(state, "hero-1", mutation)).toEqual({ allowed: true });
    }
  });

  it("locks every member mutation and only blocks joining for town heroes", () => {
    const dungeonProgress = createUndercityProgress(["member", "town"]);
    dungeonProgress.expedition = {
      ...dungeonProgress.expedition,
      phase: "running",
      segmentHeroIds: ["member"],
    };
    const state = { dungeonProgress };

    for (const mutation of mutations) {
      expect(decideDungeonHeroMutation(state, "member", mutation)).toEqual({
        allowed: false,
        code: DUNGEON_PARTY_LOCK_CODE,
      });
    }
    expect(decideDungeonHeroMutation(state, "town", "join_party")).toEqual({
      allowed: false,
      code: DUNGEON_PARTY_LOCK_CODE,
    });
    for (const mutation of mutations.filter((entry) => entry !== "join_party")) {
      expect(decideDungeonHeroMutation(state, "town", mutation)).toEqual({ allowed: true });
    }
  });

  it("keeps the stable code separate from its French presentation", () => {
    const dungeonProgress = createUndercityProgress(["member", "town"]);
    dungeonProgress.expedition = {
      ...dungeonProgress.expedition,
      phase: "running",
      segmentHeroIds: ["member"],
    };

    expect(createDungeonPartyLockView(dungeonProgress, ["member", "town"])).toEqual({
      canChangeComposition: false,
      compositionBlockReason: "Équipe verrouillée pendant l’expédition",
      lockedHeroIds: ["member"],
      lockedHeroReason: "Équipe verrouillée pendant l’expédition",
    });
    expect(dungeonMutationReason(DUNGEON_PARTY_LOCK_CODE)).toBe("Équipe verrouillée pendant l’expédition");
  });
});
