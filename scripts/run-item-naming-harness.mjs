import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { once } from 'node:events';
import { finished } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ITEM_LIBRARY, PROGRESSION_ITEM_BASES, RARITY_ORDER } from '../shared/domain/items/items.ts';
import { resolveItemInstance } from '../shared/domain/items/scaling.ts';
import { nameItem, ITEM_NAMING_VERSION, MAX_ITEM_NAME_LENGTH } from '../shared/domain/items/naming.ts';
import { NAMING_FAMILIES, NAMING_THEMES } from '../shared/data/item-naming-v1.ts';

const args = process.argv.slice(2);
if (args.some((arg) => !/^--(seeds|seed-offset)=\d+$/.test(arg))) throw new Error('Usage: npm.cmd run test:item-naming -- --seeds=100 --seed-offset=0');
const option = (name, fallback) => Number(args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
const seeds = option('seeds', 100);
const seedOffset = option('seed-offset', 0);
if (!Number.isSafeInteger(seeds) || seeds < 1 || seeds > 1000 || !Number.isSafeInteger(seedOffset) || seedOffset < 0 || !Number.isSafeInteger(seedOffset + seeds - 1)) throw new Error('Invalid seed count/offset');
const output = fileURLToPath(new URL('../test-results/item-naming/', import.meta.url));
await mkdir(output, { recursive: true });
const csv = createWriteStream(join(output, 'corpus.csv'), { encoding: 'utf8' });
let streamError;
csv.on('error', (error) => { streamError = error; });
const write = async (text) => {
  if (streamError) throw streamError;
  if (!csv.write(text)) await once(csv, 'drain');
};
const csvLine = (values) => values.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';') + '\n';
const columns = ['instanceId', 'itemId', 'level', 'rarity', 'name', 'theme', 'style', 'modifiers', 'damageTypes'];
await write('\uFEFF' + csvLine(columns));
const started = performance.now();
const digest = createHash('sha256');
const rarities = Object.fromEntries(RARITY_ORDER.map((rarity) => [rarity, {
  count: 0, names: new Map(), lengths: [], shortened: 0, noTheme: 0,
}]));
const bandCounts = {};
const levelCounts = {};
const themeCounts = {};
const anomalyCounts = {};
const anomalies = [];
const samples = [];
const namedFamilies = new Map();
let total = 0;
let buffer = '';
const anomaly = (code, row) => {
  anomalyCounts[code] = (anomalyCounts[code] ?? 0) + 1;
  if (anomalies.length < 100) anomalies.push({ code, ...row });
};

try {
  for (const [familyIndex, base] of PROGRESSION_ITEM_BASES.entries()) {
    const baseBefore = JSON.stringify(base);
    for (let band = 1; band <= 36; band += 5) {
      for (const [rarityIndex, rarity] of RARITY_ORDER.entries()) {
        for (let index = 0; index < seeds; index += 1) {
          const seed = seedOffset + index;
          const instance = { instanceId: `naming:${base.id}:${band}:${rarity}:${seed}`, itemId: base.id, itemLevel: band + seed % 5, powerModelId: base.powerModelId, rarity };
          const before = JSON.stringify(instance);
          const named = nameItem(base, instance);
          const resolved = resolveItemInstance(base, instance);
          const row = { instanceId: instance.instanceId, itemId: base.id, level: instance.itemLevel, rarity, name: named.name, theme: named.themeId ?? '', style: named.styleId ?? '', modifiers: JSON.stringify(resolved.modifiers ?? []), damageTypes: resolved.itemType === 'weapon' ? (resolved.damageTypes ?? []).join(',') : '' };
          const line = csvLine(columns.map((column) => row[column]));
          digest.update(line);
          buffer += line;
          if (buffer.length >= 256_000) { await write(buffer); buffer = ''; }
          const report = rarities[rarity];
          report.count += 1;
          report.names.set(named.name, (report.names.get(named.name) ?? 0) + 1);
          report.lengths.push([...named.name].length);
          report.shortened += Number(named.shortened);
          report.noTheme += Number(!named.themeId);
          bandCounts[band] = (bandCounts[band] ?? 0) + 1;
          levelCounts[instance.itemLevel] = (levelCounts[instance.itemLevel] ?? 0) + 1;
          themeCounts[named.themeId ?? 'none'] = (themeCounts[named.themeId ?? 'none'] ?? 0) + 1;
          total += 1;
          if (named.mode !== 'generated') anomaly(`unexpected-${named.mode}`, row);
          if (!named.name.startsWith(NAMING_FAMILIES[base.id]?.name ?? '\u0000')) anomaly('family-lost', row);
          if (!named.name || [...named.name].length > MAX_ITEM_NAME_LENGTH) anomaly('length', row);
          if (/\s{2}|undefined|null|\{.*\}|évoluti[fv]/i.test(named.name)) anomaly('invalid-fragment', row);
          if (named.name.split(' — ').length > 2) anomaly('stacked-title-separators', row);
          if (JSON.stringify(nameItem(base, JSON.parse(before))) !== JSON.stringify(named)) anomaly('unstable-name', row);
          if (JSON.stringify(instance) !== before || JSON.stringify(base) !== baseBefore) anomaly('input-mutation', row);
          if (namedFamilies.has(named.name) && namedFamilies.get(named.name) !== base.id) anomaly('cross-family-collision', row);
          namedFamilies.set(named.name, base.id);
          if (named.themeId) {
            const theme = NAMING_THEMES.find((entry) => entry.id === named.themeId);
            const hasEvidence = theme?.stat
              ? resolved.modifiers?.some((modifier) => modifier.stat === theme.stat && modifier.value > 0)
              : resolved.itemType === 'weapon' && resolved.damageTypes?.includes(theme?.damageType);
            if (!hasEvidence) anomaly('theme-without-property', row);
          }
          if (index === 0 && band === 1 + 5 * ((familyIndex + rarityIndex) % 8)) samples.push({ ...row, baseName: named.baseName });
        }
      }
    }
  }
  await write(buffer);
} finally {
  csv.end();
  await finished(csv);
}

