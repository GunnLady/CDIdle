create or replace function public.reset_game(p_user_id uuid, p_state jsonb)
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare result public.games;
begin
  if p_user_id is null or p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception using errcode = '22023', message = 'INVALID_RESET_STATE'; end if;
  update public.games set state = p_state, revision = revision + 1, last_processed_at = now(), updated_at = now()
    where user_id = p_user_id returning * into result;
  if not found then raise exception using errcode = 'P0003', message = 'GAME_NOT_FOUND'; end if;
  delete from public.game_commands where user_id = p_user_id;
  return result;
end;
$$;
revoke all on function public.reset_game(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.reset_game(uuid, jsonb) to service_role;
