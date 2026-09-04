import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ITEM_LIBRARY,
  LEGACY_ITEM_EVOLUTION_TARGETS,
  PROGRESSION_ITEM_BASES,
  RARITY_ORDER,
  getItemHandedness,
  getItemSlot,
  validateItemCatalog,
} from "../shared/domain/items/items.ts";
import { calculateHeroDerivedStats } from "../shared/domain/hero-stats.ts";
import { resolveItemInstance } from "../shared/domain/items/scaling.ts";

const errors = validateItemCatalog();
if (errors.length > 0) throw new Error(`Invalid item catalog:\n${errors.join("\n")}`);

const subtype = (item) => item.itemType === "weapon"
  ? item.weaponTypeId
  : item.itemType === "offhand"
  ? item.offHandTypeId
  : item.itemType === "armor"
  ? item.armorTypeId
  : item.accessoryTypeId;

const DPS_REFERENCE_ATTRIBUTES = {
  str: 20,
  agi: 20,
  end: 20,
  int: 20,
  wiz: 20,
  dex: 20,
  luk: 20,
};

const rows = ITEM_LIBRARY.map((item) => [
  item.id,
  item.name.replaceAll("|", "\\|"),
  item.itemType,
  subtype(item),
  getItemSlot(item),
  getItemHandedness(item) ?? "—",
  item.itemType === "weapon" ? item.scaling.category : "—",
  item.itemType === "weapon" ? item.scaling.stat : "—",
  item.catalogStatus,
  item.powerModelId,
  `${item.levelRange.min}-${item.levelRange.max}`,
  String(item.powerReferenceLevel),
  item.minimumRarity,
  item.provenances.join(", "),
  item.blueprintAvailable ? "oui" : "non",
].join(" | "));

const weaponDpsData = ITEM_LIBRARY
  .filter((item) => item.itemType === "weapon")
  .map((item) => {
    const scaled = resolveItemInstance(item, {
      instanceId: `matrix:${item.id}`,
      itemLevel: item.requiredLevel,
      powerModelId: item.powerModelId,
      rarity: item.minimumRarity,
    });
    const derived = calculateHeroDerivedStats(
      DPS_REFERENCE_ATTRIBUTES,
      scaled.modifiers ?? [],
      {
        scaling: scaled.scaling,
        attackProfile: scaled.attackProfile,
        damageRange: scaled.damageRange,
        attackSpeed: scaled.attackSpeed,
      },
    );
    return {
      id: item.id,
      category: item.scaling.category,
      stat: item.scaling.stat,
      rarity: item.minimumRarity,
      requiredLevel: item.requiredLevel,
      handedness: getItemHandedness(item),
      damageRange: scaled.damageRange ? `${scaled.damageRange.min}-${scaled.damageRange.max}` : "—",
      attackSpeed: scaled.attackSpeed ?? 1,
      attackProfile: scaled.attackProfile,
      power: item.scaling.category === "magic" ? derived.magicDamage : derived.physicalDamage,
      heroSpeed: derived.speed,
      criticalChance: derived.criticalChance,
      estimatedDps: derived.estimatedDps,
    };
  });

const weaponDpsRows = weaponDpsData.map((entry) => [
  entry.id,
  entry.category,
  entry.stat,
  entry.rarity,
  String(entry.requiredLevel),
  entry.handedness,
  entry.damageRange,
  String(entry.attackSpeed),
  String(entry.attackProfile.baseStrikes),
  String(entry.attackProfile.powerPerStrike),
  String(entry.power),
  String(entry.heroSpeed),
  String(entry.criticalChance),
  entry.estimatedDps.toFixed(2),
].join(" | "));

const groupedDps = new Map();
for (const entry of weaponDpsData) {
  const key = `${entry.rarity}|${entry.requiredLevel}|${entry.handedness}`;
  const group = groupedDps.get(key) ?? [];
  group.push(entry.estimatedDps);
  groupedDps.set(key, group);
}
const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const groupedDpsRows = [...groupedDps.entries()]
  .map(([key, values]) => {
    const [rarity, requiredLevel, handedness] = key.split("|");
    return {
      rarity,
      requiredLevel: Number(requiredLevel),
      handedness,
      count: values.length,
      median: median(values),
      minimum: Math.min(...values),
      maximum: Math.max(...values),
    };
  })
  .sort((left, right) => (
    left.requiredLevel - right.requiredLevel
    || left.rarity.localeCompare(right.rarity)
    || left.handedness.localeCompare(right.handedness)
  ));

const levelBands = Array.from({ length: 8 }, (_, index) => ({
  min: index * 5 + 1,
  max: index * 5 + 5,
}));

