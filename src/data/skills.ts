import { SkillInfo } from "../types";
import {
  createActiveSkill,
  createPassiveSkill,
  damageEffect,
  buffEffect,
  debuffEffect,
  healEffect,
  statModifierEffect,
  lootModifierEffect
} from "./skillBuilders";

export const NOVICE_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "heavy_blow",
    "Frappe lourde",
    "Attaque physique puissante infligeant plus de dégâts qu’une attaque normale.",
    "single_enemy",
    14,
    3,
    damageEffect("physical", "physicalDamage", 1.6, 1)
  ),
  createActiveSkill(
    "guard_stance",
    "Posture défensive",
    "Augmente temporairement la défense physique du Novice.",
    "self",
    18,
    5,
    buffEffect(2, [{ stat: "physicalDefense", type: "percent", value: 25 }])
  ),
  createPassiveSkill(
    "survival_instinct",
    "Instinct de survie",
    "Augmente légèrement les PV maximum.",
    statModifierEffect([{ stat: "maxHp", type: "percent", value: 3 }])
  ),
  createPassiveSkill(
    "small_profit",
    "Petit profit",
    "Augmente légèrement l’or gagné après un combat.",
    lootModifierEffect([{ stat: "goldGain", type: "percent", value: 3 }])
  )
];

export const WARRIOR_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "cleaving_strike",
    "Frappe circulaire",
    "Attaque physique touchant tous les ennemis proches.",
    "all_enemies",
    24,
    3,
    damageEffect("physical", "physicalDamage", 1.0, 1)
  ),
  createActiveSkill(
    "weakening_shout",
    "Cri affaiblissant",
    "Réduit temporairement les dégâts physiques d’un ennemi.",
    "single_enemy",
    16,
    4,
    debuffEffect(2, [{ stat: "physicalDamage", type: "percent", value: -20 }])
  ),
  createActiveSkill(
    "provocation",
    "Provocation",
    "Les ennemis on plus des chance de vous attaquer.",
    "single_enemy",
    20,
    6,
    buffEffect(4, [{ stat: "forcedTarget", type: "percent", value: 50 }])
  ),
  createPassiveSkill(
    "weapon_training",
    "Entraînement martial",
    "Augmente légèrement les dégâts physiques.",
    statModifierEffect([{ stat: "physicalDamage", type: "percent", value: 7 }])
  ),
  createPassiveSkill(
    "disciplined_soldier",
    "Soldat discipliné",
    "Augmente légèrement la défense.",
    statModifierEffect([
      { stat: "physicalDefense", type: "percent", value: 5 },
      { stat: "magicDefense", type: "percent", value: 5 }
    ])
  )
];

export const ROGUE_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "quick_shiv",
    "Surin rapide",
    "Attaque physique rapide et peu coûteuse contre un ennemi.",
    "single_enemy",
    16,
    1,
    damageEffect("physical", "physicalDamage", 1.25, 1)
  ),
  createActiveSkill(
    "double_cut",
    "Double entaille",
    "Attaque deux fois le même ennemi avec des coups rapides.",
    "single_enemy",
    32,
    3,
    damageEffect("physical", "physicalDamage", 0.95, 2)
  ),
  createActiveSkill(
    "blinding_dust",
    "Poudre aveuglante",
    "Réduit temporairement la puissance offensive d’un ennemi.",
    "single_enemy",
    28,
    4,
    debuffEffect(2, [
      { stat: "physicalDamage", type: "percent", value: -20 },
      { stat: "criticalChance", type: "percent", value: -15 }
    ])
  ),
  createPassiveSkill(
    "agile_footwork",
    "Jeu de jambes",
    "Augmente l’esquive.",
    statModifierEffect([{ stat: "dodgeChance", type: "percent", value: 7 }])
  ),
  createPassiveSkill(
    "killer_precision",
    "Précision meurtrière",
    "Augmente les chances de coup critique.",
    statModifierEffect([{ stat: "criticalChance", type: "percent", value: 7 }])
  )
];

