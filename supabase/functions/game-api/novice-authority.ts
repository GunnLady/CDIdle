import { generateAuthoritativeNoviceEquipment } from "./inventory-authority.ts";
import {
  calculateAuthoritativeNoviceStats,
  type AuthoritativeNoviceStats,
} from "./novice-stats-authority.ts";

type NoviceStats = AuthoritativeNoviceStats;

const MALE_FIRST_NAMES = [
  "Aldus", "Berik", "Cedric", "Eldrin", "Faelar", "Grom", "Jarek", "Kaelen",
  "Orin", "Pharis", "Ragnor", "Thorne", "Ulfgar", "Zephyr", "Aelion",
  "Cassian", "Dorian", "Garrick", "Ignis", "Kael", "Malakor", "Sylas",
  "Urien", "Wulfrith", "Zarek", "Alistair",
] as const;

const FEMALE_FIRST_NAMES = [
  "Dara", "Hulda", "Ithil", "Lyra", "Nyssa", "Quilla", "Sariel", "Vala",
  "Wren", "Ygritte", "Bronda", "Drusilla", "Elysia", "Fiona", "Hesper",
  "Lumina", "Nesta", "Rowan", "Talia", "Vesper", "Ysolde", "Beatrix",
  "Aurelia", "Geneviève", "Morgane", "Sybille",
] as const;

const ACTIVE_SKILLS = ["heavy_blow", "guard_stance"] as const;
const PASSIVE_SKILLS = ["survival_instinct", "small_profit"] as const;
const STAT_KEYS = ["str", "agi", "end", "int", "wiz", "dex", "luk"] as const;

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function createRng(seedKey: string) {
  let state = stableHash(seedKey) || 0x9e3779b9;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
  return {
    next,
    nextInt: (max: number) => Math.floor(next() * max),
  };
}

function generateNoviceStats(seedKey: string): { stats: NoviceStats; isElite: boolean } {
  const rng = createRng(`${seedKey}:stats`);
  const isElite = rng.next() < 0.005;
  const highStats = new Set<string>();
  if (isElite) {
    // Preserve the historical novice distribution exactly. Although this
    // random-sort shuffle is biased, changing it would alter gameplay odds.
    const shuffled = [...STAT_KEYS].sort(() => rng.next() - 0.5);
    highStats.add(shuffled[0]);
    highStats.add(shuffled[1]);
  }

  while (true) {
    const stats = {} as NoviceStats;
    for (const key of STAT_KEYS) {
      const min = isElite && highStats.has(key) ? 8 : 1;
      const max = isElite && highStats.has(key) ? 10 : 7;
      stats[key] = min + rng.nextInt(max - min + 1);
    }
    const total = STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
    if ((isElite && total >= 16 && total <= 38) || (!isElite && total >= 20 && total <= 33)) {
      return { stats, isElite };
    }
  }
}

export function generateAuthoritativeNovice(seedKey: string, id: string, race = "Humain"): Record<string, unknown> {
  const identityRng = createRng(`${seedKey}:identity`);
  const isMale = identityRng.nextInt(100) < 50;
  const names = isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const { stats, isElite } = generateNoviceStats(seedKey);
  const passiveSkill = PASSIVE_SKILLS[identityRng.nextInt(PASSIVE_SKILLS.length)];
  const equipment = generateAuthoritativeNoviceEquipment(seedKey);
  const calculatedStats = calculateAuthoritativeNoviceStats(stats, passiveSkill, equipment);

  return {
    id,
    name: names[identityRng.nextInt(names.length)],
    gender: isMale ? "Male" : "Female",
    race,
    classType: "Novice",
    level: 1,
    xp: 0,
    xpNeeded: 100,
    currentHp: calculatedStats.maxHp,
    currentMana: calculatedStats.maxMana,
    baseStats: stats,
    isElite,
    status: "idle",
    isActive: false,
    activeSkills: [ACTIVE_SKILLS[identityRng.nextInt(ACTIVE_SKILLS.length)]],
    passiveSkills: [passiveSkill],
    equipment,
    calculatedStats,
  };
}
