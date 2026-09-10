---
id: CDI-105
title: Corriger la cible journalisée par une compétence létale
status: ToDo
area: architecture
priority: P1
size: S
risk: high
source: Demande utilisateur du 10 septembre 2026 - redécoupage approuvé des scènes Donjon 2D
depends_on: []
blocks: ["CDI-100"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","shared/contracts/authoritative.ts","shared/domain/authoritative-dungeon.ts","shared/domain/undercity.ts","shared/domain/undercity-combat.ts","docs/development/canonical-state-migrations.md","docs/development/supabase-egress-budget.md"]
---

# CDI-105 — Corriger la cible journalisée par une compétence létale

## Objectif

Reproduire puis corriger uniquement l'identité et les PV de la cible journalisée après une compétence monocible létale.

## Resultat utilisateur

Le coup fatal sera représenté sur l'ennemi réellement touché, pas sur le survivant suivant.

## Contexte

Constat statique dans authoritative-dungeon.ts : la cible principale peut être réaffectée après damageUndercityEnemy et avant le log. S est une correction localisée, mais le risque reste high à proximité de la résolution autoritaire. Aucun test de reproduction n'a encore été exécuté pour ce constat.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Reproduire la branche de compétence monocible avec cible tuée et survivant
suivant, puis corriger uniquement l'identité/PV journalisés au point d'impact.
Ajouter le cas sans survivant et prouver état métier, RNG et récompenses
inchangés. Ne pas enrichir le schéma ni modifier le choix de cible du combat.
Le constat est statique à ce jour : aucun test de reproduction n'est encore
déclaré passé.

## Hors perimetre

- Extension de schéma et acteurs initiaux : CDI-098.
- Enrichissement global de la trace, ressources/statuts et mise en scène.
- Modification du choix de cible, des dégâts, des règles de combat ou des récompenses.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Capturer l'identité et les valeurs de l'impact au point où la cible est connue, avant de passer au survivant.
- Distinguer id de la cible touchée, PV après impact et prochaine cible ; préserver RNG et sorties métier.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

Aucune dépendance bloquante. Cette correction de trace peut commencer indépendamment du prototype CDI-097.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Un test échoue avant correction sur une compétence tuant la cible avec un survivant suivant, puis réussit sur le bon id/PV.
- [ ] Le cas sans survivant et une attaque non létale restent corrects.
- [ ] État final, RNG, XP, loot et résultat sont identiques hors correction du log.
- [ ] Le changement reste local, sans extension du schéma ni refactor du moteur.

## Tests

- Test de régression ciblé dans authoritativeDungeonGolden/les suites du producteur de rencontres.
- Comparer avant/après à état et graine identiques pour cible létale avec/sans survivant et cible non létale.
- npm.cmd run check:determinism
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Aucune validation artistique requise. Présenter la trace minimale avant/après, sans secret ni donnée joueur ; la représentation visuelle sera validée dans CDI-101/CDI-113.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Corriger la trace en modifiant accidentellement la cible utilisée par la résolution suivante.

## Handoff

Fournir reproduction rouge/verte, emplacement de la correction et preuve de parité métier/RNG. V02/V03. CDI-100 utilise la fixture corrigée ; ne pas prétendre à une correction avant reproduction.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
