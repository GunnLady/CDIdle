select plan(10);

select is(
  public.before_user_created(jsonb_build_object(
    'user', jsonb_build_object(
      'email', 'local@example.test',
      'app_metadata', jsonb_build_object('provider', 'google')
    )
  ))::text,
  '{}'::text,
  'un email Google allowlisté est accepté'
);

select ok(
  (public.before_user_created(jsonb_build_object(
    'user', jsonb_build_object(
      'email', 'blocked@example.test',
      'app_metadata', jsonb_build_object('provider', 'google')
    )
  )) #>> '{error,message}') = 'This email is not allowlisted.',
  'un email absent de l allowlist est refusé'
);

select ok(
  (public.before_user_created(jsonb_build_object(
    'user', jsonb_build_object(
      'email', 'local@example.test',
      'app_metadata', jsonb_build_object('provider', 'email')
    )
  )) #>> '{error,message}') = 'Only Google authentication is allowed.',
  'un fournisseur autre que Google est refusé'
);

select ok(
  (public.before_user_created(jsonb_build_object(
    'user', jsonb_build_object(
      'email', 'LOCAL@EXAMPLE.TEST',
      'app_metadata', jsonb_build_object('provider', 'google')
    )
  ))) = '{}'::jsonb,
  'la normalisation email est appliquée'
);

select ok(
  (public.before_user_created('{}'::jsonb) #>> '{error,message}') = 'Only Google authentication is allowed.',
  'un événement sans fournisseur est refusé'
);

select ok(has_function_privilege(
  'supabase_auth_admin', 'public.before_user_created(jsonb)', 'EXECUTE'
), 'Supabase Auth peut appeler le hook');
select ok(not has_function_privilege(
  'authenticated', 'public.before_user_created(jsonb)', 'EXECUTE'
), 'authenticated ne peut pas appeler le hook');
select ok(has_function_privilege(
  'service_role', 'public.revoke_allowlisted_email(text)', 'EXECUTE'
), 'service_role peut révoquer une adresse');
select ok(not has_function_privilege(
  'authenticated', 'public.revoke_allowlisted_email(text)', 'EXECUTE'
), 'authenticated ne peut pas révoquer une adresse');
select ok(exists (
  select 1 from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname = 'before_user_created'
    and prosecdef
), 'le hook est security definer');

select * from finish();