export const ARCHER_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "precise_shot",
    "Tir précis",
    "Tir physique précis contre un ennemi.",
    "single_enemy",
    18,
    1,
    damageEffect("physical", "physicalDamage", 1.3, 1)
  ),
  createActiveSkill(
    "piercing_arrow",
    "Flèche perforante",
    "Tir puissant qui inflige de lourds dégâts physiques à un ennemi.",
    "single_enemy",
    34,
    3,
    damageEffect("physical", "physicalDamage", 1.9, 1)
  ),
  createActiveSkill(
    "crippling_shot",
    "Tir handicapant",
    "Réduit temporairement la vitesse et l’esquive d’un ennemi.",
    "single_enemy",
    26,
    3,
    debuffEffect(2, [
      { stat: "speed", type: "percent", value: -20 },
      { stat: "dodgeChance", type: "percent", value: -15 }
    ])
  ),
  createPassiveSkill(
    "eagle_eye",
    "Œil d’aigle",
    "Augmente les chances de coup critique.",
    statModifierEffect([{ stat: "criticalChance", type: "percent", value: 7 }])
  ),
  createPassiveSkill(
    "steady_aim",
    "Visée stable",
    "Augmente légèrement les dégâts physiques.",
    statModifierEffect([{ stat: "physicalDamage", type: "percent", value: 7 }])
  )
];

export const MAGE_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "fire_bolt",
    "Trait de feu",
    "Projectile de feu infligeant de lourds dégâts magiques à un ennemi.",
    "single_enemy",
    38,
    2,
    damageEffect("fire", "magicDamage", 2.0, 1)
  ),
  createActiveSkill(
    "ice_shard",
    "Éclat de glace",
    "Fragment de glace infligeant des dégâts magiques à un ennemi.",
    "single_enemy",
    36,
    2,
    damageEffect("ice", "magicDamage", 1.9, 1)
  ),
  createActiveSkill(
    "water_lance",
    "Lance d’eau",
    "Jet d’eau concentré infligeant des dégâts magiques à un ennemi.",
    "single_enemy",
    34,
    2,
    damageEffect("water", "magicDamage", 1.8, 1)
  ),
  createActiveSkill(
    "stone_spike",
    "Pointe de pierre",
    "Pointe de pierre infligeant des dégâts magiques à un ennemi.",
    "single_enemy",
    36,
    2,
    damageEffect("earth", "magicDamage", 1.9, 1)
  ),
  createActiveSkill(
    "wind_blade",
    "Lame de vent",
    "Lame d’air rapide infligeant des dégâts magiques à un ennemi.",
    "single_enemy",
    30,
    1,
    damageEffect("wind", "magicDamage", 1.45, 1)
  ),
  createActiveSkill(
    "lightning_bolt",
    "Trait de foudre",
    "Projectile de foudre infligeant de lourds dégâts magiques à un ennemi.",
    "single_enemy",
    42,
    3,
    damageEffect("lightning", "magicDamage", 2.2, 1)
  ),
  createPassiveSkill(
    "arcane_training",
    "Entraînement arcanique",
    "Augmente les dégâts magiques.",
    statModifierEffect([{ stat: "magicDamage", type: "percent", value: 7 }])
  ),
  createPassiveSkill(
    "mana_control",
    "Contrôle du mana",
    "Augmente le mana maximum.",
    statModifierEffect([{ stat: "maxMana", type: "percent", value: 7 }])
  )
];

export const ACOLYTE_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "minor_heal",
    "Soin mineur",
    "Restaure une petite quantité de PV à un allié.",
    "single_ally",
    24,
    2,
    healEffect("magicDamage", 1.6)
  ),
  createActiveSkill(
    "holy_smite",
    "Châtiment sacré",
    "Attaque sacrée infligeant des dégâts magiques à un ennemi.",
    "single_enemy",
    28,
    2,
    damageEffect("holy", "magicDamage", 1.25, 1)
  ),
  createActiveSkill(
    "sacred_barrier",
    "Barrière sacrée",
    "Augmente fortement les défenses d’un allié ou de soi-même.",
    "single_ally",
    42,
    4,
    buffEffect(2, [
      { stat: "physicalDefense", type: "percent", value: 25 },
      { stat: "magicDefense", type: "percent", value: 35 }
    ])
  ),
  createActiveSkill(
    "holy_mark",
    "Marque sacrée",
    "Réduit temporairement la défense magique d’un ennemi.",
    "single_enemy",
    34,
    3,
    debuffEffect(2, [{ stat: "magicDefense", type: "percent", value: -25 }])
  ),
  createActiveSkill(
    "benediction",
    "Bénédiction",
    "Augmente temporairement les dégâts physiques et magiques d’un allié ou de soi-même.",
    "single_ally",
    36,
    4,
    buffEffect(2, [
      { stat: "physicalDamage", type: "percent", value: 20 },
      { stat: "magicDamage", type: "percent", value: 20 }
    ])
  ),
  createPassiveSkill(
    "spiritual_resilience",
    "Résilience spirituelle",
    "Augmente le mana maximum et la défense magique.",
    statModifierEffect([
      { stat: "maxMana", type: "percent", value: 5 },
      { stat: "magicDefense", type: "percent", value: 5 }
    ])
  ),
  createPassiveSkill(
    "healing_grace",
    "Grâce guérisseuse",
    "Augmente légèrement les soins prodigués.",
    statModifierEffect([{ stat: "healingPower", type: "percent", value: 8 }])
  )
];

