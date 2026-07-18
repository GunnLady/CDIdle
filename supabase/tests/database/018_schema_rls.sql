create extension if not exists pgtap;

select plan(21);

select ok(to_regclass('public.alpha_allowlist') is not null, 'alpha_allowlist existe');
select ok(to_regclass('public.profiles') is not null, 'profiles existe');
select ok(to_regclass('public.games') is not null, 'games existe');
select ok(to_regclass('public.game_commands') is not null, 'game_commands existe');

select ok((select relrowsecurity from pg_class where oid = 'public.alpha_allowlist'::regclass), 'alpha_allowlist est protégée par RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles est protégée par RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.games'::regclass), 'games est protégée par RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.game_commands'::regclass), 'game_commands est protégée par RLS');

select ok(exists (
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'profiles_owner_read' and cmd = 'SELECT'
), 'profiles expose seulement la lecture propriétaire');
select ok(exists (
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'games'
    and policyname = 'games_owner_read' and cmd = 'SELECT'
), 'games expose seulement la lecture propriétaire');
select ok(exists (
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'game_commands'
    and policyname = 'commands_owner_read' and cmd = 'SELECT'
), 'game_commands expose seulement la lecture propriétaire');
select ok(not exists (
  select 1 from pg_policies
  where schemaname = 'public' and tablename in ('profiles', 'games', 'game_commands')
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
), 'aucune mutation directe n est autorisée par RLS');

select ok((select attnotnull from pg_attribute
  where attrelid = 'public.games'::regclass and attname = 'state' and not attisdropped),
  'games.state est obligatoire');
select ok((select attnotnull from pg_attribute
  where attrelid = 'public.games'::regclass and attname = 'revision' and not attisdropped),
  'games.revision est obligatoire');
select ok(exists (
  select 1 from pg_constraint
  where conrelid = 'public.game_commands'::regclass
    and pg_get_constraintdef(oid) like '%pg_column_size(events)%'
), 'game_commands limite les événements à 128 Ko');
select ok(exists (
  select 1 from pg_trigger
  where tgrelid = 'public.game_commands'::regclass
    and tgname = 'game_commands_prune_after_insert'
), 'game_commands applique la rétention');

select ok(exists (
  select 1 from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname = 'commit_game_command'
    and prosecdef
), 'commit_game_command est une fonction security definer');
select ok(exists (
  select 1 from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname = 'commit_game_command'
    and proconfig @> array['search_path=public']
), 'commit_game_command verrouille son search_path');
select ok(has_schema_privilege('service_role', 'public', 'USAGE'), 'service_role peut utiliser le schéma public');
select ok(has_function_privilege('service_role', 'public.commit_game_command(uuid,uuid,text,bigint,jsonb,jsonb)', 'EXECUTE'), 'service_role peut appeler la fonction atomique');
select ok(not has_function_privilege('authenticated', 'public.commit_game_command(uuid,uuid,text,bigint,jsonb,jsonb)', 'EXECUTE'), 'authenticated ne peut pas appeler directement la fonction atomique');

select * from finish();
