create or replace function public._item_progression_v3_definition(p_item_id text)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_required_level integer;
begin
  -- ITEM_CATALOG_SYNC_START
  select definition.required_level
  into v_required_level
  from (
    values
      (1, array[
        'novice_mystic_robe', 'quick_dagger', 'simple_leather_armor',
        'starter_sword', 'traveler_clothes', 'woodcutter_axe', 'wooden_shield'
      ]::text[]),
      (10, array[
        'ashwood_bracelet', 'basic_axe', 'basic_bo', 'basic_crossbow',
        'basic_dagger', 'basic_gauntlets', 'basic_gear_cannon', 'basic_greataxe',
        'basic_greatmace', 'basic_greatsword', 'basic_knuckles', 'basic_longbow',
        'basic_lute', 'basic_mace', 'basic_rifle', 'basic_saber',
        'basic_shortbow', 'basic_spear', 'basic_spellbook', 'basic_staff',
        'basic_sword', 'basic_wand', 'clear_focus_crystal', 'copper_focus_ring',
        'cracked_coin_charm', 'dim_spell_lantern', 'dull_arcane_orb',
        'dusty_travel_cloak', 'echoing_stage_garb', 'faded_rune_robe',
        'fresh_living_branch', 'ironbound_hauberk', 'knotted_leather_bracelet',
        'light_buckler', 'loose_fighting_garb', 'lucky_charm',
        'mosswoven_cloak', 'pale_moonlit_leaf', 'patched_field_belt',
        'plain_prayer_beads', 'plain_round_shield', 'plain_tower_shield',
        'quiet_prayer_vestment', 'riverstone_amulet', 'riveted_work_apron',
        'silver_ring', 'small_verdant_seed', 'smoldering_censer',
        'sturdy_travel_belt', 'supple_shadow_vest', 'trailrunner_garb',
        'warm_ember_amulet', 'windworn_cloak', 'worn_sacred_book'
      ]::text[]),
      (20, array[
        'arcane_spellbook', 'assassin_dagger', 'astral_thread_robe',
        'balanced_bo', 'blooming_living_branch', 'duelist_buckler',
        'duelist_saber', 'fine_rune_ring', 'flowing_twin_sabers',
        'focused_wand', 'guard_spear', 'hunter_shortbow', 'iron_mace',
        'iron_thread_gi', 'ironbound_round_shield', 'ironthread_bracelet',
        'moonshadow_cloak', 'nightfang_daggers', 'nightstep_leather',
        'prismatic_focus_crystal', 'pulsing_arcane_orb', 'resonant_harp',
        'resonant_performer_coat', 'silver_prayer_beads', 'sparring_bracelet',
        'steel_sword', 'storm_etched_ring', 'swift_knuckles',
        'three_knots_charm', 'twin_battle_axes', 'twin_steel_swords',
        'veilcloth_cloak', 'verdant_hide_armor', 'warrior_axe'
      ]::text[]),
      (21, array[
        'adept_staff', 'azure_spell_lantern', 'blessed_battle_vestment',
        'blessed_silver_censer', 'emberproof_belt', 'fine_plate_coat',
        'heartroot_seed', 'ironbuckle_belt', 'keeneye_mail',
        'marksman_longbow', 'pale_guardian_amulet', 'reinforced_gauntlets',
        'steel_greatsword', 'sunmarked_amulet'
      ]::text[]),
      (22, array[
        'bulwark_plate', 'calibrated_gear_cannon', 'crusher_greatmace',
        'executioner_greataxe', 'fortress_tower_shield',
        'gilded_fortune_charm', 'gilded_sacred_book', 'heavy_crossbow',
        'reinforced_rifle', 'silvervein_moonlit_leaf'
      ]::text[]),
      (24, array[
        'moonneedle_dagger', 'starwoven_mantle', 'stormbound_buckler'
      ]::text[]),
      (25, array[
        'cloak_of_the_silent_eclipse', 'embercleaver_greataxe',
        'ring_of_the_split_star', 'stormglass_longbow'
      ]::text[]),
      (26, array['astral_choir_staff', 'sunward_censer']::text[]),
      (27, array['graveiron_plate']::text[]),
      (32, array['charm_of_the_impossible_find']::text[]),
      (33, array['eclipse_heart_spellbook']::text[])
  ) as definition(required_level, item_ids)
  where p_item_id = any(definition.item_ids);

  if found then
    return jsonb_build_object(
      'itemLevel', v_required_level,
      'powerModelId', 'legacy-fixed-v1'
    );
  end if;

  if p_item_id = any(array[
    'progression_sword', 'progression_saber', 'progression_greatsword',
    'progression_axe', 'progression_greataxe', 'progression_mace',
    'progression_greatmace', 'progression_spear', 'progression_dagger',
    'progression_shortbow',
    'progression_longbow', 'progression_crossbow', 'progression_rifle',
    'progression_staff', 'progression_wand', 'progression_spellbook',
    'progression_lute', 'progression_bo', 'progression_gauntlets',
    'progression_knuckles', 'progression_gear_cannon',
    'progression_dual_swords', 'progression_dual_sabers',
    'progression_dual_axes', 'progression_dual_daggers',
    'progression_cloth_armor',
    'progression_leather_armor', 'progression_chainmail',
    'progression_plate_armor', 'progression_magic_robe',
    'progression_shield', 'progression_buckler', 'progression_tower_shield',
    'progression_arcane_orb', 'progression_crystal_focus',
    'progression_spell_lantern', 'progression_prayer_beads',
    'progression_sanctified_censer', 'progression_bible',
    'progression_living_branch', 'progression_verdant_seed',
    'progression_moonlit_leaf', 'progression_ring', 'progression_amulet',
    'progression_bracelet', 'progression_belt', 'progression_cloak',
    'progression_charm'
  ]::text[]) then
    return jsonb_build_object(
      'itemLevel', 1,
      'powerModelId', 'level-bands-v1'
    );
  end if;
  -- ITEM_CATALOG_SYNC_END

  -- Unknown references are enriched but kept so validation can report them.
  return jsonb_build_object(
    'itemLevel', 1,
    'powerModelId', 'legacy-fixed-v1'
  );
