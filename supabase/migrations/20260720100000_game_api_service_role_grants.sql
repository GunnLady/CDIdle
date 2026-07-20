-- The Edge game-api adapter uses the service role through PostgREST for the
-- authenticated server boundary. Keep direct writes restricted to the RPCs;
-- only the bootstrap insert and server-side reads are granted here.
grant select, insert on public.games to service_role;
grant select on public.game_commands to service_role;
