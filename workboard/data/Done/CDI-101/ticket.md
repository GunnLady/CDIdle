---
id: CDI-101
title: Construire la scène de combat simple CDIdle
status: Done
area: ui
priority: P1
size: M
risk: medium
source: Demande utilisateur du 10 septembre 2026 - scènes Donjon 2D inspirées de SLT
depends_on: ["CDI-099","CDI-107"]
blocks: ["CDI-103"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/components/dungeon/CurrentEncounterPanel.tsx","shared/domain/undercity-combat.ts","src/ui/foundations/tokens.css"]
---

# CDI-101 — Construire la scène de combat simple CDIdle

## Objectif

Rendre un combat simple vivant et lisible à partir du lecteur et du kit pilote validés.

## Resultat utilisateur

Les héros avancent, frappent, esquivent, subissent des impacts et restent visiblement KO à leur emplacement.

## Contexte

M est limité à la scène de combat de base ; les compétences passent à CDI-113 et les statuts/intentions à CDI-114. L'intégration réelle suit dans CDI-103.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Composer les acteurs et couches, entrée/repos animé, mêlée, impact, nombre
flottant, PV, esquive, critique, KO et résultat avec le lecteur et le kit pilote.
Supporter jusqu'à quatre héros/trois ennemis et les identités historiques.
Inclure nettoyage, plafond de 16 effets temporaires, HTML accessible et
mouvements réduits. Prouver les cibles/valeurs et le coup létal sur le bon acteur.
Les actions avancées encore non chorégraphiées restent fidèles par un rendu
neutre/résumé explicite ; leur rendu final relève de 113/114. Pas de branchement
à l'automate dans ce ticket de rendu.

## Hors perimetre

- Raccordement à l'automate de production : CDI-103.
- Chorégraphies de compétences/projectiles/soins avancés : CDI-113 ; statuts et Roi : CDI-114.
- Collision, pathfinding, choix de cible, production de toute la bibliothèque artistique.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Composer décor/sol/acteurs/jauges/résultat à partir de modèles hors React ; pas de rerender de tout App par frame.
- Jauges, impacts et nombres flottants partagent les mêmes points temporels.
- Un héros KO reste à sa place et n'attaque plus ; critique/esquive ne modifient pas les valeurs reçues.
- Limiter les effets temporaires à 16, les nettoyer et préserver commandes, résumé HTML et mouvements réduits.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-099 : Préparer le catalogue visuel et le kit pilote CDIdle.
- CDI-107 : Construire le lecteur temporel annulable à cadence constante.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [x] Jusqu'à quatre héros et trois ennemis sont distincts dans la composition CDI-097 et conservent leur identité.
- [x] Entrée/repos animé, anticipation, mêlée, impact et retour sont présents ; aucun simple glissement sans impact ne vaut validation.
- [x] Coup normal, critique, esquive, coup létal sur la bonne cible, KO et résultat sont couverts par les fixtures et le rendu.
- [x] Les actions avancées non encore chorégraphiées utilisent un rendu neutre/résumé fidèle explicitement transitoire jusqu'à CDI-113/CDI-114.
- [x] Aucun effet ne recouvre les commandes ou une information obligatoire ; 16 effets maximum, nettoyage, reduced-motion et asset absent sont testés.
- [x] L'utilisateur valide rythme et lisibilité du combat pilote aux dimensions prévues.

## Tests

- Tests de composants sur les profils simples, acteurs cibles, nombre/jauge au même impact et états accessibles.
- Harness quatre héros/trois ennemis, coup létal, esquive, KO ; largeurs PC selon l'autorisation navigateur du projet.
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Faire valider le combat simple, le critique, l'esquive et le KO par l'utilisateur. Ne pas déclarer les compétences ou le boss final validés sur ce seul pilote.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Des animations indépendantes des points d'impact trahiraient la trace.
- Le rendu neutre intermédiaire ne doit pas devenir le résultat final des familles avancées.

## Handoff

Fournir profils simples, limites de rendu, tests et verdict du pilote. V02/V03/V06/V14/V15/V18. La scène est prête pour CDI-103, pas encore un remplacement complet.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.

Livré : modèle de présentation déterministe, composition PC partagée avec le prototype, composant de combat isolé, identités historiques, jauges, effets bornés, KO, résultat, fallbacks et reduced-motion. Les rythmes idle sont désynchronisés sans déplacer les pieds et les acteurs à 0 PV ne peuvent pas agir.

Preuves : validation visuelle utilisateur le 11 septembre 2026 ; 129 fichiers Vitest et 1052 tests passés ; 5 tests Playwright PC passés ; lint, typecheck CDI-101 hors dossier utilisateur ignoré `tmp`, build, budget bundle et Workboard validés. L'intégration à l'automate de production reste volontairement réservée à CDI-103, les compétences à CDI-113 et les statuts/intentions à CDI-114.