end;
$$;

create or replace function public._item_progression_v3_instance(p_instance jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_result jsonb := p_instance;
  v_definition jsonb;
  v_level numeric;
begin
  if p_instance is null
     or jsonb_typeof(p_instance) <> 'object'
     or jsonb_typeof(p_instance->'itemId') <> 'string' then
    return p_instance;
  end if;

  v_definition := public._item_progression_v3_definition(p_instance->>'itemId');

  if jsonb_typeof(p_instance->'itemLevel') = 'number' then
    v_level := (p_instance->>'itemLevel')::numeric;
  end if;
  if v_level is null or v_level <> trunc(v_level) then
    v_result := jsonb_set(v_result, '{itemLevel}', v_definition->'itemLevel', true);
  end if;

  if jsonb_typeof(p_instance->'powerModelId') is distinct from 'string' then
    v_result := jsonb_set(v_result, '{powerModelId}', v_definition->'powerModelId', true);
  end if;

  return v_result;
end;
$$;

create or replace function public._item_progression_v3_hero(p_hero jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_equipment jsonb;
  v_slot text;
  v_instance jsonb;
begin
  if p_hero is null
     or jsonb_typeof(p_hero) <> 'object'
     or jsonb_typeof(p_hero->'equipment') <> 'object' then
    return p_hero;
  end if;

  v_equipment := p_hero->'equipment';
  for v_slot, v_instance in
    select key, value from jsonb_each(v_equipment)
  loop
    v_equipment := jsonb_set(
      v_equipment,
      array[v_slot],
      public._item_progression_v3_instance(v_instance),
      false
    );
  end loop;

  return jsonb_set(p_hero, '{equipment}', v_equipment, false);
end;
$$;

create or replace function public._item_progression_v3_history_entry(p_entry jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_loot jsonb;
begin
  if p_entry is null
     or jsonb_typeof(p_entry) <> 'object'
     or jsonb_typeof(p_entry#>'{rewards,loot}') <> 'array' then
    return p_entry;
  end if;

  select coalesce(
    jsonb_agg(
      case
        when jsonb_typeof(loot) = 'object' and loot->>'type' = 'item'
          then public._item_progression_v3_instance(loot)
        else loot
      end
      order by ordinal
    ),
    '[]'::jsonb
  )
  into v_loot
  from jsonb_array_elements(p_entry#>'{rewards,loot}')
    with ordinality as entries(loot, ordinal);

  return jsonb_set(p_entry, '{rewards,loot}', v_loot, false);
end;
$$;

create or replace function public._item_progression_v3_state(p_state jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_state jsonb := p_state;
  v_group_name text;
  v_group jsonb;
  v_migrated jsonb;
begin
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    return p_state;
  end if;

  if jsonb_typeof(v_state->'storedItems') = 'array' then
    select coalesce(
      jsonb_agg(public._item_progression_v3_instance(instance) order by ordinal),
      '[]'::jsonb
    )
    into v_migrated
    from jsonb_array_elements(v_state->'storedItems')
      with ordinality as entries(instance, ordinal);
    v_state := jsonb_set(v_state, '{storedItems}', v_migrated, false);
  end if;

  foreach v_group_name in array array['heroes', 'onboardingCandidates']
  loop
    v_group := v_state->v_group_name;
    if jsonb_typeof(v_group) = 'array' then
      select coalesce(
        jsonb_agg(public._item_progression_v3_hero(hero) order by ordinal),
        '[]'::jsonb
      )
      into v_migrated
      from jsonb_array_elements(v_group)
        with ordinality as entries(hero, ordinal);
      v_state := jsonb_set(v_state, array[v_group_name], v_migrated, false);
    end if;
  end loop;

  if jsonb_typeof(v_state->'pendingRecruit') = 'object' then
    v_state := jsonb_set(
      v_state,
      '{pendingRecruit}',
      public._item_progression_v3_hero(v_state->'pendingRecruit'),
      false
    );
  end if;

  if jsonb_typeof(v_state->'pendingForge') = 'object' then
    v_state := jsonb_set(
      v_state,
      '{pendingForge}',
      public._item_progression_v3_instance(v_state->'pendingForge'),
      false
    );
  end if;

  if jsonb_typeof(v_state->'encounterHistory') = 'array' then
    select coalesce(
      jsonb_agg(public._item_progression_v3_history_entry(entry) order by ordinal),
      '[]'::jsonb
    )
    into v_migrated
    from jsonb_array_elements(v_state->'encounterHistory')
      with ordinality as entries(entry, ordinal);
    v_state := jsonb_set(v_state, '{encounterHistory}', v_migrated, false);
  end if;

  -- Older snapshots keep their version so runtime migrations still run in order.
  if jsonb_typeof(v_state->'stateVersion') = 'number' then
    if (v_state->>'stateVersion')::numeric = 2 then
      v_state := jsonb_set(v_state, '{stateVersion}', '3'::jsonb, false);
    end if;
  end if;

  return v_state;
end;
$$;

update public.games
set state = public._item_progression_v3_state(state)
where state is distinct from public._item_progression_v3_state(state);

revoke all on function public._item_progression_v3_state(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public._item_progression_v3_history_entry(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public._item_progression_v3_hero(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public._item_progression_v3_instance(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public._item_progression_v3_definition(text)
  from public, anon, authenticated, service_role;
