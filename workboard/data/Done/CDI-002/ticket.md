---
id: CDI-002
title: Harnais de caracterisation
status: Done
area: testing
priority: P0
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-001"]
blocks: ["CDI-003", "CDI-005", "CDI-006", "CDI-009"]
github_issue: "https://github.com/mathrondot-collab/CDIdle/issues/2"
related_docs: ["docs/architecture/README.md", "README.md"]
---

# CDI-002 — Harnais de caracterisation

## Objectif

Installer un socle de tests reproductible et capturer les comportements critiques du prototype avant l'extraction de la logique ou la correction de bugs.

## Resultat utilisateur

Les transformations fullstack pourront prouver qu'elles conservent les regles actuelles au lieu de reimplementer le jeu de memoire.

## Contexte

Le depot ne contient actuellement aucun framework de test. Les regles sont reparties entre `src/utils`, les hooks React et plusieurs composants, avec des usages directs de `Math.random`, des timers et Firebase.

## Perimetre autorise

- Ajouter Vitest, jsdom, React Testing Library et `@testing-library/user-event` en dependances de developpement.
- Ajouter une configuration de test distincte de la configuration Vite de production.
- Ajouter `test`, `test:watch` et `test:coverage` aux scripts npm.
- Creer des fixtures lisibles pour ressources, citoyens, batiments, heros, inventaire et encounters.
- Caracteriser en priorite les fonctions pures existantes de `gameCalculations.ts` et `dungeonHelpers.ts`.
- Ajouter un smoke test React limite, avec Firebase entierement mocke et sans acces reseau.

## Hors perimetre

- Ne pas corriger CDI-005 ou CDI-006 dans ce ticket.
- Ne pas extraire encore le domaine vers `shared/`.
- Ne pas modifier les regles, probabilites, couts, textes utilisateur ou structure de sauvegarde.
- Ne pas appeler Firebase, GitHub ou un navigateur reel pendant les tests.

## Contrat d'implementation

- Les tests doivent etre deterministes : utiliser des mocks explicites pour le temps, les timers et l'aleatoire lorsqu'ils sont traverses.
- Les fixtures doivent etre construites par des factories et non par des snapshots JSON opaques.
- Capturer au minimum calcul des statistiques derivees, equipement/desequipement, stockage, selection du meilleur heros d'encounter, couts de batiments et progression de recrutement.
- Ajouter des tests qui exposent les anomalies CDI-005 et CDI-006 sans les corriger ; ces tests peuvent etre `it.todo` uniquement si l'echec ne peut pas etre isole sans changer le code de production.
- La couverture est informative dans cette tranche et ne doit pas imposer un seuil global artificiel.

## Dependances

CDI-001 doit etre `Done` afin que les tests distinguent clairement comportement a preserver et comportement cible.

## Criteres d'acceptation

- [x] `npm test -- --run` reussit sans reseau et sans ordre de test implicite.
- [x] Les principales fonctions pures disposent de cas nominaux et de bords.
- [x] Un smoke test React charge avec des doubles Firebase controles.
- [x] Les fixtures sont reutilisables par les futurs tickets de domaine.
- [x] Aucun comportement joueur n'est modifie.

## Tests

- `npm test -- --run`
- `npm run test:coverage`
- `npm run lint`
- `npm run build`
- `npm run board:validate`

## Validation manuelle

- Verifier que les tests restent verts apres deux executions consecutives.
- Couper le reseau ou inspecter les mocks pour confirmer qu'aucun appel Firebase ne sort du processus.

## Preservation

- Conserver exactement les valeurs et anomalies actuelles ; les deux corrections connues restent reservees a CDI-005 et CDI-006.

## Risques

- Un montage React trop large rendrait les tests fragiles. Tester les coutures utiles et garder un seul smoke de l'application complete.

## Handoff

Fournir la liste des comportements caracterises, les fixtures ajoutees, les commandes avec resultats, la couverture obtenue a titre informatif et les coutures encore difficiles a tester. Resultat : 9 tests passent, 2 todo intentionnels pour CDI-005 et CDI-006 ; lint, coverage et validation Workboard passent.
