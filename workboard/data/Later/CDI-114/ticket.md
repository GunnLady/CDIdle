---
id: CDI-114
title: Tracer et représenter le cycle des buffs et debuffs
status: Later
area: ui
priority: P1
size: M
risk: high
source: Demande utilisateur du 13 septembre 2026 - recadrage selon le plan amélioré
depends_on: ["CDI-113"]
blocks: ["CDI-116","CDI-121","CDI-123","CDI-124","CDI-125","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/components/dungeon/CurrentEncounterPanel.tsx","shared/domain/undercity-combat.ts","src/ui/foundations/tokens.css","shared/contracts/authoritative.ts","shared/domain/authoritative-dungeon.ts","shared/domain/undercity.ts","docs/development/canonical-state-migrations.md","docs/development/supabase-egress-budget.md","src/domain/encounterPlayback.ts","src/hooks/useEncounterPlayback.ts","src/domain/dungeonPresentation.ts","src/hooks/useAuthoritativeCommandDispatch.ts","tests/encounterPlayback.test.ts","src/components/dungeon/DungeonPage.tsx","src/components/dungeon/DungeonHistoryPanel.tsx","src/hooks/useDungeonAutomation.ts","src/hooks/useCrossTabGameSynchronization.ts","docs/development/dungeon-segment-ko-milestone-plan.md","docs/development/dungeon-2d-action-production-plan.md"]
---

# CDI-114 — Tracer et représenter le cycle des buffs et debuffs

## Objectif

Prouver début, renouvellement et expiration des buffs/debuffs du producteur au rendu.

## Resultat utilisateur

Le joueur voit les effets réellement actifs sur les bonnes cibles et leur disparition au bon moment.

## Contexte

Recadrage : intentions et protections de groupe vers CDI-126 ; gardes et mutation du Roi vers CDI-127. Un même cycle d’état reste livré de bout en bout, pas trois tickets indépendants de schéma/projection/icône.

## Perimetre autorise

Buffs/debuffs individuels, self et collectifs des compétences existantes : cibles, début/changement/renouvellement/expiration, conséquences et mana reçus. Tracer au point métier connu, projeter à un instant et rendre un marqueur discret. Les gestes/signatures des compétences restent dans les tickets de familles.

## Hors perimetre

- Intentions, protection/exposition ennemie et Roi : CDI-126/127.
- Nouvelle règle de durée, stacking, contrôle, dégâts périodiques ou équilibrage.
- Produire toutes les poses de lancement dans ce lot.

## Contrat d'implementation

- Domaine partagé pour les règles ; projection/chronologie et modèles hors React ; rendu limité à la présentation.
- Utiliser identifiants structurés et clés visuelles historiques, pas les messages traduits, l’arme actuellement équipée ou le seul damageType/rôle ennemi.
- Réutiliser lecteur, composants et effets existants ; aucune abstraction ou dépendance nouvelle sans bénéfice direct.
- Une information par bulle, une ligne hors visage ; PV rouges, PM bleus, départs 600 ms et vie 1 000 ms comme référence validée ; chevauchement lisible et borné.
- Garder le pas logique de 400 ms, 16 effets temporaires, nettoyage hors vue, ancienne trace honnête et mode sans animation complet.
- Si une retouche/pose est indispensable, créer son ticket A1/A2 sur des clés nommées et le relier comme prérequis du consommateur, de CDI-135 et de CDI-134 si héros. Aucun ticket artistique ne dépend du consommateur qu’il bloque.
- Alpha réel, boîte visible/pivot, arme entière, éclairage et cohérence de visage contrôlés sur les seules images modifiées ; pas de détourage runtime.
- Contrat additif et borné ; parité RNG/résultats, historique quinze rencontres et mesure egress. Ne jamais déduire une expiration du timer d’un effet CSS.
- Capturer au point où le domaine connaît la vraie durée et ses changements ; repli neutre pour les anciens événements insuffisants.

## Dependances

- CDI-113 : chronologie et rendu intégré fiables.

## Criteres d'acceptation

- [ ] Producteur, projection à t et scène concordent sur pose/renouvellement/expiration et vraies cibles, y compris collectives.
- [ ] Les coûts PM et états n’ajoutent ni pas de lecture ni nouveau résultat métier.
- [ ] Anciennes traces et événements inconnus restent compatibles ; persistance/replay et octets ajoutés sont vérifiés.
- [ ] Marqueurs discrets, libellés HTML et mode sans animation restent complets ; validation utilisateur d’effets représentatifs.
- [ ] Les rubriques de données restantes sont attribuées explicitement à 126/127 ; aucune promesse globale de statuts accomplie par ce seul sous-lot.

## Tests

Fixtures début/renouvellement/expiration, self/single/all, cible KO, mana et ancienne trace ; tests partagés domaine/contrats/projection/composants. `npm.cmd run check:determinism`, `npm.cmd run test:egress-budget`, `npm.cmd run test:integration` si contrat persisté modifié.

- Contrôles structurels ciblés et fixtures déterministes du périmètre.
- Après validation visuelle de l’écran : `npm.cmd test -- --run <fichiers ciblés>`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet` ; tests navigateur ciblés via `npm.cmd run test:layout-browser -- <spec>` si scène concernée.
- `npm.cmd run build`, `npm.cmd run check:bundle` ; `npm.cmd run check:dungeon-visuals` si assets/catalogue modifiés ; `npm.cmd run board:validate`.
- Les commandes avec paramètres entre chevrons sont à préciser dans le handoff d’implémentation, pas à exécuter telles quelles. Aucune réussite de test applicatif n’est déclarée par la création de ce ticket.

## Validation manuelle

Valider un buff allié, un debuff ennemi, un effet collectif, son renouvellement et sa fin dans le vrai combat ; pas de nouveau geste obligatoire pour cette preuve.

## Preservation

- PC uniquement ; compositions, identités, diversité et DA CDIdle conservées.
- Arme propre au sprite, variable dans une classe mais indépendante de l’équipement réel.
- Réutilisation d’abord ; les poses d’action restent ciblées après les gardes validées. Pas de cycles complets ni de série automatique pour 200 identités visuelles.
- Autorité serveur, RNG, résultats, XP/loot, révisions, idempotence et cadence conservés ; aucune commande depuis une animation.
- Autonomie technique/Git du chantier selon AGENTS.md ; validation visuelle par l’utilisateur écran par écran. Zéro déploiement sans contre-ordre explicite.

## Risques

- Effet perpétuel faute de fin historique ou faux cumul.
- Métadonnées trop volumineuses, répétées sur quinze rencontres.

## Handoff

Matrice et preuves V04/V14/V17/V18 sur le cycle des buffs/debuffs ; liens explicites vers les gestes CDI-121/123/124/125 et les états ennemis CDI-126/127. Conserver les tests d’intégration au même niveau que la trace.
