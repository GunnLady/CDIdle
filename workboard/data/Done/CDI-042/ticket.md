---
id: CDI-042
title: Audit global de l'�tat du plan
status: Done
area: governance
priority: P1
size: M
risk: medium
source: plan valide
depends_on: []
blocks: []
github_issue: null
related_docs: ["AGENTS.md","workboard/config.json", "docs/architecture/cdi-042-audit.md"]
---

# CDI-042 — Audit global de l'�tat du plan

## Objectif

Auditer le plan ex�cut�, les r�gles et les �carts encore ouverts.

## Resultat utilisateur

Une photographie fiable des tickets, preuves et blocages.

## Contexte

Le plan a �volu� et plusieurs tickets restent � r�concilier.

## Perimetre autorise

- Plan\n- Workboard\n- R�gles projet

## Hors perimetre

- Nouvelle fonctionnalit� produit

## Contrat d'implementation

- Produire une matrice faits, �carts, preuves et actions.

## Dependances

Aucune.

## Criteres d'acceptation

- [ ] Tous les tickets sont class�s\n- [ ] �carts P1 identifi�s

## Tests

- npm.cmd run board:validate

## Validation manuelle

Relire la matrice avec le propri�taire.

## Preservation

- Conserver l'historique des d�cisions.

## Risques

- Informations historiques contradictoires.

## Handoff

Joindre la matrice d'audit au ticket.
