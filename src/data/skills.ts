import { SkillInfo } from "../types";

export const NOVICE_SKILLS: SkillInfo[] = [
  {
    id: "heavy_blow",
    name: "Frappe lourde",
    description: "Attaque physique puissante infligeant plus de dégâts qu’une attaque normale.",
    type: "active",
    target: "single_enemy",
    manaCost: 14,
    cooldownRounds: 3,
    effect: {
      type: "damage",
      damageType: "physical",
      scalingStat: "physicalDamage",
      power: 1.6,
      hitCount: 1
    }
  },
  {
    id: "guard_stance",
    name: "Posture défensive",
    description: "Augmente temporairement la défense physique du Novice.",
    type: "active",
    target: "self",
    manaCost: 18,
    cooldownRounds: 5,
    effect: {
      type: "buff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDefense",
          type: "percent",
          value: 25
        }
      ]
    }
  },
  {
    id: "survival_instinct",
    name: "Instinct de survie",
    description: "Augmente légèrement les PV maximum.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "maxHp",
          type: "percent",
          value: 3
        }
      ]
    }
  },
  {
    id: "small_profit",
    name: "Petit profit",
    description: "Augmente légèrement l’or gagné après un combat.",
    type: "passive",
    effect: {
      type: "loot_modifier",
      modifiers: [
        {
          stat: "goldGain",
          type: "percent",
          value: 3
        }
      ]
    }
  }
];

export const WARRIOR_SKILLS: SkillInfo[] = [
  {
    id: "cleaving_strike",
    name: "Frappe circulaire",
    description: "Attaque physique touchant tous les ennemis proches.",
    type: "active",
    target: "all_enemies",
    manaCost: 24,
    cooldownRounds: 3,
    effect: {
      type: "damage",
      damageType: "physical",
      scalingStat: "physicalDamage",
      power: 1.0,
      hitCount: 1
    }
  },
  {
    id: "weakening_shout",
    name: "Cri affaiblissant",
    description: "Réduit temporairement les dégâts physiques d’un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 16,
    cooldownRounds: 4,
    effect: {
      type: "debuff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: -20
        }
      ]
    }
  },
  {
    id: "provocation",
    name: "Provocation",
    description: "Les ennemis on plus des chance de vous attaquer.",
    type: "active",
    target: "single_enemy",
    manaCost: 20,
    cooldownRounds: 6,
    effect: {
      type: "buff",
      durationRounds: 4,
      modifiers: [
        {
          stat: "forcedTarget",
          type: "percent",
          value: 50
        }
      ]
    }
  },
  {
    id: "weapon_training",
    name: "Entraînement martial",
    description: "Augmente légèrement les dégâts physiques.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: 7
        }
      ]
    }
  },
  {
    id: "disciplined_soldier",
    name: "Soldat discipliné",
    description: "Augmente légèrement la défense.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "physicalDefense",
          type: "percent",
          value: 5
        },
        {
          stat: "magicDefense",
          type: "percent",
          value: 5
        }
      ]
    }
  }
];

export const ROGUE_SKILLS: SkillInfo[] = [
  {
    id: "quick_shiv",
    name: "Surin rapide",
    description: "Attaque physique rapide et peu coûteuse contre un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 16,
    cooldownRounds: 1,
    effect: {
      type: "damage",
      damageType: "physical",
      scalingStat: "physicalDamage",
      power: 1.25,
      hitCount: 1
    }
  },
  {
    id: "double_cut",
    name: "Double entaille",
    description: "Attaque deux fois le même ennemi avec des coups rapides.",
    type: "active",
    target: "single_enemy",
    manaCost: 32,
    cooldownRounds: 3,
    effect: {
      type: "damage",
      damageType: "physical",
      scalingStat: "physicalDamage",
      power: 0.95,
      hitCount: 2
    }
  },
  {
    id: "blinding_dust",
    name: "Poudre aveuglante",
    description: "Réduit temporairement la puissance offensive d’un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 28,
    cooldownRounds: 4,
    effect: {
      type: "debuff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: -20
        },
        {
          stat: "criticalChance",
          type: "percent",
          value: -15
        }
      ]
    }
  },
  {
    id: "agile_footwork",
    name: "Jeu de jambes",
    description: "Augmente l’esquive.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "dodgeChance",
          type: "percent",
          value: 7
        }
      ]
    }
  },
  {
    id: "killer_precision",
    name: "Précision meurtrière",
    description: "Augmente les chances de coup critique.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "criticalChance",
          type: "percent",
          value: 7
        }
      ]
    }
  }
];

