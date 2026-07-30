create table if not exists public.alpha_error_reports (
  id bigint generated always as identity primary key,
  build_version text not null,
  category text not null,
  message text not null,
  stack text,
  request_id text,
  error_code text,
  http_status smallint,
  surface text not null,
  occurred_at timestamptz not null default clock_timestamp(),
  constraint alpha_error_reports_build_version_check
    check (build_version ~ '^(local-dev|git-[0-9a-f]{7,40})$'),
  constraint alpha_error_reports_category_check
    check (category in ('react', 'javascript', 'unhandledrejection', 'timeout', 'api_5xx')),
  constraint alpha_error_reports_message_check
    check (char_length(message) between 1 and 500),
  constraint alpha_error_reports_stack_check
    check (stack is null or char_length(stack) between 1 and 4000),
  constraint alpha_error_reports_request_id_check
    check (request_id is null or char_length(request_id) between 1 and 128),
  constraint alpha_error_reports_error_code_check
    check (error_code is null or error_code ~ '^[A-Z0-9_]{1,64}$'),
  constraint alpha_error_reports_http_check
    check ((category = 'api_5xx' and http_status is not null and http_status between 500 and 599)
        or (category <> 'api_5xx' and http_status is null and error_code is null)),
  constraint alpha_error_reports_surface_check
    check (surface ~ '^[a-zA-Z0-9_./:-]{1,64}$')
);

create index if not exists alpha_error_reports_occurred_at_idx
  on public.alpha_error_reports (occurred_at desc);
create index if not exists alpha_error_reports_analysis_idx
  on public.alpha_error_reports (build_version, category, occurred_at desc);

create table if not exists public.alpha_error_report_rate_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default clock_timestamp()
);

create index if not exists alpha_error_report_rate_events_user_time_idx
  on public.alpha_error_report_rate_events (user_id, occurred_at desc);

alter table public.alpha_error_reports enable row level security;
alter table public.alpha_error_report_rate_events enable row level security;

revoke all on public.alpha_error_reports from public, anon, authenticated, service_role;
revoke all on public.alpha_error_report_rate_events from public, anon, authenticated, service_role;
revoke all on sequence public.alpha_error_reports_id_seq from public, anon, authenticated, service_role;

create or replace function public.submit_alpha_error_report(
  p_user_id uuid,
  p_build_version text,
  p_category text,
  p_message text,
  p_stack text,
  p_request_id text,
  p_error_code text,
  p_http_status integer,
  p_surface text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  report_id bigint;
begin
  if p_user_id is null
     or p_build_version !~ '^(local-dev|git-[0-9a-f]{7,40})$'
     or p_category not in ('react', 'javascript', 'unhandledrejection', 'timeout', 'api_5xx')
     or char_length(p_message) not between 1 and 500
     or (p_stack is not null and char_length(p_stack) not between 1 and 4000)
     or (p_request_id is not null and char_length(p_request_id) not between 1 and 128)
     or (p_error_code is not null and p_error_code !~ '^[A-Z0-9_]{1,64}$')
     or (p_category = 'api_5xx' and (p_http_status is null or p_http_status not between 500 and 599))
     or (p_category <> 'api_5xx' and (p_http_status is not null or p_error_code is not null))
     or p_surface !~ '^[a-zA-Z0-9_./:-]{1,64}$' then
    raise exception using errcode = '22023', message = 'INVALID_ERROR_REPORT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 65065));

  delete from public.alpha_error_report_rate_events
  where user_id = p_user_id
    and occurred_at < clock_timestamp() - interval '10 minutes';

  if (select count(*) from public.alpha_error_report_rate_events where user_id = p_user_id) >= 10 then
    raise exception using errcode = 'P0004', message = 'RATE_LIMITED';
  end if;

  insert into public.alpha_error_report_rate_events (user_id)
  values (p_user_id);

  insert into public.alpha_error_reports (
    build_version,
    category,
    message,
    stack,
    request_id,
    error_code,
    http_status,
    surface
  ) values (
    p_build_version,
    p_category,
    p_message,
    p_stack,
    p_request_id,
    p_error_code,
    p_http_status,
    p_surface
  ) returning id into report_id;

  return report_id;
end;
$$;

revoke all on function public.submit_alpha_error_report(uuid, text, text, text, text, text, text, integer, text)
  from public, anon, authenticated, service_role;
grant execute on function public.submit_alpha_error_report(uuid, text, text, text, text, text, text, integer, text)
  to service_role;