export const AEDE_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "inspiring_song",
    "Chant inspirant",
    "Augmente fortement les dégâts physiques et magiques de tous les alliés.",
    "all_allies",
    56,
    4,
    buffEffect(2, [
      { stat: "physicalDamage", type: "percent", value: 25 },
      { stat: "magicDamage", type: "percent", value: 25 }
    ])
  ),
  createActiveSkill(
    "discordant_chord",
    "Accord discordant",
    "Réduit fortement les dégâts physiques et magiques de tous les ennemis.",
    "all_enemies",
    52,
    4,
    debuffEffect(2, [
      { stat: "physicalDamage", type: "percent", value: -25 },
      { stat: "magicDamage", type: "percent", value: -25 }
    ])
  ),
  createActiveSkill(
    "soothing_song",
    "Chant apaisant",
    "Restaure une petite quantité de PV à tous les alliés.",
    "all_allies",
    46,
    4,
    healEffect("magicDamage", 0.85)
  ),
  createPassiveSkill(
    "harmonic_focus",
    "Harmonie intérieure",
    "Augmente légèrement le mana maximum.",
    statModifierEffect([{ stat: "maxMana", type: "percent", value: 7 }])
  ),
  createPassiveSkill(
    "performer_instinct",
    "Instinct de scène",
    "Augmente légèrement la vitesse et l’esquive.",
    statModifierEffect([
      { stat: "speed", type: "percent", value: 5 },
      { stat: "dodgeChance", type: "percent", value: 5 }
    ])
  )
];

export const DRUID_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "thorn_grasp",
    "Étreinte de ronces",
    "Entrave violemment un ennemi avec des ronces, réduisant presque totalement sa vitesse et son esquive pendant un court moment.",
    "single_enemy",
    48,
    6,
    debuffEffect(2, [
      { stat: "speed", type: "percent", value: -95 },
      { stat: "dodgeChance", type: "percent", value: -95 }
    ])
  ),
  createActiveSkill(
    "wild_regrowth",
    "Repousse sauvage",
    "Restaure les PV d’un allié ou de soi-même grâce à l’énergie naturelle.",
    "single_ally",
    36,
    3,
    healEffect("magicDamage", 1.6)
  ),
  createActiveSkill(
    "barkskin",
    "Peau d’écorce",
    "Augmente fortement les défenses d’un allié ou de soi-même.",
    "single_ally",
    42,
    4,
    buffEffect(2, [
      { stat: "physicalDefense", type: "percent", value: 30 },
      { stat: "magicDefense", type: "percent", value: 20 }
    ])
  ),
  createPassiveSkill(
    "nature_attunement",
    "Harmonie naturelle",
    "Augmente légèrement les dégâts magiques et le mana maximum.",
    statModifierEffect([
      { stat: "magicDamage", type: "percent", value: 6 },
      { stat: "maxMana", type: "percent", value: 6 }
    ])
  ),
  createPassiveSkill(
    "verdant_healing",
    "Guérison verdoyante",
    "Augmente légèrement les soins prodigués.",
    statModifierEffect([{ stat: "healingPower", type: "percent", value: 8 }])
  )
];

