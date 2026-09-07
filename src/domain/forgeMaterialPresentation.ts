import type { StoredForgeMaterialStack } from "../types";
import { FORGE_MATERIALS } from "../utils/gameCalculations";

export interface ForgeMaterialView {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface BossComponentGroupView {
  bossId: string;
  bossName: string;
  dungeonId: string;
  materials: ForgeMaterialView[];
}

export function createForgeMaterialReserveView(stacks: StoredForgeMaterialStack[]) {
  const counts = new Map(stacks.map((stack) => [stack.materialId, stack.count]));
  const materialView = (material: (typeof FORGE_MATERIALS)[number]): ForgeMaterialView => ({
    id: material.id,
    name: material.name,
    description: material.description,
    count: counts.get(material.id) ?? 0,
  });
  const materials = FORGE_MATERIALS
    .filter((material) => material.category !== "boss")
    .map(materialView);
  const bossGroups = new Map<string, BossComponentGroupView>();
  for (const material of FORGE_MATERIALS.filter((entry) => entry.category === "boss" && entry.sourceBoss)) {
    const source = material.sourceBoss!;
    const key = source.dungeonId + ":" + source.encounterId;
    const group = bossGroups.get(key) ?? {
      bossId: source.encounterId,
      bossName: source.name,
      dungeonId: source.dungeonId,
      materials: [],
    };
    group.materials.push(materialView(material));
    bossGroups.set(key, group);
  }
  return { materials, bossComponents: [...bossGroups.values()] };
}