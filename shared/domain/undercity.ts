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
export type UndercityEncounterBlueprint = { id: string; name: string; behavior: UndercityBehavior; members: readonly { key: string; name: string; role: UndercityEnemyRole }[] };
type UndercityZoneDefinition = { id: string; name: string; floorMin: number; floorMax: number; encounters: readonly UndercityEncounterBlueprint[]; elite: UndercityEncounterBlueprint; boss: UndercityEncounterBlueprint; themeModifiers: readonly (CanonicalItemModifier & { requiresDamageType?: "physical" | "magic" })[] };

type UndercityMemberSeed = readonly [key: string, name: string];
const solo = (id: string, name: string, behavior: UndercityBehavior = "surge"): UndercityEncounterBlueprint => ({ id, name, behavior, members: [{ key: "a", name, role: "ordinary" }] });
const pack = (id: string, name: string, members: readonly UndercityMemberSeed[], behavior: UndercityBehavior = "swarm"): UndercityEncounterBlueprint => ({ id, name, behavior, members: members.map(([key, memberName]) => ({ key, name: memberName, role: "ordinary" as const })) });
const escort = (id: string, name: string, members: readonly UndercityMemberSeed[]): UndercityEncounterBlueprint => ({ id, name, behavior: "cover", members: members.map(([key, memberName], index) => ({ key, name: memberName, role: (["protector", "ranged", "support"] as const)[index] ?? "ordinary" })) });

