create extension if not exists pgtap;

select plan(20);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '30303030-3030-4030-8030-303030303030',
  'authenticated', 'authenticated', 'item-v3-migration@example.test', '', now(),
  '{}'::jsonb, '{}'::jsonb, now(), now()
) on conflict (id) do nothing;

insert into public.games (user_id, revision, state)
values (
  '30303030-3030-4030-8030-303030303030',
  73,
  $$
  {
    "stateVersion": 2,
    "marker": {"preserved": true},
    "storedItems": [
      {
        "instanceId": "starter",
        "itemId": "starter_sword",
        "rarity": "uncommon",
        "modifiers": [{"stat":"physicalDamage","type":"flat","value":7}]
      },
      {"instanceId":"tier-20","itemId":"iron_mace","rarity":"common"},
      {"instanceId":"tier-22","itemId":"heavy_crossbow","rarity":"rare"},
      {"instanceId":"tier-33","itemId":"eclipse_heart_spellbook","rarity":"legendary"},
      {
        "instanceId":"pre-versioned",
        "itemId":"progression_axe",
        "itemLevel":17,
        "powerModelId":"level-bands-v1",
        "rarity":"epic"
      },
      {"instanceId":"unknown","itemId":"unknown_model","rarity":"common"}
    ],
    "heroes": [{
      "id": "rank-up-hero",
      "equipment": {
        "mainHand": {
          "instanceId":"item:rank-up-hero:tier1:weapon",
          "itemId":"basic_sword",
          "rarity":"common"
        }
      }
    }],
    "onboardingCandidates": [{
      "id": "candidate",
      "equipment": {
        "armor": {
          "instanceId":"item:candidate:armor",
          "itemId":"traveler_clothes",
          "rarity":"common"
        }
      }
    }],
    "pendingRecruit": {
      "id": "recruit",
      "equipment": {
        "mainHand": {
          "instanceId":"item:recruit:mainHand",
          "itemId":"quick_dagger",
          "rarity":"common"
        }
      }
    },
    "pendingForge": {
      "previewId":"preview-v3",
      "recipeId":"progression_sword",
      "itemId":"progression_sword",
      "itemType":"weapon",
      "upgradeProc":"none"
    },
    "encounterHistory": [{
      "encounterId":"encounter-v3",
      "rewards":{
        "gold":3,
        "loot":[
          {
            "type":"item",
            "instanceId":"loot-24",
            "itemId":"moonneedle_dagger",
            "rarity":"epic",
            "count":1
          },
          {
            "type":"material",
            "materialId":"metal_scrap",
            "rarity":"common",
            "count":2,
            "name":"Metal"
          }
        ]
      }
    }]
  }
  $$::jsonb || jsonb_build_object(
    'rngState', jsonb_build_object(
      'algorithm', 'xorshift32',
      'version', 1,
      'seed', public.canonical_rng_seed('30303030-3030-4030-8030-303030303030'),
      'state', public.canonical_rng_seed('30303030-3030-4030-8030-303030303030'),
      'draws', 0
    )
  )
)
on conflict (user_id) do update
set revision = excluded.revision,
    state = excluded.state;

update public.games
set state = public._item_progression_v3_state(state)
where user_id = '30303030-3030-4030-8030-303030303030';

