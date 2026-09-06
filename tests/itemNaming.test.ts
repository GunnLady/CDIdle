import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITEM_LIBRARY, PROGRESSION_ITEM_BASES, RARITY_ORDER, getItemById, getItemSlot } from '../shared/domain/items/items';
import { resolveItemInstance } from '../shared/domain/items/scaling';
import { nameItem, resolveNamedItemInstance, eligibleNamingThemes, MAX_ITEM_NAME_LENGTH, type NamingInstance } from '../shared/domain/items/naming';
import { createHeroEquipmentView } from '../src/domain/heroEquipmentPresentation';
import { describeTier1EquipmentReward } from '../shared/domain/tier1-class-equipment-reward';
import { NAMING_FAMILIES, NAMING_STYLES, NAMING_THEMES } from '../shared/data/item-naming-v1';
import { generateAuthoritativeNovice } from '../supabase/functions/game-api/novice-authority';
import { initialCanonicalRngState, restoreCanonicalRng } from '../supabase/functions/game-api/authoritative-rng';
import { applyForgeCommand } from '../supabase/functions/game-api/forge-authority';
import { initialTownState } from '../supabase/functions/game-api/town-authority';
import { applyInventoryCommand } from '../supabase/functions/game-api/inventory-authority';
import { applyTier1ClassTransition } from '../shared/domain/tier1-class-transition';
import { TIER1_CLASS_EQUIPMENT_POOLS, type Tier1ClassType } from '../shared/data/tier1-class-equipment';
import { resolveAuthoritativeDungeonEncounter } from '../shared/domain/authoritative-dungeon';
import { makeHero, makeResources } from './fixtures/game';
import type { CanonicalDamageType, CanonicalStoredItemInstance } from '../shared/domain/items/types';

afterEach(() => vi.restoreAllMocks());
const instanceFor = (itemId = 'progression_sword', rarity: NamingInstance['rarity'] = 'rare', level = 11): CanonicalStoredItemInstance => ({
  instanceId: `naming:${itemId}:${rarity}:${level}`, itemId, rarity, itemLevel: level,
  powerModelId: getItemById(itemId)!.powerModelId,
});
const named = (instance: NamingInstance) => nameItem(getItemById(instance.itemId), instance);