const legacy = ITEM_LIBRARY.filter((item) => item.powerModelId === 'legacy-fixed-v1');
for (const base of legacy) {
  const instance = { instanceId: `legacy:${base.id}`, itemId: base.id, rarity: base.minimumRarity, itemLevel: base.requiredLevel, powerModelId: base.powerModelId };
  if (nameItem(base, instance).name !== base.name) anomaly('legacy-renamed', { itemId: base.id });
}
if (total !== PROGRESSION_ITEM_BASES.length * 8 * 5 * seeds || samples.length !== 240) anomaly('incomplete-matrix', { total, sampleCount: samples.length });
const summary = {
  candidate: ITEM_NAMING_VERSION, seedOffset, seedsPerCell: seeds,
  kind: 'stratified-name-corpus-not-a-drop-frequency-simulation',
  total, familyCount: PROGRESSION_ITEM_BASES.length, levelCounts, bandCounts,
  legacyChecked: legacy.length, sampleCount: samples.length,
  corpusSha256: digest.digest('hex'), durationSeconds: Number(((performance.now() - started) / 1000).toFixed(2)),
  anomalies: anomalyCounts, themeCounts,
  rarities: Object.fromEntries(Object.entries(rarities).map(([rarity, value]) => {
    value.lengths.sort((a, b) => a - b);
    return [rarity, {
      count: value.count, distinctNames: value.names.size,
      repeatedOccurrences: value.count - value.names.size,
      maxLength: value.lengths.at(-1), p95Length: value.lengths[Math.ceil(value.count * 0.95) - 1],
      shortened: value.shortened, noTheme: value.noTheme,
      mostFrequent: [...value.names].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 5).map(([name, count]) => ({ name, count })),
    }];
  })),
};
const markdown = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const familyOrder = PROGRESSION_ITEM_BASES.map((base) => base.id);
samples.sort((left, right) => familyOrder.indexOf(left.itemId) - familyOrder.indexOf(right.itemId) || RARITY_ORDER.indexOf(left.rarity) - RARITY_ORDER.indexOf(right.rarity));
const sampleMarkdown = ['# Échantillon du moteur de nommage V1', '',
  '240 exemples déterministes, un par famille et rareté. Les raretés sont équilibrées pour le contrôle : ce ne sont pas les fréquences de loot.', '',
  '| Famille | Niveau | Rareté | Nom candidat | Thème |', '|---|---:|---|---|---|',
  ...samples.map((row) => `| ${[row.baseName, row.level, row.rarity, row.name, row.theme || 'sobre/neutre'].map(markdown).join(' | ')} |`), '',
].join('\n');
await Promise.all([
  writeFile(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n'),
  writeFile(join(output, 'samples.json'), JSON.stringify(samples, null, 2) + '\n'),
  writeFile(join(output, 'samples.md'), sampleMarkdown),
  writeFile(join(output, 'anomalies.json'), JSON.stringify(anomalies, null, 2) + '\n'),
]);
console.log(JSON.stringify(summary, null, 2));
console.log(`Rapports : ${output}`);
if (Object.keys(anomalyCounts).length > 0) process.exitCode = 1;
