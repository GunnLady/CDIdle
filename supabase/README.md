# Socle Supabase local

Ce dossier contient la configuration, la migration initiale et le seed du
ticket CDI-017. Avec la CLI Supabase installée :

```powershell
supabase start
supabase db reset
supabase test db
supabase stop
```

Le schema CDI-018 fournit `alpha_allowlist`, `profiles`, `games` et
`game_commands`, avec contraintes JSONB, revisions, limite d'evenements a
128 Ko, retention 24 heures/50 reponses et RLS. Les tests pgTAP sont dans
`supabase/tests/database/018_schema_rls.sql`.

Les tables exposent uniquement les lectures propriétaire nécessaires. Les
écritures de partie et de commandes passent par `commit_game_command`, qui
garantit l'idempotence d'un `command_id` et refuse une révision périmée.
