import { isUndercity, undercityLocation, undercityMonster } from './undercity-experiment.mjs';
// Harness only. No production imports this experimental catalogue.
export const BESTIARY_REGIONS = [
  { id: 'sewers', name: 'Les Dessous de la Cité', areas: ['Égouts', 'Repaire des pillards'], element: 'physical',
    names: ['Rat des canalisations', 'Scarabée de ferraille', 'Gobelin éclaireur', 'Limoneux des égouts', 'Brigand masqué', 'Gobelin récupérateur'], rare: 'Le Porte-clefs des oubliettes', signature: 'Talisman du récupérateur' },
  { id: 'roots', name: 'Les Racines Affamées', areas: ['Champignonnières', 'Territoire orc'], element: 'nature',
    names: ['Araignée cavernicole', 'Orc cuirassé', 'Myconide crache-spores', 'Sangsue des racines', 'Sanglier fongique', 'Orc chasseur'], rare: 'La Matriarche des spores', signature: 'Carapace fongique' },
  { id: 'forge', name: 'Les Forges Ensevelies', areas: ['Carrières abandonnées', 'Fonderie d’obsidienne'], element: 'fire',
    names: ['Automate mineur', 'Golem de taille', 'Salamandre de braise', 'Scorie vivante', 'Crabe de minerai', 'Contremaître lié'], rare: 'Le Creuset errant', signature: 'Marteau du creuset' },
  { id: 'crypt', name: 'La Nécropole des Serments', areas: ['Ossuaires', 'Palais funéraire'], element: 'dark',
    names: ['Squelette guerrier', 'Chevalier creux', 'Archiviste spectral', 'Zombie affamé', 'Porteur de cloche', 'Liche mineure'], rare: 'Seigneur Vampire Céleste', signature: 'Sceau des serments' },
  { id: 'core', name: 'Le Cœur Primordial', areas: ['Sanctuaire draconique', 'Faille volcanique'], element: 'fire',
    names: ['Rejeton draconique', 'Gardien des œufs', 'Démon du soufre', 'Basilic de cendre', 'Drake affamé', 'Fragment de titan'], rare: 'Dragon d’Émeraude Ancestral', signature: 'Écaille primordiale' },
];
export const BESTIARY_ROLES = [
  { id: 'common', hp: 1, attack: 1, defense: 1, magicDefense: 1 },
  { id: 'armored', hp: 1.05, attack: .85, defense: 1.3, magicDefense: .75 },
  { id: 'striker', hp: .8, attack: 1.15, defense: .8, magicDefense: .8 },
  { id: 'attrition', hp: 1.15, attack: .85, defense: .9, magicDefense: .9 },
  { id: 'warden', hp: 1, attack: .95, defense: .85, magicDefense: 1.25 },
  { id: 'hunter', hp: .9, attack: 1.1, defense: .85, magicDefense: .9 },
];
export function regionAt(floor, profile) {
  if(isUndercity(profile)) return undercityLocation(floor);
  if (!Number.isInteger(floor) || floor < 1) throw new Error('Invalid bestiary floor');
  const offset = (floor - 1) % 50;
  return { region: BESTIARY_REGIONS[Math.floor(offset / 10)], cycle: Math.floor((floor - 1) / 50), area: Math.floor(offset % 10 / 5) };
}
// Separate deterministic entropy: no additional draw in the gameplay RNG.
function sample(entropy, salt) {
  let n = ((entropy * 0x100000000) >>> 0) ^ salt;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 0x100000000;
}
export function experimentMonster(monster, floor, room, entropy, variant) {
  if(isUndercity(variant)) return undercityMonster(monster,floor,entropy,variant);
  const location = regionAt(floor);
  const major = monster.isBoss && floor % 10 === 0;
  let region = location.region;
  const transition = !major && floor % 10 >= 9 && sample(entropy, 17) < .2;
  if (transition) region = BESTIARY_REGIONS[(BESTIARY_REGIONS.indexOf(region) + 1) % 5];
  // First half introduces four roles; second half broadens to all six.
  const roleIndex = Math.floor(sample(entropy, 31) * (location.area === 0 ? 4 : 6));
  const role = BESTIARY_ROLES[roleIndex];
  const rare = variant === 'bestiaryRares' && !monster.isBoss && sample(entropy, 71) < .04;
  const speciesId = major ? 'boss-' + Math.floor((floor - 1) / 10) : region.id + ':' + (rare ? 'rare' : role.id);
  const metadata = { region: location.region.id, speciesRegion: region.id, area: location.area, cycle: location.cycle,
    speciesId, role: major ? 'boss' : role.id, rare, transition, signature: rare ? region.signature : null };
  if (!['bestiaryRegions', 'bestiaryStats', 'bestiaryElements', 'bestiaryRoles', 'bestiaryRares'].includes(variant)) return { monster, metadata: { ...metadata, speciesId: monster.name, rare: false, transition: false, signature: null } };
  // Boss identities, stats and loot tables stay aligned with the canonical milestone.
  if (major) return { monster, metadata };
  let name = rare ? region.rare : region.names[roleIndex];
  if (location.cycle > 0) name += ' — Écho des profondeurs ' + location.cycle;
  if (monster.isBoss) name += ' d’élite';
  let result = { ...monster, name };
  if (['bestiaryStats', 'bestiaryRoles', 'bestiaryRares'].includes(variant)) {
    const hp = Math.max(1, Math.round(monster.maxHp * role.hp));
    result = { ...result, maxHp: hp, hp,
      atk: Math.max(1, Math.round(monster.atk * role.attack)),
      def: Math.max(0, Math.round(monster.def * role.defense)),
      magicDef: Math.max(0, Math.round(monster.magicDef * role.magicDefense)) };
  }
  if (['bestiaryElements', 'bestiaryRoles', 'bestiaryRares'].includes(variant)) {
    const damageType = role.id === 'striker' || role.id === 'warden' ? region.element : 'physical';
    result = { ...result, damageType, resistances: damageType === 'physical' ? {} : { [damageType]: 15, holy: region.id === 'crypt' ? -15 : 0 } };
  }
  // Rares deliberately have the same combat budget and actual rewards as their role.
  return { monster: result, metadata };
}
export function createBestiaryLedger(profile) {
  return { profile, phases: {}, regions: {}, discoveries: {}, signatureOpportunities: {}, exceptionalRooms: {}, classes: [], fights: 0 };
}
export function observeBestiary(ledger, encounter, metadata) {
  const location = regionAt(encounter.floor, ledger.profile);
  const row = ledger.regions[location.region.id + ':cycle' + location.cycle] ??= {
    encounters: 0, fights: 0, victories: 0, defeats: 0, rares: 0, transitions: 0, rounds: 0,
    gold: 0, items: 0, seconds: 0, recoverySeconds: 0, roles: {},
  };
  row.encounters++;
  row.gold += encounter.rewards.gold;
  row.items += encounter.rewards.loot.filter((l) => l.type === 'item').length;
  if (encounter.kind !== 'fight') {
    const label = location.region.id + ':' + encounter.kind;
    ledger.exceptionalRooms[label] = (ledger.exceptionalRooms[label] ?? 0) + 1;
    return;
  }
  ledger.fights++; row.fights++; row.rounds += encounter.roundCount;
  row.victories += encounter.outcome === 'victory' ? 1 : 0;
  row.defeats += encounter.outcome === 'defeat' ? 1 : 0;
  row.rares += metadata.rare ? 1 : 0; row.transitions += metadata.transition ? 1 : 0;
  row.roles[metadata.role] = (row.roles[metadata.role] ?? 0) + 1;
  const discovery = ledger.discoveries[metadata.speciesId] ??= { encounters: 0, kills: 0, knownResistances: false, knownLoot: false };
  discovery.encounters++;
  discovery.kills += encounter.outcome === 'victory' ? 1 : 0;
  discovery.knownResistances = discovery.kills >= 1;
  discovery.knownLoot = discovery.kills >= 5;
  // Sidecar opportunities only, NOT items generated or awarded to a saved character.
  if (metadata.signature && encounter.outcome === 'victory') {
    ledger.signatureOpportunities[metadata.signature] = (ledger.signatureOpportunities[metadata.signature] ?? 0) + 1;
  }
}
