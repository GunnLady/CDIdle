import { RaceInfo, ClassInfo } from "../types";

export const RACE_INFO_LIST: RaceInfo[] = [
  {
    id: "human",
    name: "Humain",
    description: "Polyvalents et adaptables, les humains peuvent évoluer vers de nombreuses voies différentes."
  },
  {
    id: "elf",
    name: "Elfe",
    description: "Gracieux et longévifs, les elfes sont naturellement doués pour l’agilité, la précision et la magie."
  },
  {
    id: "dwarf",
    name: "Nain",
    description: "Robustes et résistants, les nains sont naturellement endurants et fiables physiquement."
  },
  {
    id: "orc",
    name: "Orc",
    description: "Puissants et instinctifs, les orcs comptent sur leur force, leur endurance et leur résilience primitive."
  },
  {
    id: "goblin",
    name: "Gobelin",
    description: "Petits, faibles et primitifs, les gobelins sont des créatures fragiles qui survivent grâce à la peur, l’instinct et une adaptabilité obstinée."
  },
  {
    id: "lizardfolk",
    name: "Homme-Lézard",
    description: "Froids de sang et résistants, les hommes-lézards sont des survivants naturels."
  },
  {
    id: "tiefling",
    name: "Tieffelin",
    description: "Marqués par une ancienne influence infernale ou démoniaque, les tieffelins possèdent une affinité naturelle avec les forces occultes et les énergies instables."
  }
];

export const CLASS_INFO_LIST: ClassInfo[] = [
  {
    type: "Novice",
    name: "Novice",
    tier: 0,
    description: "Une classe de départ faible et non spécialisée. Le novice ne possède aucune statistique principale et peut évoluer vers une classe de Tier 1 selon son potentiel, son équipement et sa progression.",
    mainStats: [],
    activeSkills: ["heavy_blow", "guard_stance"],
    passiveSkills: ["survival_instinct", "small_profit"],
    color: "#94a3b8"
  },
  {
    type: "Guerrier",
    name: "Guerrier",
    tier: 1,
    description: "Une classe physique équilibrée, spécialisée dans le combat direct, les armes simples et la survie en mêlée.",
    mainStats: ["str", "end"],
    jobChangeBuildingId: "caserne",
    mainDerivedStats: ["maxHp", "physicalDamage", "physicalDefense"],
    activeSkills: ["cleaving_strike", "weakening_shout", "provocation"],
    passiveSkills: ["weapon_training", "disciplined_soldier"],
    color: "#eab308"
  },
  {
    type: "Voleur",
    name: "Voleur",
    tier: 1,
    description: "Une classe rapide et opportuniste, spécialisée dans l’esquive, les coups critiques, la discrétion et les attaques précises.",
    mainStats: ["agi", "dex"],
    jobChangeBuildingId: "lair",
    mainDerivedStats: ["speed", "dodgeChance", "criticalChance", "physicalDamage"],
    activeSkills: ["quick_shiv", "double_cut", "blinding_dust"],
    passiveSkills: ["agile_footwork", "killer_precision"],
    color: "#a855f7"
  },
  {
    type: "Archer",
    name: "Archer",
    tier: 1,
    description: "Une classe à distance précise, spécialisée dans les attaques sûres, les tirs critiques et le contrôle de la distance.",
    mainStats: ["dex", "agi"],
    jobChangeBuildingId: "poste_chasse",
    mainDerivedStats: ["physicalDamage", "speed", "criticalChance"],
    activeSkills: ["rapid_shot", "piercing_arrow", "crippling_shot"],
    passiveSkills: ["eagle_eye", "steady_aim"],
    color: "#22c55e"
  },
  {
    type: "Mage",
    name: "Mage",
    tier: 1,
    description: "Une classe magique offensive, spécialisée dans les sorts destructeurs, les dégâts magiques et l’utilisation du mana.",
    mainStats: ["int", "dex"],
    jobChangeBuildingId: "academie",
    mainDerivedStats: ["maxMana", "magicDamage", "criticalChance"],
    activeSkills: [
      "arcane_bolt",
      "fire_bolt",
      "ice_shard",
      "water_lance",
      "stone_spike",
      "wind_blade",
      "lightning_bolt",
      "mana_shield"
    ],
    passiveSkills: ["arcane_training", "mana_control"],
    color: "#3b82f6"
  },
  {
    type: "Acolyte",
    name: "Acolyte",
    tier: 1,
    description: "Une classe spirituelle de soutien, spécialisée dans les soins, la protection, les bénédictions et la résistance magique.",
    mainStats: ["wiz", "dex"],
    jobChangeBuildingId: "temple",
    mainDerivedStats: ["maxMana", "magicDefense", "criticalChance"],
    activeSkills: ["holy_smite", "sacred_barrier", "holy_mark", "benediction"],
    passiveSkills: ["spiritual_resilience", "healing_grace"],
    color: "#2dd4bf"
  },
  {
    type: "Aède",
    name: "Aède",
    tier: 1,
    description: "Une classe de soutien mystique utilisant les chants, les récits et les arts sonores pour renforcer ses alliés ou affaiblir ses ennemis.",
    mainStats: ["wiz", "int"],
    jobChangeBuildingId: "academie",
    mainDerivedStats: ["maxMana", "magicDamage", "magicDefense"],
    activeSkills: ["inspiring_song", "discordant_chord", "soothing_song"],
    passiveSkills: ["harmonic_focus", "performer_instinct"],
    color: "#ec4899"
  },
  {
    type: "Druide",
    name: "Druide",
    tier: 1,
    description: "Une classe liée à la nature, spécialisée dans la magie naturelle, les soins simples, les plantes, les bêtes et l’équilibre du vivant.",
    mainStats: ["wiz", "int"],
    jobChangeBuildingId: "cercle",
    mainDerivedStats: ["maxMana", "magicDamage", "magicDefense"],
    activeSkills: ["thorn_grasp", "wild_regrowth", "barkskin"],
    passiveSkills: ["nature_attunement", "verdant_healing"],
    color: "#10b981"
  },
  {
    type: "Artificier",
    name: "Artificier",
    tier: 1,
    description: "Une classe technique et inventive, spécialisée dans les outils, les mécanismes, les enchantements simples et l’utilisation stratégique d’objets fabriqués.",
    mainStats: ["int", "dex"],
    jobChangeBuildingId: "forge",
    mainDerivedStats: ["maxMana", "magicDamage", "criticalChance"],
    activeSkills: ["flame_thrower", "lightning_arc", "overcharged_core", "static_trap"],
    passiveSkills: ["technical_precision", "arcane_engineering"],
    color: "#f97316"
  },
  {
    type: "Pugiliste",
    name: "Pugiliste",
    tier: 1,
    description: "Une classe de combat rapproché utilisant le corps comme arme, spécialisée dans les coups rapides, l’endurance physique et les enchaînements à mains nues.",
    mainStats: ["str", "agi"],
    jobChangeBuildingId: "caserne",
    mainDerivedStats: ["maxHp", "physicalDamage", "speed", "dodgeChance"],
    activeSkills: ["earthen_fist", "wind_kick", "rapid_combo", "battle_focus"],
    passiveSkills: ["conditioned_body", "combat_reflexes"],
    color: "#ef4444"
  }
];

