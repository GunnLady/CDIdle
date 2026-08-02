import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ITEM_LIBRARY,
  getItemHandedness,
  getItemSlot,
  validateItemCatalog,
} from "../shared/domain/items/items.ts";

const errors = validateItemCatalog();
if (errors.length > 0) throw new Error(`Invalid item catalog:\n${errors.join("\n")}`);

const subtype = (item) => item.itemType === "weapon"
  ? item.weaponTypeId
  : item.itemType === "offhand"
  ? item.offHandTypeId
  : item.itemType === "armor"
  ? item.armorTypeId
  : item.accessoryTypeId;

const rows = ITEM_LIBRARY.map((item) => [
  item.id,
  item.name.replaceAll("|", "\\|"),
  item.itemType,
  subtype(item),
  getItemSlot(item),
  getItemHandedness(item) ?? "—",
  String(item.requiredLevel),
  item.minimumRarity,
  item.provenances.join(", "),
  item.blueprintAvailable ? "oui" : "non",
].join(" | "));

const document = `# Matrice du catalogue d'objets

Fichier généré depuis la source autoritaire \`shared/domain/items\`.
Ne pas modifier manuellement. Nombre de modèles : **${ITEM_LIBRARY.length}**.

| ID | Nom | Type | Sous-type | Emplacement | Maniement | Niveau | Rareté minimale | Provenances | Plan |
|---|---|---|---|---|---|---:|---|---|---|
${rows.map((row) => `| ${row} |`).join("\n")}
`;

const target = resolve("docs/architecture/item-catalog-matrix.md");
if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8");
  if (current !== document) throw new Error("Item catalog matrix is stale");
} else {
  await writeFile(target, document, "utf8");
}
