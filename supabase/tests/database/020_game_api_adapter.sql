create extension if not exists pgtap;

select plan(5);

select ok(exists (
  select 1 from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname = 'reset_game'
    and prosecdef
), 'reset_game est une fonction security definer');
select ok(exists (
  select 1 from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname = 'reset_game'
    and proconfig @> array['search_path=public']
), 'reset_game verrouille son search_path');
select ok(has_function_privilege('service_role', 'public.reset_game(uuid,jsonb)', 'EXECUTE'), 'service_role peut appeler reset_game');
select ok(not has_function_privilege('authenticated', 'public.reset_game(uuid,jsonb)', 'EXECUTE'), 'authenticated ne peut pas appeler reset_game');
select ok(has_table_privilege('service_role', 'public.alpha_allowlist', 'SELECT'), 'service_role peut lire l allowlist côté Edge');

select * from finish();