function itemPowerLabel(item, level, rarity) {
  const resolved = resolveItemInstance(item, {
    instanceId: `matrix:${item.id}:${level}:${rarity}`,
    itemLevel: level,
    powerModelId: item.powerModelId,
    rarity,
  });
  const modifierMagnitude = (resolved.modifiers ?? [])
    .reduce((sum, modifier) => sum + Math.abs(modifier.value), 0);
  if (resolved.itemType !== "weapon") return `Σ bonus ${modifierMagnitude}`;
  const derived = calculateHeroDerivedStats(
    DPS_REFERENCE_ATTRIBUTES,
    resolved.modifiers ?? [],
    {
      scaling: resolved.scaling,
      attackProfile: resolved.attackProfile,
      damageRange: resolved.damageRange,
      attackSpeed: resolved.attackSpeed,
    },
  );
  return `${resolved.damageRange.min}-${resolved.damageRange.max} dégâts · ${derived.estimatedDps.toFixed(1)} DPS`;
}

const progressionRows = PROGRESSION_ITEM_BASES.flatMap((item) => levelBands.map((band) => [
  item.id,
  item.name.replaceAll("|", "\\|"),
  item.itemType,
  `${band.min}-${band.max}`,
  ...RARITY_ORDER.map((rarity) => {
    const low = itemPowerLabel(item, band.min, rarity);
    const high = itemPowerLabel(item, band.max, rarity);
    return low === high ? low : `${low} → ${high}`;
  }),
].join(" | ")));

const legacyEvolutionRows = Object.entries(LEGACY_ITEM_EVOLUTION_TARGETS).map(([legacyId, progressionId]) => {
  const legacy = ITEM_LIBRARY.find((item) => item.id === legacyId);
  const progression = ITEM_LIBRARY.find((item) => item.id === progressionId);
  if (!legacy || !progression) throw new Error(`Invalid legacy evolution mapping: ${legacyId} -> ${progressionId}`);
  return [legacyId, legacy.name, progressionId, progression.name]
    .map((value) => value.replaceAll("|", "\\|"))
    .join(" | ");
});

const document = `# Matrice du catalogue d'objets

Fichier généré depuis la source autoritaire \`shared/domain/items\`.
Ne pas modifier manuellement. Nombre de modèles : **${ITEM_LIBRARY.length}**.

| ID | Nom | Type | Sous-type | Emplacement | Maniement | Catégorie | Scaling | Statut | Modèle puissance | Plage niveaux | Niveau référence | Rareté minimale | Provenances | Plan |
|---|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|
${rows.map((row) => `| ${row} |`).join("\n")}

## Intégration des plans historiques

Chaque plan historique connu est converti vers la famille évolutive indiquée.
L'identité et la puissance des objets historiques déjà possédés restent
inchangées.

| Objet/plan historique | Nom historique | Famille évolutive | Nom évolutif |
|---|---|---|---|
${legacyEvolutionRows.map((row) => `| ${row} |`).join("\n")}

## Progression consolidée des ${PROGRESSION_ITEM_BASES.length} bases actives

La rareté est appliquée après le niveau. Pour les armes, chaque cellule donne
la plage de dégâts et le DPS neutre aux deux bornes de la tranche. Pour les
autres objets, elle donne la somme absolue des bonus résolus ; les affixes
additionnels restent déterministes par identité, niveau et rareté.

| Base | Nom | Type | Tranche | Commune | Inhabituelle | Rare | Épique | Légendaire |
|---|---|---|---|---|---|---|---|---|
${progressionRows.map((row) => `| ${row} |`).join("\n")}

## Matrice DPS de référence

Projection neutre de l'attaque normale avec toutes les caractéristiques de base
fixées à **20**, l'objet à sa rareté minimale et ses modificateurs canoniques.
Le DPS est normalisé par cycle d'attaque, avant défense et résistances.

| ID | Catégorie | Scaling | Rareté | Niveau | Maniement | Dégâts arme | Vitesse arme | Frappes base | Puissance/frappe | Puissance | Vitesse héros | Critique (%) | DPS estimé |
|---|---|---|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
${weaponDpsRows.map((row) => `| ${row} |`).join("\n")}

## Médianes DPS par progression et maniement

| Rareté | Niveau requis | Maniement | Armes | Médiane DPS | Minimum | Maximum |
|---|---:|---|---:|---:|---:|---:|
${groupedDpsRows.map((entry) => `| ${entry.rarity} | ${entry.requiredLevel} | ${entry.handedness} | ${entry.count} | ${entry.median.toFixed(2)} | ${entry.minimum.toFixed(2)} | ${entry.maximum.toFixed(2)} |`).join("\n")}
`;

const target = resolve("docs/architecture/item-catalog-matrix.md");
if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8");
  if (current !== document) throw new Error("Item catalog matrix is stale");
} else {
  await writeFile(target, document, "utf8");
}
