---
id: CDI-046
title: Matrice finale des tests automatis�s locaux
status: Later
area: quality
priority: P1
size: S
risk: low
source: audit global
depends_on: ["CDI-045", "CDI-050", "CDI-051", "CDI-054"]
blocks: ["CDI-048", "CDI-049"]
github_issue: null
related_docs: ["package.json", ".github/workflows/ci.yml", "docs/fullstack-authoritative-plan.md"]
---

# CDI-046 — Matrice finale des tests automatis�s locaux

## Objectif

Ex�cuter la matrice automatis�e locale et figer les r�sultats.

## Resultat utilisateur

R�sultats reproductibles typecheck, tests, lint, build et board.

## Contexte

Les validations existent mais doivent �tre regroup�es apr�s audit.

## Perimetre autorise

- Scripts npm locaux\n- Validation Workboard
- Ajouter les commandes `test:integration` et `test:e2e` requises par le plan.
- Couvrir le parcours React vers game-api, base, cache et bootstrap.

## Hors perimetre

- CI distante

## Contrat d'implementation

- Ex�cuter chaque commande et consigner sortie et date.
- Les tests detectent une divergence de champs entre le snapshot serveur et le
  mapping React.
- Reset, suppression de compte et purge IndexedDB sont couverts.

## Dependances

- CDI-045 — cache, offline et conflits.
- CDI-050 — persistance RNG canonique.
- CDI-051 — raccordement UI aux commandes autoritaires.

## Criteres d'acceptation

- [ ] Toutes commandes ex�cut�es\n- [ ] �checs class�s
- [ ] `npm.cmd run test:integration` existe et passe.
- [ ] `npm.cmd run test:e2e` existe et passe.
- [ ] Le parcours UI, API, base, bootstrap et cache est couvert.
- [ ] Une divergence du contrat canonique fait echouer la matrice.

## Tests

- npm.cmd run typecheck\n- npm.cmd test -- --run\n- npm.cmd run lint\n- npm.cmd run build\n- npm.cmd run board:validate

## Validation manuelle

Relecture des logs.

## Preservation

- Distinguer warnings historiques des erreurs.

## Risques

- Build d�pendant de l'environnement.

## Handoff

Joindre la matrice compl�te.
