---
id: CDI-043
title: R�concilier documentation, workboard et preuves
status: Later
area: governance
priority: P1
size: M
risk: medium
source: audit global
depends_on: []
blocks: []
github_issue: null
related_docs: ["workboard"]
---

# CDI-043 — R�concilier documentation, workboard et preuves

## Objectif

Aligner les documents normatifs, le board et les preuves d'ex�cution.

## Resultat utilisateur

Une source de v�rit� coh�rente et tra�able.

## Contexte

Des documents anciens mentionnent staging alors que main est normatif.

## Perimetre autorise

- Documentation projet\n- Ticket markdown\n- Historique Git

## Hors perimetre

- Refonte de l'application

## Contrat d'implementation

- Corriger les contradictions et r�f�rencer les preuves.

## Dependances

Aucune.

## Criteres d'acceptation

- [ ] R�gle main explicitement prioritaire\n- [ ] Documents obsol�tes signal�s

## Tests

- npm.cmd run board:validate

## Validation manuelle

Relecture des documents modifi�s.

## Preservation

- Ne pas supprimer l'historique.

## Risques

- R�f�rences crois�es obsol�tes.

## Handoff

Lister les fichiers et d�cisions restantes.
