create extension if not exists pgtap;

select plan(26);

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
  '61616161-6161-4161-8161-616161616161',
  'authenticated',
  'authenticated',
  'cdi-061@example.test',
  '',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
) on conflict (id) do nothing;

insert into public.games (user_id, revision, state, last_processed_at)
values (
  '61616161-6161-4161-8161-616161616161',
  0,
  jsonb_build_object('rngState', jsonb_build_object(
    'algorithm', 'xorshift32',
    'version', 1,
    'seed', public.canonical_rng_seed('61616161-6161-4161-8161-616161616161'),
    'state', public.canonical_rng_seed('61616161-6161-4161-8161-616161616161'),
    'draws', 0
  )),
  now() - interval '10 seconds'
)
on conflict (user_id) do update
set revision = 0,
    state = excluded.state,
    last_processed_at = excluded.last_processed_at;

select ok(
  has_function_privilege('service_role', 'public.load_game_transition(uuid)', 'EXECUTE'),
  'le service peut lire un snapshot avec l heure PostgreSQL'
);

select ok(
  not has_function_privilege('authenticated', 'public.load_game_transition(uuid)', 'EXECUTE'),
  'le client authentifie ne peut pas appeler la lecture temporelle'
);

select ok(
  has_function_privilege('service_role', 'public.create_game_transition(uuid,jsonb)', 'EXECUTE'),
  'le service peut creer une partie par le RPC autoritaire'
);

select ok(
  not has_function_privilege('authenticated', 'public.create_game_transition(uuid,jsonb)', 'EXECUTE'),
  'le client authentifie ne peut pas creer une partie directement'
);

select ok(
  not has_table_privilege('service_role', 'public.games', 'INSERT'),
  'le service ne contourne pas le RPC de creation par un insert direct'
);

select ok(
  has_function_privilege('service_role', 'public.claim_game_transition(uuid,uuid,text)', 'EXECUTE'),
  'le service peut reserver une commande'
);

select ok(
  not has_function_privilege('authenticated', 'public.claim_game_transition(uuid,uuid,text)', 'EXECUTE'),
  'le client authentifie ne peut pas reserver directement une commande'
);

select ok(
  not has_function_privilege('service_role', 'public.commit_idle_state(uuid,timestamptz,jsonb,timestamptz)', 'EXECUTE'),
  'le service ne peut plus contourner la revision avec le RPC idle historique'
);

select ok(
  not has_function_privilege('service_role', 'public.commit_game_command(uuid,uuid,text,bigint,jsonb,jsonb)', 'EXECUTE'),
  'le service ne peut plus contourner le temps et le debit avec le RPC commande historique'
);

select ok(
  (select server_time >= last_processed_at
   from public.load_game_transition('61616161-6161-4161-8161-616161616161')),
  'l heure autoritaire provient de PostgreSQL et suit le dernier traitement'
);

select is(
  (public.commit_idle_transition(
    '61616161-6161-4161-8161-616161616161',
    0,
    (select last_processed_at from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select jsonb_set(state, '{idleMarker}', 'true'::jsonb) from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select last_processed_at + interval '1 second' from public.games where user_id = '61616161-6161-4161-8161-616161616161')
  )).revision,
  1::bigint,
  'idle incremente la revision et le timestamp dans le meme commit'
);

