-- Keep the access-check helpers out of the exposed API schema.
-- Policies reference functions by OID, so they follow the move.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.is_team_member() set schema private;
alter function public.is_team_admin() set schema private;