export const ARCHER_SKILLS: SkillInfo[] = [
  {
    id: "precise_shot",
    name: "Tir précis",
    description: "Tir physique précis contre un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 18,
    cooldownRounds: 1,
    effect: {
      type: "damage",
      damageType: "physical",
      scalingStat: "physicalDamage",
      power: 1.3,
      hitCount: 1
    }
  },
  {
    id: "piercing_arrow",
    name: "Flèche perforante",
    description: "Tir puissant qui inflige de lourds dégâts physiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 34,
    cooldownRounds: 3,
    effect: {
      type: "damage",
      damageType: "physical",
      scalingStat: "physicalDamage",
      power: 1.9,
      hitCount: 1
    }
  },
  {
    id: "crippling_shot",
    name: "Tir handicapant",
    description: "Réduit temporairement la vitesse et l’esquive d’un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 26,
    cooldownRounds: 3,
    effect: {
      type: "debuff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "speed",
          type: "percent",
          value: -20
        },
        {
          stat: "dodgeChance",
          type: "percent",
          value: -15
        }
      ]
    }
  },
  {
    id: "eagle_eye",
    name: "Œil d’aigle",
    description: "Augmente les chances de coup critique.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "criticalChance",
          type: "percent",
          value: 7
        }
      ]
    }
  },
  {
    id: "steady_aim",
    name: "Visée stable",
    description: "Augmente légèrement les dégâts physiques.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: 7
        }
      ]
    }
  }
];

export const MAGE_SKILLS: SkillInfo[] = [
  {
    id: "fire_bolt",
    name: "Trait de feu",
    description: "Projectile de feu infligeant de lourds dégâts magiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 38,
    cooldownRounds: 2,
    effect: {
      type: "damage",
      damageType: "fire",
      scalingStat: "magicDamage",
      power: 2.0,
      hitCount: 1
    }
  },
  {
    id: "ice_shard",
    name: "Éclat de glace",
    description: "Fragment de glace infligeant des dégâts magiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 36,
    cooldownRounds: 2,
    effect: {
      type: "damage",
      damageType: "ice",
      scalingStat: "magicDamage",
      power: 1.9,
      hitCount: 1
    }
  },
  {
    id: "water_lance",
    name: "Lance d’eau",
    description: "Jet d’eau concentré infligeant des dégâts magiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 34,
    cooldownRounds: 2,
    effect: {
      type: "damage",
      damageType: "water",
      scalingStat: "magicDamage",
      power: 1.8,
      hitCount: 1
    }
  },
  {
    id: "stone_spike",
    name: "Pointe de pierre",
    description: "Pointe de pierre infligeant des dégâts magiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 36,
    cooldownRounds: 2,
    effect: {
      type: "damage",
      damageType: "earth",
      scalingStat: "magicDamage",
      power: 1.9,
      hitCount: 1
    }
  },
  {
    id: "wind_blade",
    name: "Lame de vent",
    description: "Lame d’air rapide infligeant des dégâts magiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 30,
    cooldownRounds: 1,
    effect: {
      type: "damage",
      damageType: "wind",
      scalingStat: "magicDamage",
      power: 1.45,
      hitCount: 1
    }
  },
  {
    id: "lightning_bolt",
    name: "Trait de foudre",
    description: "Projectile de foudre infligeant de lourds dégâts magiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 42,
    cooldownRounds: 3,
    effect: {
      type: "damage",
      damageType: "lightning",
      scalingStat: "magicDamage",
      power: 2.2,
      hitCount: 1
    }
  }
];

export const ACOLYTE_SKILLS: SkillInfo[] = [
  {
    id: "minor_heal",
    name: "Soin mineur",
    description: "Restaure une petite quantité de PV à un allié.",
    type: "active",
    target: "single_ally",
    manaCost: 24,
    cooldownRounds: 2,
    effect: {
      type: "heal",
      scalingStat: "magicDamage",
      power: 1.6
    }
  },
  {
    id: "holy_smite",
    name: "Châtiment sacré",
    description: "Attaque sacrée infligeant des dégâts magiques à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 28,
    cooldownRounds: 2,
    effect: {
      type: "damage",
      damageType: "holy",
      scalingStat: "magicDamage",
      power: 1.25,
      hitCount: 1
    }
  },
  {
    id: "sacred_barrier",
    name: "Barrière sacrée",
    description: "Augmente fortement les défenses d’un allié ou de soi-même.",
    type: "active",
    target: "single_ally",
    manaCost: 42,
    cooldownRounds: 4,
    effect: {
      type: "buff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDefense",
          type: "percent",
          value: 25
        },
        {
          stat: "magicDefense",
          type: "percent",
          value: 35
        }
      ]
    }
  },
  {
    id: "holy_mark",
    name: "Marque sacrée",
    description: "Réduit temporairement la défense magique d’un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 34,
    cooldownRounds: 3,
    effect: {
      type: "debuff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "magicDefense",
          type: "percent",
          value: -25
        }
      ]
    }
  },
  {
    id: "benediction",
    name: "Bénédiction",
    description: "Augmente temporairement les dégâts physiques et magiques d’un allié ou de soi-même.",
    type: "active",
    target: "single_ally",
    manaCost: 36,
    cooldownRounds: 4,
    effect: {
      type: "buff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: 20
        },
        {
          stat: "magicDamage",
          type: "percent",
          value: 20
        }
      ]
    }
  },
  {
    id: "spiritual_resilience",
    name: "Résilience spirituelle",
    description: "Augmente le mana maximum et la défense magique.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "maxMana",
          type: "percent",
          value: 5
        },
        {
          stat: "magicDefense",
          type: "percent",
          value: 5
        }
      ]
    }
  },
  {
    id: "healing_grace",
    name: "Grâce guérisseuse",
    description: "Augmente légèrement les soins prodigués.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "healingPower",
          type: "percent",
          value: 8
        }
      ]
    }
  }
];

