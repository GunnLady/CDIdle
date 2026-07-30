---
id: CDI-047
title: Smoke réel Edge et Supabase authentifié
status: Done
area: integration
priority: P1
size: M
risk: high
source: audit global
depends_on: []
blocks: ["CDI-062"]
github_issue: null
related_docs: ["supabase", "src/App.tsx", "src/lib/gameCache.ts"]
---

# CDI-047 — Smoke réel Edge et Supabase authentifié

## Objectif

Valider le parcours réel Edge/Supabase avec une session authentifiée.

## Resultat utilisateur

Le frontend local communique avec une base, une authentification Google et une
Edge Function `game-api` réellement hébergées par Supabase.

## Contexte

Le projet Supabase distant `tohujvjxcfarciotsnbp` existait, mais ne contenait
ni migrations CDIdle ni fonction `game-api`. Le smoke a également révélé un
cycle Auth/cache qui empêchait l'acquisition durable du contrôle navigateur.

## Perimetre autorise

- Navigateur réel
- Supabase distant
- API `game-api`

## Hors perimetre

- Modification de données de production non contrôlée
- Hébergement du frontend statique

## Contrat d'implementation

- Utiliser un compte de test et consigner requêtes, statuts et erreurs.
- Ne jamais exposer de JWT, de clé secrète ou de clé `service_role`.

## Dependances

Aucune.

## Criteres d'acceptation

- [x] Session Google distante établie avec allowlist active.
- [x] Bootstrap et mutation contrôlée validés sur l'Edge Function distante.

## Tests

- Bootstrap sans JWT : HTTP 401 après déploiement de `game-api`.
- Bootstrap Google authentifié : HTTP 200.
- Reset distant contrôlé : HTTP 200, révision 693.
- `npm.cmd test -- --run` : 37 fichiers, 309 tests PASS (Codex).
- `npm.cmd run typecheck` : PASS (Codex).
- `npm.cmd run lint -- --quiet` : PASS (Codex).
- `npm.cmd run check:determinism` : PASS (Codex).
- `npm.cmd run board:validate` : 61 tickets, 0 erreur (Codex).
- `npm.cmd run build` : PASS rapporté par le propriétaire.

## Validation manuelle

Validé le 2026-07-28 avec le frontend Vite local connecté au projet Supabase
distant : connexion Google, bootstrap, récupération du contrôle et reset.

## Preservation

- Aucun secret n'a été ajouté au dépôt.
- Le cache IndexedDB reste une projection locale non autoritaire.
- Le frontend distant reste hors périmètre de ce smoke.

## Risques

- Le dépôt Supabase local est désormais lié au projet distant : `db push` et
  `functions deploy` doivent être utilisés en connaissance de cette cible.
- Aucun environnement GitHub de déploiement automatisé n'est encore configuré.

## Handoff

- Dix migrations additives appliquées au projet distant.
- Edge Function `game-api` déployée et protégée par JWT.
- Google OAuth et allowlist distante configurés.
- Le cycle Auth ne dépend plus d'un callback recréé par `setCurrentUser`.
- Les opérations IndexedDB sont bornées afin qu'un cache bloqué ne fige pas le
  snapshot canonique.
- Une demande de contrôle périmée est reprise automatiquement après son TTL.
