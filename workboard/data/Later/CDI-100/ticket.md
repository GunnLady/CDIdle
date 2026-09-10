---
id: CDI-100
title: Projeter les rencontres en états de scène déterministes
status: Later
area: frontend
priority: P1
size: M
risk: high
source: Demande utilisateur du 10 septembre 2026 - scènes Donjon 2D inspirées de SLT
depends_on: ["CDI-098","CDI-105"]
blocks: ["CDI-106","CDI-107"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/domain/encounterPlayback.ts","src/hooks/useEncounterPlayback.ts","src/domain/dungeonPresentation.ts","src/hooks/useAuthoritativeCommandDispatch.ts","tests/encounterPlayback.test.ts"]
---

# CDI-100 — Projeter les rencontres en états de scène déterministes

## Objectif

Transformer la rencontre reçue en états et points d'impact déterministes, sans minuterie ni simulation métier.

## Resultat utilisateur

Les valeurs intermédiaires concernent les bons acteurs et restent exactes même lors d'un accès direct au milieu de la lecture.

## Contexte

Le contrat initial CDI-098 et la correction CDI-105 fournissent la base fiable. M couvre l'adaptateur pur, distinct du lecteur temporel CDI-107.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Adapter les records nouveaux/anciens vers acteurs, actions, points d'impact,
PV/PM et résultat ; établir l'état à t sans minuterie ni rendu React. Couvrir
coup normal/létal, KO, conséquences déjà explicitement disponibles, ordre et
regroupement des événements. Prouver égalité projection directe/pas à pas et
identifiants stables. Records insuffisants, inconnus ou héros retirés du roster
actuel : résumé honnête, jamais reconstruction fictive. Les informations encore
absentes sont identifiées pour 106/114, pas déduites du français. Le lecteur
temporel et ses promesses appartiennent à 107.

## Hors perimetre

- Minuteries, promesses de lecture et raccordement applicatif : CDI-107/CDI-103.
- Compléments structurés de ressources/statuts : CDI-106/CDI-114.
- Relancer resolveFight, tirer du RNG, parser du français ou reconstruire les valeurs historiques depuis le roster actuel.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Acteurs, événements, résultat, ordre, regroupement et points d'impact sont calculés hors React.
- L'état à t doit égaler la projection pas à pas au même instant ; encounterId/sequence/indice d'impact donnent des identifiants stables.
- Les métadonnées visuelles n'ajoutent aucun pas au calendrier (N + 1) × 400 ms.
- L'absence de données pour une action est explicite, avec résumé neutre fidèle ; elle ne constitue pas une couverture finale de cette action.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-098 : Capturer les acteurs initiaux dans un contrat de rencontre compatible.
- CDI-105 : Corriger la cible journalisée par une compétence létale.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Les records anciens/nouveaux, vides et inconnus produisent un modèle utile sans plantage ni valeur inventée.
- [ ] Les fixtures de coup normal/létal, KO et conséquences explicitement disponibles donnent les bonnes identités et valeurs à chaque impact.
- [ ] Projection directe et parcours séquentiel donnent les mêmes acteurs, PV/PM et résultat, y compris en milieu d'action.
- [ ] Un héros absent du roster courant et un KO de segment ne disparaissent pas de leur rencontre historique.
- [ ] Aucune minuterie, règle de combat ou écriture de snapshot n'est introduite ; les extensions à venir sont attribuées à CDI-106/CDI-114.

## Tests

- Ajouter les tests purs de projection/chronologie sur les fixtures CDI-098/CDI-105.
- Étendre dungeonPresentation et encounterPlayback pour données insuffisantes, cible absente et événements inconnus.
- npm.cmd run check:determinism
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

La fidélité des valeurs est prouvée par les fixtures. La qualité du rendu sera validée dans CDI-101 ; aucune application n'a besoin d'être pilotée pour approuver ce modèle pur.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Confondre dégâts annoncés et PV retirés au coup létal.
- Utiliser la situation actuelle du héros à la place de son identité au début de la rencontre.

## Handoff

Fournir contrat du modèle pur, règles d'impact/identité, tests de projection et limites explicites. V01/V02/V03/V06/V13. CDI-107 consomme ce modèle ; CDI-106/CDI-114 l'enrichissent.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
