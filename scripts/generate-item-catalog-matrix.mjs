import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ITEM_LIBRARY,
  getItemHandedness,
  getItemSlot,
  validateItemCatalog,
} from "../shared/domain/items/items.ts";
import { calculateHeroDerivedStats } from "../shared/domain/hero-stats.ts";
import { applyItemRarityScaling } from "../shared/domain/items/scaling.ts";

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
  String(item.requiredLevel),
  item.minimumRarity,
  item.provenances.join(", "),
  item.blueprintAvailable ? "oui" : "non",
].join(" | "));

const weaponDpsData = ITEM_LIBRARY
  .filter((item) => item.itemType === "weapon")
  .map((item) => {
    const scaled = applyItemRarityScaling(item, item.minimumRarity);
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

const document = `# Matrice du catalogue d'objets

Fichier généré depuis la source autoritaire \`shared/domain/items\`.
Ne pas modifier manuellement. Nombre de modèles : **${ITEM_LIBRARY.length}**.

| ID | Nom | Type | Sous-type | Emplacement | Maniement | Catégorie | Scaling | Niveau | Rareté minimale | Provenances | Plan |
|---|---|---|---|---|---|---|---|---:|---|---|---|
${rows.map((row) => `| ${row} |`).join("\n")}

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
