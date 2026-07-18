---
id: CDI-018
title: Schema PostgreSQL et RLS
status: Done
area: backend
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-007", "CDI-008", "CDI-017"]
blocks: ["CDI-019", "CDI-020"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/supabase-local-audit.md"]
---

# CDI-018 — Schema PostgreSQL et RLS

## Objectif

Implementer le perimetre Schema PostgreSQL et RLS selon le plan fullstack autoritaire.

## Resultat utilisateur

Un composant testable, documente et compatible avec les invariants du plan.

## Contexte

Ce ticket fait partie du catalogue approuve et ses dependants attendent ses contrats.

## Perimetre autorise

- Implementer uniquement le domaine indique.
- Ajouter les tests deterministes et la documentation necessaire.

## Hors perimetre

- Ne pas elargir le ticket a un domaine voisin.
- Ne pas introduire de facturation ni de secret client.

## Contrat d'implementation

- Etat canonique, erreurs explicites et mutations idempotentes.
- Validation reproductible sans reseau reel.

## Dependances

Ce ticket depend de : ["CDI-007", "CDI-008", "CDI-017"].

## Criteres d'acceptation

- [x] Le perimetre est implemente sans regression hors domaine.
- [x] Les invariants sont couverts par des tests reproductibles.
- [x] Les preuves et la documentation sont fournies.

## Tests

- npm test -- --run
- npm run lint
- npm run build
- npm run board:validate

## Validation manuelle

Relire le resultat contre le plan et verifier les parcours nominaux et d'erreur.

## Preservation

Preserver les contrats valides, les identifiants persistants et les tests verts.

## Risques

Une implementation trop large creerait des dependances implicites.

## Handoff

Schema PostgreSQL et RLS livres dans la migration Supabase, avec tables
`alpha_allowlist`, `profiles`, `games` et `game_commands`, contraintes JSONB,
revisions, retention 24 heures/50 reponses et mutations reservees a la
fonction atomique `commit_game_command`. Les tests pgTAP sont dans
`supabase/tests/database/018_schema_rls.sql`.

Preuves : `npx supabase db reset`, `npm run test:db` (21/21),
`npm run supabase:verify`, `npm run typecheck`, `npm run lint` (0 erreur,
134 avertissements historiques), `npm test -- --run` (49/49), `npm run build`
et `npm run board:validate` (38 tickets, 0 erreur). OAuth, repository et
dispatcher complet restent dans CDI-019, CDI-020 et CDI-021.
