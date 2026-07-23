create extension if not exists pgtap;

select plan(10);

select ok(not has_table_privilege('anon', 'public.games', 'INSERT'), 'anon ne peut pas inserer une partie');
select ok(not has_table_privilege('authenticated', 'public.games', 'UPDATE'), 'authenticated ne peut pas modifier une partie directement');
select ok(not has_table_privilege('authenticated', 'public.game_commands', 'INSERT'), 'authenticated ne peut pas inserer une commande directement');
select ok(not has_function_privilege('authenticated', 'public.commit_game_command(uuid,uuid,text,bigint,jsonb,jsonb)', 'EXECUTE'), 'authenticated ne peut pas appeler le commit atomique');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'games' and policyname = 'games_owner_read' and qual like '%auth.uid()%'), 'lecture games liee au JWT');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_owner_read' and qual like '%auth.uid()%'), 'lecture profiles liee au JWT');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename in ('games', 'profiles', 'game_commands') and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')), 'aucune policy de mutation hostile');
select ok((select relrowsecurity from pg_class where oid = 'public.games'::regclass), 'RLS games active');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS profiles active');
select ok((select relrowsecurity from pg_class where oid = 'public.game_commands'::regclass), 'RLS game_commands active');

select * from finish();
