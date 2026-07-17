---
id: CDI-037
title: Audit global et migration horloge/RNG
status: Later
area: domain
priority: P1
size: L
risk: medium
source: Extension utilisateur du plan fullstack autoritaire
depends_on: ["CDI-009", "CDI-010", "CDI-011", "CDI-012", "CDI-013", "CDI-014", "CDI-015", "CDI-016"]
blocks: []
github_issue: null
tags: ["analyse"]
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/clock-rng.md"]
---

# CDI-037 — Audit global et migration horloge/RNG

## Objectif

Auditer puis migrer les domaines et adaptateurs restants vers les dépendances
`Clock` et `Rng` injectées, afin de supprimer les accès directs non autoritaires
à `Date.now` et `Math.random`.

## Résultat utilisateur

Le domaine de jeu est reproductible en test et aucune mutation métier ne
dépend implicitement de l’horloge ou de l’aléatoire global.

## Périmètre autorisé

- Inventorier les accès directs dans `src/domain`, les hooks et les helpers.
- Migrer les appels métier vers les contrats CDI-009.
- Conserver les implémentations système uniquement aux frontières UI/bootstrap.
- Ajouter un contrôle CI empêchant la réintroduction d’accès directs dans le domaine.

## Hors périmètre

- Ne pas réécrire le gameplay ni changer les probabilités.
- Ne pas implémenter la persistance serveur de la graine (CDI-017/021).

## Critères d’acceptation

- [ ] L’inventaire des usages est documenté et chaque usage est classé.
- [ ] Les domaines concernés reçoivent `Clock`/`Rng` explicitement.
- [ ] Les tests métier sont reproductibles avec une horloge et une graine contrôlées.
- [ ] La CI détecte les nouveaux accès interdits dans le domaine.

## Tests

- npm test -- --run
- npm run lint
- npm run build
- npm run board:validate

## Dépendances

Les contrats CDI-009 et les domaines CDI-010 à CDI-016 doivent être disponibles
avant l’audit final.
