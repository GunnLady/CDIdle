create extension if not exists pgtap;

select plan(13);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '60606060-6060-4060-8060-606060606060',
  'authenticated', 'authenticated', 'cdi-060-migration@example.test', '', now(),
  '{}'::jsonb, '{}'::jsonb, now(), now()
) on conflict (id) do nothing;

insert into public.games (user_id, revision, state)
values (
  '60606060-6060-4060-8060-606060606060',
  42,
  $$
  {
    "storedItems": [
      {
        "instanceId": "stored-epic",
        "itemId": "cloak_of_the_silent_eclipse",
        "rarity": "rare",
        "modifiers": [
          {"stat":"physicalResistance","type":"percent","value":5},
          {"stat":"physicalDefense","type":"flat","value":2}
        ]
      },
      {
        "instanceId": "stored-legendary",
        "itemId": "eclipse_heart_spellbook",
        "rarity": "epic"
      },
      {
        "instanceId": "stored-unknown",
        "itemId": "legacy_unknown_item",
        "rarity": "rare"
      }
    ],
    "heroes": [{
      "equipment": {
        "armor": {
          "instanceId": "equipped-epic",
          "itemId": "starwoven_mantle",
          "rarity": "uncommon",
          "modifiers": [{"stat":"physicalResistance","type":"percent","value":3}]
        }
      }
    }],
    "onboardingCandidates": [{
      "equipment": {
        "accessory": {
          "instanceId": "candidate-legendary",
          "itemId": "charm_of_the_impossible_find",
          "rarity": "common"
        }
      }
    }],
    "pendingRecruit": {
      "equipment": {
        "mainHand": {
          "instanceId": "recruit-legendary",
          "itemId": "eclipse_heart_spellbook",
          "rarity": "rare"
        }
      }
    }
  }
  $$::jsonb || jsonb_build_object(
    'rngState', jsonb_build_object(
      'algorithm', 'xorshift32',
      'version', 1,
      'seed', public.canonical_rng_seed('60606060-6060-4060-8060-606060606060'),
      'state', public.canonical_rng_seed('60606060-6060-4060-8060-606060606060'),
      'draws', 0
    )
  )
)
on conflict (user_id) do update
set revision = excluded.revision,
    state = excluded.state;

update public.games
set state = public._cdi060_migrate_game_state(state)
where user_id = '60606060-6060-4060-8060-606060606060';

select is(
  (select revision from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  42::bigint,
  'la migration ne modifie pas la revision canonique'
);

select is(
  (select state#>>'{storedItems,0,rarity}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'epic',
  'une instance stockee est promue a sa rarete minimale epique'
);

select is(
  (select state#>>'{storedItems,0,instanceId}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'stored-epic',
  'l identifiant de l instance stockee est preserve'
);

select is(
  (select count(*) from public.games g, jsonb_array_elements(g.state#>'{storedItems,0,modifiers}') modifier
   where g.user_id = '60606060-6060-4060-8060-606060606060'
     and modifier->>'stat' = 'physicalResistance'),
  0::bigint,
  'l ancien modificateur physicalResistance est supprime'
);

select is(
  (select count(*) from public.games g, jsonb_array_elements(g.state#>'{storedItems,0,modifiers}') modifier
   where g.user_id = '60606060-6060-4060-8060-606060606060'
     and modifier->>'stat' = 'physicalDefense'),
  1::bigint,
  'une defense physique deja presente n est pas dupliquee'
);

select is(
  (select state#>>'{storedItems,1,rarity}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'legendary',
  'une instance stockee est promue a sa rarete minimale legendaire'
);

select is(
  (select state#>>'{storedItems,2,rarity}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'rare',
  'un modele inconnu reste intact pour etre signale explicitement'
);

select is(
  (select state#>>'{heroes,0,equipment,armor,rarity}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'epic',
  'un objet equipe est promu a sa rarete minimale'
);

select is(
  (select state#>>'{heroes,0,equipment,armor,modifiers,0,stat}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'physicalDefense',
  'un ancien modificateur equipe est renomme'
);

select is(
  (select state#>>'{onboardingCandidates,0,equipment,accessory,rarity}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'legendary',
  'les candidats d integration sont migres'
);

select is(
  (select state#>>'{pendingRecruit,equipment,mainHand,rarity}' from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  'legendary',
  'la recrue en attente est migree'
);

select ok(
  not has_function_privilege('authenticated', 'public._cdi060_migrate_game_state(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public._cdi060_migrate_hero(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public._cdi060_migrate_item_instance(jsonb)', 'EXECUTE')
  and not has_function_privilege('service_role', 'public._cdi060_migrate_game_state(jsonb)', 'EXECUTE'),
  'les helpers de migration restent inaccessibles aux roles API'
);

create temporary table cdi060_migrated_state as
select state from public.games where user_id = '60606060-6060-4060-8060-606060606060';

update public.games
set state = public._cdi060_migrate_game_state(state)
where user_id = '60606060-6060-4060-8060-606060606060';

select is(
  (select state from public.games where user_id = '60606060-6060-4060-8060-606060606060'),
  (select state from cdi060_migrated_state),
  'la migration est idempotente'
);

delete from auth.users where id = '60606060-6060-4060-8060-606060606060';

select * from finish();
