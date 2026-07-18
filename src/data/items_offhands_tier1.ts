import { ItemInfo } from "../types";
import { createOffhand } from "./itemBuilders";

export const TIER1_ITEM_OFFHAND_LIST: ItemInfo[] = [
  // SHIELD
  createOffhand(
    "plain_round_shield",
    "Bouclier rond simple",
    "shield",
    "common",
    10,
    "Un bouclier rond fiable, offrant une protection équilibrée contre les attaques directes.",
    [{ stat: "physicalDefense", type: "percent", value: 8 }]
  ),
  createOffhand(
    "ironbound_round_shield",
    "Bouclier rond cerclé de fer",
    "shield",
    "uncommon",
    20,
    "Un bouclier renforcé par un cerclage de fer, conçu pour mieux absorber les impacts répétés.",
    [
      { stat: "physicalDefense", type: "percent", value: 14 },
      { stat: "dodgeChance", type: "percent", value: 3 }
    ]
  ),

  // BUCKLER
  createOffhand(
    "light_buckler",
    "Rondache légère",
    "buckler",
    "common",
    10,
    "Une petite rondache maniable, utile pour dévier les coups sans gêner les mouvements du porteur.",
    [{ stat: "dodgeChance", type: "percent", value: 4 }]
  ),
  createOffhand(
    "duelist_buckler",
    "Rondache de duel",
    "buckler",
    "uncommon",
    20,
    "Une rondache fine et réactive, parfaite pour détourner les attaques tout en gardant une posture défensive souple.",
    [
      { stat: "dodgeChance", type: "percent", value: 6 },
      { stat: "physicalDefense", type: "percent", value: 6 }
    ]
  ),

  // TOWER SHIELD
  createOffhand(
    "plain_tower_shield",
    "Pavois simple",
    "tower_shield",
    "common",
    10,
    "Un grand bouclier lourd, capable de couvrir une large partie du corps contre les assauts frontaux.",
    [{ stat: "physicalDefense", type: "percent", value: 14 }]
  ),
  createOffhand(
    "fortress_tower_shield",
    "Pavois de forteresse",
    "tower_shield",
    "uncommon",
    22,
    "Un pavois massif renforcé de plaques épaisses, conçu pour tenir face aux chocs les plus violents.",
    [
      { stat: "physicalDefense", type: "percent", value: 24 },
      { stat: "fireResistance", type: "percent", value: 6 }
    ]
  ),

  // ARCANE ORB
  createOffhand(
    "dull_arcane_orb",
    "Orbe arcanique terne",
    "arcane_orb",
    "common",
    10,
    "Un orbe parcouru de faibles lueurs arcaniques, utilisé pour stabiliser les premiers flux magiques.",
    [{ stat: "magicDamage", type: "percent", value: 4 }]
  ),
  createOffhand(
    "pulsing_arcane_orb",
    "Orbe arcanique pulsant",
    "arcane_orb",
    "uncommon",
    20,
    "Un orbe vibrant d’énergie arcanique, amplifiant les sorts tout en protégeant des flux instables.",
    [
      { stat: "magicDamage", type: "percent", value: 7 },
      { stat: "arcaneResistance", type: "percent", value: 6 }
    ]
  ),

  // CRYSTAL FOCUS
  createOffhand(
    "clear_focus_crystal",
    "Cristal clair de focalisation",
    "crystal_focus",
    "common",
    10,
    "Un cristal limpide aidant à concentrer le mana avant le lancement d’un sort.",
    [{ stat: "maxMana", type: "percent", value: 5 }]
  ),
  createOffhand(
    "prismatic_focus_crystal",
    "Cristal prismatique",
    "crystal_focus",
    "uncommon",
    20,
    "Un cristal aux reflets changeants, améliorant la réserve de mana et la stabilité magique du porteur.",
    [
      { stat: "maxMana", type: "percent", value: 8 },
      { stat: "arcaneResistance", type: "percent", value: 6 }
    ]
  ),

  // SPELL LANTERN
  createOffhand(
    "dim_spell_lantern",
    "Lanterne arcanique faible",
    "spell_lantern",
    "common",
    10,
    "Une lanterne enchantée projetant une lueur magique instable, utile pour guider les sorts.",
    [{ stat: "magicDamage", type: "percent", value: 4 }]
  ),
  createOffhand(
    "azure_spell_lantern",
    "Lanterne d’azur",
    "spell_lantern",
    "uncommon",
    21,
    "Une lanterne brillant d’une flamme bleutée, renforçant la puissance magique et protégeant des énergies froides.",
    [
      { stat: "magicDamage", type: "percent", value: 6 },
      { stat: "iceResistance", type: "percent", value: 7 }
    ]
  ),

  // PRAYER BEADS
  createOffhand(
    "plain_prayer_beads",
    "Chapelet sobre",
    "prayer_beads",
    "common",
    10,
    "Un chapelet simple favorisant la concentration et la réserve spirituelle du porteur.",
    [{ stat: "maxMana", type: "percent", value: 5 }]
  ),
  createOffhand(
    "silver_prayer_beads",
    "Chapelet d’argent",
    "prayer_beads",
    "uncommon",
    20,
    "Un chapelet aux perles argentées, renforçant les prières et repoussant les influences impures.",
    [
      { stat: "maxMana", type: "percent", value: 8 },
      { stat: "darkResistance", type: "percent", value: 7 }
    ]
  ),

  // SANCTIFIED CENSER
  createOffhand(
    "smoldering_censer",
    "Encensoir fumant",
    "sanctified_censer",
    "common",
    10,
    "Un encensoir diffusant une fumée sacrée, apaisant les flux magiques autour du porteur.",
    [{ stat: "holyResistance", type: "percent", value: 6 }]
  ),
  createOffhand(
    "blessed_silver_censer",
    "Encensoir d’argent béni",
    "sanctified_censer",
    "uncommon",
    21,
    "Un encensoir sanctifié dont la fumée renforce les bénédictions et protège contre les forces obscures.",
    [
      { stat: "magicDamage", type: "percent", value: 5 },
      { stat: "darkResistance", type: "percent", value: 8 }
    ]
  ),

  // BIBLE
  createOffhand(
    "worn_sacred_book",
    "Livre sacré usé",
    "bible",
    "common",
    10,
    "Un livre sacré marqué par l’usage, aidant le porteur à canaliser sa foi avec plus de constance.",
    [{ stat: "maxMana", type: "percent", value: 5 }]
  ),
  createOffhand(
    "gilded_sacred_book",
    "Livre sacré doré",
    "bible",
    "uncommon",
    22,
    "Un livre sacré orné d’enluminures, renforçant les prières et la protection spirituelle du porteur.",
    [
      { stat: "magicDamage", type: "percent", value: 5 },
      { stat: "holyResistance", type: "percent", value: 8 }
    ]
  ),

  // LIVING BRANCH
  createOffhand(
    "fresh_living_branch",
    "Branche vivante fraîche",
    "living_branch",
    "common",
    10,
    "Une branche encore parcourue de sève magique, favorisant la circulation du mana naturel.",
    [{ stat: "maxMana", type: "percent", value: 5 }]
  ),
  createOffhand(
    "blooming_living_branch",
    "Branche vivante fleurie",
    "living_branch",
    "uncommon",
    20,
    "Une branche couverte de jeunes pousses, renforçant l’énergie naturelle et la résistance aux toxines.",
    [
      { stat: "maxMana", type: "percent", value: 8 },
      { stat: "poisonResistance", type: "percent", value: 7 }
    ]
  ),

  // VERDANT SEED
  createOffhand(
    "small_verdant_seed",
    "Petite graine verdoyante",
    "verdant_seed",
    "common",
    10,
    "Une graine magique pleine de vitalité, protégeant légèrement le porteur des forces naturelles instables.",
    [{ stat: "natureResistance", type: "percent", value: 6 }]
  ),
  createOffhand(
    "heartroot_seed",
    "Graine de cœur-racine",
    "verdant_seed",
    "uncommon",
    21,
    "Une graine rare battant faiblement comme un cœur végétal, renforçant la vitalité magique et l’affinité naturelle.",
    [
      { stat: "maxMana", type: "percent", value: 7 },
      { stat: "natureResistance", type: "percent", value: 8 }
    ]
  ),

  // MOONLIT LEAF
  createOffhand(
    "pale_moonlit_leaf",
    "Feuille lunaire pâle",
    "moonlit_leaf",
    "common",
    10,
    "Une feuille imprégnée d’une faible lueur lunaire, apaisant les flux magiques du porteur.",
    [{ stat: "maxMana", type: "percent", value: 5 }]
  ),
  createOffhand(
    "silvervein_moonlit_leaf",
    "Feuille lunaire aux veines d’argent",
    "moonlit_leaf",
    "uncommon",
    22,
    "Une feuille rare parcourue de veines argentées, mêlant énergie naturelle et clarté lunaire protectrice.",
    [
      { stat: "maxMana", type: "percent", value: 7 },
      { stat: "radiantResistance", type: "percent", value: 8 }
    ]
  )
];
