-- Repair deployments where the first rate-limit migration was recorded before
-- the function/table permissions were fully available to Edge Functions.
-- The table remains inaccessible to anon/authenticated clients; only the
-- SECURITY DEFINER function can mutate it.
alter table public.edge_rate_limits no force row level security;

alter function public.consume_edge_rate_limit(text, uuid, integer, integer)
  security definer;
alter function public.consume_edge_rate_limit(text, uuid, integer, integer)
  set search_path = '';

revoke all on table public.edge_rate_limits from public, anon, authenticated;
revoke all on function public.consume_edge_rate_limit(text, uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text, uuid, integer, integer)
  to service_role;

notify pgrst, 'reload schema';
