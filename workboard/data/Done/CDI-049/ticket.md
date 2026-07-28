---
id: CDI-049
title: Readiness finale et clôture du plan
status: Done
area: release
priority: P1
size: S
risk: medium
source: audit global
depends_on: ["CDI-045", "CDI-046", "CDI-048", "CDI-050", "CDI-051", "CDI-054"]
blocks: []
github_issue: null
related_docs: ["workboard", "workboard/data/Done/CDI-047/ticket.md"]
---

# CDI-049 — Readiness finale et clôture du plan

## Objectif

Décider la clôture du plan après audits et tests.

## Resultat utilisateur

Le plan autoritaire est clôturé avec une décision GO justifiée, tandis que les
sujets autonomes et les limites de déploiement restent explicitement tracés.

## Contexte

Les audits, les parcours authentifiés locaux et le smoke Supabase distant sont
terminés. Toutes les dépendances explicites du ticket sont `Done`.

## Perimetre autorise

- Résultats des tickets CDI-042 à CDI-048
- État Git, validations locales et smoke distant disponible

## Hors perimetre

- Nouvelle fonctionnalité non planifiée
- Hébergement du frontend
- Automatisation d'un déploiement de production

## Contrat d'implementation

- Auditer critères, oublis, preuves et écarts avant toute clôture.
- Distinguer la clôture du plan autoritaire de la livraison d'un frontend
  public ou d'une production automatisée.

## Dependances

- CDI-045 — offline, cache et conflits : `Done`.
- CDI-046 — matrice finale automatisée : `Done`.
- CDI-048 — parcours front manuels authentifiés : `Done`.
- CDI-050 — persistance RNG canonique : `Done`.
- CDI-051 — raccordement UI aux commandes autoritaires : `Done`.
- CDI-054 — progression des héros : `Done`.

## Criteres d'acceptation

- [x] Tous les P1 restants sont classés.
- [x] Aucun écart réel identifié ne reste non tracé.
- [x] La décision finale est documentée.

## Tests

- CDI-047 : Google OAuth distant, bootstrap HTTP 200 et reset HTTP 200 à la
  révision 693.
- Suite finale CDI-047 : 37 fichiers, 309 tests PASS (Codex).
- TypeScript, lint et garde de déterminisme : PASS (Codex).
- Build final : PASS rapporté par le propriétaire.
- `npm.cmd run board:validate` : 61 tickets, 0 erreur.

## Validation manuelle

Décision validée avec le propriétaire le 2026-07-28 après le smoke distant et
la publication du commit `7f3aee5`.

## Preservation

- CDI-043 conserve la dette documentaire et ses critères de réconciliation.
- CDI-056 conserve la migration indépendante de Supabase JS.
- CDI-060 conserve le catalogue autoritaire et le butin comme nouveau
  périmètre gameplay autonome.
- Les preuves rapportées par le propriétaire restent distinguées des preuves
  exécutées par Codex.

## Risques

- Le frontend n'est pas encore hébergé.
- Les déploiements Supabase restent manuels.
- Aucun statut CI GitHub n'était associé au commit final contrôlé.

## Handoff

Décision finale : **GO pour clôturer le plan autoritaire**.

P1 encore ouverts mais autonomes et explicitement différés :

- CDI-043 — réconciliation documentaire ;
- CDI-056 — migration Supabase JS 2.110.8 ;
- CDI-060 — catalogue autoritaire et butin de boss.

La clôture ne déclare ni le frontend public, ni la production automatisée,
ni ces trois nouveaux périmètres terminés.
