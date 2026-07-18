import { Rarity } from "../types";

export interface BossLootMaterialReward {
  materialId: string;
  rarity: Rarity;
  chance: number; // e.g., 1.0 for guaranteed, 0.15 for 15%
  minCount: number;
  maxCount: number;
  displayName: string;
}

export interface BossLootItemReward {
  rarity: Rarity;
  chance: number; // e.g., 0.70 for 70%
  levelMin?: number;
  levelMax?: number;
}

export interface BossLootBlueprintReward {
  chance: number; // e.g., 0.05 for 5%
  levelMin?: number;
  levelMax?: number;
}

export interface BossLootTable {
  bossName: string;
  goldRange?: [number, number]; // custom gold range
  materials: BossLootMaterialReward[];
  items: BossLootItemReward[];
  blueprints: BossLootBlueprintReward[];
}

export const BOSS_LOOT_TABLES_REGISTRY: Record<string, BossLootTable> = {
  "Giga Gobelin 'Roi des Déchets'": {
    bossName: "Giga Gobelin 'Roi des Déchets'",
    goldRange: [25, 45],
    materials: [
      { materialId: "metal_scrap", rarity: "common", chance: 1.0, minCount: 4, maxCount: 8, displayName: "Débris métalliques" },
      { materialId: "refined_metal", rarity: "uncommon", chance: 1.0, minCount: 2, maxCount: 5, displayName: "Métal raffiné" },
      { materialId: "enchanted_fragment", rarity: "rare", chance: 0.15, minCount: 1, maxCount: 4, displayName: "Fragment enchanté" }
    ],
    items: [
      { rarity: "uncommon", chance: 0.70, levelMin: 0, levelMax: 9 },
      { rarity: "rare", chance: 0.20, levelMin: 0, levelMax: 9 },
      { rarity: "epic", chance: 0.02, levelMin: 0, levelMax: 9 }
    ],
    blueprints: [
      { chance: 0.05, levelMin: 0, levelMax: 10 }
    ]
  },
  "Chef de Meute Orc Blindé": {
    bossName: "Chef de Meute Orc Blindé",
    goldRange: [60, 100],
    materials: [
      { materialId: "metal_scrap", rarity: "common", chance: 1.0, minCount: 6, maxCount: 12, displayName: "Débris métalliques" },
      { materialId: "refined_metal", rarity: "uncommon", chance: 1.0, minCount: 4, maxCount: 8, displayName: "Métal raffiné" },
      { materialId: "enchanted_fragment", rarity: "rare", chance: 0.30, minCount: 2, maxCount: 6, displayName: "Fragment enchanté" }
    ],
    items: [
      { rarity: "uncommon", chance: 0.80, levelMin: 10, levelMax: 15 },
      { rarity: "rare", chance: 0.40, levelMin: 10, levelMax: 15 },
      { rarity: "epic", chance: 0.05, levelMin: 10, levelMax: 15 }
    ],
    blueprints: [
      { chance: 0.05, levelMin: 10, levelMax: 15 }
    ]
  },
  "Gardien du Portail en Obsidienne": {
    bossName: "Gardien du Portail en Obsidienne",
    goldRange: [150, 250],
    materials: [
      { materialId: "refined_metal", rarity: "uncommon", chance: 1.0, minCount: 6, maxCount: 12, displayName: "Métal raffiné" },
      { materialId: "enchanted_fragment", rarity: "rare", chance: 1.0, minCount: 4, maxCount: 10, displayName: "Fragment enchanté" },
      { materialId: "arcane_core", rarity: "epic", chance: 0.25, minCount: 1, maxCount: 4, displayName: "Noyau arcanique" }
    ],
    items: [
      { rarity: "uncommon", chance: 0.90, levelMin: 10, levelMax: 25 },
      { rarity: "rare", chance: 0.50, levelMin: 10, levelMax: 25 },
      { rarity: "epic", chance: 0.10, levelMin: 10, levelMax: 25 }
    ],
    blueprints: [
      { chance: 0.05, levelMin: 10, levelMax: 25 }
    ]
  },
  "La Liche Éternelle 'Malakor'": {
    bossName: "La Liche Éternelle 'Malakor'",
    goldRange: [400, 600],
    materials: [
      { materialId: "enchanted_fragment", rarity: "rare", chance: 1.0, minCount: 8, maxCount: 16, displayName: "Fragment enchanté" },
      { materialId: "arcane_core", rarity: "epic", chance: 1.0, minCount: 4, maxCount: 10, displayName: "Noyau arcanique" },
      { materialId: "legendary_essence", rarity: "legendary", chance: 0.10, minCount: 1, maxCount: 2, displayName: "Essence légendaire" }
    ],
    items: [
      { rarity: "rare", chance: 0.80, levelMin: 20, levelMax: 35 },
      { rarity: "epic", chance: 0.25, levelMin: 20, levelMax: 35 },
      { rarity: "legendary", chance: 0.05, levelMin: 20, levelMax: 35 }
    ],
    blueprints: [
      { chance: 0.05, levelMin: 20, levelMax: 35 }
    ]
  },
  "Sinueux Dragon Rouge Primordial": {
    bossName: "Sinueux Dragon Rouge Primordial",
    goldRange: [1200, 2000],
    materials: [
      { materialId: "arcane_core", rarity: "epic", chance: 1.0, minCount: 12, maxCount: 24, displayName: "Noyau arcanique" },
      { materialId: "legendary_essence", rarity: "legendary", chance: 1.0, minCount: 4, maxCount: 8, displayName: "Essence légendaire" }
    ],
    items: [
      { rarity: "rare", chance: 1.00, levelMin: 30, levelMax: 50 },
      { rarity: "epic", chance: 0.50, levelMin: 30, levelMax: 50 },
      { rarity: "legendary", chance: 0.15, levelMin: 30, levelMax: 50 }
    ],
    blueprints: [
      { chance: 0.05, levelMin: 30, levelMax: 50 }
    ]
  }
};
