---
id: CDI-113
title: Fiabiliser la chronologie et le pilote de contact
status: Done
area: ui
priority: P1
size: M
risk: high
source: Demande utilisateur du 13 septembre 2026 - recadrage selon le plan amélioré
depends_on: ["CDI-103","CDI-106","CDI-117","CDI-136","CDI-148"]
blocks: ["CDI-114","CDI-118","CDI-120","CDI-121","CDI-122","CDI-124","CDI-125","CDI-126","CDI-128"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","docs/development/dungeon-2d-combat-effects.md","docs/development/session-2026-09-16-cdi-113-contact-pilot-handoff.md","src/components/dungeon/CurrentEncounterPanel.tsx","shared/domain/undercity-combat.ts","src/ui/foundations/tokens.css","src/assets/heroSpriteSheets.ts","src/domain/heroPortrait.ts","src/components/HeroPortrait.tsx","shared/domain/undercity.ts","assets/design/hero-sprites/human-tier1-class-spritesheets-v1.prompt.md","shared/contracts/authoritative.ts","shared/domain/authoritative-dungeon.ts","docs/development/canonical-state-migrations.md","docs/development/supabase-egress-budget.md","docs/development/dungeon-2d-action-production-plan.md"]
---

# CDI-113 — Fiabiliser la chronologie et le pilote de contact

## Objectif

Livrer une chronologie commune fiable et un contact simple lisible, du geste à la reprise d’attente.

## Resultat utilisateur

Une attaque se prépare, touche sa vraie cible et se termine proprement, même pendant une lecture continue.

## Contexte

Recadrage du 13 septembre : l’ancien lot réunissait trop de familles. Son code et ses preuves techniques restent conservés ; la couverture globale est transférée aux tickets CDI-118–128 puis CDI-135. CDI-117 a terminé le tri artistique. Le pilote reprend après les bases neutres Novice CDI-136 et les poses de combat Novice CDI-148.

## Perimetre autorise

Réutiliser le lecteur et les modèles actuels. Définir les repères garde/préparation/émission/contact(s)/récupération/garde, arbitrer le chevauchement et l’annulation, corriger le routage trop générique et intégrer un pilote de contact avec les poses Novice validées. Tester une trajectoire minimale comme preuve de chronologie, sans prétendre livrer les tirs et sorts définitifs.

## Hors perimetre

- Production globale des sprites, autres familles et régressions artistiques non liées.
- Modifier le pas logique de 400 ms, les résultats métier ou la cadence des commandes.
- Ajouter un moteur d’animation complexe ou clôturer les successeurs par le pilote.

## Contrat d'implementation

- Domaine partagé pour les règles ; projection/chronologie et modèles hors React ; rendu limité à la présentation.
- Utiliser identifiants structurés et clés visuelles historiques, pas les messages traduits, l’arme actuellement équipée ou le seul damageType/rôle ennemi.
- Réutiliser lecteur, composants et effets existants ; aucune abstraction ou dépendance nouvelle sans bénéfice direct.
- Une information par bulle, une ligne hors visage ; PV rouges, PM bleus, départs 600 ms et vie 1 000 ms comme référence validée ; chevauchement lisible et borné.
- Garder le pas logique de 400 ms, 16 effets temporaires, nettoyage hors vue, ancienne trace honnête et mode sans animation complet.
- Si une retouche/pose est indispensable, créer son ticket A1/A2 sur des clés nommées et le relier comme prérequis du consommateur, de CDI-135 et de CDI-134 si héros. Aucun ticket artistique ne dépend du consommateur qu’il bloque.
- Alpha réel, boîte visible/pivot, arme entière, éclairage et cohérence de visage contrôlés sur les seules images modifiées ; pas de détourage runtime.
- Un identifiant d’effet reste stable entre pas ; les timers de jauges ne se réannulent pas à chaque tick. Le dernier acteur actif reprend l’attente sans attendre une nouvelle action.
- Une seule chronologie de présentation pilote pose, trajet, impact, réaction et PV ; PM selon consommation reçue. Arbitrage borné documenté, sans backlog infini.

## Dependances

- CDI-103 : intégration du lecteur.
- CDI-106 : ressources et cibles fiables.
- CDI-117 : référence et tri artistique ; ajouter les seules retouches indispensables au pilote avant reprise.
- CDI-136 : bases neutres Novice validées.
- CDI-148 : poses de combat Novice validées et intégrées au cinéma.

## Criteres d'acceptation

- [x] Le pilote de contact est intégré au vrai lecteur et validé visuellement, sans pas-à-pas obligatoire.
- [x] Le pilote prouve la transition garde → action/contact → garde avec la même identité Novice, sans retour intermédiaire à la pose neutre.
- [x] Acquis antérieur à préserver : auteurs/cibles, mana et valeurs structurées exactes, sans impact inventé.
- [x] Acquis antérieur à préserver : une compétence létale garde la cible touchée même avec un survivant suivant.
- [x] Repères communs, effets stables entre ticks, arbitrage des actions et synchronisation PV/impacts sont vérifiés en continu à 400 ms.
- [x] La dernière action finit et rend l’attente individuelle ; pause/replay/remplacement/onglet masqué/démontage ne laissent ni effet ni jauge bloqués.
- [x] Une séquence jusqu’à cinq impacts prouve l’ordonnancement technique sans déclarer livrée la chorégraphie de CDI-119.
- [x] Limite 16, nettoyage, mode sans animation et compatibilité ancienne trace sont revérifiés après le changement de chronologie.

## Tests

- Contrôles structurels ciblés et fixtures déterministes du périmètre.
- Après validation visuelle de l’écran : `npm.cmd test -- --run <fichiers ciblés>`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet` ; tests navigateur ciblés via `npm.cmd run test:layout-browser -- <spec>` si scène concernée.
- `npm.cmd run build`, `npm.cmd run check:bundle` ; `npm.cmd run check:dungeon-visuals` si assets/catalogue modifiés ; `npm.cmd run board:validate`.
- Les commandes avec paramètres entre chevrons sont à préciser dans le handoff d’implémentation, pas à exécuter telles quelles. Aucune réussite de test applicatif n’est déclarée par la création de ce ticket.

Preuves antérieures conservées (ancien périmètre, consignées le 13 septembre) : 1 122 tests Vitest / 134 fichiers ; typecheck, lint, check:dungeon-visuals, board:validate, build et check:bundle ; 252 797 octets gzip, plus gros chunk 118 347. Cinq scénarios Playwright CDI-113 et neuf combinés 113/115 étaient annoncés passés. Ces résultats ne sont pas rejoués par le recadrage et ne prouvent pas le nouveau lecteur. La mention « seule validation visuelle restante » est retirée. Le critère ancien des effets bornés doit être revérifié car leur cycle change.

Preuves actualisées le 16 septembre 2026 sur le périmètre recadré : 7 fichiers / 85 tests Vitest ciblés passés ; 9 scénarios Playwright ciblés passés, dont le pilote continu et le retour en garde à 1024/1280/1440 px ; typecheck, lint, build, check:bundle, check:dungeon-visuals et board:validate passés. Bundle : 254 618 octets gzip JS, plus gros chunk 118 347 octets. Le flux est vidé sur replay, résultat et remplacement de rencontre ; les timers d’effets et de jauges sont annulés au démontage ; pause/reprise ne bloque pas la valeur présentée.

## Validation manuelle

Montrer un vrai enchaînement automatique : garde/contact, critique, esquive, létal avec survivant, dernière action puis retour en garde. Pas de cycle complet imposé.

Validation utilisateur du 16 septembre 2026 sur le cinéma intégré : « Tout est bon le cinéma est bien ». La pose de victoire évoquée est différée et ne bloque pas ce ticket.

## Preservation

- PC uniquement ; compositions, identités, diversité et DA CDIdle conservées.
- Arme propre au sprite, variable dans une classe mais indépendante de l’équipement réel.
- Réutilisation d’abord ; les poses d’action restent ciblées après les gardes validées. Pas de cycles complets ni de série automatique pour 200 identités.
- Autorité serveur, RNG, résultats, XP/loot, révisions, idempotence et cadence conservés ; aucune commande depuis une animation.
- Autonomie technique/Git du chantier selon AGENTS.md ; validation visuelle par l’utilisateur écran par écran. Zéro déploiement sans contre-ordre explicite.

## Risques

- Action plus longue que le pas de lecture : effet redémarré, jauge retardée annulée, attente figée ou accumulation.
- Déduire une attaque de mêlée du seul type de dégâts ou classer tous les tirs ennemis par le rôle ranged.
- Écart du 13 septembre résolu le 16 septembre 2026 : la couche d’attente reste active sous le mouvement ponctuel, puis reprend seule après l’action. Les scénarios Playwright 1024/1280/1440 passent.

## Handoff

Le handoff [`session-2026-09-16-cdi-113-contact-pilot-handoff.md`](../../../docs/development/session-2026-09-16-cdi-113-contact-pilot-handoff.md) documente les repères, règles d’arbitrage, scénario reproductible, limites et preuves V02/V03/V14/V18. Les tickets de famille réutilisent ce contrat ; leur rendu final reste à livrer. Aucun écart réel non corrigé n’est reporté à la clôture.
