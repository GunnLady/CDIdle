---
id: CDI-124
title: Mettre en scène les soins et les effets sacrés ou naturels
status: Later
area: ui
priority: P1
size: L
risk: medium
source: Demande utilisateur du 13 septembre 2026 - appliquer le plan amélioré, sobre et lisible
depends_on: ["CDI-113","CDI-114","CDI-141","CDI-143","CDI-146"]
blocks: ["CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-encounter-plan.md","AGENTS.md","shared/data/skills.ts","src/domain/dungeonCombatScene.ts","docs/development/dungeon-2d-combat-effects.md"]
---

# CDI-124 — Mettre en scène les soins et les effets sacrés ou naturels

## Objectif

Distinguer recevoir un soin, subir un châtiment et recevoir un effet de protection ou de nature.

## Resultat utilisateur

Distinguer recevoir un soin, subir un châtiment et recevoir un effet de protection ou de nature.

## Contexte

Lot S1 du plan amélioré. Le socle et les images déjà livrés sont réutilisés. Taille L relative, incluant intégration, contrôles et revue, hors attente visuelle ; pas un engagement de durée ni de production en série. Aucun résultat visuel n’est encore validé pour ce lot.

## Perimetre autorise

minor_heal, holy_smite, sacred_barrier, holy_mark, benediction ; thorn_grasp, wild_regrowth, barkskin ; enemy.support médical. L couvre trois recettes partagées (émission ciblée, réception, pose d’état), pas neuf nouveaux gestes. Les soigneurs ennemis utilisent le matériel de leur sprite ; exceptions artistiques par écran.

## Hors perimetre

- Pas de réanimation en combat ; celle du repos appartient à CDI-128/134.
- Nouveau gameplay, refactor collatéral, déploiement ou modification de l’équipement affiché en fonction de l’inventaire.

## Contrat d'implementation

- Domaine partagé pour les règles ; projection/chronologie et modèles hors React ; rendu limité à la présentation.
- Utiliser identifiants structurés et clés visuelles historiques, pas les messages traduits, l’arme actuellement équipée ou le seul damageType/rôle ennemi.
- Réutiliser lecteur, composants et effets existants ; aucune abstraction ou dépendance nouvelle sans bénéfice direct.
- Une information par bulle, une ligne hors visage ; PV rouges, PM bleus, départs 600 ms et vie 1 000 ms comme référence validée ; chevauchement lisible et borné.
- Garder le pas logique de 400 ms, 16 effets temporaires, nettoyage hors vue, ancienne trace honnête et mode sans animation complet.
- Si une retouche/pose est indispensable, créer son ticket A1/A2 sur des clés nommées et le relier comme prérequis du consommateur, de CDI-135 et de CDI-134 si héros. Aucun ticket artistique ne dépend du consommateur qu’il bloque.
- Alpha réel, boîte visible/pivot, arme entière, éclairage et cohérence de visage contrôlés sur les seules images modifiées ; pas de détourage runtime.

## Dependances

- CDI-113.
- CDI-114.

## Criteres d'acceptation

- [ ] Les huit compétences héros et le soin ennemi ont auteurs/bénéficiaires corrects, y compris soin sur soi.
- [ ] Un soigneur médical n’attaque pas et ne devient pas magicien par défaut ; geste discret adapté au matériel.
- [ ] Soin, châtiment, marque, ronces et protection ne se confondent pas ; pas d’immobilisation ou de dommages périodiques ajoutés.
- [ ] PV positifs rouges et PM bleus, valeurs appliquées exactes, une information par bulle hors visage, expiration des seuls états reçus.
- [ ] Le scénario intégré est validé visuellement par l’utilisateur ; contrôles techniques ciblés, limites et éventuels tickets artistiques sont tracés.

## Tests

Huit skillId + enemy.support, soin nul/partiel/plafonné, cible auteur distincte, buffs/debuffs et restauration en groupe.

- Contrôles structurels ciblés et fixtures déterministes du périmètre.
- Après validation visuelle de l’écran : `npm.cmd test -- --run <fichiers ciblés>`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet` ; tests navigateur ciblés via `npm.cmd run test:layout-browser -- <spec>` si scène concernée.
- `npm.cmd run build`, `npm.cmd run check:bundle` ; `npm.cmd run check:dungeon-visuals` si assets/catalogue modifiés ; `npm.cmd run board:validate`.
- Les commandes avec paramètres entre chevrons sont à préciser dans le handoff d’implémentation, pas à exécuter telles quelles. Aucune réussite de test applicatif n’est déclarée par la création de ce ticket.

## Validation manuelle

Présenter le scénario intégré et rejouable à l’utilisateur, au rythme réel, avec les variantes propres au lot. Il valide le visuel ; Codex assure les contrôles techniques. PC 1024/1280/1440 et zoom 200 % selon le risque. Ne pas attribuer à tout le catalogue la validation d’un seul écran.

## Preservation

- PC uniquement ; compositions, identités, diversité et DA CDIdle conservées.
- Arme propre au sprite, variable dans une classe mais indépendante de l’équipement réel.
- Réutilisation d’abord ; une ou deux poses seulement si nécessaires. Pas de cycles complets ni de série automatique pour 400 identités.
- Autorité serveur, RNG, résultats, XP/loot, révisions, idempotence et cadence conservés ; aucune commande depuis une animation.
- Autonomie technique/Git du chantier selon AGENTS.md ; validation visuelle par l’utilisateur écran par écran. Zéro déploiement sans contre-ordre explicite.

## Risques

- Ajouter des effets ou poses coûteux sans améliorer la lecture ; masquer une action absente par un fallback.
- Un changement de taille/pivot ou de durée désynchronise l’action et son résultat.

## Handoff

Fournir clés/actions couvertes, ressources conservées ou modifiées, références, scénario exact, preuves datées et verdict utilisateur. Mettre à jour le plan et les dépendances avant clôture ; toute lacune réelle bloque le ticket ou son propriétaire explicite, jamais une déclaration de couverture complète.
