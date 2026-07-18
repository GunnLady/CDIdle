---
id: CDI-015
title: Moteur de combat et transcript
status: Doing
area: domain
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-009", "CDI-011", "CDI-012", "CDI-014"]
blocks: ["CDI-029", "CDI-037"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/dungeon-progression-audit.md", "docs/architecture/zero-rebase-audit.md"]
---

# CDI-015 — Moteur de combat et transcript

## Objectif

Implementer le perimetre Moteur de combat et transcript selon le plan fullstack autoritaire.

## Resultat utilisateur

Un composant testable, documente et compatible avec les invariants du plan.

## Contexte

Ce ticket fait partie du catalogue approuve et ses dependants attendent ses contrats.

## Perimetre autorise

- Implementer uniquement le domaine indique.
- Ajouter les tests deterministes et la documentation necessaire.
- Prendre en charge le contrat des encounters et la production d'un transcript
  deterministe, y compris les cas de succes, d'echec et d'interruption.
- Representer les buffs et debuffs comme des modificateurs temporaires par
  combattant, avec duree en rounds, expiration et trace dans le transcript.

## Hors perimetre

- Ne pas elargir le ticket a un domaine voisin.
- Ne pas introduire de facturation ni de secret client.

## Contrat d'implementation

- Etat canonique, erreurs explicites et mutations idempotentes.
- Validation reproductible sans reseau reel.
- Le resultat d'un encounter doit etre rejouable a seed et etat identiques.
- `attackSpeed` est une cadence : `1` vaut un coup par tick, `0.8` est plus
  lent et `1.5` plus rapide ; cette cadence est combinee a `speed` pour le
  calcul des frappes supplementaires.

## Dependances

Ce ticket depend de : ["CDI-009", "CDI-011", "CDI-012", "CDI-014"].

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
