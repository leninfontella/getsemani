-- Atomic, server-side fixed-window rate limits for privileged Edge Functions.
-- Only service_role can consume a bucket; clients cannot inspect or mutate it.
create table if not exists public.edge_rate_limits (
  endpoint text not null,
  subject_id uuid not null,
  window_started_at timestamptz not null default clock_timestamp(),
  request_count integer not null default 1 check (request_count > 0),
  primary key (endpoint, subject_id)
);

alter table public.edge_rate_limits enable row level security;
alter table public.edge_rate_limits force row level security;

revoke all on table public.edge_rate_limits from public, anon, authenticated;

create or replace function public.consume_edge_rate_limit(
  p_endpoint text,
  p_subject_id uuid,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_time timestamptz := clock_timestamp();
  bucket public.edge_rate_limits%rowtype;
begin
  if p_endpoint is null or char_length(p_endpoint) not between 1 and 80
    or p_subject_id is null
    or p_max_requests not between 1 and 10000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into public.edge_rate_limits as limits (
    endpoint,
    subject_id,
    window_started_at,
    request_count
  ) values (
    p_endpoint,
    p_subject_id,
    current_time,
    1
  )
  on conflict (endpoint, subject_id) do update
  set
    window_started_at = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= current_time
        then current_time
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= current_time
        then 1
      else limits.request_count + 1
    end
  returning * into bucket;

  allowed := bucket.request_count <= p_max_requests;
  retry_after := case
    when allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (
        bucket.window_started_at + make_interval(secs => p_window_seconds) - current_time
      )))::integer
    )
  end;
  return next;
end;
$$;

revoke all on function public.consume_edge_rate_limit(text, uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text, uuid, integer, integer)
  to service_role;

notify pgrst, 'reload schema';
