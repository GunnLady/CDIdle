---
id: CDI-034
title: Hardening et budgets
status: Later
area: delivery
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-031", "CDI-032", "CDI-033"]
blocks: ["CDI-035", "CDI-036"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/zero-rebase-audit.md"]
---

# CDI-034 — Hardening et budgets

## Objectif

Implementer le perimetre Hardening et budgets selon le plan fullstack autoritaire.

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

Ce ticket depend de : ["CDI-031", "CDI-032", "CDI-033"].

## Criteres d'acceptation

- [ ] Le perimetre est implemente sans regression hors domaine.
- [ ] Les invariants sont couverts par des tests reproductibles.
- [ ] Les preuves et la documentation sont fournies.

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

Fournir fichiers, commandes, resultats, risques residuels et decisions a transmettre.
