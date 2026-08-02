create function public._cdi060_migrate_item_instance(p_instance jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_result jsonb := p_instance;
  v_modifier jsonb;
  v_modifiers jsonb := '[]'::jsonb;
  v_has_physical_defense boolean := false;
begin
  if p_instance is null or jsonb_typeof(p_instance) <> 'object' then
    return p_instance;
  end if;

  if p_instance->>'itemId' in (
    'embercleaver_greataxe',
    'moonneedle_dagger',
    'stormglass_longbow',
    'astral_choir_staff',
    'starwoven_mantle',
    'graveiron_plate',
    'sunward_censer',
    'stormbound_buckler',
    'ring_of_the_split_star',
    'cloak_of_the_silent_eclipse'
  ) and p_instance->>'rarity' in ('common', 'uncommon', 'rare') then
    v_result := jsonb_set(v_result, '{rarity}', '"epic"'::jsonb, false);
  elsif p_instance->>'itemId' in (
    'eclipse_heart_spellbook',
    'charm_of_the_impossible_find'
  ) and p_instance->>'rarity' in ('common', 'uncommon', 'rare', 'epic') then
    v_result := jsonb_set(v_result, '{rarity}', '"legendary"'::jsonb, false);
  end if;

  if jsonb_typeof(p_instance->'modifiers') <> 'array' then
    return v_result;
  end if;

  select exists (
    select 1
    from jsonb_array_elements(p_instance->'modifiers') as modifier
    where modifier->>'stat' = 'physicalDefense'
  ) into v_has_physical_defense;

  for v_modifier in
    select modifier
    from jsonb_array_elements(p_instance->'modifiers') as modifier
  loop
    if v_modifier->>'stat' = 'physicalResistance' then
      if v_has_physical_defense then
        continue;
      end if;
      v_modifier := jsonb_set(v_modifier, '{stat}', '"physicalDefense"'::jsonb, false);
      v_has_physical_defense := true;
    end if;
    v_modifiers := v_modifiers || jsonb_build_array(v_modifier);
  end loop;

  return jsonb_set(v_result, '{modifiers}', v_modifiers, false);
end;
$$;

create function public._cdi060_migrate_hero(p_hero jsonb)
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
      public._cdi060_migrate_item_instance(v_instance),
      false
    );
  end loop;

  return jsonb_set(p_hero, '{equipment}', v_equipment, false);
end;
$$;

create function public._cdi060_migrate_game_state(p_state jsonb)
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
      jsonb_agg(public._cdi060_migrate_item_instance(instance) order by ordinal),
      '[]'::jsonb
    )
    into v_migrated
    from jsonb_array_elements(v_state->'storedItems') with ordinality as entries(instance, ordinal);
    v_state := jsonb_set(v_state, '{storedItems}', v_migrated, false);
  end if;

  foreach v_group_name in array array['heroes', 'onboardingCandidates']
  loop
    v_group := v_state->v_group_name;
    if jsonb_typeof(v_group) = 'array' then
      select coalesce(
        jsonb_agg(public._cdi060_migrate_hero(hero) order by ordinal),
        '[]'::jsonb
      )
      into v_migrated
      from jsonb_array_elements(v_group) with ordinality as entries(hero, ordinal);
      v_state := jsonb_set(v_state, array[v_group_name], v_migrated, false);
    end if;
  end loop;

  if jsonb_typeof(v_state->'pendingRecruit') = 'object' then
    v_state := jsonb_set(
      v_state,
      '{pendingRecruit}',
      public._cdi060_migrate_hero(v_state->'pendingRecruit'),
      false
    );
  end if;

  return v_state;
end;
$$;

update public.games
set state = public._cdi060_migrate_game_state(state)
where state is distinct from public._cdi060_migrate_game_state(state);

revoke all on function public._cdi060_migrate_game_state(jsonb) from public, anon, authenticated, service_role;
revoke all on function public._cdi060_migrate_hero(jsonb) from public, anon, authenticated, service_role;
revoke all on function public._cdi060_migrate_item_instance(jsonb) from public, anon, authenticated, service_role;
