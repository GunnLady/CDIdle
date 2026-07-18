insert into public.alpha_allowlist (email, note)
values ('local@example.test', 'Compte de test local')
on conflict (email) do nothing;