export const AEDE_SKILLS: SkillInfo[] = [
  {
    id: "inspiring_song",
    name: "Chant inspirant",
    description: "Augmente fortement les dégâts physiques et magiques de tous les alliés.",
    type: "active",
    target: "all_allies",
    manaCost: 56,
    cooldownRounds: 4,
    effect: {
      type: "buff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: 25
        },
        {
          stat: "magicDamage",
          type: "percent",
          value: 25
        }
      ]
    }
  },
  {
    id: "discordant_chord",
    name: "Accord discordant",
    description: "Réduit fortement les dégâts physiques et magiques de tous les ennemis.",
    type: "active",
    target: "all_enemies",
    manaCost: 52,
    cooldownRounds: 4,
    effect: {
      type: "debuff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: -25
        },
        {
          stat: "magicDamage",
          type: "percent",
          value: -25
        }
      ]
    }
  },
  {
    id: "soothing_song",
    name: "Chant apaisant",
    description: "Restaure une petite quantité de PV à tous les alliés.",
    type: "active",
    target: "all_allies",
    manaCost: 46,
    cooldownRounds: 4,
    effect: {
      type: "heal",
      scalingStat: "magicDamage",
      power: 0.85
    }
  },
  {
    id: "harmonic_focus",
    name: "Harmonie intérieure",
    description: "Augmente légèrement le mana maximum.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "maxMana",
          type: "percent",
          value: 7
        }
      ]
    }
  },
  {
    id: "performer_instinct",
    name: "Instinct de scène",
    description: "Augmente légèrement la vitesse et l’esquive.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "speed",
          type: "percent",
          value: 5
        },
        {
          stat: "dodgeChance",
          type: "percent",
          value: 5
        }
      ]
    }
  }
];

export const DRUID_SKILLS: SkillInfo[] = [
  {
    id: "thorn_grasp",
    name: "Étreinte de ronces",
    description: "Entrave violemment un ennemi avec des ronces, réduisant presque totalement sa vitesse et son esquive pendant un court moment.",
    type: "active",
    target: "single_enemy",
    manaCost: 48,
    cooldownRounds: 6,
    effect: {
      type: "debuff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "speed",
          type: "percent",
          value: -95
        },
        {
          stat: "dodgeChance",
          type: "percent",
          value: -95
        }
      ]
    }
  },
  {
    id: "wild_regrowth",
    name: "Repousse sauvage",
    description: "Restaure les PV d’un allié ou de soi-même grâce à l’énergie naturelle.",
    type: "active",
    target: "single_ally",
    manaCost: 36,
    cooldownRounds: 3,
    effect: {
      type: "heal",
      scalingStat: "magicDamage",
      power: 1.6
    }
  },
  {
    id: "barkskin",
    name: "Peau d’écorce",
    description: "Augmente fortement les défenses d’un allié ou de soi-même.",
    type: "active",
    target: "single_ally",
    manaCost: 42,
    cooldownRounds: 4,
    effect: {
      type: "buff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDefense",
          type: "percent",
          value: 30
        },
        {
          stat: "magicDefense",
          type: "percent",
          value: 20
        }
      ]
    }
  },
  {
    id: "nature_attunement",
    name: "Harmonie naturelle",
    description: "Augmente légèrement les dégâts magiques et le mana maximum.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "magicDamage",
          type: "percent",
          value: 6
        },
        {
          stat: "maxMana",
          type: "percent",
          value: 6
        }
      ]
    }
  },
  {
    id: "verdant_healing",
    name: "Guérison verdoyante",
    description: "Augmente légèrement les soins prodigués.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "healingPower",
          type: "percent",
          value: 8
        }
      ]
    }
  }
];

