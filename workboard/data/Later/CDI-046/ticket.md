---
id: CDI-046
title: Matrice finale des tests automatis�s locaux
status: Later
area: quality
priority: P1
size: S
risk: low
source: audit global
depends_on: []
blocks: []
github_issue: null
related_docs: ["package.json"]
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

## Hors perimetre

- CI distante

## Contrat d'implementation

- Ex�cuter chaque commande et consigner sortie et date.

## Dependances

Aucune.

## Criteres d'acceptation

- [ ] Toutes commandes ex�cut�es\n- [ ] �checs class�s

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