describe('shared item naming V1', () => {
  it('covers exactly the 48 active families with explicit French forms', () => {
    expect(Object.keys(NAMING_FAMILIES).sort()).toEqual(PROGRESSION_ITEM_BASES.map((base) => base.id).sort());
    for (const family of Object.values(NAMING_FAMILIES)) expect(['ms', 'fs', 'mp', 'fp']).toContain(family.form);
    expect(new Set(NAMING_THEMES.map((theme) => theme.id)).size).toBe(NAMING_THEMES.length);
  });

  it('keeps complete and grammatical outputs across all 40 levels and five rarities', () => {
    let count = 0;
    for (const base of PROGRESSION_ITEM_BASES) for (const rarity of RARITY_ORDER) for (let level = 1; level <= 40; level += 1) {
      const instance = instanceFor(base.id, rarity, level);
      const result = nameItem(base, instance);
      const raw = resolveItemInstance(base, instance);
      expect(resolveNamedItemInstance(base, instance)).toEqual({ ...raw, name: result.name });
      expect(result.mode).toBe('generated');
      expect(result.name.startsWith(NAMING_FAMILIES[base.id].name)).toBe(true);
      expect([...result.name].length).toBeLessThanOrEqual(MAX_ITEM_NAME_LENGTH);
      expect(result.name).not.toMatch(/undefined|\s{2}|évoluti[fv]/i);
      expect(result.name.split(' — ').length).toBeLessThanOrEqual(2);
      if (result.styleId) expect(result.name).toContain(NAMING_STYLES[result.styleId][NAMING_FAMILIES[base.id].form]);
      if (result.themeId) expect(eligibleNamingThemes(resolveItemInstance(base, instance)).map((theme) => theme.id)).toContain(result.themeId);
      count += 1;
    }
    expect(count).toBe(9600);
  });

  it('preserves every legacy name, including old instances without level metadata', () => {
    const legacy = ITEM_LIBRARY.filter((base) => base.powerModelId === 'legacy-fixed-v1');
    expect(legacy).toHaveLength(131);
    for (const base of legacy) expect(named({ instanceId: `old:${base.id}`, itemId: base.id, rarity: base.minimumRarity })).toMatchObject({ mode: 'legacy', name: base.name });
  });

  it('has safe explicit fallbacks for unknown, future and incomplete instances', () => {
    expect(named({ instanceId: 'unknown', itemId: 'unknown', rarity: 'common' })).toMatchObject({ mode: 'fallback', name: 'unknown' });
    expect(named({ instanceId: 'incomplete', itemId: 'progression_sword', rarity: 'rare' }).reason).toBe('incomplete-or-invalid-instance');
    expect(named({ ...instanceFor(), itemLevel: 41 }).mode).toBe('fallback');
    expect(named({ ...instanceFor(), powerModelId: 'legacy-fixed-v1' }).mode).toBe('fallback');
    const base = getItemById('progression_sword')!;
    expect(nameItem({ ...base, id: 'future', name: 'Objet futur' }, { ...instanceFor(), itemId: 'future' })).toMatchObject({ mode: 'fallback', name: 'Objet futur' });
  });

  it('uses actual persisted properties, not the raw base or hero scaling attribute', () => {
    const instance = { ...instanceFor(), modifiers: [{ stat: 'speed', type: 'percent' as const, value: 4 }] };
    expect(named(instance).themeId).toBe('swiftness');
    expect(named({ ...instance, modifiers: [{ stat: 'maxHp', type: 'flat', value: 40 }] }).themeId).toBe('vigor');
    expect(named(instance).name).not.toMatch(/Force|force/);
  });

  it('never turns resistance to fire into fire damage or zero bonuses into a theme', () => {
    const instance = { ...instanceFor(), modifiers: [{ stat: 'fireResistance', type: 'flat' as const, value: 2 }] };
    expect(named(instance).themeId).toBe('resist-fire');
    expect(named({ ...instance, modifiers: [{ stat: 'fireResistance', type: 'flat', value: 0 }] }).themeId).toBeUndefined();
    expect(named({ ...instance, modifiers: [{ stat: 'speed', type: 'percent', value: 2 }, { stat: 'speed', type: 'percent', value: -2 }] }).themeId).toBeUndefined();
    const sword = getItemById('progression_sword')!;
    if (sword.itemType !== 'weapon') throw new Error('Expected sword');
    expect(eligibleNamingThemes({ ...sword, itemType: 'weapon', damageTypes: ['fire'], modifiers: [] }).map((theme) => theme.id)).toEqual(['damage-fire']);
  });

  it('handles every elemental resistance and damage type with distinct keys', () => {
    const sword = getItemById('progression_sword')!;
    if (sword.itemType !== 'weapon') throw new Error('Expected sword');
    for (const theme of NAMING_THEMES.filter((entry) => entry.id.startsWith('resist-'))) {
      expect(named({ ...instanceFor(), modifiers: [{ stat: theme.stat!, type: 'flat', value: 3 }] }).themeId).toBe(theme.id);
    }
    for (const theme of NAMING_THEMES.filter((entry) => entry.damageType)) {
      const item = { ...sword, modifiers: [], damageTypes: [theme.damageType as CanonicalDamageType] };
      expect(eligibleNamingThemes(item).map((entry) => entry.id)).toEqual([theme.id]);
    }
  });

  it('is stable after JSON reload, modifier reordering and changes to raw magnitudes', () => {
    const instance = { ...instanceFor(), modifiers: [{ stat: 'speed', type: 'percent' as const, value: 2 }, { stat: 'maxHp', type: 'flat' as const, value: 100 }] };
    const expected = named(instance);
    expect(named(JSON.parse(JSON.stringify(instance)))).toEqual(expected);
    expect(named({ ...instance, modifiers: [...instance.modifiers].reverse() })).toEqual(expected);
    expect(named({ ...instance, modifiers: instance.modifiers.map((entry) => ({ ...entry, value: entry.value * 100 })) })).toEqual(expected);
  });

  it('does not mutate inputs or use time, Math.random or gameplay RNG', () => {
    const instance = instanceFor();
    const base = structuredClone(getItemById(instance.itemId)!);
    const before = structuredClone({ base, instance });
    const rng = restoreCanonicalRng(initialCanonicalRngState(123));
    const rngBefore = rng.snapshot();
    vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('RANDOM_FORBIDDEN'); });
    vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('CLOCK_FORBIDDEN'); });
    nameItem(base, Object.freeze(instance));
    expect({ base, instance }).toEqual(before);
    expect(rng.snapshot()).toEqual(rngBefore);
  });

  it('keeps order-independent variation without requiring unique names', () => {
    const instances = Array.from({ length: 100 }, (_, index) => ({ ...instanceFor(), instanceId: `variant:${index}` }));
    const forward = instances.map(named);
    expect([...instances].reverse().map(named).reverse()).toEqual(forward);
    expect(new Set(forward.map((entry) => entry.name)).size).toBeGreaterThan(3);
    expect(named(instanceFor('progression_sword', 'common')).name).toBe('Épée');
  });

  it('locks representative French singular, plural and organic candidate examples', () => {
    const examples = [
      ['progression_sword', 11, 'rare', 'Épée raffinée de frappe'],
      ['progression_dual_swords', 1, 'epic', 'Épées jumelles souveraines de célérité'],
      ['progression_living_branch', 6, 'rare', 'Branche vivante resplendissante de protection'],
    ] as const;
    for (const [itemId, level, rarity, expected] of examples) expect(named({ ...instanceFor(itemId, rarity, level), instanceId: `naming:${itemId}:${level}:${rarity}:0` }).name).toBe(expected);
  });

  it('shortens long combinations semantically instead of truncating the family', () => {
    const instances = Array.from({ length: 100 }, (_, index) => ({ ...instanceFor('progression_crystal_focus', 'epic'), instanceId: `long:${index}`, modifiers: [{ stat: 'lightningResistance', type: 'flat' as const, value: 3 }] }));
    const names = instances.map(named);
    expect(names.some((entry) => entry.shortened)).toBe(true);
    for (const result of names) {
      expect(result.name).toMatch(/^Cristal de focalisation/);
      expect(result.name).toMatch(/foudre$/);
      expect([...result.name].length).toBeLessThanOrEqual(60);
    }
  });
});

