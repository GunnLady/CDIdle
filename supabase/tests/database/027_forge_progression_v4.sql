create extension if not exists pgtap;

select plan(31);

select has_function('public', '_forge_progression_v4_state', array['jsonb'], 'forge v4 state migrator exists');
select has_function('public', '_forge_progression_v4_minimum_rarity', array['text'], 'forge v4 rarity helper exists');
select has_function('public', '_forge_progression_v4_blueprint_target', array['text'], 'forge v4 legacy blueprint helper exists');
select has_function('public', '_forge_legacy_catalog_v4_state', array['jsonb'], 'forge v4 corrective state migrator exists');

select is(public._forge_progression_v4_blueprint_target('starter_sword'), 'progression_sword', 'starter sword plan opens evolving swords');
select is(public._forge_progression_v4_blueprint_target('quick_dagger'), 'progression_dagger', 'starter dagger plan opens evolving daggers');
select is(public._forge_progression_v4_blueprint_target('woodcutter_axe'), 'progression_axe', 'starter axe plan opens evolving axes');
select is(public._forge_progression_v4_blueprint_target('wooden_shield'), 'progression_shield', 'starter shield plan opens evolving shields');
select is(public._forge_progression_v4_blueprint_target('traveler_clothes'), 'progression_cloth_armor', 'starter cloth plan opens evolving cloth armor');
select is(public._forge_progression_v4_blueprint_target('simple_leather_armor'), 'progression_leather_armor', 'starter leather plan opens evolving leather armor');
select is(public._forge_progression_v4_blueprint_target('steel_sword'), 'progression_sword', 'later legacy plan joins the same evolving family');
select is(public._forge_progression_v4_blueprint_target('sunward_censer'), 'progression_sanctified_censer', 'signature plan joins its evolving family');
select is(public._forge_progression_v4_blueprint_target('eclipse_heart_spellbook'), 'progression_spellbook', 'legendary plan joins its evolving family');
select is(public._forge_progression_v4_blueprint_target('future_external_plan'), 'future_external_plan', 'unknown additional plans are preserved');
select is(
  jsonb_array_length(public._forge_legacy_catalog_v4_state('{"stateVersion":4,"itemBlueprints":[{"itemId":"steel_sword","unlocked":true},{"itemId":"progression_sword","unlocked":false}],"storedItems":[{"instanceId":"kept"}]}'::jsonb)->'itemBlueprints'),
  1,
  'corrective v4 migration merges a legacy plan with its evolving family'
);
select ok(
  public._forge_legacy_catalog_v4_state('{"stateVersion":4,"itemBlueprints":[{"itemId":"steel_sword","unlocked":true}],"storedItems":[{"instanceId":"kept"}]}'::jsonb)
    ->'itemBlueprints' @> '[{"itemId":"progression_sword","unlocked":true}]'::jsonb,
  'corrective v4 migration transfers the unlocked value'
);
select is(
  public._forge_legacy_catalog_v4_state(public._forge_legacy_catalog_v4_state('{"stateVersion":4,"itemBlueprints":[{"itemId":"steel_sword","unlocked":true}],"storedItems":[{"instanceId":"kept"}]}'::jsonb)),
  public._forge_legacy_catalog_v4_state('{"stateVersion":4,"itemBlueprints":[{"itemId":"steel_sword","unlocked":true}],"storedItems":[{"instanceId":"kept"}]}'::jsonb),
  'corrective v4 migration is idempotent and preserves other state'
);

select is(public._forge_progression_v4_minimum_rarity('steel_sword'), 'uncommon', 'uncommon recipe rarity is preserved');
select is(public._forge_progression_v4_minimum_rarity('embercleaver_greataxe'), 'epic', 'epic recipe rarity is preserved');
select is(public._forge_progression_v4_minimum_rarity('eclipse_heart_spellbook'), 'legendary', 'legendary recipe rarity is preserved');

select is(
  public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[]}'::jsonb)->>'stateVersion',
  '4',
  'v3 becomes v4'
);
select is(
  jsonb_array_length(public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[]}'::jsonb)->'itemBlueprints'),
  6,
  'empty blueprint list receives the six evolving plans'
);
select ok(
  public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[{"itemId":"starter_sword","unlocked":false},{"itemId":"progression_sword","unlocked":true}]}'::jsonb)
    ->'itemBlueprints' @> '[{"itemId":"progression_sword","unlocked":true}]'::jsonb,
  'legacy and evolving duplicate plans merge with unlocked OR semantics'
);
select is(
  jsonb_array_length(public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[{"itemId":"starter_sword","unlocked":false},{"itemId":"progression_sword","unlocked":true}]}'::jsonb)->'itemBlueprints'),
  1,
  'merged plans are deduplicated'
);
select is(
  public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[{"itemId":"steel_sword","unlocked":true}],"pendingForge":{"recipeId":"steel_sword","itemId":"steel_sword","upgradeProc":"none"}}'::jsonb)
    #>>'{pendingForge,offeredRarity}',
  'uncommon',
  'none preview becomes the recipe minimum rarity'
);
select ok(
  not (public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[],"pendingForge":{"recipeId":"starter_sword","upgradeProc":"rare"}}'::jsonb)->'pendingForge' ? 'upgradeProc'),
  'legacy preview field is removed'
);
select is(
  public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[],"pendingForge":{"recipeId":"starter_sword","upgradeProc":"rare"}}'::jsonb)
    #>>'{pendingForge,offeredRarity}',
  'rare',
  'explicit legacy preview rarity is retained'
);
select is(
  public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[],"pendingForge":{"recipeId":"starter_sword","upgradeProc":"uncommon"}}'::jsonb)
    #>>'{pendingForge,offeredRarity}',
  'uncommon',
  'explicit uncommon preview rarity is retained'
);
select ok(
  public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[{"itemId":"future_external_plan","unlocked":true}]}'::jsonb)
    ->'itemBlueprints' @> '[{"itemId":"future_external_plan","unlocked":true}]'::jsonb,
  'additional plans survive the state migration'
);
select is(
  public._forge_progression_v4_state('{"stateVersion":4,"itemBlueprints":[{"itemId":"already_v4","unlocked":true}],"custom":"kept"}'::jsonb),
  '{"stateVersion":4,"itemBlueprints":[{"itemId":"already_v4","unlocked":true}],"custom":"kept"}'::jsonb,
  'an existing v4 state is untouched'
);
select is(
  public._forge_progression_v4_state(public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[],"storedItems":[{"instanceId":"kept"}]}'::jsonb)),
  public._forge_progression_v4_state('{"stateVersion":3,"itemBlueprints":[],"storedItems":[{"instanceId":"kept"}]}'::jsonb),
  'migration is idempotent and preserves inventory'
);

select * from finish();
