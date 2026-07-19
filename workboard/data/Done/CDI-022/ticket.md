---
id: CDI-022
title: Edge Function game-api
status: Done
area: backend
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-021"]
blocks: ["CDI-023", "CDI-025", "CDI-026", "CDI-027", "CDI-028", "CDI-029", "CDI-030", "CDI-032", "CDI-033", "CDI-039", "CDI-040"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/game-api-audit.md", "docs/architecture/game-api-followups.md"]
---

# CDI-022 — Edge Function game-api

## Objectif

Implementer le perimetre Edge Function game-api selon le plan fullstack autoritaire.

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

Ce ticket depend de : ["CDI-021"].

## Criteres d'acceptation

- [x] Le perimetre est implemente sans regression hors domaine.
- [x] Les invariants sont couverts par des tests reproductibles.
- [x] Les preuves et la documentation sont fournies.

## Tests

- npm test -- --run
- npm run typecheck
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

Fournir fichiers, commandes, resultats, risques residuels et decisions a transmettre.

Les sujets d'adaptateur Supabase de production, de vérification JWT réelle et
de smoke test Edge sont volontairement différés et tracés dans
`docs/architecture/game-api-followups.md`.
