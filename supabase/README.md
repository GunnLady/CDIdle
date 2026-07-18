# Socle Supabase local

Ce dossier contient la configuration, la migration initiale et le seed du
ticket CDI-017. Avec la CLI Supabase installée :

```powershell
supabase start
supabase db reset
supabase stop
```

Les tables exposent uniquement les lectures propriétaire nécessaires. Les
écritures de partie et de commandes passent par `commit_game_command`, qui
garantit l'idempotence d'un `command_id` et refuse une révision périmée.
