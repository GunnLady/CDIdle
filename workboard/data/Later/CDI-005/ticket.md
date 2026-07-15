---
id: CDI-005
title: Corriger le niveau maximal de guilde
status: Later
area: gameplay
priority: P1
size: S
risk: low
source: Audit du prototype CDIdle du 2026-07-15
depends_on: ["CDI-002"]
blocks: []
github_issue: "https://github.com/mathrondot-collab/CDIdle/issues/5"
related_docs: ["src/data/buildings.ts"]
---

# CDI-005 — Corriger le niveau maximal de guilde

## Objectif

Supprimer la branche `case "guilde"` dupliquee et verrouiller le niveau maximal reel du Campement par un test de regression.

## Resultat utilisateur

Le Campement suit une limite coherente de niveau 5 et son code ne contient plus une seconde branche inatteignable suggerant une limite de niveau 1.

## Contexte

`getBuildingMaxLevel` contient actuellement `case "guilde"` une premiere fois avec `maison_chef` avant `return 5`, puis une seconde fois avant le groupe retournant 1. TypeScript accepte cette duplication mais la seconde branche est morte et entretient une ambiguite de regle.

## Perimetre autorise

- Ajouter un test cible sur `getBuildingMaxLevel`.
- Supprimer uniquement le second `case "guilde"` inatteignable.
- Corriger l'indentation du `return 5` dans le meme switch.
- Verifier les limites 10, 5, 1 et la valeur par defaut avec une table de cas representative.

## Hors perimetre

- Ne pas renommer l'identifiant historique `guilde`.
- Ne pas modifier les couts, pre-requis, descriptions ou rendements des batiments.
- Ne pas changer les niveaux maximums des autres batiments.

## Contrat d'implementation

- Le test doit prouver explicitement `getBuildingMaxLevel("guilde") === 5`.
- Inclure au moins `habitation` a 10, `maison_chef` a 5, `forge` a 1 et un identifiant inconnu a 10.
- Le diff de production doit rester limite au switch de `src/data/buildings.ts`.
- Ne pas transformer le switch en nouvelle abstraction dans ce ticket correctif.

## Dependances

CDI-002 doit etre `Done` pour fournir Vitest et l'emplacement conventionnel des tests.

## Criteres d'acceptation

- [ ] Il n'existe plus qu'une occurrence `case "guilde"` dans `getBuildingMaxLevel`.
- [ ] Le Campement retourne 5 et les autres familles gardent leur valeur actuelle.
- [ ] Un test de regression cible echouerait si la limite repassait a 1.
- [ ] Aucun autre calcul de batiment n'est modifie.

## Tests

- `npm test -- --run`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run board:validate`

## Validation manuelle

- Inspecter le tableau des batiments et verifier que le Campement peut atteindre le niveau 5 mais pas le niveau 6.

## Preservation

- Preserver les identifiants de sauvegarde, couts et conditions de deblocage existants.

## Risques

- Le nom `guilde` est historique mais persiste dans les sauvegardes ; le renommer ici casserait la compatibilite du prototype.

## Handoff

Fournir le test rouge/vert, le diff exact du switch, les commandes executees et la confirmation qu'aucun identifiant persiste n'a change.
