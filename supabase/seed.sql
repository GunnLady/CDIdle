insert into public.alpha_allowlist (email, note)
values ('local@example.test', 'Compte de test local')
on conflict (email) do nothing;

insert into public.alpha_allowlist (email, note)
values ('cdi-046-integration@example.test', 'Identite technique locale CDI-046')
on conflict (email) do update set active = true;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '46464646-4646-4646-8646-464646464646',
  'authenticated',
  'authenticated',
  'cdi-046-integration@example.test',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  now(),
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
) on conflict (id) do update set
  email = excluded.email,
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  email_change = '',
  phone = '',
  phone_change = '',
  phone_change_token = '',
  reauthentication_token = '',
  raw_app_meta_data = excluded.raw_app_meta_data,
  updated_at = now();
