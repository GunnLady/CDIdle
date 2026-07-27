-- Legacy Edge workers could persist their own wall clock. Normalize only
-- impossible future values once, and make that canonical mutation visible.
update public.games
set last_processed_at = statement_timestamp(),
    revision = revision + 1,
    updated_at = statement_timestamp()
where last_processed_at > statement_timestamp();

create or replace function public.create_game_transition(
  p_user_id uuid,
  p_state jsonb
) returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  created_game public.games;
begin
  if p_user_id is null or jsonb_typeof(p_state) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_INITIAL_GAME_STATE';
  end if;

  insert into public.games(user_id, revision, state, last_processed_at)
  values (p_user_id, 0, p_state, clock_timestamp())
  on conflict (user_id) do nothing
  returning * into created_game;

  if not found then
    select * into created_game from public.games where user_id = p_user_id;
  end if;
  return created_game;
end;
$$;

revoke all on function public.create_game_transition(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_game_transition(uuid, jsonb)
  to service_role;

-- Bootstrap creation now uses the owner-executed RPC, so the Edge role no
-- longer needs a direct INSERT that would evaluate protected constraints as
-- service_role.
revoke insert on public.games from service_role;

create or replace function public.load_game_transition(p_user_id uuid)
returns table (
  schema_version integer,
  revision bigint,
  state jsonb,
  last_processed_at timestamptz,
  server_time timestamptz
)
language sql
security definer
set search_path = public
as $$
  select g.schema_version, g.revision, g.state, g.last_processed_at,
    clock_timestamp()
  from public.games as g
  where g.user_id = p_user_id;
$$;

revoke all on function public.load_game_transition(uuid)
  from public, anon, authenticated;
grant execute on function public.load_game_transition(uuid)
  to service_role;

create or replace function public.commit_idle_transition(
  p_user_id uuid,
  p_expected_revision bigint,
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
  if p_user_id is null or p_expected_revision < 0
     or p_expected_last_processed_at is null or p_last_processed_at is null
     or jsonb_typeof(p_state) <> 'object'
     or p_last_processed_at < p_expected_last_processed_at
     or p_last_processed_at > clock_timestamp() + interval '1 second' then
    raise exception using errcode = '22023', message = 'INVALID_IDLE_PAYLOAD';
  end if;

  update public.games
    set state = p_state,
        revision = revision + 1,
        last_processed_at = p_last_processed_at,
        updated_at = now()
    where user_id = p_user_id
      and revision = p_expected_revision
      and last_processed_at = p_expected_last_processed_at
    returning * into updated_game;
  if not found then
    raise exception using errcode = 'P0002', message = 'STALE_TEMPORAL_STATE';
  end if;
  return updated_game;
end;
$$;

revoke all on function public.commit_idle_transition(uuid, bigint, timestamptz, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.commit_idle_transition(uuid, bigint, timestamptz, jsonb, timestamptz)
  to service_role;

create table if not exists public.game_command_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  request_hash text not null check (length(trim(request_hash)) > 0),
  claimed_at timestamptz not null default clock_timestamp(),
  primary key (user_id, command_id)
);

alter table public.game_command_claims enable row level security;
revoke all on public.game_command_claims
  from public, anon, authenticated, service_role;

create or replace function public.claim_game_transition(
  p_user_id uuid,
  p_command_id uuid,
  p_request_hash text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_hash text;
  pending public.game_command_claims;
  claim_time timestamptz;
begin
  if p_user_id is null or p_command_id is null
     or length(trim(p_request_hash)) = 0 then
    raise exception using errcode = '22023', message = 'INVALID_COMMAND_METADATA';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_command_id::text, 0)
  );

  select request_hash into existing_hash
  from public.game_commands
  where user_id = p_user_id and command_id = p_command_id;
  if found then
    if existing_hash <> p_request_hash then
      raise exception using errcode = 'P0001', message = 'COMMAND_ID_REUSE';
    end if;
    return 'replayed';
  end if;

  select * into pending
  from public.game_command_claims
  where user_id = p_user_id and command_id = p_command_id;
  claim_time := clock_timestamp();
  if found then
    if pending.request_hash <> p_request_hash then
      raise exception using errcode = 'P0001', message = 'COMMAND_ID_REUSE';
    end if;
    if pending.claimed_at >= claim_time - interval '30 seconds' then
      return 'in_progress';
    end if;
    update public.game_command_claims
      set claimed_at = claim_time
      where user_id = p_user_id and command_id = p_command_id;
    return 'claimed';
  end if;

  insert into public.game_command_claims(
    user_id, command_id, request_hash, claimed_at
  ) values (p_user_id, p_command_id, p_request_hash, claim_time);
  return 'claimed';
end;
$$;

revoke all on function public.claim_game_transition(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_game_transition(uuid, uuid, text)
  to service_role;

create or replace function public.release_game_transition_claim(
  p_user_id uuid,
  p_command_id uuid,
  p_request_hash text
) returns void
language sql
security definer
set search_path = public
as $$
  delete from public.game_command_claims
  where user_id = p_user_id
    and command_id = p_command_id
    and request_hash = p_request_hash;
$$;

revoke all on function public.release_game_transition_claim(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.release_game_transition_claim(uuid, uuid, text)
  to service_role;

create table if not exists public.game_command_rate_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default clock_timestamp()
);

create index if not exists game_command_rate_events_user_time_idx
  on public.game_command_rate_events (user_id, occurred_at desc);

alter table public.game_command_rate_events enable row level security;
revoke all on public.game_command_rate_events
  from public, anon, authenticated, service_role;

create or replace function public.commit_game_transition(
  p_user_id uuid,
  p_command_id uuid,
  p_request_hash text,
  p_expected_revision bigint,
  p_expected_last_processed_at timestamptz,
  p_state jsonb,
  p_last_processed_at timestamptz,
  p_events jsonb default '[]'::jsonb
) returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.game_commands;
  updated_game public.games;
  rate_time timestamptz;
begin
  if p_user_id is null or p_command_id is null
     or length(trim(p_request_hash)) = 0
     or p_expected_revision < 0
     or p_expected_last_processed_at is null or p_last_processed_at is null
     or jsonb_typeof(p_state) <> 'object'
     or jsonb_typeof(p_events) <> 'array'
     or p_last_processed_at < p_expected_last_processed_at
     or p_last_processed_at > clock_timestamp() + interval '1 second' then
    raise exception using errcode = '22023', message = 'INVALID_COMMAND_PAYLOAD';
  end if;
  if pg_column_size(p_events) > 131072 then
    raise exception using errcode = '22023', message = 'EVENTS_TOO_LARGE';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_command_id::text, 0)
  );

  select * into existing from public.game_commands
    where user_id = p_user_id and command_id = p_command_id;
  if found then
    if existing.request_hash <> p_request_hash then
      raise exception using errcode = 'P0001', message = 'COMMAND_ID_REUSE';
    end if;
    delete from public.game_command_claims
      where user_id = p_user_id and command_id = p_command_id;
    select * into updated_game from public.games where user_id = p_user_id;
    return updated_game;
  end if;

  if not exists (
    select 1 from public.game_command_claims
    where user_id = p_user_id
      and command_id = p_command_id
      and request_hash = p_request_hash
  ) then
    raise exception using errcode = 'P0005', message = 'COMMAND_CLAIM_REQUIRED';
  end if;

  -- Serialize the rolling window per user. The idempotency table is pruned to
  -- 50 rows and therefore cannot be used to enforce a 60-command limit.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  rate_time := clock_timestamp();
  delete from public.game_command_rate_events
    where user_id = p_user_id
      and occurred_at < rate_time - interval '1 minute';
  if (select count(*) from public.game_command_rate_events
      where user_id = p_user_id
        and occurred_at >= rate_time - interval '1 minute') >= 60 then
    raise exception using errcode = 'P0004', message = 'RATE_LIMITED';
  end if;
  insert into public.game_command_rate_events(user_id, occurred_at)
    values (p_user_id, rate_time);

  update public.games
    set state = p_state,
        revision = revision + 1,
        last_processed_at = p_last_processed_at,
        updated_at = now()
    where user_id = p_user_id
      and revision = p_expected_revision
      and last_processed_at = p_expected_last_processed_at
    returning * into updated_game;
  if not found then
    raise exception using errcode = 'P0002', message = 'STALE_TEMPORAL_STATE';
  end if;

  insert into public.game_commands(user_id, command_id, request_hash,
    expected_revision, resulting_revision, events)
  values (p_user_id, p_command_id, p_request_hash, p_expected_revision,
    updated_game.revision, p_events);
  delete from public.game_command_claims
    where user_id = p_user_id and command_id = p_command_id;
  return updated_game;
end;
$$;

revoke all on function public.commit_game_transition(uuid, uuid, text, bigint, timestamptz, jsonb, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.commit_game_transition(uuid, uuid, text, bigint, timestamptz, jsonb, timestamptz, jsonb)
  to service_role;

-- The runtime now has one temporal write path. Keep the historical functions
-- for migration history and owner-only regression tests, but prevent any Edge
-- worker using service_role from bypassing revision/time/rate invariants.
revoke execute on function public.commit_idle_state(uuid, timestamptz, jsonb, timestamptz)
  from service_role;
revoke execute on function public.commit_game_command(uuid, uuid, text, bigint, jsonb, jsonb)
  from service_role;
