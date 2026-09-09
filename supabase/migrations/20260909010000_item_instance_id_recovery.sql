create or replace function public._item_id_recovery_instance(
  p_instance jsonb,
  p_fallback_item_id text,
  p_recovery_instance_id text
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item_id text;
  v_definition jsonb;
  v_result jsonb;
begin
  if p_instance is null or jsonb_typeof(p_instance) <> 'object' then
    return p_instance;
  end if;

  v_item_id := coalesce(
    nullif(btrim(p_instance->>'itemId'), ''),
    nullif(btrim(p_instance->>'id'), ''),
    p_fallback_item_id
  );
  v_definition := public._item_progression_v3_definition(v_item_id);
  v_result := jsonb_build_object(
    'instanceId', coalesce(nullif(btrim(p_instance->>'instanceId'), ''), p_recovery_instance_id),
    'itemId', v_item_id,
    'itemLevel', case
      when jsonb_typeof(p_instance->'itemLevel') = 'number' then p_instance->'itemLevel'
      else v_definition->'itemLevel'
    end,
    'powerModelId', case
      when jsonb_typeof(p_instance->'powerModelId') = 'string' then p_instance->'powerModelId'
      else v_definition->'powerModelId'
    end,
    'rarity', case
      when p_instance->>'rarity' in ('common', 'uncommon', 'rare', 'epic', 'legendary') then p_instance->'rarity'
      else '"common"'::jsonb
    end
  );
  if jsonb_typeof(p_instance->'modifiers') = 'array' then
    v_result := v_result || jsonb_build_object('modifiers', p_instance->'modifiers');
  end if;
  if jsonb_typeof(p_instance->'sourceDungeonId') = 'string' then
    v_result := v_result || jsonb_build_object('sourceDungeonId', p_instance->'sourceDungeonId');
  end if;
  if jsonb_typeof(p_instance->'sourceZoneId') = 'string' then
    v_result := v_result || jsonb_build_object('sourceZoneId', p_instance->'sourceZoneId');
  end if;
  return v_result;
end;
$$;

create or replace function public._item_id_recovery_hero(p_hero jsonb, p_scope text)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_equipment jsonb;
  v_slot text;
  v_fallback text;
  v_instance jsonb;
  v_hero_id text;
begin
  if p_hero is null or jsonb_typeof(p_hero) <> 'object'
     or jsonb_typeof(p_hero->'equipment') <> 'object' then
    return p_hero;
  end if;
  v_hero_id := coalesce(nullif(btrim(p_hero->>'id'), ''), p_scope);
  v_equipment := p_hero->'equipment';
  for v_slot, v_instance in select key, value from jsonb_each(v_equipment)
  loop
    if v_instance = 'null'::jsonb then continue; end if;
    v_fallback := case v_slot
      when 'offHand' then 'wooden_shield'
      when 'armor' then 'traveler_clothes'
      when 'accessory' then 'copper_focus_ring'
      else 'starter_sword'
    end;
    if jsonb_typeof(v_instance) = 'object' and (
      v_instance ? 'id'
      or jsonb_typeof(v_instance->'itemId') is distinct from 'string'
      or jsonb_typeof(v_instance->'instanceId') is distinct from 'string'
    ) then
      v_equipment := jsonb_set(
        v_equipment,
        array[v_slot],
        public._item_id_recovery_instance(v_instance, v_fallback, 'item:recovery:' || v_hero_id || ':' || v_slot),
        false
      );
    end if;
  end loop;
  return jsonb_set(p_hero, '{equipment}', v_equipment, false);
end;
$$;

create or replace function public._item_id_recovery_state(p_state jsonb)
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
  if p_state is null or jsonb_typeof(p_state) <> 'object' then return p_state; end if;

  if jsonb_typeof(v_state->'storedItems') = 'array' then
    select coalesce(jsonb_agg(case
      when jsonb_typeof(instance) = 'object'
        and (jsonb_typeof(instance->'itemId') = 'string' or jsonb_typeof(instance->'id') = 'string')
        and (instance ? 'id'
          or jsonb_typeof(instance->'itemId') is distinct from 'string'
          or jsonb_typeof(instance->'instanceId') is distinct from 'string'
          or instance ? 'count')
      then public._item_id_recovery_instance(
          case when copy_index = 1 then instance else instance - 'instanceId' end,
          case instance->>'itemType'
            when 'offhand' then 'wooden_shield'
            when 'armor' then 'traveler_clothes'
            when 'accessory' then 'copper_focus_ring'
            else 'starter_sword'
          end,
          'item:recovery:storage:' || ordinal || ':' || copy_index
        )
      else instance
    end order by ordinal, copy_index), '[]'::jsonb)
    into v_migrated
    from jsonb_array_elements(v_state->'storedItems') with ordinality as entries(instance, ordinal)
    cross join lateral generate_series(
      1,
      case when jsonb_typeof(instance) = 'object'
        and (jsonb_typeof(instance->'itemId') = 'string' or jsonb_typeof(instance->'id') = 'string')
        and jsonb_typeof(instance->'count') = 'number' and (instance->>'count')::numeric >= 1
        then greatest(1, trunc((instance->>'count')::numeric)::integer)
        else 1
      end
    ) as copies(copy_index);
    v_state := jsonb_set(v_state, '{storedItems}', v_migrated, false);
  end if;

  foreach v_group_name in array array['heroes', 'onboardingCandidates'] loop
    v_group := v_state->v_group_name;
    if jsonb_typeof(v_group) = 'array' then
      select coalesce(jsonb_agg(
        public._item_id_recovery_hero(hero, v_group_name || ':' || ordinal) order by ordinal
      ), '[]'::jsonb)
      into v_migrated
      from jsonb_array_elements(v_group) with ordinality as entries(hero, ordinal);
      v_state := jsonb_set(v_state, array[v_group_name], v_migrated, false);
    end if;
  end loop;
  if jsonb_typeof(v_state->'pendingRecruit') = 'object' then
    v_state := jsonb_set(v_state, '{pendingRecruit}', public._item_id_recovery_hero(v_state->'pendingRecruit', 'pendingRecruit'), false);
  end if;
  return v_state;
end;
$$;

update public.games
set state = public._item_id_recovery_state(state)
where state is distinct from public._item_id_recovery_state(state);

revoke all on function public._item_id_recovery_state(jsonb) from public, anon, authenticated, service_role;
revoke all on function public._item_id_recovery_hero(jsonb, text) from public, anon, authenticated, service_role;
revoke all on function public._item_id_recovery_instance(jsonb, text, text) from public, anon, authenticated, service_role;
