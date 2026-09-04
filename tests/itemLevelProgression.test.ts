import { describe, expect, it } from 'vitest';
import {
  PROGRESSION_ITEM_BASES,
  getItemById,
  getItemSlot,
} from '../shared/domain/items/items';
import {
  ITEM_RARITY_DAMAGE_MULTIPLIERS,
  applyItemLevelScaling,
  applyItemRarityScaling,
  itemLevelPowerBudget,
  resolveItemInstance,
} from '../shared/domain/items/scaling';
import { applyInventoryCommand } from '../supabase/functions/game-api/inventory-authority';
import { initialTownState } from '../supabase/functions/game-api/town-authority';
import { makeHero } from './fixtures/game';

describe('level-banded item progression', () => {
  it('exposes exactly 48 active reusable bases with the complete legacy-derived slot split', () => {
    expect(PROGRESSION_ITEM_BASES).toHaveLength(48);
    expect(PROGRESSION_ITEM_BASES.filter((item) => item.itemType === 'weapon')).toHaveLength(25);
    expect(PROGRESSION_ITEM_BASES.filter((item) => item.itemType === 'armor')).toHaveLength(5);
    expect(PROGRESSION_ITEM_BASES.filter((item) => item.itemType === 'offhand')).toHaveLength(12);
    expect(PROGRESSION_ITEM_BASES.filter((item) => item.itemType === 'accessory')).toHaveLength(6);
    for (const item of PROGRESSION_ITEM_BASES) {
      expect(item).toMatchObject({
        requiredLevel: 1,
        levelRange: { min: 1, max: 40 },
        minimumRarity: 'common',
        powerModelId: 'level-bands-v1',
        catalogStatus: 'active',
      });
    }
  });

  it('keeps the common curve monotonic through every level and five-level boundary', () => {
    const budgets = Array.from({ length: 40 }, (_, index) => itemLevelPowerBudget(index + 1));
    for (let index = 1; index < budgets.length; index += 1) {
      expect(budgets[index]).toBeGreaterThan(budgets[index - 1]);
    }
    for (const item of PROGRESSION_ITEM_BASES) {
      let previousMagnitude = 0;
      for (let itemLevel = 1; itemLevel <= 40; itemLevel += 1) {
        const scaled = applyItemLevelScaling(item, itemLevel);
        const magnitude = scaled.itemType === 'weapon'
          ? (scaled.damageRange?.min ?? 0) + (scaled.damageRange?.max ?? 0)
          : (scaled.modifiers ?? []).reduce((sum, modifier) => sum + Math.abs(modifier.value), 0);
        expect(magnitude).toBeGreaterThanOrEqual(previousMagnitude);
        previousMagnitude = magnitude;
      }
    }
  });

  it('applies explosive rarity only after resolving item level', () => {
    const weapon = PROGRESSION_ITEM_BASES.find((item) => item.itemType === 'weapon')!;
    const levelScaled = applyItemLevelScaling(weapon, 30);
    for (const [rarity, multiplier] of Object.entries(ITEM_RARITY_DAMAGE_MULTIPLIERS)) {
      const resolved = applyItemRarityScaling(levelScaled, rarity as keyof typeof ITEM_RARITY_DAMAGE_MULTIPLIERS);
      expect(resolved.itemType).toBe('weapon');
      if (resolved.itemType !== 'weapon' || levelScaled.itemType !== 'weapon') continue;
      expect(resolved.damageRange).toEqual({
        min: Math.round(levelScaled.damageRange!.min * multiplier),
        max: Math.round(levelScaled.damageRange!.max * multiplier),
      });
    }
  });

  it('preserves legacy power while resolving scalable instances deterministically', () => {
    const legacy = getItemById('starter_sword')!;
    expect(applyItemLevelScaling(legacy, 1)).toMatchObject({
      damageRange: legacy.itemType === 'weapon' ? legacy.damageRange : undefined,
      modifiers: legacy.modifiers,
    });
    const base = getItemById('progression_sword')!;
    const instance = {
      instanceId: 'progression-instance',
      itemLevel: 17,
      powerModelId: 'level-bands-v1' as const,
      rarity: 'epic' as const,
    };
    expect(resolveItemInstance(base, instance)).toEqual(resolveItemInstance(base, instance));
  });

  it('uses the instance level as the equip requirement', () => {
    const item = getItemById('progression_sword')!;
    const instance = {
      instanceId: 'level-20-sword',
      itemId: item.id,
      itemLevel: 20,
      powerModelId: item.powerModelId,
      rarity: 'common' as const,
    };
    const state = { ...initialTownState(42), heroes: [makeHero({ level: 19 })], storedItems: [instance] };
    expect(() => applyInventoryCommand(state, {
      type: 'hero.equip',
      heroId: state.heroes[0].id,
      instanceId: instance.instanceId,
    })).toThrow('hero level is too low');
    const eligible = { ...state, heroes: [makeHero({ level: 20 })] };
    const result = applyInventoryCommand(eligible, {
      type: 'hero.equip',
      heroId: eligible.heroes[0].id,
      instanceId: instance.instanceId,
    });
    expect(result.state.heroes[0].equipment?.[getItemSlot(item)]).toMatchObject(instance);
  });
});
