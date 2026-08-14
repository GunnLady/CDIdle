import type { Hero } from "../types";
import noviceClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-novice-v3.png";
import warriorClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-guerrier-v1.png";
import rogueClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-voleur-v1.png";
import archerClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-archer-v1.png";
import mageClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-mage-v1.png";
import acolyteClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-acolyte-v1.png";
import aedeClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-aede-v1.png";
import druidClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-druide-v1.png";
import artificerClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-artificier-v1.png";
import pugilistClassPlaque from "../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-pugiliste-v1.png";

const dungeonClassPlaques = {
  Novice: noviceClassPlaque,
  Guerrier: warriorClassPlaque,
  Voleur: rogueClassPlaque,
  Archer: archerClassPlaque,
  Mage: mageClassPlaque,
  Acolyte: acolyteClassPlaque,
  "Aède": aedeClassPlaque,
  Druide: druidClassPlaque,
  Artificier: artificerClassPlaque,
  Pugiliste: pugilistClassPlaque,
} satisfies Record<Hero["classType"], string>;

export function getDungeonClassPlaque(classType: Hero["classType"]): string {
  return dungeonClassPlaques[classType];
}