select is(
  (select state ->> 'idleMarker' from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
  'true',
  'le commit idle persiste son etat'
);

select is(
  public.claim_game_transition(
    '61616161-6161-4161-8161-616161616161',
    '61616161-0001-4000-8000-616161616161',
    'command-loaded-before-idle'
  ),
  'claimed',
  'la premiere requete reserve la commande avant le calcul metier'
);

select is(
  public.claim_game_transition(
    '61616161-6161-4161-8161-616161616161',
    '61616161-0001-4000-8000-616161616161',
    'command-loaded-before-idle'
  ),
  'in_progress',
  'une requete identique concurrente ne reexecute pas le calcul metier'
);

select throws_ok(
  $$select public.commit_game_transition(
    '61616161-6161-4161-8161-616161616161',
    '61616161-0001-4000-8000-616161616161',
    'command-loaded-before-idle',
    0,
    (select last_processed_at - interval '1 second' from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select jsonb_set(state, '{lostCommand}', 'true'::jsonb) from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select last_processed_at from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    '[]'::jsonb
  )$$,
  'P0002',
  'STALE_TEMPORAL_STATE',
  'une commande chargee avant idle ne peut pas ecraser idle'
);

select is(
  (select revision from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
  1::bigint,
  'le conflit commande apres idle ne modifie pas la revision'
);

select is(
  public.claim_game_transition(
    '61616161-6161-4161-8161-616161616161',
    '61616161-0002-4000-8000-616161616161',
    'valid-temporal-command'
  ),
  'claimed',
  'une nouvelle commande obtient sa reservation'
);

select is(
  (public.commit_game_transition(
    '61616161-6161-4161-8161-616161616161',
    '61616161-0002-4000-8000-616161616161',
    'valid-temporal-command',
    1,
    (select last_processed_at from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select jsonb_set(state, '{commandMarker}', 'true'::jsonb) from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select last_processed_at + interval '1 second' from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    '[]'::jsonb
  )).revision,
  2::bigint,
  'commande et temps sont commites dans une seule revision'
);

select ok(
  (select (state ->> 'idleMarker')::boolean and (state ->> 'commandMarker')::boolean
   from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
  'la commande conserve aussi l etat idle precedent'
);

select throws_ok(
  $$select public.commit_idle_transition(
    '61616161-6161-4161-8161-616161616161',
    1,
    (select last_processed_at - interval '1 second' from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select jsonb_set(state, '{lostIdle}', 'true'::jsonb) from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select last_processed_at from public.games where user_id = '61616161-6161-4161-8161-616161616161')
  )$$,
  'P0002',
  'STALE_TEMPORAL_STATE',
  'idle charge avant une commande ne peut pas ecraser la commande'
);

select is(
  (select revision from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
  2::bigint,
  'le conflit idle apres commande ne modifie pas la revision'
);

delete from public.game_command_rate_events
where user_id = '61616161-6161-4161-8161-616161616161';

insert into public.game_command_rate_events (user_id, occurred_at)
select
  '61616161-6161-4161-8161-616161616161',
  clock_timestamp()
from generate_series(1, 60) as value;

select is(
  public.claim_game_transition(
    '61616161-6161-4161-8161-616161616161',
    '61616161-0003-4000-8000-616161616161',
    'rate-limited-command'
  ),
  'claimed',
  'la commande limitee est reservee avant le controle de debit'
);

select throws_ok(
  $$select public.commit_game_transition(
    '61616161-6161-4161-8161-616161616161',
    '61616161-0003-4000-8000-616161616161',
    'rate-limited-command',
    2,
    (select last_processed_at from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select state from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    (select last_processed_at from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
    '[]'::jsonb
  )$$,
  'P0004',
  'RATE_LIMITED',
  'la 61e commande de la minute est refusee par PostgreSQL'
);

select is(
  (select revision from public.games where user_id = '61616161-6161-4161-8161-616161616161'),
  2::bigint,
  'la limite de debit refuse sans mutation'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.commit_game_transition(uuid,uuid,text,bigint,timestamptz,jsonb,timestamptz,jsonb)',
    'EXECUTE'
  ),
  'le service peut appeler le commit temporel de commande'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.commit_game_transition(uuid,uuid,text,bigint,timestamptz,jsonb,timestamptz,jsonb)',
    'EXECUTE'
  ),
  'le client authentifie ne peut pas appeler le commit temporel direct'
);

delete from auth.users where id = '61616161-6161-4161-8161-616161616161';

select * from finish();
