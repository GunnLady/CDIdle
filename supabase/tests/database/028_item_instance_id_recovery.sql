create extension if not exists pgtap;

select plan(9);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '28282828-2828-4828-8828-282828282828',
  'authenticated', 'authenticated', 'item-recovery@example.test', '', now(),
  '{}'::jsonb, '{}'::jsonb, now(), now()
) on conflict (id) do nothing;

insert into public.games (user_id, revision, state)
values (
  '28282828-2828-4828-8828-282828282828',
  81,
  '{
    "stateVersion":6,
    "storedItems":[
      {"id":"wooden_shield","rarity":"uncommon","count":2},
      {"instanceId":"typed-fallback","id":"traveler_clothes","itemType":"armor","rarity":"rare"}
    ],
    "heroes":[{
      "id":"legacy-hero",
      "equipment":{"mainHand":{"id":"starter_sword","rarity":"common"}}
    }]
  }'::jsonb || jsonb_build_object(
    'rngState', jsonb_build_object(
      'algorithm', 'xorshift32',
      'version', 1,
      'seed', public.canonical_rng_seed('28282828-2828-4828-8828-282828282828'),
      'state', public.canonical_rng_seed('28282828-2828-4828-8828-282828282828'),
      'draws', 0
    )
  )
)
on conflict (user_id) do update set revision = excluded.revision, state = excluded.state;

update public.games
set state = public._item_id_recovery_state(state)
where user_id = '28282828-2828-4828-8828-282828282828';

select is((select revision from public.games where user_id = '28282828-2828-4828-8828-282828282828'), 81::bigint,
  'recovery preserves the canonical revision');
select is((select jsonb_array_length(state->'storedItems') from public.games where user_id = '28282828-2828-4828-8828-282828282828'), 3,
  'legacy counts are expanded to distinct instances');
select is((select state#>>'{storedItems,0,itemId}' from public.games where user_id = '28282828-2828-4828-8828-282828282828'), 'wooden_shield',
  'legacy id becomes itemId');
select isnt((select state#>>'{storedItems,0,instanceId}' from public.games where user_id = '28282828-2828-4828-8828-282828282828'),
  (select state#>>'{storedItems,1,instanceId}' from public.games where user_id = '28282828-2828-4828-8828-282828282828'),
  'expanded instances receive unique ids');
select is((select state#>>'{storedItems,2,itemId}' from public.games where user_id = '28282828-2828-4828-8828-282828282828'), 'traveler_clothes',
  'missing stored item identity uses its type fallback');
select is((select state#>>'{heroes,0,equipment,mainHand,itemId}' from public.games where user_id = '28282828-2828-4828-8828-282828282828'), 'starter_sword',
  'legacy equipped id becomes itemId');
select is((select state#>>'{heroes,0,equipment,mainHand,instanceId}' from public.games where user_id = '28282828-2828-4828-8828-282828282828'), 'item:recovery:legacy-hero:mainHand',
  'missing equipped instance id is deterministic');
select ok(
  not has_function_privilege('authenticated', 'public._item_id_recovery_state(jsonb)', 'EXECUTE')
  and not has_function_privilege('service_role', 'public._item_id_recovery_state(jsonb)', 'EXECUTE'),
  'recovery helpers are not exposed to API roles');

create temporary table recovered_item_state as
select state from public.games where user_id = '28282828-2828-4828-8828-282828282828';
update public.games set state = public._item_id_recovery_state(state)
where user_id = '28282828-2828-4828-8828-282828282828';
select is(
  (select state from public.games where user_id = '28282828-2828-4828-8828-282828282828'),
  (select state from recovered_item_state),
  'recovery is idempotent'
);

delete from auth.users where id = '28282828-2828-4828-8828-282828282828';
select * from finish();
