// Frozen French vocabulary V1. Changes that rename instances require a versioning plan.
export type NamingForm = 'ms' | 'fs' | 'mp' | 'fp';
export type NamingForms = Record<NamingForm, string>;
export type NamingFamily = { name: string; form: NamingForm; organic?: boolean };

export const NAMING_FAMILIES: Readonly<Record<string, NamingFamily>> = {
  progression_sword: { name: 'Épée', form: 'fs' },
  progression_saber: { name: 'Sabre', form: 'ms' },
  progression_greatsword: { name: 'Épée lourde', form: 'fs' },
  progression_axe: { name: 'Hache', form: 'fs' },
  progression_greataxe: { name: 'Grande hache', form: 'fs' },
  progression_mace: { name: 'Masse', form: 'fs' },
  progression_greatmace: { name: 'Grande masse', form: 'fs' },
  progression_spear: { name: 'Lance', form: 'fs' },
  progression_dagger: { name: 'Dague', form: 'fs' },
  progression_shortbow: { name: 'Arc court', form: 'ms' },
  progression_longbow: { name: 'Arc long', form: 'ms' },
  progression_crossbow: { name: 'Arbalète', form: 'fs' },
  progression_rifle: { name: 'Fusil', form: 'ms' },
  progression_staff: { name: 'Bâton', form: 'ms' },
  progression_wand: { name: 'Baguette', form: 'fs' },
  progression_spellbook: { name: 'Grimoire', form: 'ms' },
  progression_lute: { name: 'Instrument', form: 'ms' },
  progression_bo: { name: 'Bô', form: 'ms' },
  progression_gauntlets: { name: 'Gantelets', form: 'mp' },
  progression_knuckles: { name: 'Poings', form: 'mp' },
  progression_gear_cannon: { name: 'Canon à engrenages', form: 'ms' },
  progression_dual_swords: { name: 'Épées jumelles', form: 'fp' },
  progression_dual_sabers: { name: 'Sabres jumeaux', form: 'mp' },
  progression_dual_axes: { name: 'Haches jumelles', form: 'fp' },
  progression_dual_daggers: { name: 'Dagues jumelles', form: 'fp' },
  progression_cloth_armor: { name: 'Tenue en tissu', form: 'fs' },
  progression_leather_armor: { name: 'Armure de cuir', form: 'fs' },
  progression_chainmail: { name: 'Cotte de mailles', form: 'fs' },
  progression_plate_armor: { name: 'Armure de plates', form: 'fs' },
  progression_magic_robe: { name: 'Robe magique', form: 'fs' },
  progression_shield: { name: 'Bouclier', form: 'ms' },
  progression_buckler: { name: 'Rondache', form: 'fs' },
  progression_tower_shield: { name: 'Pavois', form: 'ms' },
  progression_arcane_orb: { name: 'Orbe arcanique', form: 'ms' },
  progression_crystal_focus: { name: 'Cristal de focalisation', form: 'ms' },
  progression_spell_lantern: { name: 'Lanterne arcanique', form: 'fs' },
  progression_prayer_beads: { name: 'Chapelet', form: 'ms' },
  progression_sanctified_censer: { name: 'Encensoir', form: 'ms' },
  progression_bible: { name: 'Livre sacré', form: 'ms' },
  progression_living_branch: { name: 'Branche vivante', form: 'fs', organic: true },
  progression_verdant_seed: { name: 'Graine verdoyante', form: 'fs', organic: true },
  progression_moonlit_leaf: { name: 'Feuille lunaire', form: 'fs', organic: true },
  progression_ring: { name: 'Anneau', form: 'ms' },
  progression_amulet: { name: 'Amulette', form: 'fs' },
  progression_bracelet: { name: 'Bracelet', form: 'ms' },
  progression_belt: { name: 'Ceinture', form: 'fs' },
  progression_cloak: { name: 'Cape', form: 'fs' },
  progression_charm: { name: 'Charme', form: 'ms' },
};

// Explicit forms, not an algorithm that guesses French agreements.
export const NAMING_STYLES: Readonly<Record<string, NamingForms>> = {
  worked: { ms: 'ouvragé', fs: 'ouvragée', mp: 'ouvragés', fp: 'ouvragées' },
  refined: { ms: 'raffiné', fs: 'raffinée', mp: 'raffinés', fp: 'raffinées' },
  remarkable: { ms: 'remarquable', fs: 'remarquable', mp: 'remarquables', fp: 'remarquables' },
  flourishing: { ms: 'florissant', fs: 'florissante', mp: 'florissants', fp: 'florissantes' },
  radiant: { ms: 'resplendissant', fs: 'resplendissante', mp: 'resplendissants', fp: 'resplendissantes' },
  sovereign: { ms: 'souverain', fs: 'souveraine', mp: 'souverains', fp: 'souveraines' },
  august: { ms: 'auguste', fs: 'auguste', mp: 'augustes', fp: 'augustes' },
  sublime: { ms: 'sublime', fs: 'sublime', mp: 'sublimes', fp: 'sublimes' },
  exceptional: { ms: 'd’exception', fs: 'd’exception', mp: 'd’exception', fp: 'd’exception' },
};

