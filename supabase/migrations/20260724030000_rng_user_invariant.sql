do $$
begin
  if exists (
    select 1
    from public.games
    where (state #>> '{rngState,seed}')::bigint
      <> public.canonical_rng_seed(user_id)
  ) then
    raise exception using
      errcode = '22023',
      message = 'CANONICAL_RNG_SEED_USER_MISMATCH';
  end if;
end;
$$;

alter table public.games
  drop constraint games_rng_state_valid;

alter table public.games
  add constraint games_rng_state_valid
  check (
    public.canonical_rng_state_is_valid(state)
    and (state #>> '{rngState,seed}')::bigint
      = public.canonical_rng_seed(user_id)
  )
  not valid;

alter table public.games
  validate constraint games_rng_state_valid;
