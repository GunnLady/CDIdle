create or replace function public.commit_idle_state(
  p_user_id uuid,
  p_expected_last_processed_at timestamptz,
  p_state jsonb,
  p_last_processed_at timestamptz
) returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_game public.games;
begin
  if p_user_id is null or p_expected_last_processed_at is null or p_last_processed_at is null
     or jsonb_typeof(p_state) <> 'object' or p_last_processed_at < p_expected_last_processed_at then
    raise exception using errcode = '22023', message = 'INVALID_IDLE_PAYLOAD';
  end if;

  update public.games
    set state = p_state, last_processed_at = p_last_processed_at, updated_at = now()
    where user_id = p_user_id and last_processed_at = p_expected_last_processed_at
    returning * into updated_game;
  if not found then
    raise exception using errcode = 'P0003', message = 'STALE_IDLE_STATE';
  end if;
  return updated_game;
end;
$$;

revoke all on function public.commit_idle_state(uuid, timestamptz, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.commit_idle_state(uuid, timestamptz, jsonb, timestamptz)
  to service_role;
