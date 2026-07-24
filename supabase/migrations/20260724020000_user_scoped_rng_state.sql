create or replace function public.canonical_rng_seed(p_user_id uuid)
returns bigint
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  source text := replace(lower(p_user_id::text), '-', '');
  seed bigint := 2166136261;
  char_index integer;
begin
  for char_index in 1..length(source) loop
    seed := (
      (seed # ascii(substr(source, char_index, 1))::bigint) * 16777619
    )
      % 4294967296;
  end loop;
  return case when seed = 0 then 1831565813::bigint else seed end;
end;
$$;

revoke all on function public.canonical_rng_seed(uuid)
  from public, anon, authenticated, service_role;

update public.games
set state = jsonb_set(
  state,
  '{rngState}',
  jsonb_build_object(
    'algorithm', 'xorshift32',
    'version', 1,
    'seed', public.canonical_rng_seed(user_id),
    'state', public.canonical_rng_seed(user_id),
    'draws', 0
  ),
  true
)
where not state ? 'rngState';

create or replace function public.canonical_rng_state_is_valid(p_state jsonb)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select coalesce((
    jsonb_typeof(p_state -> 'rngState') = 'object'
    and p_state #>> '{rngState,algorithm}' = 'xorshift32'
    and p_state #>> '{rngState,version}' = '1'
    and coalesce(p_state #>> '{rngState,seed}', '') ~ '^[0-9]+$'
    and coalesce(p_state #>> '{rngState,seed}', '') !~ '^0+$'
    and (
      length(p_state #>> '{rngState,seed}') < 10
      or (
        length(p_state #>> '{rngState,seed}') = 10
        and p_state #>> '{rngState,seed}' <= '4294967295'
      )
    )
    and coalesce(p_state #>> '{rngState,state}', '') ~ '^[0-9]+$'
    and coalesce(p_state #>> '{rngState,state}', '') !~ '^0+$'
    and (
      length(p_state #>> '{rngState,state}') < 10
      or (
        length(p_state #>> '{rngState,state}') = 10
        and p_state #>> '{rngState,state}' <= '4294967295'
      )
    )
    and coalesce(p_state #>> '{rngState,draws}', '') ~ '^[0-9]+$'
    and (
      length(p_state #>> '{rngState,draws}') < 16
      or (
        length(p_state #>> '{rngState,draws}') = 16
        and p_state #>> '{rngState,draws}' <= '9007199254740991'
      )
    )
  ), false);
$$;

revoke all on function public.canonical_rng_state_is_valid(jsonb)
  from public, anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from public.games
    where not public.canonical_rng_state_is_valid(state)
  ) then
    raise exception using
      errcode = '22023',
      message = 'INVALID_OR_UNSUPPORTED_CANONICAL_RNG_STATE';
  end if;
end;
$$;

-- One-time transition away from the provisional shared seed introduced by
-- 20260724010000. Gameplay state and revision are preserved; only the future
-- RNG sequence is restarted from the account-derived seed.
update public.games
set state = jsonb_set(
  state,
  '{rngState}',
  jsonb_build_object(
    'algorithm', 'xorshift32',
    'version', 1,
    'seed', public.canonical_rng_seed(user_id),
    'state', public.canonical_rng_seed(user_id),
    'draws', 0
  ),
  false
)
where (state #>> '{rngState,seed}')::bigint
  <> public.canonical_rng_seed(user_id);

alter table public.games
  add constraint games_rng_state_valid
  check (public.canonical_rng_state_is_valid(state))
  not valid;

alter table public.games
  validate constraint games_rng_state_valid;
