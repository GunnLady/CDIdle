create or replace function public.before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(event #>> '{user,email}', '')));
  provider text := lower(trim(coalesce(event #>> '{user,app_metadata,provider}', '')));
begin
  if provider <> 'google' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Only Google authentication is allowed.'
    ));
  end if;

  if normalized_email = '' or not exists (
    select 1 from public.alpha_allowlist
    where alpha_allowlist.email = normalized_email and active
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'This email is not allowlisted.'
    ));
  end if;

  return '{}'::jsonb;
end;
$$;

create or replace function public.revoke_allowlisted_email(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
begin
  if normalized_email = '' then
    raise exception using errcode = '22023', message = 'EMAIL_REQUIRED';
  end if;

  update public.alpha_allowlist
  set active = false
  where email = normalized_email;
  return found;
end;
$$;

revoke all on function public.before_user_created(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.revoke_allowlisted_email(text)
  from public, anon, authenticated;
grant execute on function public.before_user_created(jsonb) to supabase_auth_admin;
grant execute on function public.revoke_allowlisted_email(text) to service_role;
grant usage on schema public to supabase_auth_admin;
grant select on public.alpha_allowlist to supabase_auth_admin;
