import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { nameItem, resolveNamedItemInstance } from '../shared/domain/items/naming';
import { getItemById } from '../shared/domain/items/items';
import type { CanonicalStoredItemInstance } from '../shared/domain/items/types';
import { createHeroEquipmentView, resolveStoredEquipmentItem } from '../src/domain/heroEquipmentPresentation';
import { createStorageEquipmentDecisionView, createStorageInventoryItemViews, defaultStorageFilters, filterAndSortStorageItems, resolveStorageItems } from '../src/domain/storagePresentation';
import { createForgeWorkspaceView } from '../src/domain/forgePresentation';
import { formatCanonicalTownEvent } from '../src/domain/townEventLog';
import { makeHero } from './fixtures/game';
import EquipmentItemDetails from '../src/components/heroes/EquipmentItemDetails';
import ItemInventoryPanel from '../src/components/storage/ItemInventoryPanel';

afterEach(cleanup);
const instance = (itemId = 'progression_sword', instanceId = 'integrated:1'): CanonicalStoredItemInstance => ({
  instanceId, itemId, itemLevel: 11, powerModelId: 'level-bands-v1', rarity: 'legendary',
  modifiers: [{ stat: 'speed', type: 'percent', value: 4 }],
});
const displayName = (item: CanonicalStoredItemInstance) => nameItem(getItemById(item.itemId), item).name;

describe('integrated item naming surfaces', () => {
  it.each(['progression_sword', 'progression_shield', 'progression_cloth_armor', 'progression_ring'])('keeps %s identical in storage, equipment, candidates and after reload', (itemId) => {
    const item = instance(itemId);
    const base = getItemById(itemId);
    expect(base).toBeDefined();
    const expected = displayName(item);
    const stored = resolveStorageItems([JSON.parse(JSON.stringify(item))]);
    expect(stored[0].item.name).toBe(expected);
    expect(createStorageInventoryItemViews(stored)[0].item.name).toBe(expected);
    const hero = makeHero({ level: 40, equipment: {} });
    const decision = createStorageEquipmentDecisionView(item, [hero])!;
    expect(decision.item.name).toBe(expected);
    expect(decision.targets[0].candidate?.item.name).toBe(expected);
    const slot = decision.targets[0].slot;
    const equipped = makeHero({ id: 'another-hero', level: 40, equipment: { [slot]: item } });
    expect(createHeroEquipmentView(equipped, [])?.slots.find((entry) => entry.key === slot)?.item?.name).toBe(expected);
    const replacement = instance(itemId, 'integrated:replacement');
    const replacementView = createHeroEquipmentView(equipped, [replacement])?.slots.find((entry) => entry.key === slot);
    expect(replacementView?.candidates[0].displacedItems).toContain(expected);
    expect(replacementView?.candidates[0].item.name).toBe(displayName(replacement));
    expect(item).not.toHaveProperty('name');
  });

  it('searches by generated name and original catalogue family and sorts by visible name', () => {
    const sword = instance();
    const ring = instance('progression_ring', 'integrated:2');
    const stored = resolveStorageItems([sword, ring]);
    for (const searchTerm of [displayName(sword), getItemById(sword.itemId)!.name, 'Épée']) {
      expect(filterAndSortStorageItems(stored, { ...defaultStorageFilters, searchTerm }).map((item) => item.instanceId)).toEqual([sword.instanceId]);
    }
    const sorted = filterAndSortStorageItems(stored, { ...defaultStorageFilters, sortKey: 'name' });
    expect(sorted.map((entry) => entry.item.name)).toEqual(stored.map((entry) => entry.item.name).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
  });

  it('leaves recipe and unfinalized forge labels at catalogue family level', () => {
    const item = instance();
    const baseName = getItemById(item.itemId)!.name;
    const view = createForgeWorkspaceView({ materials: [], blueprints: [{ itemId: item.itemId, unlocked: true }], selectedRecipeId: item.itemId, forgeLevel: 8,
      pending: { previewId: 'pending', itemId: item.itemId, itemLevel: 11, offeredRarity: 'legendary' } });
    expect(view.selectedRecipe?.name).toBe(baseName);
    expect(view.pending?.itemName).toBe(baseName);
    expect(view.pending?.itemName).not.toBe(displayName(item));
  });

  it('uses captured event names without reconstructing incomplete historical events', () => {
    const item = instance();
    for (const type of ['forge.finalized', 'inventory.recycled']) {
      const event = { type, ...item, rewards: [], itemName: displayName(item) };
      expect(formatCanonicalTownEvent(event)?.message).toContain(displayName(item));
      expect(formatCanonicalTownEvent({ ...event, itemName: 'Nom historique capturé' })?.message).toContain('Nom historique capturé');
      expect(formatCanonicalTownEvent({ ...event, itemName: undefined })?.message).toContain(getItemById(item.itemId)!.name);
    }
  });

  it('preserves legacy and incomplete historical names without repairing saved data', () => {
    const incomplete = { instanceId: 'old', itemId: 'progression_sword', rarity: 'rare' as const };
    expect(resolveNamedItemInstance(getItemById(incomplete.itemId)!, incomplete).name).toBe(getItemById(incomplete.itemId)!.name);
    const legacy = { ...instance(), itemId: 'starter_sword', powerModelId: 'legacy-fixed-v1' as const, itemLevel: 1 };
    expect(resolveStoredEquipmentItem(legacy)?.name).toBe(getItemById(legacy.itemId)!.name);
    expect(resolveStoredEquipmentItem({ ...instance(), itemId: 'unknown' })).toBeNull();
  });

  it('renders generated text in actual inventory and equipment components without truncating it', () => {
    const item = instance();
    const [view] = createStorageInventoryItemViews(resolveStorageItems([item]));
    render(<><EquipmentItemDetails item={view.item} /><ItemInventoryPanel items={[view]} totalItemCount={1} selectedItemInstanceId={null} canMutate canRecycle={false} onSelect={() => {}} onResetFilters={() => {}} /></>);
    expect(screen.getAllByText(displayName(item))).toHaveLength(2);
    expect(screen.getAllByText(displayName(item))[0]).toHaveClass('break-words');
  });
});