export const UNDERCITY_ZONES = [
  {
    id: "sewers", name: "Égouts infestés", floorMin: 1, floorMax: 10,
    encounters: [
      pack("rat-pack", "Meute de rats", [["a", "Rat des canaux"], ["b", "Rat galeux"], ["c", "Rat pestiféré"]]),
      pack("beetle-swarm", "Nuée de cafards", [["a", "Cafard charognard"], ["b", "Cafard noir des égouts"], ["c", "Cafard des conduits"]]),
      solo("pipe-slime", "Slime des égouts"), solo("colossal-rat", "Rat colossal", "swarm"),
    ],
    elite: pack("sewer-warden", "Gardien des conduits", [["a", "Mordeur des écluses"], ["b", "Ronge-fer"]]),
    boss: solo("vermin-mother", "La Mère des nuisibles"),
    themeModifiers: [{ stat: "maxHp", type: "percent", value: 5 }, { stat: "physicalDefense", type: "percent", value: 8 }, { stat: "poisonResistance", type: "flat", value: 8 }, { stat: "dodgeChance", type: "flat", value: 2 }],
  },
  {
    id: "smugglers", name: "Galeries des contrebandiers", floorMin: 11, floorMax: 20,
    encounters: [
      escort("smuggler-escort", "Escorte des passeurs", [["a", "Brise-lames des passeurs"], ["b", "Arbalétrier des passeurs"], ["c", "Médecin des tunnels"]]),
      pack("goblin-scavengers", "Récupérateurs gobelins", [["a", "Fouilleur de cuivre"], ["b", "Guetteur gobelin"]]),
      pack("hound-handler", "Dresseur et molosse", [["a", "Molosse brise-chaîne"], ["b", "Maître-chaînes des galeries"]], "cover"),
      solo("tribute-cutthroat", "Coupe-jarret du tribut", "cover"),
    ],
    elite: escort("smuggler-captain", "Capitaine des passeurs", [["a", "Lame jurée du capitaine"], ["b", "Capitaine des passeurs"], ["c", "Alchimiste du capitaine"]]),
    boss: escort("tribute-collector", "Le Collecteur du tribut", [["a", "Garde du tribut"], ["b", "Le Collecteur du tribut"], ["c", "Apothicaire du tribut"]]),
    themeModifiers: [{ stat: "speed", type: "percent", value: 5 }, { stat: "criticalChance", type: "flat", value: 2 }, { stat: "dodgeChance", type: "flat", value: 2 }, { stat: "physicalDamage", type: "percent", value: 8, requiresDamageType: "physical" }],
  },
  {
    id: "cisterns", name: "Citernes oubliées", floorMin: 21, floorMax: 30,
    encounters: [
      pack("water-parasites", "Couvée des eaux croupies", [["a", "Lamproie de vase"], ["b", "Crabe des vannes"], ["c", "Anguille des fosses noires"]]),
      solo("reservoir-slime", "Slime des eaux mortes"), solo("refuge-warden", "Veilleur noyé"),
      pack("cistern-leeches", "Sangsues des citernes", [["a", "Sangsue blême"], ["b", "Sangsue cuirassée"]]),
    ],
    elite: pack("valve-sentinel", "Sentinelle hydrique", [["a", "Sentinelle hydrique"], ["b", "Crabe des vannes"]]),
    boss: solo("dead-water-warden", "Le Gardien des eaux mortes"),
    themeModifiers: [{ stat: "maxHp", type: "percent", value: 5 }, { stat: "physicalDefense", type: "percent", value: 8 }, { stat: "waterResistance", type: "flat", value: 8 }, { stat: "poisonResistance", type: "flat", value: 8 }],
  },
  {
    id: "bastion", name: "Bastion des Exclus", floorMin: 31, floorMax: 40,
    encounters: [
      solo("banished-sentinel", "Veilleur sans-bannière", "cover"),
      pack("exile-patrol", "Patrouille des exilés", [["a", "Guetteur des palissades"], ["b", "Trait-noir des exilés"]]),
      escort("bastion-defenders", "Défenseurs du bastion", [["a", "Rempart des bannis"], ["b", "Œil des remparts"], ["c", "Chirurgien des proscrits"]]),
      solo("barricade-colossus", "Brise-siège des barricades"),
    ],
    elite: escort("barricade-warden", "Gardien des barricades", [["a", "Lame des barricades"], ["b", "Gardien des barricades"], ["c", "Chirurgien des proscrits"]]),
    boss: escort("outcast-standard-bearer", "Le Porte-étendard des Exclus", [["a", "Garde des remparts"], ["b", "Le Porte-étendard des Exclus"], ["c", "Chirurgien du bastion"]]),
    themeModifiers: [{ stat: "physicalDefense", type: "percent", value: 8 }, { stat: "magicDefense", type: "percent", value: 8 }, { stat: "darkResistance", type: "flat", value: 8 }, { stat: "maxHp", type: "percent", value: 5 }],
  },
  {
    id: "court", name: "Cour du Roi des Rats", floorMin: 41, floorMax: 50,
    encounters: [
      escort("court-guard", "Garde des sans-couronne", [["a", "Pavois vivant de la Cour"], ["b", "Arbalétrier royal"], ["c", "Médecin des oubliettes"]]),
      pack("court-vermin", "Vermine de la Cour", [["a", "Rat couronné"], ["b", "Dévoreur des oubliettes"]]),
      escort("chamberlain-escort", "Escorte du chambellan", [["a", "Lame du chambellan"], ["b", "Chambellan des profondeurs"], ["c", "Alchimiste des profondeurs"]]),
      solo("court-champion", "Champion de la Cour"),
    ],
    elite: escort("king-herald", "Héraut du Roi", [["a", "Porte-lame du Héraut"], ["b", "Héraut du Roi"], ["c", "Médecin des oubliettes"]]),
    boss: { id: "rat-king", name: "Le Roi des Rats", behavior: "king", members: [{ key: "a", name: "Lame senestre du Roi", role: "guard" }, { key: "b", name: "Lame dextre du Roi", role: "guard" }, { key: "c", name: "Le Roi des Rats", role: "king" }] },
    themeModifiers: [{ stat: "criticalChance", type: "flat", value: 2 }, { stat: "speed", type: "percent", value: 5 }, { stat: "physicalDamage", type: "percent", value: 8, requiresDamageType: "physical" }, { stat: "magicDamage", type: "percent", value: 8, requiresDamageType: "magic" }, { stat: "maxMana", type: "percent", value: 5 }],
  },
] as const satisfies readonly UndercityZoneDefinition[];

export type UndercityZoneId = typeof UNDERCITY_ZONES[number]["id"];
export type UndercityZone = Omit<UndercityZoneDefinition, "id"> & { id: UndercityZoneId };

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
