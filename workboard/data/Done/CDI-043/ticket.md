---
id: CDI-043
title: Réconcilier documentation, workboard et preuves
status: Done
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

# CDI-043 — Réconcilier documentation, workboard et preuves

## Objectif

Aligner les documents normatifs, le board et les preuves d'exécution.

## Resultat utilisateur

Une source de vérité cohérente et traçable.

## Contexte

Des documents anciens mentionnent staging alors que main est normatif.

## Perimetre autorise

- Documentation projet
- Ticket markdown
- Historique Git

## Hors perimetre

- Refonte de l'application

## Contrat d'implementation

- Corriger les contradictions et référencer les preuves.

## Dependances

Aucune.

## Criteres d'acceptation

- [x] Règle main explicitement prioritaire
- [x] Documents obsolètes signalés

## Tests

- `npm.cmd run board:validate`
- `git diff --check`
- Contrôle des liens Markdown locaux

## Validation manuelle

Relecture des documents modifiés et double audit fonctionnel pré-push.

## Preservation

- Ne pas supprimer l'historique.

## Risques

- Références croisées obsolètes.

## Handoff

- La hiérarchie documentaire donne priorité à `AGENTS.md`, au Workboard pour
  les statuts et aux documents d'architecture pour les décisions.
- Le travail Git sur `main`, le passage à `Done` avant publication et l'audit
  post-push sont alignés dans les documents actifs.
- Le miroir GitHub Issues est explicitement optionnel et désactivé par défaut.
- Tous les audits d'architecture sont signalés comme instantanés historiques.
- Workboard validé : 61 tickets, 0 erreur.
- Liens Markdown locaux et `git diff --check` validés.
- Aucun code applicatif ou test modifié.