export const ARTIFICER_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "flame_thrower",
    "Lance-flammes",
    "Projette un jet de flammes mécanique infligeant des dégâts physiques de feu à tous les ennemis.",
    "all_enemies",
    40,
    4,
    damageEffect("fire", "physicalDamage", 0.95, 1)
  ),
  createActiveSkill(
    "lightning_arc",
    "Arc électrique",
    "Libère un arc électrique instable infligeant des dégâts physiques de foudre à un ennemi.",
    "single_enemy",
    34,
    3,
    damageEffect("lightning", "physicalDamage", 1.55, 1)
  ),
  createActiveSkill(
    "overcharged_core",
    "Noyau surchargé",
    "Surcharge temporairement l’équipement d’un allié ou de soi-même, augmentant fortement les dégâts physiques et magiques.",
    "single_ally",
    42,
    4,
    buffEffect(2, [
      { stat: "physicalDamage", type: "percent", value: 20 },
      { stat: "magicDamage", type: "percent", value: 20 }
    ])
  ),
  createActiveSkill(
    "static_trap",
    "Piège statique",
    "Réduit temporairement la vitesse et la défense magique d’un ennemi.",
    "single_enemy",
    38,
    4,
    debuffEffect(2, [
      { stat: "speed", type: "percent", value: -25 },
      { stat: "magicDefense", type: "percent", value: -20 }
    ])
  ),
  createPassiveSkill(
    "technical_precision",
    "Précision technique",
    "Augmente légèrement les chances de coup critique et les dégâts physiques.",
    statModifierEffect([
      { stat: "criticalChance", type: "percent", value: 6 },
      { stat: "physicalDamage", type: "percent", value: 6 }
    ])
  ),
  createPassiveSkill(
    "arcane_engineering",
    "Ingénierie arcanique",
    "Augmente légèrement le mana maximum.",
    statModifierEffect([{ stat: "maxMana", type: "percent", value: 6 }])
  )
];

export const PUGILIST_SKILLS: SkillInfo[] = [
  createActiveSkill(
    "earthen_fist",
    "Poing tellurique",
    "Frappe un ennemi avec un poing renforcé par la pierre.",
    "single_enemy",
    28,
    2,
    damageEffect("earth", "physicalDamage", 1.55, 1)
  ),
  createActiveSkill(
    "zephyr_strike",
    "Frappe du zéphyr",
    "Frappe un ennemi avec un coup de pied léger et rapide porté par le vent.",
    "single_enemy",
    30,
    3,
    damageEffect("wind", "physicalDamage", 1.75, 1)
  ),
  createActiveSkill(
    "rapid_combo",
    "Combo rapide",
    "Enchaîne several frappes physiques contre un ennemi.",
    "single_enemy",
    36,
    4,
    damageEffect("physical", "physicalDamage", 0.55, 5)
  ),
  createActiveSkill(
    "battle_focus",
    "Concentration martiale",
    "Augmente temporairement la vitesse et les dégâts physiques.",
    "self",
    34,
    4,
    buffEffect(2, [
      { stat: "speed", type: "percent", value: 25 },
      { stat: "physicalDamage", type: "percent", value: 20 }
    ])
  ),
  createPassiveSkill(
    "conditioned_body",
    "Corps endurci",
    "Augmente légèrement les PV maximum et la défense physique.",
    statModifierEffect([
      { stat: "maxHp", type: "percent", value: 6 },
      { stat: "physicalDefense", type: "percent", value: 6 }
    ])
  ),
  createPassiveSkill(
    "combat_reflexes",
    "Réflexes de combat",
    "Augmente légèrement la vitesse et l’esquive.",
    statModifierEffect([
      { stat: "speed", type: "percent", value: 6 },
      { stat: "dodgeChance", type: "percent", value: 6 }
    ])
  )
];

export const SKILLS_LIBRARY: SkillInfo[] = [
  ...NOVICE_SKILLS,
  ...WARRIOR_SKILLS,
  ...ROGUE_SKILLS,
  ...ARCHER_SKILLS,
  ...MAGE_SKILLS,
  ...ACOLYTE_SKILLS,
  ...AEDE_SKILLS,
  ...DRUID_SKILLS,
  ...ARTIFICER_SKILLS,
  ...PUGILIST_SKILLS
];

export const SKILLS_BY_ID: Record<string, SkillInfo> = Object.fromEntries(
  SKILLS_LIBRARY.map((skill) => [skill.id, skill])
);

export const SKILLS_BY_CLASS = {
  Novice: NOVICE_SKILLS,
  Warrior: WARRIOR_SKILLS,
  Rogue: ROGUE_SKILLS,
  Archer: ARCHER_SKILLS,
  Mage: MAGE_SKILLS,
  Acolyte: ACOLYTE_SKILLS,
  Aede: AEDE_SKILLS,
  Druid: DRUID_SKILLS,
  Artificer: ARTIFICER_SKILLS,
  Pugilist: PUGILIST_SKILLS
};

export function getSkillById(skillId: string): SkillInfo | undefined {
  return SKILLS_BY_ID[skillId];
}

export function getSkillsByIds(skillIds: string[]): SkillInfo[] {
  return skillIds
    .map((skillId) => SKILLS_BY_ID[skillId])
    .filter((skill): skill is SkillInfo => Boolean(skill));
}
