import {
  UNARMED_WEAPON_CONTEXT,
  calculateEstimatedDps,
  calculateWeaponBasePower,
  selectWeaponAttackPower,
  type WeaponOffensiveContext,
} from "./weapon-combat.ts";

export type CanonicalHeroBaseStats = {
  str: number;
  agi: number;
  end: number;
  int: number;
  wiz: number;
  dex: number;
  luk: number;
};

export type CanonicalStatModifier = {
  stat: string;
  type: "flat" | "percent";
  value: number;
};

export const CANONICAL_RESISTANCE_FIELDS = [
  "arcane", "fire", "ice", "water", "earth", "wind", "lightning", "holy",
  "dark", "nature", "sound", "poison", "blood", "radiant",
] as const;

export const CANONICAL_ITEM_MODIFIER_FIELDS = [
  "maxHp", "maxMana", "physicalDamage", "magicDamage", "criticalChance",
  "dodgeChance", "speed", "physicalDefense", "magicDefense",
  ...CANONICAL_RESISTANCE_FIELDS.map((field) => `${field}Resistance`),
] as const;

const CANONICAL_ITEM_MODIFIER_FIELD_SET = new Set<string>(CANONICAL_ITEM_MODIFIER_FIELDS);

export function isCanonicalItemModifierField(stat: string): boolean {
  return CANONICAL_ITEM_MODIFIER_FIELD_SET.has(stat);
}

/**
 * Canonical pure core behind the historical global getHeroStats function.
 * Both the client adapter and server authorities must use this implementation.
 */
export function calculateHeroDerivedStats(
  stats: CanonicalHeroBaseStats,
  modifiers: CanonicalStatModifier[],
  weaponContext: WeaponOffensiveContext = UNARMED_WEAPON_CONTEXT,
) {
  const { str, agi, end, int, wiz, dex, luk } = stats;
  const apply = (baseValue: number, statName: string): number => {
    let finalValue = baseValue;
    for (const modifier of modifiers) {
      if (modifier.stat !== statName) continue;
      finalValue += modifier.type === "flat"
        ? modifier.value
        : baseValue * (modifier.value / 100);
    }
    return finalValue;
  };

  const baseHp = Math.max(1, 50 + end * 8 + str);
  const baseMana = Math.max(1, Math.floor(20 + int * 7 + wiz * 4));
  const physicalScaling = weaponContext.scaling.category === "magic"
    ? UNARMED_WEAPON_CONTEXT.scaling
    : weaponContext.scaling;
  const basePhysicalDamage = calculateWeaponBasePower(stats, physicalScaling);
  const baseMagicDamage = weaponContext.scaling.category === "magic"
    ? calculateWeaponBasePower(stats, weaponContext.scaling)
    : Math.max(1, Math.floor(2 + int * 1.3 + wiz * 0.4));
  const baseCriticalChance = Math.max(1, Math.min(100, 3 + dex * 0.1 + luk * 0.2));
  const baseDodgeChance = Math.max(3, Math.min(90, 1 + agi * 0.1 + luk * 0.2));
  const baseSpeed = Math.max(1, Math.floor(10 + agi * 1.2 + dex * 0.3));
  const basePhysicalDefense = Math.max(0, Math.floor(end * 0.4 + str * 0.15));
  const baseMagicDefense = Math.max(0, Math.floor(wiz * 0.4 + int * 0.15));
  const maxHp = Math.max(1, Math.round(apply(baseHp, "maxHp")));
  const maxMana = Math.max(1, Math.round(apply(baseMana, "maxMana")));
  const physicalDefense = Math.max(0, Math.round(apply(basePhysicalDefense, "physicalDefense")));
  const magicDefense = Math.max(0, Math.round(apply(baseMagicDefense, "magicDefense")));
  const criticalChance = Number(Math.max(1, Math.min(100, apply(baseCriticalChance, "criticalChance"))).toFixed(1));
  const physicalDamage = Math.max(1, Math.round(apply(basePhysicalDamage, "physicalDamage")));
  const magicDamage = Math.max(1, Math.round(apply(baseMagicDamage, "magicDamage")));
  const speed = Math.max(1, Math.round(apply(baseSpeed, "speed")));
  const estimatedDps = calculateEstimatedDps({
    attackPower: selectWeaponAttackPower({ physicalDamage, magicDamage }, weaponContext.scaling),
    attackProfile: weaponContext.attackProfile,
    damageRange: weaponContext.damageRange,
    attackSpeed: weaponContext.attackSpeed,
    heroSpeed: speed,
    criticalChance,
  });

  return {
    maxHp,
    hp: maxHp,
    maxMana,
    mana: maxMana,
    criticalChance,
    dodgeChance: Number(Math.max(1, Math.min(90, apply(baseDodgeChance, "dodgeChance"))).toFixed(1)),
    physicalDamage,
    magicDamage,
    speed,
    estimatedDps,
    physicalDefense,
    magicDefense,
    resistances: Object.fromEntries(
      CANONICAL_RESISTANCE_FIELDS.map((element) => {
        const resistanceStat = `${element}Resistance`;
        return [element, Math.round(apply(magicDefense, resistanceStat))];
      }),
    ),
  };
}
