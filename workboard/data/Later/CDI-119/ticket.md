---
id: CDI-119
title: Animer le balayage et les combos de pugilat
status: Later
area: ui
priority: P1
size: M
risk: high
source: Demande utilisateur du 13 septembre 2026 - appliquer le plan amélioré, sobre et lisible
depends_on: ["CDI-118","CDI-137","CDI-145"]
blocks: ["CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-encounter-plan.md","AGENTS.md","shared/data/skills.ts","src/domain/dungeonCombatScene.ts","docs/development/dungeon-2d-combat-effects.md"]
---

# CDI-119 — Animer le balayage et les combos de pugilat

## Objectif

Faire comprendre une frappe collective et un enchaînement réel sans multiplier les animations dessinées.

## Resultat utilisateur

Faire comprendre une frappe collective et un enchaînement réel sans multiplier les animations dessinées.

## Contexte

Lot C2 du plan amélioré. Le socle et les images déjà livrés sont réutilisés. Taille M relative, incluant intégration, contrôles et revue, hors attente visuelle ; pas un engagement de durée ni de production en série. Aucun résultat visuel n’est encore validé pour ce lot.

## Perimetre autorise

cleaving_strike, earthen_fist, zephyr_strike et rapid_combo ; réutiliser les recettes contact, ajouter seulement les gestes poing/pied impossibles à lire autrement. battle_focus est livré dans CDI-125.

## Hors perimetre

- Concentration martiale persistante : CDI-125/114 ; aucune mécanique de combo nouvelle.
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

- CDI-118.

## Criteres d'acceptation

- [ ] Le balayage montre une cause et seulement les réceptions des cibles reçues.
- [ ] Pierre et vent restent des coups de poing/pied au contact, pas des projectiles par déduction du damageType.
- [ ] Jusqu’à cinq impacts ont geste/réaction, ordre, PV et valeurs cohérents ; un coup létal n’invente pas les coups suivants.
- [ ] Le combo se lit en continu avec le pas logique de 400 ms et les bulles validées, sans accumulation ni changement silencieux de cadence.
- [ ] Le scénario intégré est validé visuellement par l’utilisateur ; contrôles techniques ciblés, limites et éventuels tickets artistiques sont tracés.

## Tests

Multicible avec morts partielles, 1/2/5 impacts, critiques mixtes, cible létale et action suivante à 400 ms.

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
