# Session du 21 juillet 2026 — Auth locale, game-api et CDI-033

## Contexte

Session de reprise du flux local Supabase après la mise en place de Google OAuth.
L’objectif était de débloquer l’exécution locale, valider les cheats
development/staging et clôturer CDI-033 avec des preuves reproductibles.

## Chronologie et causes

1. Google OAuth local a été configuré avec `alpha_allowlist` et testé avec une
   session Google autorisée.
2. L’application restait hors ligne car le runtime `game-api` ne recevait pas
   les variables serveur attendues. Les variables de l’env-file ont été
   renommées en `GAME_API_*` pour éviter le filtrage `SUPABASE_*` du CLI.
3. Le client local a été aligné sur Supabase local (`127.0.0.1:54321`) et sa
   clé `ANON_KEY`.
4. Le bootstrap répondait 404 car la migration locale
   `20260720000000_idle_commit.sql` n’était pas appliquée. La fonction
   `public.commit_idle_state` a été créée localement.
5. Des bootstraps concurrents provoquaient `STALE_IDLE_STATE`. L’adaptateur
   recharge maintenant l’état courant lorsqu’un autre appel a déjà validé le
   tick idle.
6. Le bouton Déconnexion était désactivé par le conteneur offline. Le panneau
   Compte reste désormais interactif hors ligne.
7. Les commandes de sauvegarde envoyaient `save_game`, type absent de l’autorité
   serveur. L’envoi a été retiré ; les commandes métier typées restent la voie
   canonique.

## CDI-033 — Cheats locaux/staging

- Activation limitée aux modes development/staging.
- Affichage limité à un utilisateur Google autorisé par `alpha_allowlist`.
- Mutations bloquées hors ligne.
- `G 100` validé en local et en staging navigateur réel.
- Build production : cheats absents.
- Build staging : cheats présents.
- TypeScript : OK.
- Vitest : 13 fichiers, 97 tests OK.
- Workboard : 49 tickets, 0 erreur.

## Audits et commits

- Audit pré-push et post-push documentés dans le ticket CDI-033.
- `a404fdd` — restauration du sync local, game-api et actions offline.
- `12ccece` — suppression de la commande `save_game` invalide.
- `1a24c55` — ajout des preuves d’audit CDI-033.
- `e39061c` — passage de CDI-033 en Done.

## État final

- CDI-033 : Done.
- CDI-044 Google OAuth : Done.
- CDI-041 : Done après smoke Edge/Supabase local réel.
- CDI-048 : suivi des tests manuels navigateur restant selon le board.
- Branche `main` synchronisée avec `origin/main` au dernier contrôle.

## CDI-041 — Smoke Edge/Supabase local

- `bootstrap` authentifié : HTTP 200.
- `commands` métier : HTTP 200, révision incrémentée.
- `reset` : HTTP 200, état initial restauré.
- Replay idempotent : HTTP 200 avec `replayed: true`.
- Collision de commande : HTTP 400 `DUPLICATE_COMMAND`.
- Requête sans JWT : HTTP 401.
- Origine interdite : HTTP 403.
- `test:db` : 3 fichiers, 40 tests, PASS.
- `supabase:verify` : socle local présent.
- ESLint : 0 erreur, warnings préexistants tracés.

Le ticket CDI-041 a été déplacé de Paused à Doing puis Done et publié dans
le commit `1e73ff1`.

## Écarts et suites

- La sauvegarde cloud générique n’est pas réintroduite sous forme de snapshot
  client ; elle devra être remplacée par des commandes métier typées si le
  besoin revient.
- Toute nouvelle preuve manuelle doit être ajoutée au ticket concerné et à ce
  journal de session si elle modifie l’état du plan.