export const MALE_FIRST_NAMES = [
  "Aldus", "Berik", "Cedric", "Eldrin", "Faelar", "Grom", "Jarek", "Kaelen", "Orin", "Pharis", 
  "Ragnor", "Thorne", "Ulfgar", "Zephyr", "Aelion", "Cassian", "Dorian", "Garrick", "Ignis", 
  "Kael", "Malakor", "Sylas", "Urien", "Wulfrith", "Zarek", "Alistair"
];

export const FEMALE_FIRST_NAMES = [
  "Dara", "Hulda", "Ithil", "Lyra", "Nyssa", "Quilla", "Sariel", "Vala", "Wren", "Ygritte", 
  "Bronda", "Drusilla", "Elysia", "Fiona", "Hesper", "Lumina", "Nesta", "Rowan", "Talia", 
  "Vesper", "Ysolde", "Beatrix", "Aurelia", "Geneviève", "Morgane", "Sybille"
];

export const HERO_FIRST_NAMES = [
  ...MALE_FIRST_NAMES,
  ...FEMALE_FIRST_NAMES
];

export const HERO_LAST_NAMES = [
  "Haut-Roc", "Brise-Fer", "Feuille-d'Argent", "Sombre-Garde", "Lumière-Bénie", "Sabre-Foufou",
  "Peau-de-Loup", "Oeil-de-Faucon", "Coeur-Valeureux", "Chante-Pierre", "Garde-Montagne", "Siffle-Vent",
  "Grand-Pas", "Fort-Bras", "Ombre-Pas", "Tranche-Tête", "Main-D'Or", "Rune-Forge", "Cherche-Etoile",
  "Chasse-Aube", "Barbe-Rousse", "Nuit-Eternelle", "Glace-Eternelle", "Grogne-Fer", "Double-Lame"
];
