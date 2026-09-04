create or replace function public._forge_progression_v4_blueprint_target(p_item_id text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce((
    select target_id
    from (values
      -- LEGACY_BLUEPRINT_EVOLUTION_SYNC_START
      ('starter_sword', 'progression_sword'),
      ('quick_dagger', 'progression_dagger'),
      ('woodcutter_axe', 'progression_axe'),
      ('wooden_shield', 'progression_shield'),
      ('traveler_clothes', 'progression_cloth_armor'),
      ('simple_leather_armor', 'progression_leather_armor'),
      ('novice_mystic_robe', 'progression_magic_robe'),
      ('basic_sword', 'progression_sword'),
      ('steel_sword', 'progression_sword'),
      ('basic_saber', 'progression_saber'),
      ('duelist_saber', 'progression_saber'),
      ('basic_greatsword', 'progression_greatsword'),
      ('steel_greatsword', 'progression_greatsword'),
      ('basic_axe', 'progression_axe'),
      ('warrior_axe', 'progression_axe'),
      ('basic_greataxe', 'progression_greataxe'),
      ('executioner_greataxe', 'progression_greataxe'),
      ('basic_mace', 'progression_mace'),
      ('iron_mace', 'progression_mace'),
      ('basic_greatmace', 'progression_greatmace'),
      ('crusher_greatmace', 'progression_greatmace'),
      ('basic_spear', 'progression_spear'),
      ('guard_spear', 'progression_spear'),
      ('basic_dagger', 'progression_dagger'),
      ('assassin_dagger', 'progression_dagger'),
      ('basic_shortbow', 'progression_shortbow'),
      ('hunter_shortbow', 'progression_shortbow'),
      ('basic_longbow', 'progression_longbow'),
      ('marksman_longbow', 'progression_longbow'),
      ('basic_crossbow', 'progression_crossbow'),
      ('heavy_crossbow', 'progression_crossbow'),
      ('basic_rifle', 'progression_rifle'),
      ('reinforced_rifle', 'progression_rifle'),
      ('basic_staff', 'progression_staff'),
      ('adept_staff', 'progression_staff'),
      ('basic_wand', 'progression_wand'),
      ('focused_wand', 'progression_wand'),
      ('basic_spellbook', 'progression_spellbook'),
      ('arcane_spellbook', 'progression_spellbook'),
      ('basic_lute', 'progression_lute'),
      ('resonant_harp', 'progression_lute'),
      ('basic_bo', 'progression_bo'),
      ('balanced_bo', 'progression_bo'),
      ('basic_gauntlets', 'progression_gauntlets'),
      ('reinforced_gauntlets', 'progression_gauntlets'),
      ('basic_knuckles', 'progression_knuckles'),
      ('swift_knuckles', 'progression_knuckles'),
      ('basic_gear_cannon', 'progression_gear_cannon'),
      ('calibrated_gear_cannon', 'progression_gear_cannon'),
      ('twin_steel_swords', 'progression_dual_swords'),
      ('flowing_twin_sabers', 'progression_dual_sabers'),
      ('twin_battle_axes', 'progression_dual_axes'),
      ('nightfang_daggers', 'progression_dual_daggers'),
      ('ironbound_hauberk', 'progression_chainmail'),
      ('bulwark_plate', 'progression_plate_armor'),
      ('supple_shadow_vest', 'progression_leather_armor'),
      ('nightstep_leather', 'progression_leather_armor'),
      ('trailrunner_garb', 'progression_leather_armor'),
      ('keeneye_mail', 'progression_chainmail'),
      ('faded_rune_robe', 'progression_magic_robe'),
      ('astral_thread_robe', 'progression_magic_robe'),
      ('quiet_prayer_vestment', 'progression_cloth_armor'),
      ('blessed_battle_vestment', 'progression_chainmail'),
      ('echoing_stage_garb', 'progression_cloth_armor'),
      ('resonant_performer_coat', 'progression_magic_robe'),
      ('mosswoven_cloak', 'progression_cloth_armor'),
      ('verdant_hide_armor', 'progression_leather_armor'),
      ('riveted_work_apron', 'progression_leather_armor'),
      ('fine_plate_coat', 'progression_chainmail'),
      ('loose_fighting_garb', 'progression_cloth_armor'),
      ('iron_thread_gi', 'progression_leather_armor'),
      ('plain_round_shield', 'progression_shield'),
      ('ironbound_round_shield', 'progression_shield'),
      ('light_buckler', 'progression_buckler'),
      ('duelist_buckler', 'progression_buckler'),
      ('plain_tower_shield', 'progression_tower_shield'),
      ('fortress_tower_shield', 'progression_tower_shield'),
      ('dull_arcane_orb', 'progression_arcane_orb'),
      ('pulsing_arcane_orb', 'progression_arcane_orb'),
      ('clear_focus_crystal', 'progression_crystal_focus'),
      ('prismatic_focus_crystal', 'progression_crystal_focus'),
      ('dim_spell_lantern', 'progression_spell_lantern'),
      ('azure_spell_lantern', 'progression_spell_lantern'),
      ('plain_prayer_beads', 'progression_prayer_beads'),
      ('silver_prayer_beads', 'progression_prayer_beads'),
      ('smoldering_censer', 'progression_sanctified_censer'),
      ('blessed_silver_censer', 'progression_sanctified_censer'),
      ('worn_sacred_book', 'progression_bible'),
      ('gilded_sacred_book', 'progression_bible'),
      ('fresh_living_branch', 'progression_living_branch'),
      ('blooming_living_branch', 'progression_living_branch'),
      ('small_verdant_seed', 'progression_verdant_seed'),
      ('heartroot_seed', 'progression_verdant_seed'),
      ('pale_moonlit_leaf', 'progression_moonlit_leaf'),
      ('silvervein_moonlit_leaf', 'progression_moonlit_leaf'),
      ('silver_ring', 'progression_ring'),
      ('copper_focus_ring', 'progression_ring'),
      ('fine_rune_ring', 'progression_ring'),
      ('storm_etched_ring', 'progression_ring'),
      ('warm_ember_amulet', 'progression_amulet'),
      ('riverstone_amulet', 'progression_amulet'),
      ('pale_guardian_amulet', 'progression_amulet'),
      ('sunmarked_amulet', 'progression_amulet'),
      ('knotted_leather_bracelet', 'progression_bracelet'),
      ('ashwood_bracelet', 'progression_bracelet'),
      ('ironthread_bracelet', 'progression_bracelet'),
      ('sparring_bracelet', 'progression_bracelet'),
      ('sturdy_travel_belt', 'progression_belt'),
      ('patched_field_belt', 'progression_belt'),
      ('ironbuckle_belt', 'progression_belt'),
      ('emberproof_belt', 'progression_belt'),
      ('dusty_travel_cloak', 'progression_cloak'),
      ('windworn_cloak', 'progression_cloak'),
      ('moonshadow_cloak', 'progression_cloak'),
      ('veilcloth_cloak', 'progression_cloak'),
      ('lucky_charm', 'progression_charm'),
      ('cracked_coin_charm', 'progression_charm'),
      ('gilded_fortune_charm', 'progression_charm'),
      ('three_knots_charm', 'progression_charm'),
      ('embercleaver_greataxe', 'progression_greataxe'),
      ('moonneedle_dagger', 'progression_dagger'),
      ('stormglass_longbow', 'progression_longbow'),
      ('astral_choir_staff', 'progression_staff'),
      ('starwoven_mantle', 'progression_magic_robe'),
      ('graveiron_plate', 'progression_plate_armor'),
      ('sunward_censer', 'progression_sanctified_censer'),
      ('stormbound_buckler', 'progression_buckler'),
      ('ring_of_the_split_star', 'progression_ring'),
      ('cloak_of_the_silent_eclipse', 'progression_cloak'),
      ('eclipse_heart_spellbook', 'progression_spellbook'),
      ('charm_of_the_impossible_find', 'progression_charm')
      -- LEGACY_BLUEPRINT_EVOLUTION_SYNC_END
    ) as mapping(source_id, target_id)
    where source_id = p_item_id
  ), p_item_id);
$$;

create or replace function public._forge_legacy_catalog_v4_state(p_state jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_blueprints jsonb;
begin
  if jsonb_typeof(p_state) <> 'object'
    or jsonb_typeof(p_state->'stateVersion') <> 'number'
    or (p_state->>'stateVersion')::numeric <> 4
    or jsonb_typeof(p_state->'itemBlueprints') <> 'array' then
    return p_state;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object('itemId', mapped_id, 'unlocked', unlocked)
    order by first_ordinal
  ), '[]'::jsonb)
  into v_blueprints
  from (
    select
      public._forge_progression_v4_blueprint_target(entry->>'itemId') as mapped_id,
      bool_or(coalesce((entry->>'unlocked')::boolean, false)) as unlocked,
      min(ordinal) as first_ordinal
    from jsonb_array_elements(p_state->'itemBlueprints') with ordinality as entries(entry, ordinal)
    group by 1
  ) merged;

  return jsonb_set(p_state, '{itemBlueprints}', v_blueprints, true);
end;
$$;

update public.games
set state = public._forge_legacy_catalog_v4_state(state)
where state is distinct from public._forge_legacy_catalog_v4_state(state);

revoke all on function public._forge_progression_v4_blueprint_target(text)
  from public, anon, authenticated, service_role;
revoke all on function public._forge_legacy_catalog_v4_state(jsonb)
  from public, anon, authenticated, service_role;
