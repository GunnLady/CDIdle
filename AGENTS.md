# Instructions projet CDIdle

## Contexte d'exécution Codex

Les actions susceptibles d'être bloquées par le sandbox ou par des verrous de
processus sont documentées dans
[`docs/development/codex-elevation.md`](docs/development/codex-elevation.md).

Avant une commande potentiellement privilégiée, Codex doit :

1. annoncer l'action et sa cible exacte ;
2. demander une élévation ciblée si le sandbox la refuse ;
3. ne jamais demander une élévation globale ou utiliser une cible non vérifiée.

Le PowerShell utilisateur reste la référence pour les processus interactifs,
Vite, Vitest, Supabase local et Docker.

## Replay autoritaire local

Pour rejouer manuellement une commande sans copier de bearer :

1. récupérer dans `public.game_commands` le `command_id`,
   `expected_revision` et la nature de la commande à vérifier ;
2. depuis la console Chrome ouverte sur le frontend local, importer
   `supabase` avec `await import("/src/lib/supabase.ts")`, puis obtenir la
   session avec `supabase.auth.getSession()` ;
3. renvoyer sur `/functions/v1/game-api/commands` exactement le même envelope :
   même `commandId`, même `idempotencyKey`, même `expectedRevision`, même
   `clientVersion` et même `command` ;
4. ne pas réinjecter manuellement la réponse dans l'interface ;
5. vérifier `HTTP 200`, `ok: true`, `replayed: true`, une seule ligne pour le
   `command_id` dans `public.game_commands` et l'absence de duplication dans
   l'état canonique.

Le token doit être lu depuis la session courante et ne doit jamais être écrit
dans la documentation, les commandes partagées ou Git.
