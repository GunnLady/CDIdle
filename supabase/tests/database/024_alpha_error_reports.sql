create extension if not exists pgtap;

select plan(18);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '65656565-6565-4565-8565-656565656565',
  'authenticated', 'authenticated', 'cdi-065@example.test', '', now(),
  '{}'::jsonb, '{}'::jsonb, now(), now()
) on conflict (id) do nothing;

delete from public.alpha_error_report_rate_events
where user_id = '65656565-6565-4565-8565-656565656565';

delete from public.alpha_error_reports
where request_id = 'request-065'
   or (build_version = 'local-dev'
       and category = 'javascript'
       and message ~ '^failure ([2-9]|10)$'
       and surface = 'window');

select ok((select relrowsecurity from pg_class where oid = 'public.alpha_error_reports'::regclass), 'RLS rapports active');
select ok((select relrowsecurity from pg_class where oid = 'public.alpha_error_report_rate_events'::regclass), 'RLS debit active');
select ok(not has_table_privilege('anon', 'public.alpha_error_reports', 'SELECT'), 'anon ne lit pas les rapports');
select ok(not has_table_privilege('authenticated', 'public.alpha_error_reports', 'INSERT'), 'authenticated n insere pas directement');
select ok(not has_table_privilege('service_role', 'public.alpha_error_reports', 'SELECT'), 'service_role ne contourne pas la route pour lire');
select ok(not has_table_privilege('service_role', 'public.alpha_error_reports', 'INSERT'), 'service_role ne contourne pas le RPC pour inserer');
select ok(has_function_privilege('service_role', 'public.submit_alpha_error_report(uuid,text,text,text,text,text,text,integer,text)', 'EXECUTE'), 'service_role peut appeler le RPC borne');
select ok(not has_function_privilege('authenticated', 'public.submit_alpha_error_report(uuid,text,text,text,text,text,text,integer,text)', 'EXECUTE'), 'authenticated ne peut pas appeler le RPC');
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'alpha_error_reports' and column_name = 'user_id'), 'le rapport ne conserve aucun identifiant utilisateur');

select ok(public.submit_alpha_error_report(
  '65656565-6565-4565-8565-656565656565', 'git-0123456789abcdef', 'api_5xx',
  'service unavailable', 'Error: service unavailable', 'request-065',
  'SERVICE_UNAVAILABLE', 503, 'game-api/bootstrap'
) > 0, 'un rapport valide est accepte');

select is((select count(*) from public.alpha_error_reports where request_id = 'request-065'), 1::bigint, 'le rapport est stocke une seule fois');
select ok((select occurred_at between clock_timestamp() - interval '5 seconds' and clock_timestamp() from public.alpha_error_reports where request_id = 'request-065'), 'la date est attribuee par PostgreSQL');
select is((select error_code from public.alpha_error_reports where request_id = 'request-065'), 'SERVICE_UNAVAILABLE', 'le code API est conserve');
select is((select http_status from public.alpha_error_reports where request_id = 'request-065'), 503::smallint, 'le statut HTTP est conserve');

select throws_ok(
  $$select public.submit_alpha_error_report('65656565-6565-4565-8565-656565656565', 'bad-version', 'react', 'failure', null, null, null, null, 'app')$$,
  '22023', 'INVALID_ERROR_REPORT', 'une version invalide est refusee'
);

select throws_ok(
  $$select public.submit_alpha_error_report('65656565-6565-4565-8565-656565656565', 'local-dev', 'react', repeat('x', 501), null, null, null, null, 'app')$$,
  '22023', 'INVALID_ERROR_REPORT', 'un message trop long est refuse'
);

select lives_ok(
  $$select public.submit_alpha_error_report(
    '65656565-6565-4565-8565-656565656565', 'local-dev', 'javascript',
    'failure ' || value, null, null, null, null, 'window'
  ) from generate_series(2, 10) as value$$,
  'les dix premiers rapports de la fenetre sont acceptes'
);

select throws_ok(
  $$select public.submit_alpha_error_report('65656565-6565-4565-8565-656565656565', 'local-dev', 'react', 'eleventh', null, null, null, null, 'app')$$,
  'P0004', 'RATE_LIMITED', 'le onzieme rapport en dix minutes est refuse'
);

delete from public.alpha_error_reports
where request_id = 'request-065'
   or (build_version = 'local-dev'
       and category = 'javascript'
       and message ~ '^failure ([2-9]|10)$'
       and surface = 'window');

delete from auth.users where id = '65656565-6565-4565-8565-656565656565';

select * from finish();
