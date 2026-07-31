import { CLASS_INFO_LIST, getSkillById } from "../data/gameData.ts";
import type { ClassType, Hero, StoredItemInstance } from "../types.ts";
import { refreshHeroDerivedStats } from "../utils/gameCalculations.ts";
import type { Rng } from "./random.ts";
import {
  grantTier1ClassEquipment,
  type ClassEquipmentReward,
} from "./tier1ClassEquipmentReward.ts";

function requiredTier1Class(classType: ClassType) {
  const classInfo = CLASS_INFO_LIST.find((entry) => entry.type === classType && entry.tier === 1);
  if (!classInfo) throw new Error(`INVALID_TIER1_CLASS:${classType}`);
  return classInfo;
}

function requiredSkillPool(
  skillIds: string[],
  expectedType: "active" | "passive",
  classType: ClassType,
): string[] {
  const invalid = skillIds.filter((skillId) => getSkillById(skillId)?.type !== expectedType);
  if (invalid.length > 0) {
    throw new Error(`INVALID_CLASS_SKILL_CATALOG:${classType}:${invalid.join(",")}`);
  }
  if (skillIds.length === 0) {
    throw new Error(`EMPTY_CLASS_SKILL_CATALOG:${classType}:${expectedType}`);
  }
  return [...skillIds];
}

function drawDistinctSkills(skillIds: string[], count: number, rng: Rng): string[] {
  if (skillIds.length < count) throw new Error("INSUFFICIENT_DISTINCT_CLASS_SKILLS");
  const available = [...skillIds];
  const selected: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const selectedIndex = rng.nextInt(available.length);
    selected.push(available[selectedIndex]);
    available.splice(selectedIndex, 1);
  }
  return selected;
}

export function assignTier1Skills(
  hero: Hero,
  classType: ClassType,
  rng: Rng,
): Pick<Hero, "activeSkills" | "passiveSkills"> {
  const classInfo = requiredTier1Class(classType);
  const activePool = requiredSkillPool(classInfo.activeSkills, "active", classType);
  const passivePool = requiredSkillPool(classInfo.passiveSkills, "passive", classType);
  const noviceClass = CLASS_INFO_LIST.find((entry) => entry.type === "Novice");
  const retainedNovicePassives = hero.passiveSkills.filter(
    (skillId) => noviceClass?.passiveSkills.includes(skillId) === true,
  );

  if (classType === "Mage") {
    return {
      activeSkills: drawDistinctSkills(activePool, 2, rng),
      passiveSkills: [...retainedNovicePassives, ...drawDistinctSkills(passivePool, 1, rng)],
    };
  }

  if (classType === "Acolyte") {
    const guaranteedHeal = getSkillById("minor_heal");
    if (!guaranteedHeal || guaranteedHeal.type !== "active") {
      throw new Error("INVALID_ACOLYTE_GUARANTEED_SKILL:minor_heal");
    }
    return {
      activeSkills: ["minor_heal", ...drawDistinctSkills(activePool, 1, rng)],
      passiveSkills: [...retainedNovicePassives, ...drawDistinctSkills(passivePool, 1, rng)],
    };
  }

  return {
    activeSkills: drawDistinctSkills(activePool, 1, rng),
    passiveSkills: [...retainedNovicePassives, ...drawDistinctSkills(passivePool, 1, rng)],
  };
}

export function applyTier1ClassTransition(
  hero: Hero,
  targetClass: ClassType,
  rng: Rng,
  storedItems: StoredItemInstance[],
): {
  hero: Hero;
  storedItems: StoredItemInstance[];
  equipmentReward: ClassEquipmentReward;
} {
  const skills = assignTier1Skills(hero, targetClass, rng);
  const transitioned = refreshHeroDerivedStats({
    ...hero,
    classType: targetClass,
    ...skills,
    cooldowns: {},
  });
  const equipped = grantTier1ClassEquipment(transitioned, targetClass, rng, storedItems);
  return {
    hero: equipped.hero,
    storedItems: equipped.storedItems,
    equipmentReward: equipped.reward,
  };
}
