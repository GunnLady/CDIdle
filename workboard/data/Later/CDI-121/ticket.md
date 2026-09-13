---
id: CDI-121
title: Animer les tirs à l’arc et à l’arbalète
status: Later
area: ui
priority: P1
size: M
risk: medium
source: Demande utilisateur du 13 septembre 2026 - appliquer le plan amélioré, sobre et lisible
depends_on: ["CDI-113","CDI-114","CDI-139","CDI-146","CDI-147"]
blocks: ["CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-encounter-plan.md","AGENTS.md","shared/data/skills.ts","src/domain/dungeonCombatScene.ts","docs/development/dungeon-2d-combat-effects.md"]
---

# CDI-121 — Animer les tirs à l’arc et à l’arbalète

## Objectif

Montrer une émission depuis l’arme et une réception exacte, avec une pose ciblée si elle apporte la décoche.

## Resultat utilisateur

Montrer une émission depuis l’arme et une réception exacte, avec une pose ciblée si elle apporte la décoche.

## Contexte

Lot D1 du plan amélioré. Le socle et les images déjà livrés sont réutilisés. Taille M relative, incluant intégration, contrôles et revue, hors attente visuelle ; pas un engagement de durée ni de production en série. Aucun résultat visuel n’est encore validé pour ce lot.

## Perimetre autorise

Bases des sprites équipés visuellement d’arc/arbalète ; precise_shot, piercing_arrow, crippling_shot. Armes mécaniques différentes uniquement si présentes dans le tri 117 ; exception à isoler si une nouvelle technique est requise.

## Hors perimetre

- Pas de changement de sprite selon l’arme équipée ni de fabrication d’armes absentes du catalogue.
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

- [ ] Visée/décoche ou départ mécanique se lisent ; projectile part de l’arme, suit la direction et atteint la vraie cible.
- [ ] Perforante reste monocible ; handicapant applique son debuff sans inventer de dégâts.
- [ ] Esquive manque réellement la cible ; PV/impact/nombre suivent le même contact et le tireur reprend son attente.
- [ ] Le scénario intégré est validé visuellement par l’utilisateur ; contrôles techniques ciblés, limites et éventuels tickets artistiques sont tracés.

## Tests

Trois skillId, tir ennemi par clé de contenu plutôt que rôle ranged, positions éloignées, critique/esquive/létal et flux continu.

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
