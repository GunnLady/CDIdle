---
id: CDI-098
title: Capturer les acteurs initiaux dans un contrat de rencontre compatible
status: Done
area: architecture
priority: P1
size: L
risk: high
source: Demande utilisateur du 10 septembre 2026 - scènes Donjon 2D inspirées de SLT
depends_on: ["CDI-097"]
blocks: ["CDI-100","CDI-106"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","shared/contracts/authoritative.ts","shared/domain/authoritative-dungeon.ts","shared/domain/undercity.ts","shared/domain/undercity-combat.ts","docs/development/canonical-state-migrations.md","docs/development/supabase-egress-budget.md"]
---

# CDI-098 — Capturer les acteurs initiaux dans un contrat de rencontre compatible

## Objectif

Capturer un état initial compact et fiable des acteurs, compatible avec toute la chaîne de stockage et de lecture.

## Resultat utilisateur

Une rencontre conserve les bonnes identités et valeurs de départ, même après une vocation, un KO ou un changement de roster.

## Contexte

Le snapshot vivant contient déjà l'état final au début du playback. L reste justifié par une même extension persistée à valider à toutes ses frontières, pas par l'ajout de toutes les actions.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Livrer l'extension additive, versionnée et facultative du record : acteurs
capturés avant résolution/XP, identités héros et clés blueprint/membre ennemi,
places, PV/PM et état KO nécessaires aux neuf types. Documenter une matrice
des champs existants/manquants et leur propriétaire 105/106/114.

Prouver compatibilité ancien/nouveau, validation API, persistance, cache,
bootstrap, cross-tab, replay, historique de quinze entrées, parité métier/RNG
et coût en octets sur traces longues. Une preuve Supabase locale est requise
pour ce contrat persisté. Ne pas inclure les corrections de cible (105) ni
l'enrichissement de toutes les actions (106/114). **L reste justifié par le
contrat traversant ces frontières : une moitié compatible n'est pas livrable.**

## Hors perimetre

- Correction du ciblage létal : CDI-105.
- Enrichissement ressources/cibles : CDI-106 ; statuts/intentions : CDI-114.
- Copie intégrale des héros à chaque événement, URL d'asset dans le domaine ou reconstruction fictive des anciennes traces.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Extension versionnée, facultative et additive, capturée avant résolution et XP pour les neuf types de rencontre.
- Clés ennemies blueprint/membre stables, distinctes du nom traduit et de l'identifiant d'instance ; identité héros et places de segment stables.
- Conserver un transcript unique, quinze rencontres historiques et le calendrier de référence ; migration seulement si une preuve l'exige.
- La matrice des champs nomme explicitement CDI-105, CDI-106 ou CDI-114 pour chaque complément restant ; aucun de ces écarts n'est déclaré corrigé ici.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-097 : Valider la composition PC de la scène Donjon 2D.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [x] Quatre membres au maximum, participants réels et KO de segment pertinents sont capturés avec identités, places, PV/PM initiaux, sans utiliser le snapshot final.
- [x] Les neuf types de rencontre ont une matrice des données disponibles/manquantes et un propriétaire pour chaque complément.
- [x] API, cache, bootstrap et cross-tab acceptent les records anciens/nouveaux et préservent l'extension.
- [x] État métier, RNG, XP et récompenses restent identiques à état/graine identiques hors extension de trace.
- [x] Les octets ajoutés sur profils petits/moyens/grands et quinze traces réelles longues respectent le budget egress documenté.
- [x] Le runtime Supabase local prouve persistance, lecture et replay de l'extension ; les anciens records restent consultables.

## Tests

- Étendre authoritativeContracts, authoritativeDungeonGolden, les tests de migrations/cache et dungeonSegmentHarness sur les neuf types et acteurs initiaux.
- npm.cmd run test:egress-budget
- npm.cmd run check:determinism
- npm.cmd run test:integration (Supabase local requis pour le contrat persisté).
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Vérifier les réponses locales nouvelle/ancienne sans copier de bearer ni de snapshot joueur dans la documentation. Pas de preuve visuelle à inventer pour ce contrat.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Capture trop tardive : disparition anticipée d'un KO ou apparence historique modifiée.
- Extension répétée par événement : gonflement des snapshots.

## Handoff

Fournir contrat, matrice avec propriétaires, fixtures, preuves de parité/compatibilité locale et métriques d'octets. V01/V06/V11/V13/V17. Les compléments CDI-106/CDI-114 restent explicitement ouverts.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.

## Preuves d'implementation

- `initialActors` v1 est produit avant toute mutation pour les neuf types. Les
  héros suivent l'ordre du segment, jusqu'à quatre, y compris les KO ; la clé
  `visual` du tuple fige classe, genre et variante de portrait. En combat,
  `b` et la clé de membre immuable du tuple `e` identifient jusqu'à trois ennemis ;
  l'ordre des tableaux porte la place d'équipe.
- L'audit pré-push a remplacé les clés membres positionnelles par des clés
  explicites dans chaque blueprint, imposé l'alignement des ennemis initiaux et
  finaux, et rendu `initialActors` obligatoire dans le type du producteur.
- L'événement de résolution ne duplique plus le record complet : il référence
  `state.encounterHistory` par `encounterId`, avec lecture des anciens événements
  enrichis encore supportée côté client.
- Les records historiques sans extension restent valides. Aucune migration de
  `stateVersion` ni backfill n'est requis ; la migration courante conserve
  l'extension lorsqu'elle existe.
- La matrice des neuf types et des compléments CDI-105/CDI-106/CDI-114 est dans
  `docs/development/dungeon-2d-encounter-plan.md`. CDI-106 et CDI-114 restent
  explicitement ouverts.
- `npm.cmd test -- --run` : 124 fichiers, 1 013 tests passés.
- Paquet ciblé contrats/domaine/API/segment/migrations/cache/bootstrap/
  cross-tab/adaptateur/egress/catalogue/hook : 12 fichiers, 211 tests passés.
- `npm.cmd run test:egress-budget` : 7 tests passés ; profils JSON 2 991,
  46 647 et 85 094 octets ; 7 320 octets ajoutés sur quinze traces maximales
  avec IDs de production, soit 488 par rencontre ; projection médiane 4,385 Go
  sur 31 jours et 1 385 commandes quotidiennes dans la cible.
- `npm.cmd run test:integration` : Supabase local passé ; ancien record sans
  extension relu, nouveau record persisté puis relu au bootstrap, replay
  identique et une seule ligne de commande.
- L'audit final a corrigé le worker produit qui lisait encore l'ancien payload
  `event.encounter` : il résout désormais `event.encounterId` dans
  `state.encounterHistory`. `npm.cmd run test:undercity-product` passe sur 10
  processus, 10 runs et 2 920 rencontres.
- `npm.cmd run check:determinism`, `npm.cmd run lint -- --quiet`,
  `npm.cmd run build` et `npm.cmd run board:validate` : passés.
- `npm.cmd run typecheck` reste pollué uniquement par les imports absents du
  dossier utilisateur ignoré `tmp/deployment-2026-09-10/backend-v27`.
  `npm.cmd exec -- tsc --noEmit -p tsconfig.cdi098.json`, configuration
  temporaire excluant seulement `tmp`, est passé ; le fichier temporaire a été
  supprimé.
- Aucun contrôle visuel n'est requis pour ce contrat sans modification de
  rendu. Aucun navigateur, déploiement, commit ou push n'a été lancé.
