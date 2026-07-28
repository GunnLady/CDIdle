---
id: CDI-046
title: Matrice finale des tests automatisés locaux
status: Done
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

# CDI-046 — Matrice finale des tests automatisés locaux

## Objectif

Exécuter la matrice automatisée locale et figer les résultats.

## Resultat utilisateur

Résultats reproductibles typecheck, tests, lint, build et board.

## Contexte

Les validations existent mais doivent être regroupées après audit.

## Perimetre autorise

- Scripts npm locaux
- Validation Workboard
- Ajouter les commandes `test:integration` et `test:e2e` requises par le plan.
- Couvrir le parcours React vers game-api, base, cache et bootstrap.

## Hors perimetre

- CI distante

## Contrat d'implementation

- Exécuter chaque commande et consigner sortie et date.
- Les tests détectent une divergence de champs entre le snapshot serveur et le
  mapping React.
- Reset, suppression de compte et purge IndexedDB sont couverts.

## Dependances

- CDI-045 — cache, offline et conflits.
- CDI-050 — persistance RNG canonique.
- CDI-051 — raccordement UI aux commandes autoritaires.

## Criteres d'acceptation

- [x] Toutes commandes exécutées
- [x] Échecs classés
- [x] `npm.cmd run test:integration` existe et passe.
- [x] `npm.cmd run test:e2e` existe et passe.
- [x] Le parcours UI, API, base, bootstrap et cache est couvert.
- [x] Une divergence du contrat canonique fait échouer la matrice.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:coverage`
- `npm.cmd run check:coverage`
- `npm.cmd run lint`
- `npm.cmd run test:e2e`
- `npm.cmd run test:db`
- `npm.cmd run test:integration`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`
- `npm.cmd audit --omit=dev --audit-level=high`

## Validation manuelle

Relecture des logs et exécution du backend Supabase local avec l'identité
technique synthétique CDI-046.

## Preservation

- Distinguer warnings historiques des erreurs.

## Risques

- Build dépendant de l'environnement.
- L'intégration temporelle consomme volontairement la limite de 60 commandes
  de l'identité technique pendant une minute.

## Handoff

Clôture du 2026-07-28 :

- `test:e2e` ajouté : React, client HTTP, handler game-api, snapshot et cache
  IndexedDB couverts ; 3/3 PASS par Codex.
- Mapping canonique React centralisé et garde exhaustive TypeScript/runtime :
  toute propriété canonique obligatoire non classée fait échouer la matrice.
- Reset, suppression de compte, purge ciblée et isolation du cache couverts.
- `test:integration` utilise un JWT local éphémère et refuse les projets non
  locaux ; aucun bearer personnel n'est requis.
- Bug découvert puis corrigé : conservation exacte des microsecondes PostgreSQL
  lorsqu'aucune seconde idle entière ne s'est écoulée.
- Tests et couverture : 308/308 PASS par Codex ; seuils domaine et game-api PASS.
- Typecheck, Workboard, logs, secrets, déterminisme et diff PASS par Codex.
- Lint : 0 erreur, 49 avertissements historiques hors périmètre.
- Base PostgreSQL/RLS : 94/94 PASS, rapporté par l'utilisateur.
- Intégration temporelle réelle : PASS, rapporté par l'utilisateur.
- Build production : PASS, rapporté par l'utilisateur.
- Bundle : 218667 octets gzip JS, plus gros chunk 144723 octets, PASS par Codex.
- Audit npm de production : 0 vulnérabilité, rapporté par l'utilisateur.
- CI distante exclue explicitement du ticket.
