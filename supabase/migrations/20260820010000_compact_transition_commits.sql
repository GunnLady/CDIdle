-- Compact commit RPCs keep the existing atomic transition functions as the
-- single implementation of revision, time, idempotency and rate-limit rules.
-- Only the PostgREST response shape changes: Edge already owns the state it
-- submitted and only needs commit metadata after PostgreSQL accepted it.

create or replace function public.commit_idle_transition_v2(
  p_user_id uuid,
  p_expected_revision bigint,
  p_expected_last_processed_at timestamptz,
  p_state jsonb,
  p_last_processed_at timestamptz
) returns table (
  schema_version integer,
  revision bigint,
  last_processed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  committed public.games;
begin
  committed := public.commit_idle_transition(
    p_user_id,
    p_expected_revision,
    p_expected_last_processed_at,
    p_state,
    p_last_processed_at
  );
  return query select
    committed.schema_version,
    committed.revision,
    committed.last_processed_at;
end;
$$;

revoke all on function public.commit_idle_transition_v2(
  uuid, bigint, timestamptz, jsonb, timestamptz
) from public, anon, authenticated;
grant execute on function public.commit_idle_transition_v2(
  uuid, bigint, timestamptz, jsonb, timestamptz
) to service_role;

create or replace function public.commit_game_transition_v2(
  p_user_id uuid,
  p_command_id uuid,
  p_request_hash text,
  p_expected_revision bigint,
  p_expected_last_processed_at timestamptz,
  p_state jsonb,
  p_last_processed_at timestamptz,
  p_events jsonb default '[]'::jsonb
) returns table (
  schema_version integer,
  revision bigint,
  last_processed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  committed public.games;
begin
  committed := public.commit_game_transition(
    p_user_id,
    p_command_id,
    p_request_hash,
    p_expected_revision,
    p_expected_last_processed_at,
    p_state,
    p_last_processed_at,
    p_events
  );
  return query select
    committed.schema_version,
    committed.revision,
    committed.last_processed_at;
end;
$$;

revoke all on function public.commit_game_transition_v2(
  uuid, uuid, text, bigint, timestamptz, jsonb, timestamptz, jsonb
) from public, anon, authenticated;
grant execute on function public.commit_game_transition_v2(
  uuid, uuid, text, bigint, timestamptz, jsonb, timestamptz, jsonb
) to service_role;
