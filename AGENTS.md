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
