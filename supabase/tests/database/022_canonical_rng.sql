create extension if not exists pgtap;

select plan(18);

select is(
  public.canonical_rng_seed('50505050-5050-4050-8050-505050505050'),
  652989193::bigint,
  'la graine SQL est deterministe'
);

select isnt(
  public.canonical_rng_seed('50505050-5050-4050-8050-505050505050'),
  public.canonical_rng_seed('51515151-5151-4151-8151-515151515152'),
  'deux comptes distincts obtiennent des graines distinctes'
);

select ok(
  not has_function_privilege(
    'service_role',
    'public.canonical_rng_seed(uuid)',
    'EXECUTE'
  ),
  'la derivation de graine reste interne aux migrations'
);

select ok(
  public.canonical_rng_state_is_valid(
    '{"rngState":{"algorithm":"xorshift32","version":1,"seed":42,"state":42,"draws":0}}'::jsonb
  ),
  'le validateur SQL accepte un etat RNG canonique'
);

select ok(
  public.canonical_rng_state_is_valid(
    '{"rngState":{"algorithm":"xorshift32","version":1,"seed":42,"state":42,"draws":9007199254740991}}'::jsonb
  ),
  'le validateur SQL accepte la borne maximale sure de draws'
);

select ok(
  not public.canonical_rng_state_is_valid(
    '{"rngState":{"algorithm":"xorshift32","version":1,"seed":42,"state":42,"draws":9007199254740992}}'::jsonb
  ),
  'le validateur SQL refuse draws au-dela de la borne sure'
);

select ok(
  not public.canonical_rng_state_is_valid(
    '{"rngState":{"algorithm":"xorshift32","version":2,"seed":42,"state":42,"draws":0}}'::jsonb
  ),
  'le validateur SQL refuse une version RNG inconnue'
);

select ok(
  not has_function_privilege(
    'service_role',
    'public.canonical_rng_state_is_valid(jsonb)',
    'EXECUTE'
  ),
  'le validateur RNG SQL reste interne'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.games'::regclass
      and conname = 'games_rng_state_valid'
      and convalidated
  ),
  'la contrainte RNG est installee et validee'
);

select ok(
  not exists (
    select 1
    from public.games
    where (state #>> '{rngState,seed}')::bigint
      <> public.canonical_rng_seed(user_id)
  ),
  'les sauvegardes migrees portent la graine de leur compte'
);

select ok(
  not exists (select 1 from public.games where not state ? 'rngState'),
  'la migration ajoute rngState aux sauvegardes existantes'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '50505050-5050-4050-8050-505050505050',
  'authenticated',
  'authenticated',
  'cdi-050@example.test',
  '',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
) on conflict (id) do nothing;

insert into public.games (user_id, revision, state)
values (
  '50505050-5050-4050-8050-505050505050',
  0,
  '{"rngState":{"algorithm":"xorshift32","version":1,"seed":652989193,"state":652989193,"draws":0}}'::jsonb
)
on conflict (user_id) do update set revision = 0, state = excluded.state;

select throws_ok(
  $$update public.games
    set state = jsonb_set(state, '{rngState,seed}', '42'::jsonb)
    where user_id = '50505050-5050-4050-8050-505050505050'$$,
  '23514',
  'new row for relation "games" violates check constraint "games_rng_state_valid"',
  'la contrainte refuse une graine appartenant a un autre compte'
);

select is(
  (public.commit_game_command(
    '50505050-5050-4050-8050-505050505050',
    '50505050-0001-4000-8000-505050505050',
    'rng-request-hash',
    0,
    '{"rngState":{"algorithm":"xorshift32","version":1,"seed":652989193,"state":1083814273,"draws":4}}'::jsonb,
    '[]'::jsonb
  )).revision,
  1::bigint,
  'le commit RNG incremente atomiquement la revision'
);

select is(
  (select (state #>> '{rngState,draws}')::integer from public.games
    where user_id = '50505050-5050-4050-8050-505050505050'),
  4,
  'le commit persiste le compteur de tirages'
);

select is(
  (public.commit_game_command(
    '50505050-5050-4050-8050-505050505050',
    '50505050-0001-4000-8000-505050505050',
    'rng-request-hash',
    0,
    '{"rngState":{"algorithm":"xorshift32","version":1,"seed":652989193,"state":99,"draws":999}}'::jsonb,
    '[]'::jsonb
  )).revision,
  1::bigint,
  'le replay conserve la revision existante'
);

select is(
  (select (state #>> '{rngState,draws}')::integer from public.games
    where user_id = '50505050-5050-4050-8050-505050505050'),
  4,
  'le replay ne consomme aucun tirage supplementaire'
);

select throws_ok(
  $$select public.commit_game_command(
    '50505050-5050-4050-8050-505050505050',
    '50505050-0002-4000-8000-505050505050',
    'stale-rng-request-hash',
    0,
    '{"rngState":{"algorithm":"xorshift32","version":1,"seed":652989193,"state":99,"draws":999}}'::jsonb,
    '[]'::jsonb
  )$$,
  'P0002',
  'STALE_REVISION',
  'un conflit tardif refuse le nouvel etat RNG'
);

select is(
  (select (state #>> '{rngState,draws}')::integer from public.games
    where user_id = '50505050-5050-4050-8050-505050505050'),
  4,
  'un conflit tardif ne persiste aucun tirage'
);

delete from auth.users where id = '50505050-5050-4050-8050-505050505050';

select * from finish();