select is(
  (select revision from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  73::bigint,
  'le backfill ne modifie pas la revision canonique'
);

select is(
  (select state->>'stateVersion' from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '3',
  'un snapshot v2 devient v3'
);

select ok(
  not (public._item_progression_v3_state('{"storedItems":[]}'::jsonb) ? 'stateVersion'),
  'un snapshot v0 reste sans version pour la migration runtime'
);

select is(
  public._item_progression_v3_state('{"stateVersion":1,"storedItems":[]}'::jsonb)->>'stateVersion',
  '1',
  'un snapshot v1 conserve sa version pour la migration runtime'
);

select is(
  (select (state#>'{storedItems,0}') - 'itemLevel'::text - 'powerModelId'::text
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '{"instanceId":"starter","itemId":"starter_sword","rarity":"uncommon","modifiers":[{"stat":"physicalDamage","type":"flat","value":7}]}'::jsonb,
  'identite rarete et modificateurs sont preserves'
);

select is(
  (select state#>'{storedItems,0}' @> '{"itemLevel":1,"powerModelId":"legacy-fixed-v1"}'::jsonb
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  true,
  'un starter historique reste niveau 1 legacy'
);

select is(
  (select state#>>'{storedItems,1,itemLevel}' from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '20',
  'un objet historique niveau 20 conserve son palier'
);

select is(
  (select state#>>'{storedItems,2,itemLevel}' from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '22',
  'un objet historique niveau 22 conserve son palier'
);

select is(
  (select state#>>'{storedItems,3,itemLevel}' from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '33',
  'un objet historique niveau 33 conserve son palier'
);

select is(
  (select state#>'{storedItems,4}' from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '{"instanceId":"pre-versioned","itemId":"progression_axe","itemLevel":17,"powerModelId":"level-bands-v1","rarity":"epic"}'::jsonb,
  'les metadonnees deja presentes sont preservees'
);

select is(
  (select state#>'{storedItems,5}' @> '{"itemLevel":1,"powerModelId":"legacy-fixed-v1"}'::jsonb
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  true,
  'une reference inconnue est enrichie sans etre remplacee'
);

select is(
  (select state#>'{heroes,0,equipment,mainHand}' @> '{"itemLevel":10,"powerModelId":"legacy-fixed-v1"}'::jsonb
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  true,
  'un cadeau de rank-up T1 reste niveau 10 legacy'
);

select is(
  (select state#>'{onboardingCandidates,0,equipment,armor}' @> '{"itemLevel":1,"powerModelId":"legacy-fixed-v1"}'::jsonb
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  true,
  'un objet onboarding reste niveau 1 legacy'
);

select is(
  (select state#>'{pendingRecruit,equipment,mainHand}' @> '{"itemLevel":1,"powerModelId":"legacy-fixed-v1"}'::jsonb
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  true,
  'un objet de recrutement en attente reste niveau 1 legacy'
);

select is(
  (select state#>'{pendingForge}' @> '{"itemLevel":1,"powerModelId":"level-bands-v1"}'::jsonb
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  true,
  'une preview de forge evolutive recoit son modele de puissance'
);

select is(
  (select state#>'{encounterHistory,0,rewards,loot,0}' @> '{"itemLevel":24,"powerModelId":"legacy-fixed-v1"}'::jsonb
   from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  true,
  'un loot objet de l historique est migre'
);

select is(
  (select state#>'{encounterHistory,0,rewards,loot,1}' from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '{"type":"material","materialId":"metal_scrap","rarity":"common","count":2,"name":"Metal"}'::jsonb,
  'un loot materiau reste intact'
);

select is(
  (select state#>'{marker}' from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  '{"preserved":true}'::jsonb,
  'les champs inconnus du snapshot sont preserves'
);

select ok(
  not has_function_privilege('authenticated', 'public._item_progression_v3_state(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public._item_progression_v3_history_entry(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public._item_progression_v3_hero(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public._item_progression_v3_instance(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public._item_progression_v3_definition(text)', 'EXECUTE')
  and not has_function_privilege('service_role', 'public._item_progression_v3_state(jsonb)', 'EXECUTE'),
  'les helpers du backfill restent inaccessibles aux roles API'
);

create temporary table item_progression_v3_state as
select state
from public.games
where user_id = '30303030-3030-4030-8030-303030303030';

update public.games
set state = public._item_progression_v3_state(state)
where user_id = '30303030-3030-4030-8030-303030303030';

select is(
  (select state from public.games where user_id = '30303030-3030-4030-8030-303030303030'),
  (select state from item_progression_v3_state),
  'le backfill est idempotent'
);

delete from auth.users where id = '30303030-3030-4030-8030-303030303030';

select * from finish();
