import { ItemInfo } from "../types";
import { createWeapon, createArmor, createOffhand, createAccessory } from "./itemBuilders";

export const HIGH_TIER_ITEM_LIST: ItemInfo[] = [
  // =========================
  // EPIC ITEMS
  // =========================

  createWeapon(
    "embercleaver_greataxe",
    "Grande hache fend-braise",
    "greataxe",
    "epic",
    25,
    "Une grande hache noircie par la forge, dont le tranchant rougeoie encore après chaque impact.",
    34, 58,
    0.65,
    [
      { stat: "physicalDamage", type: "percent", value: 14 },
      { stat: "criticalChance", type: "percent", value: 7 },
      { stat: "fireResistance", type: "percent", value: 10 },
      { stat: "maxHp", type: "percent", value: 8 }
    ],
    ["physical", "fire"]
  ),

  createWeapon(
    "moonneedle_dagger",
    "Dague aiguille-lune",
    "dagger",
    "epic",
    24,
    "Une dague fine comme un rayon de lune, presque silencieuse lorsqu’elle fend l’air.",
    18, 31,
    1.55,
    [
      { stat: "criticalChance", type: "percent", value: 9 },
      { stat: "physicalDamage", type: "percent", value: 9 },
      { stat: "speed", type: "percent", value: 7 },
      { stat: "dodgeChance", type: "percent", value: 5 }
    ],
    ["physical", "radiant"]
  ),

  createWeapon(
    "stormglass_longbow",
    "Arc long de verre-orage",
    "longbow",
    "epic",
    25,
    "Un arc long aux branches translucides, vibrant comme une corde tendue sous un ciel d’orage.",
    29, 49,
    0.85,
    [
      { stat: "physicalDamage", type: "percent", value: 12 },
      { stat: "criticalChance", type: "percent", value: 8 },
      { stat: "speed", type: "percent", value: 5 },
      { stat: "lightningResistance", type: "percent", value: 10 }
    ],
    ["physical", "lightning"]
  ),

  createWeapon(
    "astral_choir_staff",
    "Bâton du chœur astral",
    "staff",
    "epic",
    26,
    "Un bâton gravé de constellations mouvantes, résonnant faiblement lorsqu’un sort est préparé.",
    27, 46,
    0.8,
    [
      { stat: "magicDamage", type: "percent", value: 14 },
      { stat: "maxMana", type: "percent", value: 12 },
      { stat: "arcaneResistance", type: "percent", value: 10 },
      { stat: "soundResistance", type: "percent", value: 8 }
    ],
    ["arcane", "sound"]
  ),

  createArmor(
    "starwoven_mantle",
    "Manteau tissé d’étoiles",
    "magic_armor",
    "epic",
    24,
    "Un manteau sombre parcouru de fils lumineux, comme si un ciel nocturne avait été cousu dans l’étoffe.",
    [
      { stat: "magicDamage", type: "percent", value: 10 },
      { stat: "maxMana", type: "percent", value: 12 },
      { stat: "arcaneResistance", type: "percent", value: 10 },
      { stat: "radiantResistance", type: "percent", value: 8 }
    ]
  ),

  createArmor(
    "graveiron_plate",
    "Armure de fer sépulcral",
    "heavy_armor",
    "epic",
    27,
    "Une armure lourde au métal froid, gravée de sceaux protecteurs contre les forces impures.",
    [
      { stat: "physicalDefense", type: "percent", value: 32 },
      { stat: "maxHp", type: "percent", value: 10 },
      { stat: "darkResistance", type: "percent", value: 12 },
      { stat: "poisonResistance", type: "percent", value: 10 }
    ]
  ),

  createOffhand(
    "sunward_censer",
    "Encensoir tourné-soleil",
    "sanctified_censer",
    "epic",
    26,
    "Un encensoir doré dont la fumée forme parfois des cercles lumineux avant de disparaître.",
    [
      { stat: "magicDamage", type: "percent", value: 8 },
      { stat: "maxMana", type: "percent", value: 10 },
      { stat: "holyResistance", type: "percent", value: 12 },
      { stat: "darkResistance", type: "percent", value: 10 }
    ]
  ),

  createOffhand(
    "stormbound_buckler",
    "Rondache liée à l’orage",
    "buckler",
    "epic",
    24,
    "Une rondache légère cerclée d’un métal bleuté, capable de détourner les coups et de disperser les décharges.",
    [
      { stat: "dodgeChance", type: "percent", value: 7 },
      { stat: "physicalDefense", type: "percent", value: 12 },
      { stat: "lightningResistance", type: "percent", value: 12 },
      { stat: "windResistance", type: "percent", value: 8 }
    ]
  ),

  createAccessory(
    "ring_of_the_split_star",
    "Anneau de l’étoile fendue",
    "ring",
    "epic",
    25,
    "Un anneau dont la pierre semble contenir une étoile brisée, instable mais débordante de puissance arcanique.",
    [
      { stat: "magicDamage", type: "percent", value: 10 },
      { stat: "criticalChance", type: "percent", value: 5 },
      { stat: "arcaneResistance", type: "percent", value: 10 },
      { stat: "maxMana", type: "percent", value: 10 }
    ]
  ),

  createAccessory(
    "cloak_of_the_silent_eclipse",
    "Cape de l’éclipse silencieuse",
    "cloak",
    "epic",
    25,
    "Une cape sombre aux reflets dorés, brouillant la présence du porteur entre ombre et lumière.",
    [
      { stat: "dodgeChance", type: "percent", value: 7 },
      { stat: "criticalChance", type: "percent", value: 5 },
      { stat: "darkResistance", type: "percent", value: 10 },
      { stat: "radiantResistance", type: "percent", value: 10 }
    ]
  ),

  // =========================
  // LEGENDARY ITEMS
  // =========================

  createWeapon(
    "eclipse_heart_spellbook",
    "Grimoire du cœur d’éclipse",
    "spellbook",
    "legendary",
    33,
    "Un grimoire scellé par deux astres opposés, dont les pages noires et dorées se tournent sans contact.",
    39, 66,
    1,
    [
      { stat: "magicDamage", type: "percent", value: 18 },
      { stat: "maxMana", type: "percent", value: 16 },
      { stat: "criticalChance", type: "percent", value: 8 },
      { stat: "darkResistance", type: "percent", value: 14 },
      { stat: "radiantResistance", type: "percent", value: 14 }
    ],
    ["arcane", "dark", "radiant"]
  ),

  createAccessory(
    "charm_of_the_impossible_find",
    "Charme de l’impossible trouvaille",
    "charm",
    "legendary",
    32,
    "Un talisman étrange qui semble guider son porteur vers des coups parfaits, des esquives improbables et des hasards presque surnaturels.",
    [
      { stat: "criticalChance", type: "percent", value: 9 },
      { stat: "dodgeChance", type: "percent", value: 7 },
      { stat: "speed", type: "percent", value: 6 },
      { stat: "arcaneResistance", type: "percent", value: 12 },
      { stat: "radiantResistance", type: "percent", value: 10 }
    ]
  )
];
