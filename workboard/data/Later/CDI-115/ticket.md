---
id: CDI-115
title: Mettre en scène les six épreuves du Donjon
status: Later
area: ui
priority: P1
size: L
risk: medium
source: Demande utilisateur du 10 septembre 2026 - redécoupage approuvé des scènes Donjon 2D
depends_on: ["CDI-102"]
blocks: ["CDI-116"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","shared/domain/authoritative-dungeon.ts","shared/contracts/authoritative.ts","src/domain/dungeonPresentation.ts","src/assets/heroSpriteSheets.ts","src/domain/heroPortrait.ts","src/components/HeroPortrait.tsx","shared/domain/undercity.ts","assets/design/hero-sprites/human-tier1-class-spritesheets-v1.prompt.md"]
---

# CDI-115 — Mettre en scène les six épreuves du Donjon

## Objectif

Livrer les six épreuves animées et leurs accessoires dans le Donjon avec une composition commune mais des mises en scène distinctes.

## Resultat utilisateur

Le joueur voit le héros choisi affronter chaque défi et comprend son succès ou son échec sans le confondre avec un wipe.

## Contexte

L couvre six variantes du même contrat de défi et leur matrice paramétrée commune ; trésor/repos et socle non-combat ont déjà été retirés vers CDI-102.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Réaliser et intégrer `trap`, `enigma`, `ambush`, `ritual`, `obstacle`,
`negotiation`, leurs six accessoires et les branches succès/échec applicables.
Réutiliser la composition non-combat 102 et les données 106 : héros sélectionné,
issue, pertes, mana, or et récompenses exacts. Chaque type reçoit une mise en
scène identifiable ; le partage de moteur n'autorise pas six animations
visuellement identiques. `ambush` reste une épreuve, sans combat ajouté.

**L est justifié par un même contrat de défi et une matrice paramétrée commune**,
après retrait de trésor/repos et du socle technique. Livrer les six variantes
ensemble évite six petits tickets répétant montage, fixtures et validation.
Inclure provenance/poids des accessoires, mouvements réduits, clavier, résumé,
et avis utilisateur sur les issues contrastées. Aucun échec n'invente un wipe.

## Hors perimetre

- Trésor et repos : CDI-102.
- Mini-jeu, dialogue interactif, jet local, récompense depuis une animation ou combat supplémentaire d'embuscade.
- Six moteurs indépendants ou six scènes visuellement identiques.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Couvrir trap, enigma, ambush, ritual, obstacle et negotiation, avec héros de challenge.hero_selected et conséquences reçues de CDI-106.
- Créer les six accessoires, provenance/version, cadrage/ancrage, poids et fallback selon CDI-099.
- Réutiliser la composition CDI-102, le lecteur et l'intégration existants ; pas de règle métier dans React.
- Échec de défi distinct d'un wipe ; aucune interaction supplémentaire nécessaire à l'idle.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-102 : Mettre en scène trésors, repos et réanimations.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Les six types et leurs branches succès/échec applicables sont animés dans CurrentEncounterPanel, avec des scènes identifiables.
- [ ] Héros sélectionné, mana, or, pertes et récompenses proviennent des données structurées exactes.
- [ ] Ambush reste une épreuve sans combat inventé ; négociation échouée et autres échecs ne montrent pas de wipe fictif.
- [ ] Les six accessoires sont couverts par le manifeste avec provenance/poids, fallback et chargement utile seulement.
- [ ] Clavier, résumé, mouvements réduits, cadence et compte de requêtes restent corrects pour tous les types.
- [ ] L'utilisateur valide les six variantes et leurs issues contrastées ; aucun type hors combat actuel ne reste au seul ancien transcript principal.

## Tests

- Matrice paramétrée des six types et branches applicables ; vérifier exhaustivité de l'union canonique en incluant treasure/rest déjà livrés.
- Réutiliser harnesses d'épreuves/segments, tests de présentation et composants intégrés.
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Présenter à l'utilisateur les six défis et leurs issues contrastées dans le Donjon, sans nouvelle action de collecte ou choix obligatoire.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Un moteur partagé ne doit pas uniformiser la direction visuelle des six épreuves.
- Confondre outcome defeat d'une épreuve avec un wipe du groupe.

## Handoff

Fournir matrice des six types/branches, accessoires/provenance, tests intégrés et verdict visuel. V07/V14/V18. Les huit non-combats sont désormais répartis entre CDI-102 et ce ticket.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
