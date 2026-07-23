---
id: CDI-034
title: Hardening et budgets
status: Done
area: delivery
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-031", "CDI-032", "CDI-033"]
blocks: ["CDI-035", "CDI-036"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/zero-rebase-audit.md", "docs/architecture/cdi-034-hardening-audit.md"]
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

- [x] Le perimetre est implemente sans regression hors domaine.
- [x] Les invariants sont couverts par des tests reproductibles.
- [x] Les preuves et la documentation sont fournies.

## Tests

- npm test -- --run
- npm run lint
- npm run build
- npm run board:validate

## Preuves d'execution

- Vitest : 15 fichiers, 102 tests, succes.
- pgTAP : 4 fichiers, 50 tests, succes.
- `npm run typecheck` : succes.
- `npm run build` : succes, sans avertissement de chunk Vite.
- `npm run check:bundle` : 231014 octets gzip, chunk maximal 144900 octets.
- `npm run check:secrets` : 222 fichiers suivis analyses, aucun secret detecte.
- `npm run board:validate` : 51 tickets, 0 erreur.
- Benchmark combat : 1000 rounds sous 500 ms.

## Validation manuelle

Relecture contre le plan effectuee. Les parcours nominaux et d'erreur sont
couverts par les tests Edge, Error Boundary et pgTAP. Les tests navigateur
manuels restent du ressort des tickets front dependants.

## Preservation

Preserver les contrats valides, les identifiants persistants et les tests verts.

## Risques

Une implementation trop large creerait des dependances implicites.

## Risques residuels

`npm run lint` retourne 0 erreur et 132 avertissements herites de fichiers
anterieurs a CDI-034. Aucun avertissement nouveau n'a ete introduit par ce
ticket ; leur correction reste dans les tickets proprietaires.

## Handoff

Fournir fichiers, commandes, resultats, risques residuels et decisions a transmettre.
