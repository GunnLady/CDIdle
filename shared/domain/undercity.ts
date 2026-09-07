import type { Monster } from "../contracts/game.ts";
import type { CanonicalItem, CanonicalItemModifier } from "./items/types.ts";

export const UNDERCITY_DUNGEON_ID = "undercity" as const;
export const UNDERCITY_MAX_FLOOR = 50;
const UNDERCITY_LEADER_MEMBER_INDEX: Readonly<Record<string, number>> = {
  'tribute-collector': 1,
  'smuggler-captain': 1,
  'barricade-warden': 1,
  'outcast-standard-bearer': 1,
  'king-herald': 1,
  'rat-king': 2,
};
export type UndercityEnemyRole = "ordinary" | "protector" | "ranged" | "support" | "guard" | "king";
export type UndercityBehavior = "swarm" | "cover" | "surge" | "king";
export type UndercityEncounterBlueprint = { id: string; name: string; behavior: UndercityBehavior; members: readonly { name: string; role: UndercityEnemyRole }[] };
export type UndercityZone = { id: string; name: string; floorMin: number; floorMax: number; encounters: readonly UndercityEncounterBlueprint[]; elite: UndercityEncounterBlueprint; boss: UndercityEncounterBlueprint; themeModifiers: readonly (CanonicalItemModifier & { requiresDamageType?: "physical" | "magic" })[] };

const solo = (id: string, name: string, behavior: UndercityBehavior = "surge"): UndercityEncounterBlueprint => ({ id, name, behavior, members: [{ name, role: "ordinary" }] });
const pack = (id: string, name: string, members: readonly string[], behavior: UndercityBehavior = "swarm"): UndercityEncounterBlueprint => ({ id, name, behavior, members: members.map((member) => ({ name: member, role: "ordinary" as const })) });
const escort = (id: string, name: string, members: readonly string[]): UndercityEncounterBlueprint => ({ id, name, behavior: "cover", members: members.map((member, index) => ({ name: member, role: (["protector", "ranged", "support"] as const)[index] ?? "ordinary" })) });

export const UNDERCITY_ZONES: readonly UndercityZone[] = [
  {
    id: "sewers", name: "Égouts infestés", floorMin: 1, floorMax: 10,
    encounters: [
      pack("rat-pack", "Meute de rats", ["Rat des canaux", "Rat affamé", "Rat de gouttière"]),
      pack("beetle-swarm", "Nuée de scarabées", ["Scarabée des déchets", "Scarabée des boues", "Scarabée de canalisation"]),
      solo("pipe-slime", "Limon des conduits"), solo("colossal-rat", "Rat colossal", "swarm"),
    ],
    elite: pack("sewer-warden", "Gardien des conduits", ["Rat gardien", "Rat des grilles"]),
    boss: solo("vermin-mother", "La Mère des nuisibles"),
    themeModifiers: [{ stat: "maxHp", type: "percent", value: 5 }, { stat: "physicalDefense", type: "percent", value: 8 }, { stat: "poisonResistance", type: "flat", value: 8 }, { stat: "dodgeChance", type: "flat", value: 2 }],
  },
  {
    id: "smugglers", name: "Galeries des contrebandiers", floorMin: 11, floorMax: 20,
    encounters: [
      escort("smuggler-escort", "Escorte des passeurs", ["Protecteur des passeurs", "Tireur des passeurs", "Soigneur des passeurs"]),
      pack("goblin-scavengers", "Récupérateurs gobelins", ["Gobelin ferrailleur", "Gobelin guetteur"]),
      pack("hound-handler", "Dresseur et molosse", ["Molosse des tunnels", "Dresseur des tunnels"], "cover"),
      solo("tribute-cutthroat", "Coupe-jarret du tribut", "cover"),
    ],
    elite: escort("smuggler-captain", "Capitaine des passeurs", ["Garde du capitaine", "Capitaine des passeurs", "Aide du capitaine"]),
    boss: escort("tribute-collector", "Le Collecteur du tribut", ["Garde du tribut", "Le Collecteur du tribut", "Apothicaire du tribut"]),
    themeModifiers: [{ stat: "speed", type: "percent", value: 5 }, { stat: "criticalChance", type: "flat", value: 2 }, { stat: "dodgeChance", type: "flat", value: 2 }, { stat: "physicalDamage", type: "percent", value: 8, requiresDamageType: "physical" }],
  },
  {
    id: "cisterns", name: "Citernes oubliées", floorMin: 21, floorMax: 30,
    encounters: [
      pack("water-parasites", "Colonie de parasites", ["Parasite des eaux", "Parasite des vannes", "Parasite des profondeurs"]),
      solo("reservoir-slime", "Limon des réservoirs"), solo("refuge-warden", "Gardien des refuges"),
      pack("cistern-leeches", "Sangsues des citernes", ["Sangsue pâle", "Sangsue des grilles"]),
    ],
    elite: pack("valve-sentinel", "Sentinelle des vannes", ["Sentinelle des vannes", "Parasite des vannes"]),
    boss: solo("dead-water-warden", "Le Gardien des eaux mortes"),
    themeModifiers: [{ stat: "maxHp", type: "percent", value: 5 }, { stat: "physicalDefense", type: "percent", value: 8 }, { stat: "waterResistance", type: "flat", value: 8 }, { stat: "poisonResistance", type: "flat", value: 8 }],
  },
  {
    id: "bastion", name: "Bastion des Exclus", floorMin: 31, floorMax: 40,
    encounters: [
      solo("banished-sentinel", "Sentinelle bannie", "cover"),
      pack("exile-patrol", "Patrouille des exilés", ["Veilleur des barricades", "Arbalétrier exilé"]),
      escort("bastion-defenders", "Défenseurs du bastion", ["Porte-bouclier exilé", "Frondeur des remparts", "Guérisseur des bannis"]),
      solo("barricade-colossus", "Colosse des barricades"),
    ],
    elite: escort("barricade-warden", "Gardien des barricades", ["Garde des barricades", "Gardien des barricades", "Guérisseur des bannis"]),
    boss: escort("outcast-standard-bearer", "Le Porte-étendard des Exclus", ["Garde des remparts", "Le Porte-étendard des Exclus", "Guérisseur du bastion"]),
    themeModifiers: [{ stat: "physicalDefense", type: "percent", value: 8 }, { stat: "magicDefense", type: "percent", value: 8 }, { stat: "darkResistance", type: "flat", value: 8 }, { stat: "maxHp", type: "percent", value: 5 }],
  },
  {
    id: "court", name: "Cour du Roi des Rats", floorMin: 41, floorMax: 50,
    encounters: [
      escort("court-guard", "Garde des exclus", ["Bouclier de la Cour", "Arbalétrier de la Cour", "Soigneur de la Cour"]),
      pack("court-vermin", "Vermine de la Cour", ["Rat couronné", "Rat des oubliettes"]),
      escort("chamberlain-escort", "Escorte du chambellan", ["Garde du chambellan", "Chambellan des profondeurs", "Apothicaire de la Cour"]),
      solo("court-champion", "Champion de la Cour"),
    ],
    elite: escort("king-herald", "Héraut du Roi", ["Garde du Héraut", "Héraut du Roi", "Soigneur de la Cour"]),
    boss: { id: "rat-king", name: "Le Roi des Rats", behavior: "king", members: [{ name: "Garde des exclus gauche", role: "guard" }, { name: "Garde des exclus droite", role: "guard" }, { name: "Le Roi des Rats", role: "king" }] },
    themeModifiers: [{ stat: "criticalChance", type: "flat", value: 2 }, { stat: "speed", type: "percent", value: 5 }, { stat: "physicalDamage", type: "percent", value: 8, requiresDamageType: "physical" }, { stat: "magicDamage", type: "percent", value: 8, requiresDamageType: "magic" }, { stat: "maxMana", type: "percent", value: 5 }],
  },
] as const;

