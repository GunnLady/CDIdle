---
id: CDI-106
title: Compléter les traces et projections de ressources et de cibles
status: Done
area: architecture
priority: P1
size: M
risk: high
source: Demande utilisateur du 10 septembre 2026 - redécoupage approuvé des scènes Donjon 2D
depends_on: ["CDI-098","CDI-100"]
blocks: ["CDI-102","CDI-113"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","shared/contracts/authoritative.ts","shared/domain/authoritative-dungeon.ts","shared/domain/undercity.ts","shared/domain/undercity-combat.ts","docs/development/canonical-state-migrations.md","docs/development/supabase-egress-budget.md","src/domain/encounterPlayback.ts","src/hooks/useEncounterPlayback.ts","src/domain/dungeonPresentation.ts","src/hooks/useAuthoritativeCommandDispatch.ts","tests/encounterPlayback.test.ts"]
---

# CDI-106 — Compléter les traces et projections de ressources et de cibles

## Objectif

Compléter les données structurées de ressources/cibles et leur projection, sans attendre le rendu des compétences.

## Resultat utilisateur

Soins, mana, impacts multiples, trésor et repos affichent les montants et les acteurs réellement concernés.

## Contexte

M enrichit le producteur et la projection existants CDI-098/CDI-100. Les débuts/fins de statuts et intentions sont explicitement séparés dans CDI-114.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Compléter au producteur les données structurées réellement absentes de mana,
auteurs, impacts multiples, cibles explicites, soins/récupération et conséquences
des huit rencontres hors combat ; étendre dans le même ticket leur projection
pure et leurs fixtures. Distinguer dégâts annoncés/PV effectivement retirés,
héros sélectionné, butin et pertes réelles. Couvrir les branches applicables
sans parsing de texte et sans nouvelles attentes dans le calendrier.

Exclure début/fin de buffs/debuffs, intentions et protection du Roi, pris en
charge verticalement par 114. Vérifier compatibilité additive, parité métier,
taille des traces et pipeline local pour les changements persistés. Ce ticket
n'attend pas les animations 113 pour démontrer la fidélité de ses données.

## Hors perimetre

- Acteurs initiaux : CDI-098 ; ciblage létal : CDI-105.
- Début/fin de buff, debuff, protection, intention et phase du Roi : CDI-114.
- Animation des compétences/soins : CDI-113 ; réalisation des scènes hors combat : CDI-102/CDI-115.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Compléments capturés au point métier où ils sont connus : auteur, cibles, mana, impacts ordonnés, dégâts annoncés/PV retirés, récupération, héros sélectionné et conséquences exactes.
- Étendre la projection pure dans le même ticket et prouver égalité direct/pas à pas sur chaque conséquence.
- Compatibilité additive, événements inconnus et historiques acceptés ; aucun parsing de messages et aucune nouvelle attente purement visuelle.
- Mesurer les octets sur quinze traces et la parité métier/RNG ; prouver le pipeline local pour les champs persistés.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-098 : Capturer les acteurs initiaux dans un contrat de rencontre compatible.
- CDI-100 : Projeter les rencontres en états de scène déterministes.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [x] La matrice CDI-098 couvre les ressources/cibles de fight et des huit types hors combat ; seules les rubriques statuts/intentions restent attribuées à CDI-114.
- [x] Mana consommé/restauré, soins alliés/ennemis, multi-frappes et multicibles identifient les bonnes valeurs et cibles sans texte français.
- [x] Trésor vide/contenu, repos plafonné/réanimation et les branches des six épreuves ont conséquences/acteur sélectionné explicites.
- [x] Chaque complément est projeté et testé à ses points d'impact ; accès direct et séquentiel concordent.
- [x] Résultats, RNG, récompenses, révisions/idempotence et calendrier restent identiques hors enrichissement de trace.
- [x] Compatibilité ancien/nouveau, coût des traces longues et persistance/replay sur runtime local sont prouvés pour les champs ajoutés.

## Tests

- Étendre authoritativeContracts, authoritativeDungeonGolden, dungeonSegmentHarness et les tests purs de projection.
- Fixtures mana, heal, soutien ennemi, impacts multiples, huit types hors combat et branches applicables.
- npm.cmd run check:determinism
- npm.cmd run test:egress-budget
- npm.cmd run test:integration (Supabase local pour les changements persistés).
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Contrôler une trace locale et sa projection sans copier de bearer. Le verdict artistique appartient aux scènes qui consomment ces données.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Une cible multiple omise rendrait une future animation plausible mais fausse.
- Répliquer des snapshots complets au lieu de deltas compacts dégrade l'egress.

## Handoff

Fournir matrice mise à jour, fixtures producteur/projection, preuves de parité et octets/pipeline local. V02/V04/V07/V17. Remettre explicitement les statuts/intentions restants à CDI-114.

Livré : contrat additif compact pour mana, cibles, multi-frappes, valeurs annoncées et conséquences ; producteur autoritaire enrichi au point métier ; projection pure des ressources, impacts ordonnés et récompenses ; fixtures couvrant combat, trésor, repos et les six épreuves. Les statuts, intentions, protections et phases du Roi restent exclusivement dans CDI-114.

Preuves : 1 064 tests Vitest passent, typecheck projet hors dossier temporaire utilisateur et lint passent, build et budget bundle passent (255 919 octets gzip JS), déterminisme et budget egress passent. L'enrichissement représentatif mesure 51 octets par rencontre, soit 765 octets sur quinze traces et 85 859 octets au profil haut. Le runtime Supabase local a prouvé persistance, bootstrap et replay des nouveaux champs. Aucun changement de gameplay, RNG, calendrier ou rendu React.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
