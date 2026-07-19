---
id: CDI-040
title: Adaptateur Supabase reel pour game-api
status: Done
area: backend
priority: P1
size: L
risk: high
source: Audit game-api-followups confirme le 2026-07-19
depends_on: ["CDI-020", "CDI-021", "CDI-022", "CDI-039"]
blocks: ["CDI-041"]
github_issue: null
related_docs: ["docs/architecture/game-api-followups.md", "docs/architecture/game-api-audit.md", "docs/architecture/game-repository-audit.md", "docs/architecture/command-dispatcher-audit.md"]
---

# CDI-040 — Adaptateur Supabase reel pour game-api

## Objectif

Relier les services `bootstrap`, `commands`, `reset` et `account` de
`game-api` aux tables, RPC, repository et dispatcher Supabase reels.

## Resultat utilisateur

Les operations de partie sont persistees atomiquement, revisionnees et
idempotentes dans Supabase au lieu d'utiliser des services fictifs.

## Contexte

CDI-020 et CDI-021 ont livre les contrats repository/dispatcher. CDI-022 les
injecte dans le handler HTTP sans adaptateur de production.

## Perimetre autorise

- Implementer les adaptateurs Supabase pour repository et `CommandStore`.
- Brancher bootstrap, commandes, reset et suppression de compte.
- Ajouter ou completer les RPC necessaires et leurs droits minimaux.
- Garantir transaction, revision, idempotence, cascades et retention.
- Traduire les conflits et indisponibilites en erreurs HTTP structurees.

## Hors perimetre

- Ne pas implementer les commandes metier ville, heros, forge ou donjon.
- Ne pas deployer staging ou production.
- Ne pas contourner le dispatcher transactionnel ou les RLS existantes.

## Contrat d'implementation

- Une commande ne peut produire qu'un commit atomique ou aucun changement.
- Une revision perimee retourne l'etat canonique sans ecriture partielle.
- Un `commandId` rejoue restitue le resultat idempotent attendu.

## Dependances

- CDI-020
- CDI-021
- CDI-022
- CDI-039

## Criteres d'acceptation

- [x] Les quatre services `game-api` utilisent Supabase reel.
- [x] Repository, dispatcher, RPC et transactions respectent leurs invariants.
- [x] Les parcours revision, replay, collision et indisponibilite sont testes.
- [x] Reset et suppression appliquent les cascades et purges attendues.

## Tests

- npm test -- --run
- npm run test:db
- npm run typecheck
- npm run lint
- npm run build
- npm run board:validate

## Validation manuelle

Executer bootstrap, une commande idempotente, un conflit de revision, un reset
et une suppression contre Supabase local.

## Preservation

Preserver GameStateV1, les contrats CDI-020/CDI-021 et la frontiere
serveur-autoritaire.

## Risques

Une transaction incomplete peut dupliquer une recompense, perdre un etat ou
desynchroniser la revision et l'historique.

## Handoff

Fournir les migrations/RPC, adaptateurs, tests, resultats et limites avant le
smoke gate CDI-041.
