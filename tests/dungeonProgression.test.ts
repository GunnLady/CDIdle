import { describe, expect, it } from "vitest";
import {
  getDungeonRoomCount,
  getDungeonGoldReward,
  getFirstClearRewards,
  getMajorBossIndex,
  getPartyXpShare,
  getRegularEnemyBudget,
  isMajorBossFloor,
  MAJOR_BOSS_FLOORS,
} from "../shared/domain/dungeon-progression";
import { BUILDING_UNLOCKS, getBuildingUpgradeCost } from "../src/data/buildings";

describe("dungeon progression curve", () => {
  it("grows floors from five rooms to the fifty-room cap", () => {
    expect([1, 2, 3, 9, 10, 20].map(getDungeonRoomCount)).toEqual([5, 10, 15, 45, 50, 50]);
  });

  it("interpolates regular enemies without a second floor multiplier", () => {
    expect(getRegularEnemyBudget(1)).toEqual({ attack: 4, xp: 14, gold: 4 });
    expect(getRegularEnemyBudget(3)).toEqual({ attack: 6, xp: 18, gold: 4 });
    expect(getRegularEnemyBudget(5)).toEqual({ attack: 8, xp: 24, gold: 5 });
    expect(getRegularEnemyBudget(10)).toEqual({ attack: 10, xp: 42, gold: 6 });
    expect(getRegularEnemyBudget(30)).toEqual({ attack: 45, xp: 350, gold: 45 });
    expect(getRegularEnemyBudget(50)).toEqual({ attack: 120, xp: 1_400, gold: 200 });
  });

  it("derives every non-combat gold source from the shared floor budget", () => {
    expect(getDungeonGoldReward(1, "treasure")).toBe(8);
    expect(getDungeonGoldReward(1, "enigma")).toBe(8);
    expect(getDungeonGoldReward(1, "ambush")).toBe(4);
    expect(getDungeonGoldReward(1, "negotiation")).toBe(12);
    expect(getDungeonGoldReward(10, "negotiation")).toBe(18);
  });

  it("reserves named major bosses for decade floors", () => {
    expect(MAJOR_BOSS_FLOORS).toEqual([10, 20, 30, 40, 50]);
    for (const floor of [1, 5, 6, 9, 11, 49]) expect(isMajorBossFloor(floor)).toBe(false);
    for (const floor of MAJOR_BOSS_FLOORS) expect(isMajorBossFloor(floor)).toBe(true);
    expect(getMajorBossIndex(10)).toBe(0);
    expect(getMajorBossIndex(50)).toBe(4);
  });

  it("keeps the approved party-size XP shares", () => {
    expect([1, 2, 3, 4].map(getPartyXpShare)).toEqual([1, 0.5, 0.4, 0.35]);
  });

  it("grows deterministic one-time floor-clear rewards", () => {
    expect(getFirstClearRewards(1)).toEqual({ gold: 50, xpPool: 140 });
    expect(getFirstClearRewards(5)).toEqual({ gold: 180, xpPool: 630 });
    expect(getFirstClearRewards(10)).toEqual({ gold: 320, xpPool: 2_100 });
    expect(getFirstClearRewards(11).gold).toBeLessThan(getFirstClearRewards(20).gold);
    expect(getFirstClearRewards(20).gold).toBeGreaterThan(getFirstClearRewards(10).gold);
  });
});

describe("tier-one class building economy", () => {
  it("funds prerequisites and one vocation while regular rooms complete the four-building target", () => {
    const earlyClassBuildings = ["caserne", "poste_chasse", "lair", "temple"];
    const prerequisiteBuildings = ["ferme", "scierie", "carriere", "guilde", "mine"];
    const classGold = earlyClassBuildings.reduce(
      (sum, buildingId) => sum + getBuildingUpgradeCost(buildingId, 0).gold,
      0,
    );
    const prerequisiteGold = prerequisiteBuildings.reduce(
      (sum, buildingId) => sum + getBuildingUpgradeCost(buildingId, 0).gold,
      0,
    );
    const totalGold = classGold + prerequisiteGold;
    const firstSevenFloorGold = Array.from({ length: 7 }, (_, index) =>
      getFirstClearRewards(index + 1).gold
    ).reduce((sum, gold) => sum + gold, 0);

    expect(classGold).toBe(1_400);
    expect(prerequisiteGold).toBe(295);
    expect(totalGold).toBe(1_695);
    expect(firstSevenFloorGold).toBe(950);
    expect(firstSevenFloorGold).toBeGreaterThanOrEqual(prerequisiteGold + 300);
    expect(firstSevenFloorGold).toBeLessThan(totalGold);
  });

  it("reaches the four-building reference budget without recreating the former surplus", () => {
    const referenceGoldThroughFloorEight = Array.from({ length: 8 }, (_, index) => {
      const floor = index + 1;
      const roomGold = Math.round(getRegularEnemyBudget(floor).gold) * getDungeonRoomCount(floor);
      return getFirstClearRewards(floor).gold + roomGold;
    }).reduce((sum, gold) => sum + gold, 0);

    expect(referenceGoldThroughFloorEight).toBe(2_100);
    expect(referenceGoldThroughFloorEight).toBeGreaterThanOrEqual(1_695);
    expect(referenceGoldThroughFloorEight).toBeLessThan(1_695 * 1.5);
  });

  it("unlocks every tier-one class building from the shared floor-three prerequisites", () => {
    for (const buildingId of ["caserne", "poste_chasse", "lair", "temple", "academie", "cercle", "forge"]) {
      expect(BUILDING_UNLOCKS[buildingId]).toEqual({
        requiredBuildings: { guilde: 1, mine: 1 },
        requiredFloor: 3,
        desc: "Campement Niv. 1, Mine Niv. 1 et Étage atteint 3",
      });
    }
  });

  it("keeps all seven class buildings finite and explicitly priced", () => {
    for (const buildingId of ["caserne", "poste_chasse", "lair", "temple", "academie", "cercle", "forge"]) {
      const cost = getBuildingUpgradeCost(buildingId, 0);
      expect(Object.values(cost).every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
      expect(cost.gold).toBeLessThanOrEqual(1_000);
    }
  });
});
