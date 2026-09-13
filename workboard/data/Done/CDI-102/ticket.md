---
id: CDI-102
title: Mettre en scène trésors, repos et réanimations
status: Done
area: ui
priority: P1
size: M
risk: medium
source: Demande utilisateur du 10 septembre 2026 - scènes Donjon 2D inspirées de SLT
depends_on: ["CDI-103","CDI-106"]
blocks: ["CDI-115","CDI-128","CDI-134"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","shared/domain/authoritative-dungeon.ts","shared/contracts/authoritative.ts","src/domain/dungeonPresentation.ts"]
---

# CDI-102 — Mettre en scène trésors, repos et réanimations

## Objectif

Livrer les scènes de trésor et de repos dans le vrai Donjon, avec leurs accessoires et données exactes.

## Resultat utilisateur

Le joueur voit ce qu'il trouve dans le coffre et quels héros récupèrent ou se relèvent au repos.

## Contexte

M couvre deux types aux conséquences propres, en réutilisant l'intégration CDI-103 et les projections CDI-106. La composition non-combat sera réutilisée pour les six défis CDI-115.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Créer et raccorder dans le vrai Donjon les deux scènes et leurs accessoires :
coffre vide/contenu exact, récupération partielle PV/PM, un ou plusieurs KO de
segment réanimés. Installer la composition non-combat réutilisée par 115.
Inclure provenance/poids des accessoires, valeurs reçues, cas plafonnés,
accessibilité et avis visuel. Pas de clic de collecte, héros de ville ajouté
ou pourcentage recalculé. Les six épreuves restent temporairement sur leur
présentation fidèle existante jusqu'à 115.

## Hors perimetre

- Les six épreuves : CDI-115.
- Clic de collecte, choix supplémentaire, héros resté en ville, règle de récupération recalculée dans React.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Consommer heroChanges/recovery et récompenses reçues ; prendre en compte plafonds PV/PM et membres KO éligibles du segment.
- Créer les accessoires treasure/rest avec provenance, cadrage, ancrage, budget et fallback du catalogue CDI-099.
- Raccorder ces deux types à CurrentEncounterPanel sans nouveau moteur ou minuterie indépendante.
- Les six défis conservent temporairement leur présentation fidèle existante jusqu'à CDI-115 ; le chantier ne se clôture pas avec ce repli.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-103 : Intégrer le premier combat et sécuriser son cycle de lecture.
- CDI-106 : Compléter les traces et projections de ressources et de cibles.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [x] Coffre vide ou avec or/matériau/plan affiche exactement le contenu reçu, sans invention ni duplication.
- [x] Repos avec PV/PM partiels, valeurs plafonnées et plusieurs KO réanimés montre les bons acteurs et valeurs.
- [x] Les deux scènes et leurs accessoires sont effectivement branchés dans le Donjon, pas seulement dans un harness.
- [x] Composition non-combat, accessibilité, clavier/résumé, reduced-motion et fallback sont réutilisables par CDI-115.
- [x] Les accessoires sont documentés/mesurés et respectent les budgets du plan ; l'utilisateur valide coffre et repos/réanimation.
- [x] Cadence, requêtes et règles de segment restent inchangées.

## Tests

- Fixtures trésor vide/contenu et repos avec un ou plusieurs KO ; tests de mapping et d'intégration des deux types.
- Réutiliser dungeonSegmentHarness et les suites de présentation/composants, y compris récupération plafonnée.
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Validations exécutées le 11 septembre 2026 :

- `npm.cmd test` : 132 fichiers et 1072 tests passés.
- suite Playwright PC `dungeonCombatScene.responsive.browser.spec.ts` : 9 tests passés, dont 1024/1280/1440 px, zoom équivalent 200 %, reduced-motion, bulles en cascade et barres PM conditionnelles.
- `npm.cmd run build` puis `npm.cmd run check:bundle` : build passé, 255121 B gzip JS et plus gros chunk à 121290 B.
- `npm.cmd run typecheck` et `npm.cmd run lint -- --quiet` : passés.
- `npm.cmd run check:dungeon-visuals` : 1468968 octets pour les quatre assets de rencontre, sous le budget de 2 Mio.
- `npm.cmd run board:validate` : 116 tickets, 0 erreur.

## Validation manuelle

L'utilisateur a validé dans le Donjon PC la salle de coffre, le camp de repos, les compositions, les ombres, les bulles unitaires et leur cadence 600/1000 ms. Les commandes et l'historique restent accessibles.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Une animation de récupération exprimée en pourcentage peut dépasser les valeurs réellement restaurées.
- Mélanger les membres de ville et les KO du segment.

## Handoff

Deux scènes intégrées sont livrées avec accessoires/provenance, fixtures de récupération/butin, réanimations multiples, barres PV/PM conditionnelles et verdict visuel utilisateur. V06/V07/V14/V18. La composition commune est transmise à CDI-115 ; les six épreuves restent hors de ce ticket.

Limite explicite : le contrat historique actuel ne fournit pas de mana aux ennemis. Le rendu accepte et teste déjà une barre PM ennemie lorsqu'une projection porte `currentMana` et `maximumMana`, mais aucun monstre actuel ne l'affiche. Si le gameplay ajoute cette ressource, la clôture du sujet exigera une nouvelle version de `CanonicalDungeonInitialEnemyActor`, sa production serveur et un test d'intégration sur un record autoritaire réel.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