export const ARTIFICER_SKILLS: SkillInfo[] = [
  {
    id: "flame_thrower",
    name: "Lance-flammes",
    description: "Projette un jet de flammes mécanique infligeant des dégâts physiques de feu à tous les ennemis.",
    type: "active",
    target: "all_enemies",
    manaCost: 40,
    cooldownRounds: 4,
    effect: {
      type: "damage",
      damageType: "fire",
      scalingStat: "physicalDamage",
      power: 0.95,
      hitCount: 1
    }
  },
  {
    id: "lightning_arc",
    name: "Arc électrique",
    description: "Libère un arc électrique instable infligeant des dégâts physiques de foudre à un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 34,
    cooldownRounds: 3,
    effect: {
      type: "damage",
      damageType: "lightning",
      scalingStat: "physicalDamage",
      power: 1.55,
      hitCount: 1
    }
  },
  {
    id: "overcharged_core",
    name: "Noyau surchargé",
    description: "Surcharge temporairement l’équipement d’un allié ou de soi-même, augmentant fortement les dégâts physiques et magiques.",
    type: "active",
    target: "single_ally",
    manaCost: 42,
    cooldownRounds: 4,
    effect: {
      type: "buff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "physicalDamage",
          type: "percent",
          value: 20
        },
        {
          stat: "magicDamage",
          type: "percent",
          value: 20
        }
      ]
    }
  },
  {
    id: "static_trap",
    name: "Piège statique",
    description: "Réduit temporairement la vitesse et la défense magique d’un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 38,
    cooldownRounds: 4,
    effect: {
      type: "debuff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "speed",
          type: "percent",
          value: -25
        },
        {
          stat: "magicDefense",
          type: "percent",
          value: -20
        }
      ]
    }
  },
  {
    id: "technical_precision",
    name: "Précision technique",
    description: "Augmente légèrement les chances de coup critique et les dégâts physiques.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "criticalChance",
          type: "percent",
          value: 6
        },
        {
          stat: "physicalDamage",
          type: "percent",
          value: 6
        }
      ]
    }
  },
  {
    id: "arcane_engineering",
    name: "Ingénierie arcanique",
    description: "Augmente légèrement le mana maximum.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "maxMana",
          type: "percent",
          value: 6
        }
      ]
    }
  }
];

export const PUGILIST_SKILLS: SkillInfo[] = [
  {
    id: "earthen_fist",
    name: "Poing tellurique",
    description: "Frappe un ennemi avec un poing renforcé par la pierre.",
    type: "active",
    target: "single_enemy",
    manaCost: 28,
    cooldownRounds: 2,
    effect: {
      type: "damage",
      damageType: "earth",
      scalingStat: "physicalDamage",
      power: 1.55,
      hitCount: 1
    }
  },
  {
    id: "zephyr_strike",
    name: "Frappe du zéphyr",
    description: "Frappe un ennemi avec un coup de pied léger et rapide porté par le vent.",
    type: "active",
    target: "single_enemy",
    manaCost: 30,
    cooldownRounds: 3,
    effect: {
      type: "damage",
      damageType: "wind",
      scalingStat: "physicalDamage",
      power: 1.75,
      hitCount: 1
    }
  },
  {
    id: "rapid_combo",
    name: "Combo rapide",
    description: "Enchaîne plusieurs frappes physiques contre un ennemi.",
    type: "active",
    target: "single_enemy",
    manaCost: 36,
    cooldownRounds: 4,
    effect: {
      type: "damage",
      damageType: "physical",
      scalingStat: "physicalDamage",
      power: 0.55,
      hitCount: 5
    }
  },
  {
    id: "battle_focus",
    name: "Concentration martiale",
    description: "Augmente temporairement la vitesse et les dégâts physiques.",
    type: "active",
    target: "self",
    manaCost: 34,
    cooldownRounds: 4,
    effect: {
      type: "buff",
      durationRounds: 2,
      modifiers: [
        {
          stat: "speed",
          type: "percent",
          value: 25
        },
        {
          stat: "physicalDamage",
          type: "percent",
          value: 20
        }
      ]
    }
  },
  {
    id: "conditioned_body",
    name: "Corps endurci",
    description: "Augmente légèrement les PV maximum et la défense physique.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "maxHp",
          type: "percent",
          value: 6
        },
        {
          stat: "physicalDefense",
          type: "percent",
          value: 6
        }
      ]
    }
  },
  {
    id: "combat_reflexes",
    name: "Réflexes de combat",
    description: "Augmente légèrement la vitesse et l’esquive.",
    type: "passive",
    effect: {
      type: "stat_modifier",
      modifiers: [
        {
          stat: "speed",
          type: "percent",
          value: 6
        },
        {
          stat: "dodgeChance",
          type: "percent",
          value: 6
        }
      ]
    }
  }
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
