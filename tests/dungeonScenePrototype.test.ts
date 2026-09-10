import { describe, expect, it } from "vitest";
import {
  createDungeonScenePrototypeFixture,
  DUNGEON_SCENE_PROTOTYPE_DURATION_MS,
  DUNGEON_SCENE_PROTOTYPE_KINDS,
  getDungeonScenePrototypeFrame,
  getDungeonScenePrototypePlacements,
} from "../src/domain/dungeonScenePrototype";

describe("dungeon scene prototype presentation model", () => {
  it("covers every agreed fixture state with stable actor identities", () => {
    expect(DUNGEON_SCENE_PROTOTYPE_KINDS).toEqual(["waiting", "battle", "boss", "rest", "challenge"]);

    for (const kind of DUNGEON_SCENE_PROTOTYPE_KINDS) {
      const fixture = createDungeonScenePrototypeFixture(kind);
      expect(fixture.kind).toBe(kind);
      expect(fixture.actors.filter((actor) => actor.team === "heroes")).toHaveLength(4);
      expect(new Set(fixture.actors.map((actor) => actor.id)).size).toBe(fixture.actors.length);
      expect(fixture.summary).not.toHaveLength(0);
      expect(fixture.journal.length).toBeGreaterThan(0);
    }

    expect(createDungeonScenePrototypeFixture("battle").actors.filter((actor) => actor.team === "enemies")).toHaveLength(3);
    const boss = createDungeonScenePrototypeFixture("boss");
    expect(boss.actors.filter((actor) => actor.team === "enemies")).toHaveLength(3);
    expect(boss.actors.filter((actor) => actor.state === "guarding")).toHaveLength(2);
    expect(boss.actors.find((actor) => actor.glyph === "king")?.name).toBe("Roi des Rats");

    const rest = createDungeonScenePrototypeFixture("rest");
    expect(rest.actors.find((actor) => actor.id === "prototype-dorian")?.state).toBe("ko");
    expect(rest.impactTargetId).toBe("prototype-dorian");

    const challenge = createDungeonScenePrototypeFixture("challenge");
    expect(challenge.actors.find((actor) => actor.id === challenge.focusActorId)?.state).toBe("chosen");
  });

  it("keeps standard and PC zoom placements inside the normalized stage", () => {
    for (const kind of DUNGEON_SCENE_PROTOTYPE_KINDS) {
      const fixture = createDungeonScenePrototypeFixture(kind);
      for (const layout of ["standard", "zoomed"] as const) {
        const placements = getDungeonScenePrototypePlacements(fixture, layout);
        expect(placements).toHaveLength(fixture.actors.length);
        for (const placement of placements) {
          expect(placement.xPercent).toBeGreaterThanOrEqual(8);
          expect(placement.xPercent).toBeLessThanOrEqual(92);
          expect(placement.yPercent).toBeGreaterThanOrEqual(18);
          expect(placement.yPercent).toBeLessThanOrEqual(78);
          expect(placement.scale).toBeGreaterThan(0.8);
          expect(placement.layer).toBeGreaterThan(0);
        }
        const identity = placements.map((placement) => `${placement.xPercent}:${placement.yPercent}`);
        expect(new Set(identity).size).toBe(identity.length);
      }
    }
  });

  it("projects anticipation, movement, impact and return from an absolute time", () => {
    const fixture = createDungeonScenePrototypeFixture("battle");
    const actorId = fixture.focusActorId!;
    const idle = getDungeonScenePrototypeFrame(fixture, 0, "standard");
    const anticipation = getDungeonScenePrototypeFrame(fixture, 425, "standard");
    const approach = getDungeonScenePrototypeFrame(fixture, 750, "standard");
    const impact = getDungeonScenePrototypeFrame(fixture, 1_050, "standard");
    const returning = getDungeonScenePrototypeFrame(fixture, 1_450, "standard");
    const result = getDungeonScenePrototypeFrame(fixture, DUNGEON_SCENE_PROTOTYPE_DURATION_MS, "standard");

    expect([idle.phase, anticipation.phase, approach.phase, impact.phase, returning.phase, result.phase]).toEqual([
      "idle", "anticipation", "approach", "impact", "return", "result",
    ]);
    expect(idle.motions[actorId].x).toBe(0);
    expect(anticipation.motions[actorId].x).toBeLessThan(0);
    expect(approach.motions[actorId].x).toBeGreaterThan(0);
    expect(impact.motions[actorId].x).toBe(138);
    expect(impact.impactVisible).toBe(true);
    expect(returning.motions[actorId].x).toBeGreaterThan(0);
    expect(returning.motions[actorId].x).toBeLessThan(138);
    expect(result.motions[actorId]).toEqual({ x: 0, y: 0, scale: 1, rotate: 0 });

    const zoomed = getDungeonScenePrototypeFrame(fixture, 1_050, "zoomed");
    expect(zoomed.motions[actorId].x).toBe(72);
    expect(zoomed.motions[actorId].y).toBe(-92);
  });

  it("does not invent an action while the squad is waiting", () => {
    const waiting = createDungeonScenePrototypeFixture("waiting");
    const frame = getDungeonScenePrototypeFrame(waiting, DUNGEON_SCENE_PROTOTYPE_DURATION_MS, "standard");
    expect(frame.phase).toBe("idle");
    expect(frame.impactVisible).toBe(false);
    expect(Object.values(frame.motions).every((motion) => motion.x === 0 && motion.y === 0)).toBe(true);
  });
});
