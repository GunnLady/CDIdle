---
id: CDI-097
title: Valider la composition PC de la scène Donjon 2D
status: Done
area: ui
priority: P1
size: M
risk: medium
source: Demande utilisateur du 10 septembre 2026 - scènes Donjon 2D inspirées de SLT
depends_on: []
blocks: ["CDI-098","CDI-099"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","src/components/dungeon/CurrentEncounterPanel.tsx","src/components/dungeon/DungeonPage.tsx","src/ui/catalog","tests/browser/fixtures/dungeonHarness.tsx","docs/development/design-system.md","docs/development/dungeon-2d-resizing-proposal.md"]
---

# CDI-097 — Valider la composition PC de la scène Donjon 2D

## Objectif

Valider structure, actions, lisibilité et vocabulaire de mouvement de la future scène avant sa généralisation artistique.

## Resultat utilisateur

Le joueur reconnaît son équipe CDIdle et comprend une rencontre animée dans l'espace actuellement occupé par le transcript.

## Contexte

La direction CDIdle est confirmée. La référence SLT est analysée dans le plan ; son rendu DOM n'exige pas de nouveau moteur. La scène actuelle mesure 675 px et les tests figent cette hauteur.

## Perimetre autorise

- Préparer un prototype isolé réutilisant le harness ou le catalogue privé existant.
- Montrer attente, combat à quatre héros et trois ennemis, boss avec gardes, repos/KO et une épreuve.
- Établir emplacements, échelle, couches, PV/PM, noms, résumé et accès au journal.
- Prototyper anticipation, déplacement, impact et retour sur quelques silhouettes CDIdle.
- Fixer la composition PC à 1024, 1280 et 1440 px, ainsi que la distinction entre commandes d'exploration et simple présentation.

## Hors perimetre

- Brancher le prototype sur la partie persistée.
- Produire toute la bibliothèque artistique.
- Introduire placement tactique, son, vitesse de progression ou nouveau moteur.
- Traiter les viewports inférieurs à 1024 px ou concevoir une adaptation mobile/tablette dans ce lot.

## Contrat d'implementation

- Plans et positions calculés hors des composants React.
- Utiliser Panel, commandes et tokens existants ; éviter un nouvel habillage global.
- Le prototype ne rend pas le catalogue privé accessible dans le bundle public.
- Silhouettes actuelles, sans utiliser les vingt variantes comme frames.
- Démontrer le mouvement avec une horloge de présentation déterministe et des données de fixture.

## Dependances

Aucune dépendance bloquante. S'appuyer sur CDI-076/CDI-077 livrés et les sources actuelles.

## Criteres d'acceptation

- [x] Une composition PC est validée à 1024/1280/1440 px et au zoom 200 %.
- [x] Quatre héros et trois ennemis, dont deux gardes et le Roi, restent identifiables sans débordement horizontal.
- [x] Attente, KO, repos et épreuve ont des états explicites ; actions et journal restent accessibles.
- [x] L'utilisateur valide les silhouettes transformées, l'anticipation et les impacts ; sinon le besoin de poses dédiées est décidé avant CDI-099.
- [x] Le contrat de composition, les dimensions et les profils d'animation retenus sont ajoutés au plan sans imposer de nouvelle règle de combat.

## Tests

- Contrôles structurels du harness et du modèle de placement.
- Couverture structurelle du prototype aux trois largeurs PC et au zoom 200 % selon le dispositif navigateur autorisé.
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run board:validate

## Validation manuelle

L'utilisateur compare le prototype à la direction SLT décrite dans le plan et valide structure, actions et composition PC avant l'habillage final. Si les outils navigateur ne sont pas autorisés, fournir le terminal, la commande et l'URL exacts.

Verdict du 10 septembre 2026 : l'utilisateur juge le prototype « pas mal », demande une animation un peu plus rapide, puis valide la cadence ajustée par « top ». Le cycle de présentation retenu dure 2 300 ms. Les silhouettes transformées sont acceptées pour poursuivre CDI-099 sans imposer de poses dédiées.

Preuves :

- utilisateur : `npm.cmd run test:layout-browser -- tests/browser/dungeonScenePrototype.responsive.browser.spec.ts`, 4 tests réussis en 5,8 s ;
- Codex : 6 tests Vitest ciblés réussis après l'ajustement de cadence ;
- Codex : lint, build, budget de bundle, typecheck ciblé et validation Workboard réussis ;
- limite connue : le typecheck global est bloqué uniquement par les sources temporaires concurrentes sous `tmp/deployment-2026-09-10/backend-v27`, hors périmètre CDI-097.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Une scène trop dense à 1024 px ou au zoom 200 % rendrait les noms et commandes illisibles.
- Une silhouette qui glisse sans impact ne répond pas au rendu attendu.

## Handoff

Fournir composition PC retenue, captures utilisateur ou verdict daté, mesures à 1024/1280/1440 px et zoom 200 %, profils de mouvement, limites et décision sur les poses dédiées ; référencer V01/V14/V15/V18.

Le redécoupage approuvé conserve ce périmètre M. CDI-098 prépare le contrat et CDI-099 le kit pilote après ce verdict ; CDI-105 est une correction de trace indépendante.