export function getUndercityZone(floor: number): UndercityZone {
  if (!Number.isInteger(floor) || floor < 1 || floor > UNDERCITY_MAX_FLOOR) throw new Error("INVALID_UNDERCITY_FLOOR");
  return UNDERCITY_ZONES[Math.floor((floor - 1) / 10)];
}
export function getUndercityEncounterBlueprint(floor: number, room: number, roomCount: number, entropy: number): UndercityEncounterBlueprint {
  const zone = getUndercityZone(floor);
  if (room === roomCount && floor % 10 === 0) return zone.boss;
  if (room === roomCount && floor % 5 === 0) return zone.elite;
  return zone.encounters[Math.min(zone.encounters.length - 1, Math.floor(Math.max(0, Math.min(0.999999999, entropy)) * zone.encounters.length))];
}
export function getUndercityFixedVictoryId(floor: number, room: number, roomCount: number): string | null {
  if (room !== roomCount || floor % 5 !== 0 || floor < 1 || floor > UNDERCITY_MAX_FLOOR) return null;
  return UNDERCITY_DUNGEON_ID + ":" + (floor % 10 === 0 ? "boss" : "elite") + ":" + String(floor).padStart(2, "0");
}
export function getUndercityCheckpoint(completedFloors: readonly number[]): number {
  if (completedFloors.length === 0) return 0;
  return Math.min(...completedFloors.map((floor) => Math.floor(Math.max(0, Math.min(UNDERCITY_MAX_FLOOR, floor)) / 5) * 5));
}
function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193); }
  return hash >>> 0;
}
export function resolveUndercityThemeModifier(floor: number, instanceId: string, item: CanonicalItem): CanonicalItemModifier {
  const zone = getUndercityZone(floor);
  const damageTypes = item.itemType === "weapon" ? item.damageTypes ?? [] : [];
  const compatible = zone.themeModifiers.filter((modifier) => !modifier.requiresDamageType
    || damageTypes.includes(modifier.requiresDamageType === "magic" ? "arcane" : modifier.requiresDamageType)
    || (modifier.requiresDamageType === "magic" && damageTypes.some((type) => type !== "physical")));
  const selected = compatible[stableHash(zone.id + ":" + instanceId) % compatible.length];
  return { stat: selected.stat, type: selected.type, value: selected.value };
}
export type UndercityEnemy = Monster & { role: UndercityEnemyRole; intent: string };
function partition(total: number, count: number): number[] {
  const integer = Math.floor(total);
  const quotient = Math.floor(integer / count);
  return Array.from({ length: count }, (_, index) => quotient + (index < integer % count ? 1 : 0));
}
export function createUndercityEnemyGroup(source: Monster, blueprint: UndercityEncounterBlueprint): UndercityEnemy[] {
  const hitPoints = partition(source.maxHp, blueprint.members.length);
  const attacks = partition(source.atk, blueprint.members.length);
  const leaderIndex = UNDERCITY_LEADER_MEMBER_INDEX[blueprint.id] ?? 0;
  return blueprint.members.map((member, index) => ({
    ...source, id: blueprint.members.length === 1 ? source.id : source.id + ":member:" + index, name: member.name,
    hp: hitPoints[index], maxHp: hitPoints[index], atk: Math.max(1, attacks[index]), role: member.role,
    isBoss: Boolean(source.isBoss && index === leaderIndex),
    intent: member.role === "support" ? "Soutien" : member.role === "protector" || member.role === "guard" ? "Protection" : "Attaque",
  }));
}