export type NamingTheme = {
  id: string;
  kind: 'offense' | 'mobility' | 'defense' | 'resource';
  stat?: string;
  damageType?: string;
  suffixes: readonly string[];
  titles: readonly string[];
};

const coreThemes: NamingTheme[] = [
  { id: 'might', kind: 'offense', stat: 'physicalDamage', suffixes: ['de puissance', 'de l’assaut', 'de frappe'], titles: ['Brise-fer', 'Dernier assaut', 'Jugement du fer'] },
  { id: 'sorcery', kind: 'offense', stat: 'magicDamage', suffixes: ['de sorcellerie', 'de puissance mystique', 'des sortilèges'], titles: ['Écho du mystère', 'Serment du mage', 'Volonté des arcanes'] },
  { id: 'precision', kind: 'offense', stat: 'criticalChance', suffixes: ['de précision', 'du coup décisif', 'de l’instant juste'], titles: ['Dernier verdict', 'Instant décisif', 'Destin tranché'] },
  { id: 'swiftness', kind: 'mobility', stat: 'speed', suffixes: ['de vivacité', 'de célérité', 'du vif élan'], titles: ['Élan sans fin', 'Premier mouvement', 'Course des étoiles'] },
  { id: 'evasion', kind: 'mobility', stat: 'dodgeChance', suffixes: ['de l’esquive', 'du pas léger', 'de dérobade'], titles: ['Pas insaisissable', 'Danse hors d’atteinte', 'Dernière échappée'] },
  { id: 'vigor', kind: 'resource', stat: 'maxHp', suffixes: ['de vigueur', 'de vitalité', 'du second souffle'], titles: ['Souffle éternel', 'Cœur invaincu', 'Serment de vie'] },
  { id: 'insight', kind: 'resource', stat: 'maxMana', suffixes: ['de réserve mystique', 'de mana', 'du puits intérieur'], titles: ['Source intarissable', 'Puits des songes', 'Océan intérieur'] },
  { id: 'bulwark', kind: 'defense', stat: 'physicalDefense', suffixes: ['du rempart', 'de garde', 'de protection'], titles: ['Dernier rempart', 'Serment du bastion', 'Garde immuable'] },
  { id: 'ward', kind: 'defense', stat: 'magicDefense', suffixes: ['de garde mystique', 'du rempart mystique', 'de protection magique'], titles: ['Sceau inviolé', 'Gardien du voile', 'Bastion des songes'] },
];

// Resistance and offensive element remain different semantic keys.
const elements = [
  ['fire', 'le feu', 'du feu', 'Brasier'], ['ice', 'la glace', 'du givre', 'Givre'],
  ['water', 'l’eau', 'des marées', 'Marée'], ['earth', 'la terre', 'de la terre', 'Roc'],
  ['wind', 'le vent', 'des vents', 'Tempête'], ['lightning', 'la foudre', 'de la foudre', 'Foudre'],
  ['holy', 'le sacré', 'du sacré', 'Sanctuaire'], ['dark', 'l’ombre', 'des ombres', 'Ombre'],
  ['nature', 'la nature', 'de la nature', 'Sylve'], ['arcane', 'les arcanes', 'des arcanes', 'Arcane'],
  ['poison', 'le poison', 'du poison', 'Venin'], ['blood', 'le sang', 'du sang', 'Sang'],
  ['sound', 'le son', 'des résonances', 'Résonance'], ['radiant', 'le radiant', 'du rayonnement', 'Rayonnement'],
] as const;

export const NAMING_THEMES: readonly NamingTheme[] = [...coreThemes, ...elements.flatMap(([element, against, of, noun]): NamingTheme[] => [
  { id: `resist-${element}`, kind: 'defense', stat: `${element}Resistance`, suffixes: [`de garde contre ${against}`, `contre ${against}`], titles: [`Rempart ${of}`, `Garde contre ${against}`, `Dernière garde contre ${against}`, `Serment contre ${against}`] },
  { id: `damage-${element}`, kind: 'offense', damageType: element, suffixes: [of], titles: [`${noun} sans fin`, `Éveil ${of}`, `Appel ${of}`, `Courroux ${of}`] },
])];

export const NEUTRAL_TITLES = ['Serment de l’aube', 'Mémoire des âges', 'Héritage du veilleur'];
