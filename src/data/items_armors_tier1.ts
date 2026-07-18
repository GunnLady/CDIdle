import { ItemInfo } from "../types";
import { createArmor } from "./itemBuilders";

export const TIER1_ITEM_ARMOR_LIST: ItemInfo[] = [
  // GUERRIER / SHIELD
  createArmor(
    "ironbound_hauberk",
    "Haubert cerclé de fer",
    "medium_armor",
    "common",
    10,
    "Un haubert robuste aux anneaux épais, conçu pour encaisser les coups sans devenir aussi encombrant qu’une armure lourde.",
    [{ stat: "physicalResistance", type: "percent", value: 5 }]
  ),
  createArmor(
    "bulwark_plate",
    "Armure du rempart",
    "heavy_armor",
    "uncommon",
    22,
    "Une armure de plates massive, pensée pour tenir la ligne face aux assauts les plus violents.",
    [
      { stat: "physicalDefense", type: "percent", value: 24 },
      { stat: "physicalResistance", type: "percent", value: 8 }
    ]
  ),

  // VOLEUR / ASSASSIN
  createArmor(
    "supple_shadow_vest",
    "Veste d’ombre souple",
    "light_armor",
    "common",
    10,
    "Une veste de cuir sombre et légère, taillée pour suivre les mouvements rapides sans bruit.",
    [{ stat: "dodgeChance", type: "percent", value: 4 }]
  ),
  createArmor(
    "nightstep_leather",
    "Cuir des pas nocturnes",
    "light_armor",
    "uncommon",
    20,
    "Une armure discrète et ajustée, favorisant les déplacements furtifs et les attaques opportunistes.",
    [
      { stat: "dodgeChance", type: "percent", value: 6 },
      { stat: "darkResistance", type: "percent", value: 7 }
    ]
  ),

  // ARCHER / RANGER
  createArmor(
    "trailrunner_garb",
    "Tenue de piste",
    "light_armor",
    "common",
    10,
    "Une tenue légère de voyage, pratique pour garder sa mobilité sur les terrains difficiles.",
    [{ stat: "speed", type: "percent", value: 4 }]
  ),
  createArmor(
    "keeneye_mail",
    "Maille de l’œil sûr",
    "medium_armor",
    "uncommon",
    21,
    "Une armure intermédiaire renforcée aux points vitaux, laissant assez de liberté pour viser avec précision.",
    [
      { stat: "criticalChance", type: "percent", value: 4 },
      { stat: "windResistance", type: "percent", value: 6 }
    ]
  ),

  // MAGE / WIZARD
  createArmor(
    "faded_rune_robe",
    "Robe aux runes ternies",
    "magic_armor",
    "common",
    10,
    "Une robe ancienne parcourue de runes affaiblies, encore capable d’amplifier légèrement les sorts.",
    [{ stat: "arcaneResistance", type: "percent", value: 6 }]
  ),
  createArmor(
    "astral_thread_robe",
    "Robe aux fils astraux",
    "magic_armor",
    "uncommon",
    20,
    "Une robe tissée de fils imprégnés d’énergie arcanique, renforçant la puissance magique tout en protégeant contre les flux instables.",
    [
      { stat: "magicDamage", type: "percent", value: 7 },
      { stat: "arcaneResistance", type: "percent", value: 8 }
    ]
  ),

  // ACOLYTE / CLERIC
  createArmor(
    "quiet_prayer_vestment",
    "Aube de prière silencieuse",
    "cloth_armor",
    "common",
    10,
    "Une tenue rituelle sobre, favorisant la concentration et protégeant légèrement des énergies impures.",
    [{ stat: "darkResistance", type: "percent", value: 6 }]
  ),
  createArmor(
    "blessed_battle_vestment",
    "Habit de bataille béni",
    "medium_armor",
    "uncommon",
    21,
    "Un habit renforcé par des prières protectrices, mêlant endurance spirituelle et protection contre les forces obscures.",
    [
      { stat: "maxMana", type: "percent", value: 7 },
      { stat: "darkResistance", type: "percent", value: 9 }
    ]
  ),

  // AÈDE / BARD
  createArmor(
    "echoing_stage_garb",
    "Tenue aux échos légers",
    "cloth_armor",
    "common",
    10,
    "Une tenue fluide et expressive, idéale pour bouger librement tout en canalisant des vibrations sonores.",
    [{ stat: "soundResistance", type: "percent", value: 6 }]
  ),
  createArmor(
    "resonant_performer_coat",
    "Manteau de résonance",
    "magic_armor",
    "uncommon",
    20,
    "Un manteau enchanté qui amplifie les vibrations magiques et stabilise les ondes sonores autour du porteur.",
    [
      { stat: "magicDamage", type: "percent", value: 6 },
      { stat: "soundResistance", type: "percent", value: 8 }
    ]
  ),

  // DRUIDE / SHAMAN
  createArmor(
    "mosswoven_cloak",
    "Cape tissée de mousse",
    "cloth_armor",
    "common",
    10,
    "Une cape faite de fibres naturelles, douce au toucher et imprégnée d’une faible énergie vitale.",
    [{ stat: "natureResistance", type: "percent", value: 6 }]
  ),
  createArmor(
    "verdant_hide_armor",
    "Cuir verdoyant",
    "light_armor",
    "uncommon",
    20,
    "Une armure de cuir parcourue de nervures végétales, protégeant le porteur tout en renforçant son affinité naturelle.",
    [
      { stat: "maxMana", type: "percent", value: 7 },
      { stat: "natureResistance", type: "percent", value: 9 }
    ]
  ),

  // ARTIFICIER / ALCHEMIST
  createArmor(
    "riveted_work_apron",
    "Tablier à rivets",
    "light_armor",
    "common",
    10,
    "Un tablier renforcé de petites plaques métalliques, pratique pour manipuler outils, mécanismes et composants instables.",
    [{ stat: "fireResistance", type: "percent", value: 6 }]
  ),
  createArmor(
    "fine_plate_coat",
    "Manteau à plaques fines",
    "medium_armor",
    "uncommon",
    21,
    "Un manteau technique doublé de plaques légères, offrant une bonne protection contre les chocs et les projections brûlantes.",
    [
      { stat: "physicalDefense", type: "percent", value: 12 },
      { stat: "fireResistance", type: "percent", value: 8 }
    ]
  ),

  // PUGILISTE / MONK
  createArmor(
    "loose_fighting_garb",
    "Tenue de combat ample",
    "cloth_armor",
    "common",
    10,
    "Une tenue souple laissant une liberté totale aux mouvements rapides et aux enchaînements au corps à corps.",
    [{ stat: "speed", type: "percent", value: 4 }]
  ),
  createArmor(
    "iron_thread_gi",
    "Gi aux fibres de fer",
    "light_armor",
    "uncommon",
    20,
    "Un vêtement de combat renforcé by des fibres résistantes, conçu pour encaisser les coups sans ralentir les mouvements.",
    [
      { stat: "dodgeChance", type: "percent", value: 5 },
      { stat: "physicalResistance", type: "percent", value: 6 }
    ]
  )
];
