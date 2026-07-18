import { ItemInfo } from "../types";
import { createWeapon } from "./itemBuilders";

export const TIER1_ITEM_WPN_LIST: ItemInfo[] = [
  // SWORDS
  createWeapon(
    "basic_sword",
    "Épée simple",
    "sword",
    "common",
    10,
    "Une épée fiable et équilibrée, adaptée aux guerriers ayant déjà acquis les bases du combat.",
    5, 8,
    1,
    [{ stat: "physicalDamage", value: 3 }]
  ),
  createWeapon(
    "steel_sword",
    "Épée en acier",
    "sword",
    "uncommon",
    20,
    "Une épée solide et bien forgée, offrant un excellent équilibre entre puissance et régularité.",
    11, 17,
    1,
    [{ stat: "physicalDamage", value: 7 }]
  ),

  // SABERS
  createWeapon(
    "basic_saber",
    "Sabre simple",
    "saber",
    "common",
    10,
    "Un sabre léger et fluide, pensé pour les guerriers privilégiant la vitesse et la précision.",
    4, 7,
    1.15,
    [{ stat: "speed", value: 3 }]
  ),
  createWeapon(
    "duelist_saber",
    "Sabre de duelliste",
    "saber",
    "uncommon",
    20,
    "Un sabre fin et précis, conçu pour enchaîner les frappes rapides et exploiter les ouvertures.",
    9, 14,
    1.25,
    [{ stat: "physicalDamage", value: 4 }, { stat: "speed", value: 5 }]
  ),

  // GREATSWORDS
  createWeapon(
    "basic_greatsword",
    "Épée lourde",
    "greatsword",
    "common",
    10,
    "Une grande lame puissante, plus lente à manier mais capable d’infliger de lourds dégâts.",
    7, 12,
    0.8,
    [{ stat: "physicalDamage", value: 5 }]
  ),
  createWeapon(
    "steel_greatsword",
    "Épée à deux mains en acier",
    "greatsword",
    "uncommon",
    21,
    "Une puissante épée à deux mains, forgée pour les guerriers qui misent sur la force brute.",
    15, 24,
    0.85,
    [{ stat: "physicalDamage", value: 10 }]
  ),

  // AXES
  createWeapon(
    "basic_axe",
    "Hache de combat",
    "axe",
    "common",
    10,
    "Une hache brutale et efficace, conçue pour porter des coups lourds et décisifs.",
    6, 10,
    0.85,
    [{ stat: "physicalDamage", value: 4 }]
  ),
  createWeapon(
    "warrior_axe",
    "Hache de guerrier",
    "axe",
    "uncommon",
    20,
    "Une hache solide et agressive, capable d’infliger des coups puissants et irréguliers.",
    13, 21,
    0.9,
    [{ stat: "physicalDamage", value: 8 }, { stat: "criticalChance", value: 3 }]
  ),

  // GREATAXES
  createWeapon(
    "basic_greataxe",
    "Grande hache de combat",
    "greataxe",
    "common",
    10,
    "Une grande hache lourde, taillée pour les guerriers capables de supporter son poids.",
    8, 14,
    0.8,
    [{ stat: "physicalDamage", value: 6 }]
  ),
  createWeapon(
    "executioner_greataxe",
    "Grande hache d’exécuteur",
    "greataxe",
    "uncommon",
    22,
    "Une arme massive et destructrice, conçue pour briser les défenses par des frappes écrasantes.",
    17, 28,
    0.85,
    [{ stat: "physicalDamage", value: 12 }, { stat: "criticalChance", value: 4 }]
  ),

  // MACES
  createWeapon(
    "basic_mace",
    "Masse de combat",
    "mace",
    "common",
    10,
    "Une masse simple et robuste, efficace pour écraser les protections et frapper avec impact.",
    5, 9,
    0.8,
    [{ stat: "physicalDamage", value: 4 }]
  ),
  createWeapon(
    "iron_mace",
    "Masse en fer",
    "mace",
    "uncommon",
    20,
    "Une masse lourde en fer, particulièrement efficace contre les ennemis résistants ou protégés.",
    12, 20,
    0.85,
    [{ stat: "physicalDamage", value: 8 }]
  ),

  // GREATMACES
  createWeapon(
    "basic_greatmace",
    "Grande masse de combat",
    "greatmace",
    "common",
    10,
    "Une arme lourde et écrasante, lente mais redoutable entre les mains d’un guerrier solide.",
    8, 15,
    0.7,
    [{ stat: "physicalDamage", value: 6 }]
  ),
  createWeapon(
    "crusher_greatmace",
    "Grande masse broyeuse",
    "greatmace",
    "uncommon",
    22,
    "Une masse à deux mains dévastatrice, faite pour pulvériser les armures et anéantir les défenses.",
    16, 27,
    0.75,
    [{ stat: "physicalDamage", value: 11 }]
  ),

  // SPEARS
  createWeapon(
    "basic_spear",
    "Lance de combat",
    "spear",
    "common",
    10,
    "Une lance stable et précise, offrant une bonne allonge tout en conservant un rythme régulier.",
    5, 10,
    0.95,
    [{ stat: "physicalDamage", value: 3 }, { stat: "criticalChance", value: 2 }]
  ),
  createWeapon(
    "guard_spear",
    "Lance de garde",
    "spear",
    "uncommon",
    20,
    "Une lance bien équilibrée, permettant des frappes précises et constantes à bonne distance.",
    11, 19,
    1,
    [{ stat: "physicalDamage", value: 6 }, { stat: "criticalChance", value: 4 }]
  ),

  // DAGGERS
  createWeapon(
    "basic_dagger",
    "Dague",
    "dagger",
    "common",
    10,
    "Une dague légère et maniable, idéale pour frapper rapidement les points faibles.",
    3, 6,
    1.35,
    [{ stat: "criticalChance", value: 4 }]
  ),
  createWeapon(
    "assassin_dagger",
    "Dague d’assassin",
    "dagger",
    "uncommon",
    20,
    "Une dague fine et dangereuse, conçue pour les attaques rapides, précises et mortelles.",
    7, 12,
    1.45,
    [{ stat: "criticalChance", value: 7 }, { stat: "speed", value: 5 }]
  ),

  // SHORTBOWS
  createWeapon(
    "basic_shortbow",
    "Arc court",
    "shortbow",
    "common",
    10,
    "Un arc court léger, permettant de tirer rapidement tout en restant mobile.",
    4, 8,
    1.2,
    [{ stat: "speed", value: 3 }]
  ),
  createWeapon(
    "hunter_shortbow",
    "Arc court de chasseur",
    "shortbow",
    "uncommon",
    20,
    "Un arc court souple et rapide, idéal pour enchaîner les tirs avec précision.",
    9, 15,
    1.3,
    [{ stat: "physicalDamage", value: 5 }, { stat: "speed", value: 5 }]
  ),

  // LONGBOWS
  createWeapon(
    "basic_longbow",
    "Arc long",
    "longbow",
    "common",
    10,
    "Un arc long puissant, plus lent à manier mais capable de tirs précis et percutants.",
    6, 11,
    0.9,
    [{ stat: "physicalDamage", value: 4 }]
  ),
  createWeapon(
    "marksman_longbow",
    "Arc long de tireur d’élite",
    "longbow",
    "uncommon",
    21,
    "Un arc long robuste et précis, conçu pour infliger de lourds dégâts à distance.",
    13, 22,
    0.85,
    [{ stat: "physicalDamage", value: 8 }, { stat: "criticalChance", value: 5 }]
  ),

  // CROSSBOWS
  createWeapon(
    "basic_crossbow",
    "Arbalète",
    "crossbow",
    "common",
    10,
    "Une arbalète mécanique simple, lente à recharger mais puissante et précise.",
    7, 13,
    0.75,
    [{ stat: "physicalDamage", value: 5 }]
  ),
  createWeapon(
    "heavy_crossbow",
    "Arbalète lourde",
    "crossbow",
    "uncommon",
    22,
    "Une arbalète renforcée, lente mais capable de transpercer les défenses avec une grande précision.",
    16, 27,
    0.65,
    [{ stat: "physicalDamage", value: 10 }, { stat: "criticalChance", value: 6 }]
  ),

  // RIFLES
  createWeapon(
    "basic_rifle",
    "Fusil",
    "basic_rifle",
    "common",
    10,
    "Un fusil rudimentaire mais fiable, lent à utiliser mais capable de tirs puissants.",
    8, 15,
    0.7,
    [{ stat: "physicalDamage", value: 6 }]
  ),
  createWeapon(
    "reinforced_rifle",
    "Fusil renforcé",
    "basic_rifle",
    "uncommon",
    22,
    "Un fusil mécanique renforcé, très lent mais redoutable pour infliger des tirs précis et destructeurs.",
    18, 30,
    0.6,
    [{ stat: "physicalDamage", value: 12 }, { stat: "criticalChance", value: 5 }]
  ),

  // STAFFS
  createWeapon(
    "basic_staff",
    "Bâton",
    "staff",
    "common",
    10,
    "Un bâton magique simple, utilisé pour canaliser l’énergie arcanique avec stabilité.",
    5, 10,
    1,
    [{ stat: "magicDamage", value: 4 }],
    ["arcane"]
  ),
  createWeapon(
    "adept_staff",
    "Bâton d’adepte",
    "staff",
    "uncommon",
    21,
    "Un bâton renforcé par des gravures arcaniques, capable d’amplifier les sorts offensifs.",
    12, 21,
    1,
    [{ stat: "magicDamage", value: 8 }, { stat: "criticalChance", value: 4 }],
    ["arcane"]
  ),

  // WANDS
  createWeapon(
    "basic_wand",
    "Baguette simple",
    "wand",
    "common",
    10,
    "Une baguette légère, permettant de lancer rapidement des sorts arcaniques simples.",
    4, 8,
    1.2,
    [{ stat: "magicDamage", value: 3 }],
    ["arcane"]
  ),
  createWeapon(
    "focused_wand",
    "Baguette de focalisation",
    "wand",
    "uncommon",
    20,
    "Une baguette fine et réactive, conçue pour canaliser les sorts avec précision et rapidité.",
    9, 15,
    1.3,
    [{ stat: "magicDamage", value: 6 }, { stat: "speed", value: 5 }],
    ["arcane"]
  ),

  // SPELLBOOKS
  createWeapon(
    "basic_spellbook",
    "Grimoire simple",
    "spellbook",
    "common",
    10,
    "Un grimoire contenant des formules arcaniques basiques pour renforcer les sorts du porteur.",
    4, 9,
    1,
    [{ stat: "magicDamage", value: 4 }],
    ["arcane"]
  ),
  createWeapon(
    "arcane_spellbook",
    "Grimoire arcanique",
    "spellbook",
    "uncommon",
    20,
    "Un grimoire rempli de connaissances magiques avancées, améliorant la puissance et la précision des sorts.",
    10, 18,
    1,
    [{ stat: "magicDamage", value: 7 }, { stat: "criticalChance", value: 4 }],
    ["arcane"]
  ),

  // INSTRUMENTS (Sound damage)
  createWeapon(
    "basic_lute",
    "Luth",
    "instrument",
    "common",
    10,
    "Un luth modeste utilisé pour produire des vibrations sonores capables de perturber les ennemis.",
    3, 7,
    1.1,
    [{ stat: "magicDamage", value: 3 }],
    ["sound"]
  ),
  createWeapon(
    "resonant_harp",
    "Harpe résonante",
    "instrument",
    "uncommon",
    20,
    "Une harpe finement accordée, capable d’amplifier les ondes sonores magiques et d’affaiblir les ennemis.",
    8, 14,
    1.15,
    [{ stat: "magicDamage", value: 5 }, { stat: "speed", value: 4 }],
    ["sound"]
  ),

  // BO
  createWeapon(
    "basic_bo",
    "Bô",
    "bo",
    "common",
    10,
    "Un long bâton de combat équilibré, idéal pour maintenir la distance et enchaîner les frappes.",
    5, 9,
    1.1,
    [{ stat: "speed", value: 3 }]
  ),
  createWeapon(
    "balanced_bo",
    "Bô équilibré",
    "bo",
    "uncommon",
    20,
    "Un bô solide et parfaitement équilibré, favorisant les enchaînements rapides et le contrôle du combat.",
    10, 17,
    1.15,
    [{ stat: "physicalDamage", value: 5 }, { stat: "speed", value: 5 }]
  ),

  // GAUNTLETS
  createWeapon(
    "basic_gauntlets",
    "Gantelets",
    "gauntlets",
    "common",
    10,
    "Des gantelets solides, renforçant les frappes directes au corps à corps.",
    6, 11,
    1.9,
    [{ stat: "physicalDamage", value: 4 }]
  ),
  createWeapon(
    "reinforced_gauntlets",
    "Gantelets renforcés",
    "gauntlets",
    "uncommon",
    21,
    "Des gantelets lourds et robustes, conçus pour améliorer la puissance des coups au corps à corps.",
    13, 22,
    1.95,
    [{ stat: "physicalDamage", value: 8 }, { stat: "criticalChance", value: 4 }]
  ),

  // KNUCKLES
  createWeapon(
    "basic_knuckles",
    "Poings de combat simples",
    "knuckles",
    "common",
    10,
    "Des armes de pugilat légères, idéales pour frapper vite et multiplier les coups.",
    4, 7,
    1.8,
    [{ stat: "speed", value: 4 }]
  ),
  createWeapon(
    "swift_knuckles",
    "Poings de combat rapides",
    "knuckles",
    "uncommon",
    20,
    "Des poings de combat légers et précis, conçus pour des enchaînements rapides et agressifs.",
    8, 14,
    1.9,
    [{ stat: "criticalChance", value: 5 }, { stat: "speed", value: 6 }]
  ),

  // GEAR CANNONS
  createWeapon(
    "basic_gear_cannon",
    "Canon à engrenages simple",
    "gear_cannon",
    "common",
    10,
    "Un petit canon mécanique instable, capable de projeter des charges métalliques à courte distance.",
    7, 14,
    0.75,
    [{ stat: "physicalDamage", value: 5 }]
  ),
  createWeapon(
    "calibrated_gear_cannon",
    "Canon à engrenages calibré",
    "gear_cannon",
    "uncommon",
    22,
    "Un canon mécanique mieux stabilisé, projetant des charges puissantes avec une précision améliorée.",
    16, 28,
    0.7,
    [{ stat: "physicalDamage", value: 10 }, { stat: "criticalChance", value: 5 }]
  ),

  // DUAL WIELD WEAPONS
  createWeapon(
    "twin_steel_swords",
    "Épées jumelles en acier",
    "dual_swords",
    "uncommon",
    20,
    "Deux épées bien équilibrées, conçues pour maintenir une pression constante avec des enchaînements réguliers.",
    10, 16,
    1.75,
    [
      { stat: "physicalDamage", value: 5 },
      { stat: "speed", value: 4 }
    ]
  ),
  createWeapon(
    "flowing_twin_sabers",
    "Sabres jumeaux fluides",
    "dual_sabers",
    "uncommon",
    20,
    "Deux sabres légers pensés pour des attaques rapides, précises et difficiles à anticiper.",
    9, 15,
    1.9,
    [
      { stat: "criticalChance", value: 5 },
      { stat: "speed", value: 5 }
    ]
  ),
  createWeapon(
    "twin_battle_axes",
    "Haches jumelles de bataille",
    "dual_axes",
    "uncommon",
    20,
    "Deux haches agressives, idéales pour des assauts brutaux et des frappes successives à courte portée.",
    12, 21,
    1.7,
    [
      { stat: "physicalDamage", value: 8 },
      { stat: "criticalChance", value: 3 }
    ]
  ),
  createWeapon(
    "nightfang_daggers",
    "Dagues crocs-de-nuit",
    "dual_daggers",
    "uncommon",
    20,
    "Deux dagues sombres et effilées, faites pour multiplier les frappes rapides et exploiter chaque ouverture.",
    7, 13,
    2.0,
    [
      { stat: "criticalChance", value: 7 },
      { stat: "dodgeChance", value: 4 }
    ]
  )
];