describe('naming with real game authorities, not a parallel item generator', () => {
  it('preserves recruited novice equipment and derived stats', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const hero = generateAuthoritativeNovice(`naming:${seed}`, `novice:${seed}`);
      const before = structuredClone(hero);
      const equipment = Object.values(hero.equipment ?? {}).filter((item) => item !== null);
      expect(equipment.length).toBeGreaterThan(0);
      for (const item of equipment) expect(named(item!).mode).toBe('legacy');
      const view = createHeroEquipmentView(hero, []);
      for (const slot of view!.slots) {
        const ref = hero.equipment?.[slot.key];
        if (ref) expect(slot.item?.name).toBe(named(ref).name);
      }
      expect(hero).toEqual(before);
      expect(generateAuthoritativeNovice(`naming:${seed}`, `novice:${seed}`)).toEqual(before);
    }
  });

  it.each(Object.keys(TIER1_CLASS_EQUIPMENT_POOLS) as Tier1ClassType[])('keeps real %s rank-up rewards and subsequent rolls identical', (classType) => {
    const hero = makeHero({ id: `rank:${classType}`, level: 10 });
    const firstRng = restoreCanonicalRng(initialCanonicalRngState(151));
    const baselineRng = restoreCanonicalRng(initialCanonicalRngState(151));
    const actual = applyTier1ClassTransition(hero, classType, firstRng, []);
    const baseline = applyTier1ClassTransition(hero, classType, baselineRng, []);
    for (const item of [actual.equipmentReward.weapon, actual.equipmentReward.accessory]) expect(named(item).mode).toBe('legacy');
    const rewardNames = describeTier1EquipmentReward(actual.equipmentReward);
    expect(rewardNames.weaponName).toBe(named(actual.equipmentReward.weapon).name);
    expect(rewardNames.accessoryName).toBe(named(actual.equipmentReward.accessory).name);
    const slots = createHeroEquipmentView(actual.hero, [])!.slots;
    expect(slots.find((slot) => slot.key === 'mainHand')?.item?.name).toBe(rewardNames.weaponName);
    expect(slots.find((slot) => slot.key === 'accessory')?.item?.name).toBe(rewardNames.accessoryName);
    expect(actual).toEqual(baseline);
    expect(firstRng.snapshot()).toEqual(baselineRng.snapshot());
    expect(firstRng.next()).toBe(baselineRng.next());
  });

  it('preserves real forge rolls, accept/decline/infusion, reload and equipped identity', () => {
    const source = initialTownState(42);
    const state = { ...source, buildings: { ...source.buildings, forge: 8 }, storedItems: [],
      forgeMaterials: [
        { materialId: 'metal_scrap', rarity: 'common' as const, count: 100 },
        { materialId: 'refined_metal', rarity: 'uncommon' as const, count: 100 },
        { materialId: 'enchanted_fragment', rarity: 'rare' as const, count: 100 },
        { materialId: 'arcane_core', rarity: 'epic' as const, count: 100 },
        { materialId: 'legendary_essence', rarity: 'legendary' as const, count: 100 },
      ], itemBlueprints: [{ itemId: 'progression_sword', unlocked: true }] };
    let upgraded = 0;
    const offers = new Set<string>();
    for (let seed = 1; seed <= 100; seed += 1) {
      const mixedSeed = (0x515050 + Math.imul(seed, 0x9e3779b1)) >>> 0;
      const rng = restoreCanonicalRng(initialCanonicalRngState(mixedSeed));
      const baselineRng = restoreCanonicalRng(initialCanonicalRngState(mixedSeed));
      const command = { type: 'forge.start', recipeId: 'progression_sword', levelBandMin: 36, commandId: `name:${seed}` };
      const started = applyForgeCommand(state, command, rng);
      expect(started).toEqual(applyForgeCommand(state, command, baselineRng));
      const preview = started.state.pendingForge!;
      offers.add(preview.offeredRarity);
      for (const accept of [false, true]) {
        if (accept && preview.offeredRarity === 'common') continue;
        const finish = { type: 'forge.finalize', previewId: preview.previewId, acceptUpgrade: accept, ...(accept ? { chosenModifierStat: 'speed' } : {}) };
        const result = applyForgeCommand(started.state, finish);
        const before = structuredClone(result);
        const item = result.state.storedItems.at(-1)!;
        const name = named(item);
        expect(result.events.find((event) => event.type === 'forge.finalized')?.itemName).toBe(name.name);
        expect(item.rarity).toBe(accept ? preview.offeredRarity : 'common');
        if (accept) { upgraded += 1; expect(item.modifiers?.some((modifier) => modifier.stat === 'speed' && modifier.value > 0)).toBe(true); }
        expect(named(JSON.parse(JSON.stringify(item)))).toEqual(name);
        const equipped = applyInventoryCommand({ ...result.state, heroes: [makeHero({ level: 40 })] }, { type: 'hero.equip', heroId: 'hero-fixture', instanceId: item.instanceId });
        expect(named(equipped.state.heroes[0].equipment![getItemSlot(getItemById(item.itemId)!)])).toEqual(name);
        expect(equipped.events.find((event) => event.type === 'hero.equipped')?.itemName).toBe(name.name);
        const unequipped = applyInventoryCommand(equipped.state, { type: 'hero.unequip', heroId: 'hero-fixture', slot: 'mainHand' });
        expect(unequipped.events[0].itemName).toBe(name.name);
        const recycled = applyForgeCommand(unequipped.state, { type: 'inventory.recycle', instanceId: item.instanceId });
        expect(recycled.events[0].itemName).toBe(name.name);
        expect(recycled.state.storedItems.some((entry) => entry.instanceId === item.instanceId)).toBe(false);
        expect(result).toEqual(before);
        expect(applyForgeCommand(started.state, finish)).toEqual(before);
      }
      expect(rng.snapshot()).toEqual(baselineRng.snapshot());
      expect(rng.next()).toBe(baselineRng.next());
    }
    expect(upgraded).toBeGreaterThan(0);
    expect([...offers].sort()).toEqual([...RARITY_ORDER].sort());
  });

  it.each([
    ...[1, 3, 8, 11, 18, 26, 36, 49, 62].map((floor) => ({ kind: 'treasure' as const, floor })),
    ...[10, 20, 30, 40, 50].map((floor) => ({ kind: 'boss' as const, floor })),
  ])('does not change a real $kind reward at floor $floor or its RNG consumption', ({ kind, floor }) => {
    const hero = makeHero({ currentHp: 100_000, calculatedStats: { ...makeHero().calculatedStats, maxHp: 100_000, hp: 100_000, physicalDamage: 1_000_000, magicDamage: 1_000_000, speed: 100, criticalChance: 0 }, xpNeeded: 1_000_000_000 });
    const state = { ...initialTownState(42), activeDungeonFloor: floor, activeDungeonRoom: kind === 'boss' ? 50 : 1, highestFloorReached: floor, resources: makeResources({ gold: 0 }), buildings: { maison_chef: 0 }, heroes: [hero], storedItems: [], forgeMaterials: [], itemBlueprints: [] };
    const values = kind === 'treasure' ? [0.94, 0.90, 0, 0, 0.10, 0, 0.50, 0.99] : [0];
    const makeRng = () => {
      let draws = 0;
      const next = () => values[draws++ % values.length];
      return { next, nextInt: (max: number) => Math.floor(next() * max), draws: () => draws };
    };
    const rng = makeRng();
    const baselineRng = makeRng();
    const options = { xpCurve: { kind: 'level-banded' as const, levelBands: [{ firstDestinationLevel: 2, firstLevelXp: 1_000_000_000, growthFactor: 1 }] } };
    const result = resolveAuthoritativeDungeonEncounter(state, `naming:${kind}`, rng, options);
    const baseline = resolveAuthoritativeDungeonEncounter(state, `naming:${kind}`, baselineRng, options);
    expect(result.state.storedItems!.length).toBeGreaterThan(0);
    for (const item of result.state.storedItems!) {
      const base = getItemById(item.itemId)!;
      const resultName = named(item);
      const log = result.encounter.transcript.find((entry) => entry.type === 'reward.item' && entry.instanceId === item.instanceId);
      expect(log?.itemName).toBe(resultName.name);
      expect(log?.message).toContain(resultName.name);
      // Late bosses can still award fixed historical items: preserve them.
      expect(resultName.mode).toBe(base.powerModelId === 'legacy-fixed-v1' ? 'legacy' : 'generated');
      if (base.powerModelId === 'legacy-fixed-v1') expect(resultName.name).toBe(base.name);
    }
    expect(result).toEqual(baseline);
    expect(rng.draws()).toBe(baselineRng.draws());
    expect(rng.next()).toBe(baselineRng.next());
  });
});
