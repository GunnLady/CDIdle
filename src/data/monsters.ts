import { Monster } from "../types";

export const MONSTERS_LIBRARY: Omit<Monster, "id" | "hp" | "maxHp">[] = [
  // Early depths (1-5)
  { name: "Rat Énorme des Égouts", atk: 3, damageType: "physical", def: 1, magicDef: 0, xpYield: 8, goldYield: 2, image: "🐀", isBoss: false },
  { name: "Chauve-souris Vampire", atk: 4, damageType: "physical", def: 1, magicDef: 1, xpYield: 10, goldYield: 3, image: "🦇", isBoss: false, resistances: { dark: 20, holy: -15 } },
  { name: "Gobelin Éclaireur", atk: 6, damageType: "physical", def: 2, magicDef: 1, xpYield: 18, goldYield: 6, image: "🎭", isBoss: false },
  { name: "Brigand Masqué", atk: 7, damageType: "physical", def: 3, magicDef: 2, xpYield: 20, goldYield: 10, image: "🥷", isBoss: false },
  
  // Medium depths (6-15)
  { name: "Squelette Guerrier", atk: 10, damageType: "physical", def: 5, magicDef: 2, xpYield: 15, goldYield: 22, image: "💀", isBoss: false, resistances: { poison: 50, holy: -20 } },
  { name: "Zombie Affamé", atk: 12, damageType: "physical", def: 4, magicDef: 1, xpYield: 18, goldYield: 25, image: "🧟", isBoss: false, resistances: { poison: 50, fire: -15 } },
  { name: "Araignée Géante Cavernicole", atk: 15, damageType: "physical", def: 6, magicDef: 4, xpYield: 35, goldYield: 20, image: "🕷️", isBoss: false, resistances: { poison: 30 } },
  { name: "Orc Pilleur des Brumes", atk: 20, damageType: "physical", def: 8, magicDef: 4, xpYield: 45, goldYield: 28, image: "🐗", isBoss: false },
  
  // Core depths (16-29)
  { name: "Liche Reconstituée", atk: 28, damageType: "dark", def: 10, magicDef: 25, xpYield: 60, goldYield: 55, image: "🧙", isBoss: false, resistances: { dark: 40, arcane: 20, holy: -25 } },
  { name: "Golem de Pierre de Taille", atk: 25, damageType: "physical", def: 25, magicDef: 10, xpYield: 90, goldYield: 50, image: "🗿", isBoss: false, resistances: { earth: 45, lightning: -15 } },
  { name: "Minotaure Vagabond", atk: 36, damageType: "physical", def: 18, magicDef: 12, xpYield: 120, goldYield: 80, image: "🐂", isBoss: false },
  { name: "Démon du Soufre", atk: 45, damageType: "fire", def: 20, magicDef: 25, xpYield: 150, goldYield: 130, image: "😈", isBoss: false, resistances: { fire: 50, dark: 25, ice: -20 } },

  // End depths (30+)
  { name: "Dragon d'Émeraude Ancestral", atk: 70, damageType: "physical", def: 45, magicDef: 40, xpYield: 400, goldYield: 350, image: "🐉", isBoss: false, resistances: { nature: 50, poison: 50, fire: 30 } },
  { name: "Seigneur Vampire Céleste", atk: 85, damageType: "dark", def: 40, magicDef: 50, xpYield: 600, goldYield: 500, image: "🧛", isBoss: false, resistances: { dark: 60, blood: 40, holy: -30 } },
  { name: "Titan Obscur Écorché", atk: 110, damageType: "physical", def: 75, magicDef: 60, xpYield: 1000, goldYield: 800, image: "🌌", isBoss: false, resistances: { dark: 50, earth: 40, radiant: -25 } }
];

export const BOSSES_LIBRARY: Omit<Monster, "id" | "hp" | "maxHp">[] = [
  { name: "Giga Gobelin 'Roi des Déchets'", atk: 12, damageType: "physical", def: 6, magicDef: 4, xpYield: 60, goldYield: 100, image: "👑", isBoss: true, resistances: { earth: 15, poison: 20 } }, // Floor 5 Boss
  { name: "Chef de Meute Orc Blindé", atk: 30, damageType: "physical", def: 16, magicDef: 8, xpYield: 150, goldYield: 250, image: "👹", isBoss: true, resistances: { nature: 20 } }, // Floor 10 Boss
  { name: "Gardien du Portail en Obsidienne", atk: 55, damageType: "physical", def: 35, magicDef: 20, xpYield: 450, goldYield: 600, image: "⛓️", isBoss: true, resistances: { fire: 60, earth: 40, water: -15, ice: -10 } }, // Floor 20 Boss
  { name: "La Liche Éternelle 'Malakor'", atk: 90, damageType: "arcane", def: 40, magicDef: 70, xpYield: 1200, goldYield: 1500, image: "🔮", isBoss: true, resistances: { arcane: 70, dark: 50, holy: -35 } }, // Floor 30 Boss
  { name: "Sinueux Dragon Rouge Primordial", atk: 170, damageType: "physical", def: 100, magicDef: 90, xpYield: 5000, goldYield: 6000, image: "🌋", isBoss: true, resistances: { fire: 90, earth: 30, ice: -25 } } // Floor 50+ Boss
];
