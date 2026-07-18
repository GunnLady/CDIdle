import { WeaponInfo } from "../types";

export const WEAPON_INFO_LIST: WeaponInfo[] = [
  {
    id: "sword",
    name: "Épée",
    handedness: "one_handed",
    description: "Arme équilibrée, fiable et polyvalente.",
    damageTypes: ["physical"]
  },
  {
    id: "saber",
    name: "Sabre",
    handedness: "one_handed",
    description: "Arme légère et tranchante, axée sur la vitesse, la précision et les attaques fluides.",
    damageTypes: ["physical"]
  },
  {
    id: "greatsword",
    name: "Épée à deux mains",
    handedness: "two_handed",
    description: "Grande arme puissante, spécialisée dans les dégâts physiques élevés.",
    damageTypes: ["physical"]
  },
  {
    id: "axe",
    name: "Hache",
    handedness: "one_handed",
    description: "Arme brutale, efficace pour infliger de lourds dégâts physiques.",
    damageTypes: ["physical"]
  },
  {
    id: "greataxe",
    name: "Hache à deux mains",
    handedness: "two_handed",
    description: "Arme lourde et destructrice, axée sur la force brute.",
    damageTypes: ["physical"]
  },
  {
    id: "mace",
    name: "Masse",
    handedness: "one_handed",
    description: "Arme contondante, efficace contre les ennemis résistants ou lourdement protégés.",
    damageTypes: ["physical"]
  },
  {
    id: "greatmace",
    name: "Masse à deux mains",
    handedness: "two_handed",
    description: "Arme lourde et écrasante, spécialisée dans les dégâts contondants et la destruction de défense.",
    damageTypes: ["physical"]
  },
  {
    id: "spear",
    name: "Lance",
    handedness: "two_handed",
    description: "Arme d’allonge permettant des attaques précises et stables.",
    damageTypes: ["physical"]
  },
  {
    id: "dagger",
    name: "Dague",
    handedness: "one_handed",
    description: "Arme légère et rapide, idéale pour les coups critiques et les attaques précises.",
    damageTypes: ["physical"]
  },
  {
    id: "shortbow",
    name: "Arc court",
    handedness: "two_handed",
    description: "Arme à distance rapide et mobile.",
    damageTypes: ["physical"]
  },
  {
    id: "longbow",
    name: "Arc long",
    handedness: "two_handed",
    description: "Arme à distance puissante, spécialisée dans les tirs précis et les longues portées.",
    damageTypes: ["physical"]
  },
  {
    id: "crossbow",
    name: "Arbalète",
    handedness: "two_handed",
    description: "Arme à distance mécanique, lente mais puissante et précise.",
    damageTypes: ["physical"]
  },
  {
    id: "basic_rifle",
    name: "Fusil rudimentaire",
    handedness: "two_handed",
    description: "Arme à distance mécanique simple, lente à utiliser mais capable d’infliger des tirs puissants et précis.",
    damageTypes: ["physical"]
  },
  {
    id: "staff",
    name: "Bâton",
    handedness: "two_handed",
    description: "Arme magique à deux mains, utilisée pour canaliser les sorts et améliorer la puissance magique.",
    damageTypes: ["arcane"]
  },
  {
    id: "wand",
    name: "Baguette",
    handedness: "one_handed",
    description: "Arme magique légère, permettant de lancer des sorts tout en gardant la main gauche disponible.",
    damageTypes: ["arcane"]
  },
  {
    id: "spellbook",
    name: "Grimoire",
    handedness: "one_handed",
    description: "Arme magique de connaissance, améliorant les sorts, le mana et les effets arcaniques.",
    damageTypes: ["arcane"]
  },
  {
    id: "instrument",
    name: "Instrument",
    handedness: "one_handed",
    description: "Arme de soutien sonore utilisée pour renforcer les alliés ou affaiblir les ennemis.",
    damageTypes: ["sound"]
  },
  {
    id: "bo",
    name: "Bô",
    handedness: "two_handed",
    description: "Long bâton de combat, axé sur la maîtrise corporelle, les enchaînements et le contrôle de la distance.",
    damageTypes: ["physical"]
  },
  {
    id: "gauntlets",
    name: "Gantelets",
    handedness: "dual_wield",
    description: "Armes de pugilat solides, utilisées pour renforcer les frappes directes, la puissance physique et les enchaînements au corps à corps.",
    damageTypes: ["physical"]
  },
  {
    id: "knuckles",
    name: "Poings de combat",
    handedness: "dual_wield",
    description: "Armes légères de pugilat, spécialisées dans les attaques rapides, les coups successifs et la précision au corps à corps.",
    damageTypes: ["physical"]
  },
  {
    id: "gear_cannon",
    name: "Canon à engrenages",
    handedness: "one_handed",
    description: "Arme mécanique compacte utilisée par les artificiers, projetant des charges métalliques ou énergétiques grâce à un système d’engrenages instable.",
    damageTypes: ["physical"]
  },
  {
    id: "dual_swords",
    name: "Épées jumelles",
    handedness: "dual_wield",
    description: "Deux épées utilisées ensemble, offrant un style de combat équilibré basé sur les enchaînements et la pression constante.",
    damageTypes: ["physical"]
  },
  {
    id: "dual_sabers",
    name: "Sabres jumeaux",
    handedness: "dual_wield",
    description: "Deux sabres légers maniés avec fluidité, spécialisés dans les attaques rapides, les esquives et les frappes précises.",
    damageTypes: ["physical"]
  },
  {
    id: "dual_axes",
    name: "Haches jumelles",
    handedness: "dual_wield",
    description: "Deux haches de combat utilisées pour des assauts agressifs, brutaux et difficiles à interrompre.",
    damageTypes: ["physical"]
  },
  {
    id: "dual_daggers",
    name: "Dagues jumelles",
    handedness: "dual_wield",
    description: "Deux dagues rapides et précises, idéales pour multiplier les coups critiques et exploiter les ouvertures.",
    damageTypes: ["physical"]
  }
];
