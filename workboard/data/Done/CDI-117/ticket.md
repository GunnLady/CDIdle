---
id: CDI-117
title: Caler la DA et sélectionner les retouches utiles
status: Done
area: ui
priority: P1
size: M
risk: medium
source: Demande utilisateur du 13 septembre 2026 - appliquer le plan amélioré, sobre et lisible
depends_on: ["CDI-099","CDI-108","CDI-109","CDI-110","CDI-111","CDI-112"]
blocks: ["CDI-113","CDI-129","CDI-130","CDI-131","CDI-132","CDI-133","CDI-134","CDI-135","CDI-136","CDI-137","CDI-138","CDI-139","CDI-140","CDI-141","CDI-142","CDI-143","CDI-144","CDI-145","CDI-146","CDI-147"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-sprite-audit.md","AGENTS.md","src/assets/heroSpriteSheets.ts","src/assets/encounterVisuals.ts"]
---

# CDI-117 — Caler la DA et sélectionner les retouches utiles

## Objectif

Caler une référence CDIdle commune, trier les bases héros et monstres et transformer chaque reprise nécessaire en lot artistique borné.

## Resultat utilisateur

Les ressources conservées et celles à refaire sont identifiées sans ambiguïté ; chaque reprise nécessaire possède son ticket et ses dépendances.

## Contexte

Lot A0 du plan amélioré. Le socle et les images déjà livrés sont réutilisés. Taille M relative, incluant intégration, contrôles et revue, hors attente visuelle ; pas un engagement de durée ni de production en série. Les validations visuelles sont consignées zone par zone sans être étendues au reste du catalogue.

## Décisions enregistrées

- Les dix classes héros sont à refaire via CDI-136–145 ; le Novice CDI-136 est produit en premier puis ajouté aux références des neuf autres classes.
- Le 13 septembre 2026, l’utilisateur valide tous les sprites des Égouts infestés. Les onze PNG catalogués sont conservés et aucun ticket A2 n’est requis pour cette zone.
- Le même jour, l’utilisateur demande de refaire les onze humains des Galeries des contrebandiers et conserve leurs deux gobelins ainsi que leur molosse. Les cinq écrans humains sont regroupés dans CDI-146, avec une validation distincte par écran.
- Le même jour, l’utilisateur valide tous les sprites des Citernes oubliées : neuf fichiers distincts pour dix usages de manifeste, sans ticket A2.
- Pour le Bastion, seuls `banished-sentinel-v1.png`, `palisade-lookout-v1.png` et `exile-blackshot-v1.png` sont à refaire dans CDI-147 ; les sept autres sprites sont conservés.
- Le même jour, l’utilisateur valide les quinze sprites distincts de la Cour du Roi des Rats, y compris la forme monstrueuse du Roi ; aucun ticket A2 Cour.
- La liste détaillée des ressources et les verdicts suivants sont tenus dans `docs/development/dungeon-2d-sprite-audit.md`.

## Perimetre autorise

Inventaire des dix classes et des cinq zones à partir des ressources existantes ; sélection d’un étalon humanoïde, verdict utilisateur par famille, relevé des exceptions de DA, arme dessinée, morphologie, alpha et éclairage, puis création des seuls lots A1/A2 nécessaires. Aucun kit complet, aucune série de 400 identités et aucune animation produite dans ce ticket.

## Hors perimetre

- Pas de refonte de toutes les images ni de nouvel outil de rigging ; les retouches après tri ont leurs tickets.
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

- CDI-099.
- CDI-108.
- CDI-109.
- CDI-110.
- CDI-111.
- CDI-112.

## Criteres d'acceptation

- [x] Une référence commune est validée par l’utilisateur, sans gommer diversité, identités ni particularités des armes.
- [x] Le tri couvre les dix classes et les cinq zones ; chaque défaut retenu nomme les clés et usages concernés, et les ressources conservées sont identifiées.
- [x] La stratégie économe est transmise à CDI-113 : comparer mouvement simple et pose ciblée sur le pilote de contact après validation du Novice CDI-136.
- [x] Avant clôture, chaque retouche nécessaire A1/A2 devient un ticket borné (identités, poses et exports nommés). Ajouter ses dépendances aux consommateurs, à CDI-135 et à CDI-134 si héros ; aucun besoin artistique ne reste dans une simple note.
- [x] Les besoins artistiques identifiés bloquent leurs propres consommateurs ; le choix d’une éventuelle pose du pilote reste dans CDI-113 après disponibilité de sa base validée.
- [x] Les verdicts utilisateur, ressources conservées, limites, tickets artistiques et dépendances sont tracés dans l’audit et le Workboard.

## Tests

Contrôler l’inventaire, les usages partagés, les chemins de ressources et les dépendances. Aucun asset applicatif n’étant modifié, les contrôles alpha, poids et composition restent dans les tickets A1/A2 correspondants.

- `npm.cmd run board:validate` après création et raccordement des tickets A1/A2.
- `git diff --check` sur les documents et tickets du lot.
- Aucun test applicatif, navigateur, build ou contrôle d’assets n’est revendiqué : CDI-117 ne modifie ni code ni image.

## Validation manuelle

L’utilisateur a validé l’étalon, les dix verdicts de classes et les cinq zones. Ces verdicts sont consignés séparément et ne prévalident ni les nouvelles bases A1/A2 ni leurs futurs écrans intégrés.

## Preservation

- PC uniquement ; compositions, identités, diversité et DA CDIdle conservées.
- Arme propre au sprite, variable dans une classe mais indépendante de l’équipement réel.
- Réutilisation d’abord ; une ou deux poses seulement si nécessaires. Pas de cycles complets ni de série automatique pour 400 identités.
- Autorité serveur, RNG, résultats, XP/loot, révisions, idempotence et cadence conservés ; aucune commande depuis une animation.
- Autonomie technique/Git du chantier selon AGENTS.md ; validation visuelle par l’utilisateur écran par écran. Zéro déploiement sans contre-ordre explicite.

## Risques

- Produire trop tôt des poses en série ou perdre une retouche dans une simple liste.
- Un changement de taille/pivot ou de durée désynchronise l’action et son résultat.

## Handoff

Références, verdicts datés, ressources conservées ou à refaire et tickets CDI-136–147 sont consignés dans `docs/development/dungeon-2d-sprite-audit.md`. CDI-113 porte désormais le pilote de mouvement après CDI-136 ; les tickets de famille gardent l’intégration et la mesure des nouvelles poses dans le budget artistique de 2 MiB par scène.
