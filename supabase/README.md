# Socle Supabase local

Ce dossier contient la configuration, les migrations et le seed Supabase.
Avec la CLI Supabase installée :

```powershell
supabase start
supabase db reset
supabase test db
supabase stop
```

Le schéma fournit `alpha_allowlist`, `profiles`, `games` et `game_commands`,
avec contraintes JSONB, révisions, limite d'événements à 128 Ko, rétention 24
heures/50 réponses et RLS. CDI-061 ajoute une fenêtre temporelle de débit
séparée, car cette rétention à 50 ne peut pas prouver une limite de 60
commandes par minute. Les tests pgTAP sont dans
`supabase/tests/database/`.

Les tables exposent uniquement les lectures propriétaire nécessaires. Les
écritures de partie passent par `commit_idle_transition` ou
`commit_game_transition`. Ces RPC comparent révision et
`last_processed_at`; le second garantit aussi l'idempotence d'un `command_id`
et la limite concurrente de 60 commandes par minute.

Avant le calcul métier, `claim_game_transition` réserve la commande. Cela
empêche deux requêtes identiques simultanées de recalculer la mutation. Les
anciens RPC `commit_idle_state` et `commit_game_command` ne sont plus
exécutables par `service_role`.

La création initiale passe par `create_game_transition`. Le `service_role` ne
possède plus `INSERT` direct sur `games`; les contraintes RNG protégées sont
ainsi évaluées dans le contexte propriétaire du RPC.
