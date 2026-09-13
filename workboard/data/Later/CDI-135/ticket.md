---
id: CDI-135
title: Vérifier le combat continu et la couverture des actions
status: Later
area: quality
priority: P1
size: M
risk: high
source: Demande utilisateur du 13 septembre 2026 - appliquer le plan amélioré, sobre et lisible
depends_on: ["CDI-114","CDI-117","CDI-118","CDI-119","CDI-120","CDI-121","CDI-122","CDI-123","CDI-124","CDI-125","CDI-126","CDI-127","CDI-128","CDI-136","CDI-137","CDI-138","CDI-139","CDI-140","CDI-141","CDI-142","CDI-143","CDI-144","CDI-145","CDI-146","CDI-147"]
blocks: ["CDI-116"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-encounter-plan.md","AGENTS.md","shared/data/skills.ts","src/domain/dungeonCombatScene.ts","docs/development/dungeon-2d-combat-effects.md"]
---

# CDI-135 — Vérifier le combat continu et la couverture des actions

## Objectif

Prouver que les familles fonctionnent ensemble et que le catalogue actuel n’a aucun oubli.

## Resultat utilisateur

Prouver que les familles fonctionnent ensemble et que le catalogue actuel n’a aucun oubli.

## Contexte

Lot Q1 du plan amélioré. Le socle et les images déjà livrés sont réutilisés. Taille M relative, incluant intégration, contrôles et revue, hors attente visuelle ; pas un engagement de durée ni de production en série. Aucun résultat visuel n’est encore validé pour ce lot.

## Perimetre autorise

Matrice 36 compétences actives, bases héros/ennemis, réactions, effets, gardes et Roi ; toutes identités conservées, trente blueprints/cinq zones. Scénario automatique mélangeant les familles sur le vrai lecteur ; le pas-à-pas est seulement un outil de diagnostic.

## Hors perimetre

- Ne pas implémenter ici une famille oubliée : ouvrir/corriger chez son propriétaire et bloquer la clôture.
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

- CDI-117.
- CDI-114.
- CDI-118.
- CDI-119.
- CDI-120.
- CDI-121.
- CDI-122.
- CDI-123.
- CDI-124.
- CDI-125.
- CDI-126.
- CDI-127.
- CDI-128.

## Criteres d'acceptation

- [ ] Les 36 skillId sont reliés à leur ticket et leur preuve ; attaques de base, passifs sans faux tour, mana insuffisant/cooldown/absence de cible et événements de fin ne créent pas d’action inventée.
- [ ] Tous les besoins A1/A2 issus de 117 et des pilotes sont des tickets prérequis explicites terminés, ou des réutilisations validées avec preuve ; aucun défaut réel n’est caché dans une note.
- [ ] Lecture continue 4 héros/3 ennemis : impacts jusqu’à cinq, changements de cibles, KO, soin, statuts et P2 cohérents à cadence conservée.
- [ ] Aucun effet ne redémarre à chaque pas, aucune jauge différée n’est indéfiniment annulée, pas d’attente perdue ni de ressources en croissance.
- [ ] L’utilisateur valide les écrans concernés ; les tests techniques seuls ne valent pas un verdict artistique.
- [ ] Le scénario intégré est validé visuellement par l’utilisateur ; contrôles techniques ciblés, limites et éventuels tickets artistiques sont tracés.

## Tests

Réutiliser harnesses et vraies scènes ; couverture déterministe des skillId/blueprints, tests navigateur continus et reduced-motion ; réserver les mesures réelles de performance à 116.

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

- Confondre tests verts/lecture pas-à-pas et couverture réelle du combat continu.
- Un changement de taille/pivot ou de durée désynchronise l’action et son résultat.

## Handoff

Fournir clés/actions couvertes, ressources conservées ou modifiées, références, scénario exact, preuves datées et verdict utilisateur. Mettre à jour le plan et les dépendances avant clôture ; toute lacune réelle bloque le ticket ou son propriétaire explicite, jamais une déclaration de couverture complète.
