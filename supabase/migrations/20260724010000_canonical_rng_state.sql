update public.games
set state = jsonb_set(
  state,
  '{rngState}',
  '{"algorithm":"xorshift32","version":1,"seed":1831565813,"state":1831565813,"draws":0}'::jsonb,
  true
)
where not state ? 'rngState';
