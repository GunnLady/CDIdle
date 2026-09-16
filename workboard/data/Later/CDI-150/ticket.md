---
id: CDI-150
title: Produire et intégrer les poses de combat Voleur
status: Later
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 15 septembre 2026 - séparer pose neutre, pose de combat et poses d’action
depends_on: ["CDI-138","CDI-148"]
blocks: ["CDI-118","CDI-125","CDI-128","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","src/assets/heroSpriteSheets.ts","src/domain/dungeonCombatScene.ts","src/components/dungeon/CurrentEncounterPanel.tsx","AGENTS.md"]
---

# CDI-150 — Produire et intégrer les poses de combat Voleur

## Objectif

Produire pour les dix hommes et dix femmes Voleur une pose de combat en garde, cohérente avec leur base neutre, puis l’utiliser comme attente pendant les affrontements du cinéma.

## Resultat utilisateur

Chaque Voleur conserve exactement son identité et son équipement visuel entre la pose neutre et la garde. Dans le cinéma, le héros passe de la pose neutre à la garde au début de l’affrontement, revient en garde après chaque action et quitte la garde à la fin du combat.

## Contexte

La base neutre reste destinée au recrutement, au catalogue, au stockage et aux scènes hors combat. La pose de combat est un second asset persistant pendant l’affrontement ; elle n’est ni la compétence guard_stance, ni une pose d’attaque. Ce lot réutilise le standard validé par CDI-148 sans modifier le contrat de scène.

## Perimetre autorise

- Produire vingt poses de combat : dix hommes et dix femmes, index 0–9.
- Conserver pour chaque index le visage, la carnation, la coiffure, les couleurs, la tenue, l’arme ou l’accessoire de la base neutre.
- Garder dimensions, boîte alpha, pieds, pivot, direction et échelle compatibles avec la base neutre.
- Intégrer la sélection neutre/combat dans le catalogue de présentation et dans le vrai lecteur du cinéma.
- Utiliser la garde comme attente pendant un affrontement et comme état de retour après une action.

## Hors perimetre

- Pose d’attaque, de tir, de sort, de soin, de chant, de réaction ou de KO.
- Cycle de marche ou animation complexe.
- Modification de gameplay, de compétence, d’équipement réel ou de résultat autoritaire.
- Remplacement de la pose neutre dans le recrutement, le catalogue, le stockage ou les scènes hors combat.
- Déploiement frontend ou backend.

## Contrat d'implementation

- Commencer par un petit pilote contrasté et obtenir le verdict utilisateur avant la série complète.
- Une clé de pose explicite distingue neutral et combat_idle ; aucun choix ne dépend du texte traduit ou de l’équipement réel.
- La même clé d’identité et le même index sélectionnent les deux poses ; aucun visage générique ne remplace une variante.
- Le lecteur suit neutre → garde → action → garde → neutre en fin d’affrontement. Une pose d’action manquante retombe sur la garde, jamais sur une autre identité.
- La compétence guard_stance ajoute son geste ou son effet propre sans redéfinir la garde persistante.
- Charger uniquement les assets utiles à la scène et mesurer poids froid, cache chaud et mémoire décodée.

## Dependances

- CDI-138 : vingt bases neutres Voleur validées.
- CDI-148 : standard de pose de combat et intégration cinéma validé sur les Novices.

## Criteres d'acceptation

- [ ] Un pilote contrasté est validé visuellement avant la production en série.
- [ ] Les vingt poses de combat correspondent une à une aux vingt bases neutres par genre et index 0–9.
- [ ] Identité, équipement visuel, proportions, direction, lumière, pieds et pivot restent cohérents entre les deux poses.
- [ ] Le cinéma affiche la garde pendant l’affrontement, revient en garde après chaque action et n’utilise la pose neutre qu’hors combat.
- [ ] Recrutement, catalogue, stockage et autres scènes hors combat conservent la pose neutre.
- [ ] La pose de combat ne remplace aucune pose d’action et ne modifie aucun résultat métier.
- [ ] Alpha, chargement, cache, mémoire et budget de scène sont vérifiés ; le rendu est validé dans les écrans cinéma représentatifs.

## Tests

- Contrôler dimensions, alpha, boîte visible, pieds, pivots et correspondance stricte neutral/combat par clé.
- Tester la sélection de pose à l’entrée du combat, pendant l’attente, après une action et à la sortie de l’affrontement.
- Vérifier le repli sur la garde si une pose d’action manque et sur la pose neutre seulement hors combat.
- Exécuter les tests ciblés, npm.cmd run check:dungeon-visuals, npm.cmd run typecheck, npm.cmd run lint -- --quiet, npm.cmd run build, npm.cmd run check:bundle et npm.cmd run board:validate.

## Validation manuelle

L’utilisateur valide d’abord le pilote, puis les vingt correspondances neutral/combat et enfin le rendu dans les écrans du cinéma. Les tests complets et la documentation de livraison viennent après le verdict visuel.

## Preservation

- Conserver les vingt identités validées et leur équipement dessiné.
- Conserver compositions, placements, échelle et lisibilité des écrans cinéma.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Aucun déploiement n’est autorisé par ce ticket.

## Risques

- Dérive de visage, tenue, arme ou proportions entre la base et la garde.
- Saut visible de pivot ou d’échelle lors du changement de pose.
- Chargement des quarante images neutral/combat d’une classe alors que seules les identités présentes sont nécessaires.
- Confusion entre garde persistante, compétence guard_stance et vraie pose d’action.

## Handoff

Fournir références et prompts versionnés, table neutral/combat par genre et index, sources/exports, mesures, tests et verdicts utilisateur. Aucune pose d’action, réaction ou KO n’est déclarée livrée par ce lot.
