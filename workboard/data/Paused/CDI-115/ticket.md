---
id: CDI-115
title: Mettre en scène le piège et le socle des épreuves
status: Paused
area: ui
priority: P1
size: M
risk: medium
source: Demande utilisateur du 13 septembre 2026 - recadrage selon le plan amélioré
depends_on: ["CDI-102"]
blocks: ["CDI-116","CDI-129","CDI-130","CDI-131","CDI-132","CDI-133"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","docs/development/dungeon-2d-challenges.md","assets/design/dungeon-2d/dungeon-challenges-kit-v1.prompt.md","shared/domain/authoritative-dungeon.ts","shared/contracts/authoritative.ts","src/domain/dungeonPresentation.ts","src/assets/heroSpriteSheets.ts","src/domain/heroPortrait.ts","src/components/HeroPortrait.tsx","shared/domain/undercity.ts","assets/design/hero-sprites/human-tier1-class-spritesheets-v1.prompt.md","docs/development/dungeon-2d-action-production-plan.md"]
---

# CDI-115 — Mettre en scène le piège et le socle des épreuves

## Objectif

Livrer une interaction de piège complète, succès et échec, servant de socle partagé aux autres épreuves.

## Resultat utilisateur

Le héros choisi repère/intervient ou déclenche le piège ; le joueur comprend le résultat sans confondre échec et wipe.

## Contexte

Recadrage du 13 septembre. Les six accessoires et l’intégration initiale restent conservés. Énigme, embuscade, rituel, obstacle et négociation sont transférés respectivement à CDI-129–133 ; l’ancienne animation d’apparition ne vaut pas validation de leurs gestes.

## Perimetre autorise

trap : sélection réelle du héros, mouvement simple d’intervention, réaction du dispositif et conséquences reçues. Réutiliser le socle non-combat de 102, sans moteur par épreuve. Ajouter une pose uniquement si elle rend un geste autrement incompréhensible. Conserver les données et accessoires des cinq autres familles pour leurs tickets.

## Hors perimetre

- Livrer les cinq autres épreuves dans ce ticket ou déclarer leurs visuels validés.
- Mini-jeu, jet local, combat d’embuscade ajouté, wipe fictif, nouveau décor sans besoin identifié.

## Contrat d'implementation

- Domaine partagé pour les règles ; projection/chronologie et modèles hors React ; rendu limité à la présentation.
- Utiliser identifiants structurés et clés visuelles historiques, pas les messages traduits, l’arme actuellement équipée ou le seul damageType/rôle ennemi.
- Réutiliser lecteur, composants et effets existants ; aucune abstraction ou dépendance nouvelle sans bénéfice direct.
- Une information par bulle, une ligne hors visage ; PV rouges, PM bleus, départs 600 ms et vie 1 000 ms comme référence validée ; chevauchement lisible et borné.
- Garder le pas logique de 400 ms, 16 effets temporaires, nettoyage hors vue, ancienne trace honnête et mode sans animation complet.
- Si une retouche/pose est indispensable, créer son ticket A1/A2 sur des clés nommées et le relier comme prérequis du consommateur, de CDI-135 et de CDI-134 si héros. Aucun ticket artistique ne dépend du consommateur qu’il bloque.
- Alpha réel, boîte visible/pivot, arme entière, éclairage et cohérence de visage contrôlés sur les seules images modifiées ; pas de détourage runtime.
- L’accessoire réagit à l’intervention du héros, pas seulement à son montage DOM. Succès et déclenchement raté sont des branches explicites.
- Les retouches éventuelles utilisent l’étalon de 117 ; si elles sont indispensables, créer un prérequis artistique explicite avant de clore.

## Dependances

- CDI-102 : socle non-combat livré ; données de ressources 106 déjà disponibles.
- Une correction artistique nécessaire doit être ajoutée en prérequis ; les gestes génériques peuvent avancer sans refaire un sprite.

## Criteres d'acceptation

- [ ] trap est intégré avec intervention lisible, réussite et échec, dispositif et conséquences synchronisés.
- [x] Acquis conservé : héros sélectionné, mana, or, pertes et récompenses proviennent des données structurées exactes.
- [x] Acquis conservé : les six accessoires ont manifeste, provenance/poids, fallback et chargement utile.
- [ ] Les conséquences ne montrent aucun wipe fictif ; commandes, clavier, texte et mode sans animation restent corrects pour le piège.
- [ ] L’utilisateur valide les deux branches du piège ; les cinq autres familles restent ouvertes chez leurs propriétaires.

## Tests

Fixtures trap succès/échec avec ressources ; contrôler la non-régression des données des cinq autres types sans déclarer leur rendu terminé.

- Contrôles structurels ciblés et fixtures déterministes du périmètre.
- Après validation visuelle de l’écran : `npm.cmd test -- --run <fichiers ciblés>`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet` ; tests navigateur ciblés via `npm.cmd run test:layout-browser -- <spec>` si scène concernée.
- `npm.cmd run build`, `npm.cmd run check:bundle` ; `npm.cmd run check:dungeon-visuals` si assets/catalogue modifiés ; `npm.cmd run board:validate`.
- Les commandes avec paramètres entre chevrons sont à préciser dans le handoff d’implémentation, pas à exécuter telles quelles. Aucune réussite de test applicatif n’est déclarée par la création de ce ticket.

Preuves antérieures conservées (ancien périmètre, 12 septembre) : 1 121 tests Vitest / 134 fichiers ; typecheck, lint, check:dungeon-visuals, board:validate, build/check:bundle à 252 080 octets gzip. Quatre scénarios Playwright/douze branches étaient seulement collectés via --list dans ce ticket ; CDI-113 a ensuite consigné neuf scénarios combinés passés le 13 septembre. Aucun de ces relevés ne prouve les nouveaux gestes. Acquis transféré à préserver dans 130/133 : embuscade sans combat ajouté et échecs sans wipe fictif.

## Validation manuelle

Présenter uniquement le piège en succès/échec, en scène intégrée rejouable. Un accord ne valide pas les cinq autres écrans ; ils seront montrés un par un.

## Preservation

- PC uniquement ; compositions, identités, diversité et DA CDIdle conservées.
- Arme propre au sprite, variable dans une classe mais indépendante de l’équipement réel.
- Réutilisation d’abord ; les poses d’action restent ciblées après les gardes validées. Pas de cycles complets ni de série automatique pour 200 identités visuelles.
- Autorité serveur, RNG, résultats, XP/loot, révisions, idempotence et cadence conservés ; aucune commande depuis une animation.
- Autonomie technique/Git du chantier selon AGENTS.md ; validation visuelle par l’utilisateur écran par écran. Zéro déploiement sans contre-ordre explicite.

## Risques

- Apparition du piège confondue avec une interaction.
- Socle partagé imposant le même geste aux autres épreuves ou effaçant leur code en cours.

## Handoff

Fournir les phases et ancrages réutilisables, les preuves du piège V07/V14/V18 et le transfert des cinq accessoires vers CDI-129–133. Documenter/tester la livraison après validation de cet écran.
