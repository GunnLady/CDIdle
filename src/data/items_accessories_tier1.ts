import { ItemInfo } from "../types";
import { createAccessory } from "./itemBuilders";

export const TIER1_ITEM_ACC_LIST: ItemInfo[] = [
  // Rings
  createAccessory(
    "silver_ring",
    "Anneau d’argent",
    "ring",
    "common",
    10,
    "Un anneau d’argent discret, légèrement imprégné de mana.",
    [{ stat: "maxMana", type: "percent", value: 4 }]
  ),
  createAccessory(
    "copper_focus_ring",
    "Anneau de cuivre focalisé",
    "ring",
    "common",
    10,
    "Un anneau de cuivre gravé d’un cercle imparfait, aidant légèrement à stabiliser les attaques magiques.",
    [{ stat: "magicDamage", type: "percent", value: 4 }]
  ),
  createAccessory(
    "fine_rune_ring",
    "Anneau aux runes fines",
    "ring",
    "uncommon",
    20,
    "Un anneau gravé de runes délicates, capable de renforcer les sorts et de stabiliser les flux arcaniques.",
    [
      { stat: "magicDamage", type: "percent", value: 5 },
      { stat: "arcaneResistance", type: "percent", value: 6 }
    ]
  ),
  createAccessory(
    "storm_etched_ring",
    "Anneau gravé d’orage",
    "ring",
    "uncommon",
    20,
    "Un anneau parcouru de fines gravures en spirale, réagissant faiblement aux énergies électriques.",
    [
      { stat: "criticalChance", type: "percent", value: 4 },
      { stat: "lightningResistance", type: "percent", value: 7 }
    ]
  ),

  // Amulets
  createAccessory(
    "warm_ember_amulet",
    "Amulette de braise tiède",
    "amulet",
    "common",
    10,
    "Une amulette contenant une faible braise enchantée, protégeant légèrement contre la chaleur magique.",
    [{ stat: "fireResistance", type: "percent", value: 6 }]
  ),
  createAccessory(
    "riverstone_amulet",
    "Amulette de pierre-rivière",
    "amulet",
    "common",
    10,
    "Une pierre polie par l’eau, portée au cou pour apaiser les flux élémentaires instables.",
    [{ stat: "waterResistance", type: "percent", value: 6 }]
  ),
  createAccessory(
    "pale_guardian_amulet",
    "Amulette du gardien pâle",
    "amulet",
    "uncommon",
    21,
    "Une amulette de protection à la lueur pâle, renforçant la vitalité du porteur et repoussant les influences obscures.",
    [
      { stat: "maxHp", type: "percent", value: 6 },
      { stat: "darkResistance", type: "percent", value: 7 }
    ]
  ),
  createAccessory(
    "sunmarked_amulet",
    "Amulette marquée du soleil",
    "amulet",
    "uncommon",
    21,
    "Une amulette chaude au toucher, gravée d’un symbole solaire protecteur.",
    [
      { stat: "maxHp", type: "percent", value: 6 },
      { stat: "radiantResistance", type: "percent", value: 7 }
    ]
  ),

  // Bracelets
  createAccessory(
    "knotted_leather_bracelet",
    "Bracelet de cuir noué",
    "bracelet",
    "common",
    10,
    "Un bracelet de cuir serré autour du poignet, aidant à garder des gestes fermes et précis.",
    [{ stat: "criticalChance", type: "percent", value: 3 }]
  ),
  createAccessory(
    "ashwood_bracelet",
    "Bracelet de bois cendré",
    "bracelet",
    "common",
    10,
    "Un bracelet léger taillé dans un bois sombre, aidant le porteur à garder des gestes vifs.",
    [{ stat: "speed", type: "percent", value: 4 }]
  ),
  createAccessory(
    "ironthread_bracelet",
    "Bracelet aux fils de fer",
    "bracelet",
    "uncommon",
    20,
    "Un bracelet renforcé de fils métalliques, améliorant la force des attaques tout en gardant une bonne souplesse.",
    [
      { stat: "physicalDamage", type: "percent", value: 5 },
      { stat: "dodgeChance", type: "percent", value: 3 }
    ]
  ),
  createAccessory(
    "sparring_bracelet",
    "Bracelet d’assaut",
    "bracelet",
    "uncommon",
    20,
    "Un bracelet renforcé, conçu pour accompagner des frappes précises et répétées.",
    [
      { stat: "physicalDamage", type: "percent", value: 5 },
      { stat: "criticalChance", type: "percent", value: 4 }
    ]
  ),

  // Belts
  createAccessory(
    "sturdy_travel_belt",
    "Ceinture de voyage robuste",
    "belt",
    "common",
    10,
    "Une ceinture solide et pratique, aidant le porteur à mieux supporter l’effort prolongé.",
    [{ stat: "maxHp", type: "percent", value: 5 }]
  ),
  createAccessory(
    "patched_field_belt",
    "Ceinture de terrain rapiécée",
    "belt",
    "common",
    10,
    "Une ceinture pratique et usée, permettant de mieux supporter l’équipement durant les longues explorations.",
    [{ stat: "maxHp", type: "percent", value: 5 }]
  ),
  createAccessory(
    "ironbuckle_belt",
    "Ceinture à boucle de fer",
    "belt",
    "uncommon",
    21,
    "Une ceinture renforcée par une lourde boucle de fer, améliorant l’endurance et la protection physique.",
    [
      { stat: "maxHp", type: "percent", value: 7 },
      { stat: "physicalDefense", type: "percent", value: 6 }
    ]
  ),
  createAccessory(
    "emberproof_belt",
    "Ceinture ignifugée",
    "belt",
    "uncommon",
    21,
    "Une ceinture traitée avec des huiles minérales, pensée pour résister aux projections brûlantes.",
    [
      { stat: "physicalDefense", type: "percent", value: 6 },
      { stat: "fireResistance", type: "percent", value: 7 }
    ]
  ),

  // Cloaks
  createAccessory(
    "dusty_travel_cloak",
    "Cape de voyage poussiéreuse",
    "cloak",
    "common",
    10,
    "Une cape de voyage usée, utile pour masquer les mouvements et éviter les coups directs.",
    [{ stat: "dodgeChance", type: "percent", value: 4 }]
  ),
  createAccessory(
    "windworn_cloak",
    "Cape battue par le vent",
    "cloak",
    "common",
    10,
    "Une cape légère et décolorée, dont le tissu semble mieux supporter les rafales que les lames.",
    [{ stat: "windResistance", type: "percent", value: 6 }]
  ),
  createAccessory(
    "moonshadow_cloak",
    "Cape d’ombre lunaire",
    "cloak",
    "uncommon",
    20,
    "Une cape sombre aux reflets argentés, brouillant les silhouettes et protégeant des énergies nocturnes.",
    [
      { stat: "dodgeChance", type: "percent", value: 5 },
      { stat: "darkResistance", type: "percent", value: 7 }
    ]
  ),
  createAccessory(
    "veilcloth_cloak",
    "Cape en tissu-voile",
    "cloak",
    "uncommon",
    20,
    "Une cape souple presque silencieuse, brouillant légèrement les mouvements du porteur.",
    [
      { stat: "dodgeChance", type: "percent", value: 5 },
      { stat: "darkResistance", type: "percent", value: 6 }
    ]
  ),

  // Charms
  createAccessory(
    "lucky_charm",
    "Charme porte-bonheur",
    "charm",
    "common",
    10,
    "Un petit talisman sans grande valeur apparente, mais qui semble attirer les occasions favorables.",
    [{ stat: "luck", type: "flat", value: 3 }]
  ),
  createAccessory(
    "cracked_coin_charm",
    "Charme de pièce fendue",
    "charm",
    "common",
    10,
    "Une vieille pièce percée portée comme talisman, attirant parfois une chance inattendue.",
    [{ stat: "luck", type: "flat", value: 3 }]
  ),
  createAccessory(
    "gilded_fortune_charm",
    "Charme de fortune doré",
    "charm",
    "uncommon",
    22,
    "Un charme doré gravé de symboles de chance, favorisant les découvertes rares et les coups décisifs.",
    [
      { stat: "luck", type: "flat", value: 5 },
      { stat: "criticalChance", type: "percent", value: 4 }
    ]
  ),
  createAccessory(
    "three_knots_charm",
    "Charme aux trois nœuds",
    "charm",
    "uncommon",
    20,
    "Un petit talisman noué selon une ancienne superstition, censé détourner le mauvais sort au bon moment.",
    [
      { stat: "luck", type: "flat", value: 5 },
      { stat: "dodgeChance", type: "percent", value: 4 }
    ]
  )
];
