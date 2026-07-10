import { ArmorInfo } from "../types";

export const ARMOR_INFO_LIST: ArmorInfo[] = [
  {
    id: "cloth_armor",
    name: "Tenue en tissu",
    category: "cloth_armor",
    description: "Protection très légère n'offrant aucun avantage défensif, mais favorisant légèrement le mana.",
    modifiers: [
      {
        stat: "maxMana",
        type: "percent",
        value: 3
      }
    ]
  },
  {
    id: "leather_armor",
    name: "Armure légère",
    category: "light_armor",
    description: "Armure légère offrant une protection correcte tout en conservant une bonne mobilité.",
    modifiers: [
      {
        stat: "physicalDefense",
        type: "percent",
        value: 5
      },
      {
        stat: "dodgeChance",
        type: "percent",
        value: 3
      }
    ]
  },
  {
    id: "chainmail",
    name: "Armure intermédiaire",
    category: "medium_armor",
    description: "Armure équilibrée offrant une bonne protection physique avec une légère perte de mobilité.",
    modifiers: [
      {
        stat: "physicalDefense",
        type: "percent",
        value: 10
      },
      {
        stat: "speed",
        type: "percent",
        value: -3
      }
    ]
  },
  {
    id: "plate_armor",
    name: "Armure lourde",
    category: "heavy_armor",
    description: "Armure lourde offrant une forte protection physique au prix d’une mobilité réduite.",
    modifiers: [
      {
        stat: "physicalDefense",
        type: "percent",
        value: 18
      },
      {
        stat: "speed",
        type: "percent",
        value: -8
      },
      {
        stat: "dodgeChance",
        type: "percent",
        value: -8
      }
    ]
  },
  {
    id: "magic_robe",
    name: "Robe magique",
    category: "magic_armor",
    description: "Tenue enchantée offrant peu de protection physique, mais renforçant le mana et les dégâts magiques.",
    modifiers: [
      {
        stat: "physicalDefense",
        type: "percent",
        value: 2
      },
      {
        stat: "maxMana",
        type: "percent",
        value: 5
      },
      {
        stat: "magicDamage",
        type: "percent",
        value: 4
      }
    ]
  }
];
