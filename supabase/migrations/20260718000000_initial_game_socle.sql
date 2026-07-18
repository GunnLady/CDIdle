create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;

create table if not exists public.alpha_allowlist (
  email text primary key check (email = lower(trim(email)) and length(email) > 3),
  active boolean not null default true,
  note text,
  added_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version > 0),
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  last_processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_commands (
  user_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  request_hash text not null check (length(trim(request_hash)) > 0),
  expected_revision bigint not null check (expected_revision >= 0),
  resulting_revision bigint not null check (resulting_revision = expected_revision + 1),
  events jsonb not null default '[]'::jsonb check (jsonb_typeof(events) = 'array'),
  created_at timestamptz not null default now(),
  primary key (user_id, command_id),
  check (pg_column_size(events) <= 131072)
);

create index if not exists game_commands_created_at_idx
  on public.game_commands (user_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

alter table public.alpha_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_commands enable row level security;

create policy "profiles_owner_read" on public.profiles
  for select using (auth.uid() = id);
create policy "games_owner_read" on public.games
  for select using (auth.uid() = user_id);
create policy "commands_owner_read" on public.game_commands
  for select using (auth.uid() = user_id);

revoke all on public.alpha_allowlist from anon, authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.games from anon, authenticated;
revoke insert, update, delete on public.game_commands from anon, authenticated;

create or replace function public.prune_game_commands()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.game_commands
  where user_id = new.user_id
    and created_at < now() - interval '24 hours';

  delete from public.game_commands
  where ctid in (
    select ctid
    from public.game_commands
    where user_id = new.user_id
    order by created_at desc
    offset 50
  );
  return new;
end;
$$;

revoke all on function public.prune_game_commands() from public, anon, authenticated, service_role;

create trigger game_commands_prune_after_insert
after insert on public.game_commands
for each row execute function public.prune_game_commands();

create or replace function public.commit_game_command(
  p_user_id uuid,
  p_command_id uuid,
  p_request_hash text,
  p_expected_revision bigint,
  p_state jsonb,
  p_events jsonb default '[]'::jsonb
) returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.game_commands;
  updated_game public.games;
begin
  if p_user_id is null or p_command_id is null or length(trim(p_request_hash)) = 0 then
    raise exception using errcode = '22023', message = 'INVALID_COMMAND_METADATA';
  end if;
  if p_expected_revision < 0 or jsonb_typeof(p_state) <> 'object' or jsonb_typeof(p_events) <> 'array' then
    raise exception using errcode = '22023', message = 'INVALID_COMMAND_PAYLOAD';
  end if;
  if pg_column_size(p_events) > 131072 then
    raise exception using errcode = '22023', message = 'EVENTS_TOO_LARGE';
  end if;

  select * into existing from public.game_commands
    where user_id = p_user_id and command_id = p_command_id;
  if found then
    if existing.request_hash <> p_request_hash then
      raise exception using errcode = 'P0001', message = 'COMMAND_ID_REUSE';
    end if;
    select * into updated_game from public.games where user_id = p_user_id;
    return updated_game;
  end if;

  update public.games
    set state = p_state, revision = revision + 1, updated_at = now()
    where user_id = p_user_id and revision = p_expected_revision
    returning * into updated_game;
  if not found then
    raise exception using errcode = 'P0002', message = 'STALE_REVISION';
  end if;

  insert into public.game_commands(user_id, command_id, request_hash,
    expected_revision, resulting_revision, events)
  values (p_user_id, p_command_id, p_request_hash, p_expected_revision,
    updated_game.revision, p_events);
  return updated_game;
end;
$$;

revoke all on function public.commit_game_command(uuid, uuid, text, bigint, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.commit_game_command(uuid, uuid, text, bigint, jsonb, jsonb)
  to service_role;
