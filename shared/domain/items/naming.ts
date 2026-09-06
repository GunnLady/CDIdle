// Frozen French naming V1, promoted unchanged from the validated V2 corpus.
import type { CanonicalDamageType, CanonicalItem, CanonicalStoredItemInstance } from './types.ts';
import { resolveItemInstance } from './scaling.ts';
import { NAMING_FAMILIES, NAMING_STYLES, NAMING_THEMES, NEUTRAL_TITLES, type NamingTheme } from '../../data/item-naming-v1.ts';

export const ITEM_NAMING_VERSION = 'item-naming-v1';
// Keep the validated hash namespace: changing it would rename existing objects.
const NAMING_HASH_NAMESPACE = 'item-naming-candidate-v2';
export const MAX_ITEM_NAME_LENGTH = 60;
export type NamingInstance = Pick<CanonicalStoredItemInstance, 'instanceId' | 'itemId' | 'rarity'>
  & Partial<Pick<CanonicalStoredItemInstance, 'itemLevel' | 'powerModelId' | 'modifiers'>>;
export type ItemName = {
  version: string; name: string; baseName: string;
  mode: 'generated' | 'legacy' | 'fallback';
  themeId?: string; styleId?: string; reason?: string; shortened: boolean;
};

function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) value = Math.imul(value ^ text.charCodeAt(index), 0x01000193);
  // Avalanche avoids correlated variants for consecutive instance identifiers.
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

export function eligibleNamingThemes(item: CanonicalItem): NamingTheme[] {
  const totals = new Map<string, number>();
  for (const modifier of item.modifiers ?? []) {
    const key = `${modifier.stat}:${modifier.type}`;
    totals.set(key, (totals.get(key) ?? 0) + modifier.value);
  }
  return NAMING_THEMES.filter((theme) => theme.stat
    ? (totals.get(`${theme.stat}:flat`) ?? 0) > 0 || (totals.get(`${theme.stat}:percent`) ?? 0) > 0
    : item.itemType === 'weapon' && item.damageTypes?.includes(theme.damageType as CanonicalDamageType) === true);
}

function themeWeight(theme: NamingTheme, item: CanonicalItem): number {
  if (item.itemType === 'weapon') return theme.kind === 'offense' || theme.kind === 'mobility' ? 3 : 1;
  if (item.itemType === 'accessory') return 2;
  return theme.kind === 'defense' ? 3 : theme.kind === 'resource' ? 2 : 1;
}

export function nameItem(base: CanonicalItem | undefined, instance: NamingInstance): ItemName {
  return describeItemName(base, instance);
}

/** Presentation-only resolver: combat keeps using the unchanged statistical resolver. */
export function resolveNamedItemInstance<T extends CanonicalItem>(base: T, instance: NamingInstance): T {
  const resolved = resolveItemInstance(base, instance);
  return { ...resolved, name: describeItemName(base, instance, resolved).name };
}

function describeItemName(base: CanonicalItem | undefined, instance: NamingInstance, resolvedItem?: CanonicalItem): ItemName {
  const baseName = base?.name ?? instance.itemId;
  const fallback = (reason: string): ItemName => ({ version: ITEM_NAMING_VERSION, name: baseName, baseName, mode: 'fallback', reason, shortened: false });
  if (!base || base.id !== instance.itemId) return fallback('unknown-or-mismatched-base');
  if (base.powerModelId === 'legacy-fixed-v1') return { ...fallback(''), mode: 'legacy', reason: undefined };
  const family = NAMING_FAMILIES[base.id];
  if (!family) return fallback('unmapped-family');
  if (!instance.instanceId || !Number.isInteger(instance.itemLevel)
    || instance.itemLevel! < base.levelRange.min || instance.itemLevel! > base.levelRange.max
    || (instance.powerModelId !== undefined && instance.powerModelId !== base.powerModelId)) return fallback('incomplete-or-invalid-instance');
  const resolved = resolvedItem ?? resolveItemInstance(base, instance);
  const pick = <T>(pool: readonly T[], purpose: string): T => pool[hash(`${NAMING_HASH_NAMESPACE}:${instance.instanceId}:${purpose}`) % pool.length];
  const candidates = eligibleNamingThemes(resolved).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const weighted = candidates.flatMap((theme) => Array<NamingTheme>(themeWeight(theme, resolved)).fill(theme));
  const theme = instance.rarity === 'common' || weighted.length === 0 ? undefined : pick(weighted, 'theme');
  const suffix = theme ? pick(theme.suffixes, 'suffix') : '';
  const stylePool = instance.rarity === 'rare'
    ? family.organic ? ['flourishing', 'radiant', 'remarkable'] : ['worked', 'refined', 'remarkable']
    : instance.rarity === 'epic' ? ['sovereign', 'august', 'sublime', 'exceptional'] : [];
  let styleId = stylePool.length > 0 ? pick(stylePool, 'style') : undefined;
  const style = styleId ? NAMING_STYLES[styleId][family.form] : '';
  const title = instance.rarity === 'legendary' ? pick(theme?.titles ?? NEUTRAL_TITLES, 'title') : '';
  let name = title ? `${family.name} — ${title}` : [family.name, style, suffix].filter(Boolean).join(' ');
  let shortened = false;
  if ([...name].length > MAX_ITEM_NAME_LENGTH) {
    // Keep family and meaning: no blind truncation, especially for resistances.
    if (title) {
      const shortTitle = (theme?.titles ?? NEUTRAL_TITLES).reduce((left, right) => left.length <= right.length ? left : right);
      name = `${family.name} — ${shortTitle}`;
    } else {
      const shortSuffix = theme?.suffixes.reduce((left, right) => left.length <= right.length ? left : right) ?? '';
      name = [family.name, style, shortSuffix].filter(Boolean).join(' ');
      if ([...name].length > MAX_ITEM_NAME_LENGTH) {
        name = [family.name, shortSuffix].filter(Boolean).join(' ');
        styleId = undefined;
      }
    }
    shortened = true;
  }
  if ([...name].length > MAX_ITEM_NAME_LENGTH) return fallback('name-budget-exceeded');
  return { version: ITEM_NAMING_VERSION, name, baseName: family.name, mode: 'generated', themeId: theme?.id, styleId, shortened };
}
