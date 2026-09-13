---
id: CDI-146
title: Refaire les humanoïdes des Galeries des contrebandiers
status: Later
area: ui
priority: P1
size: L
risk: medium
source: Verdict utilisateur du 13 septembre 2026 - reprendre tous les humains des Galeries dans un seul ticket
depends_on: ["CDI-117"]
blocks: ["CDI-118","CDI-121","CDI-123","CDI-124","CDI-125","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-sprite-audit.md","src/assets/undercitySmugglersVisualManifest.ts","src/assets/encounterVisuals.ts","src/domain/dungeonCombatScene.ts","AGENTS.md"]
---

# CDI-146 — Refaire les humanoïdes des Galeries des contrebandiers

## Objectif

Refaire dans la DA humanoïde CDIdle les onze personnages humains des cinq écrans concernés des Galeries, tout en conservant les trois créatures déjà validées.

## Resultat utilisateur

Les humains des Galeries ont une qualité, des proportions, une lumière et une diversité cohérentes avec les références validées ; chaque écran reste lisible et conserve sa composition.

## Contexte

Le tri CDI-117 valide les deux gobelins et le molosse mais demande de reprendre tous les humains. À la demande de l’utilisateur, les cinq écrans sont regroupés dans ce ticket unique ; chacun conserve néanmoins son propre jalon de validation visuelle. Ce ticket porte les bases, pas des cycles d’animation ni des variantes liées à l’équipement.

## Perimetre autorise

- Refaire les trois humains de l’Escorte des passeurs : `smuggler-guard-v1.png`, `smuggler-crossbowman-v1.png`, `tunnel-medic-v2.png`.
- Refaire le Maître-chaînes de Dresseur et molosse : `gallery-chainmaster-v1.png`.
- Refaire `tribute-cutthroat-v2.png`.
- Refaire les trois humains du Capitaine : `smuggler-sworn-blade-v2.png`, `smuggler-captain-v1.png`, `smuggler-alchemist-v1.png`.
- Refaire les trois humains du Collecteur : `tribute-guard-v1.png`, `tribute-collector-v1.png`, `tribute-apothecary-v1.png`.
- Préserver rôle, silhouette, tenue, arme de référence, diversité, orientation et identité reconnaissable de chaque personnage, avec de légères variations de pose ou de matériel quand elles renforcent la distinction.
- Produire sur fond monochrome éloigné des couleurs du personnage, détourer hors runtime et intégrer un alpha réel propre.
- Ajuster seulement les échelles, pivots et placements rendus nécessaires par les nouvelles boîtes visibles, sans recomposer arbitrairement les scènes validées.

## Hors perimetre

- Modification de `goblin-copper-scavenger-v1.png`, `goblin-lookout-v1.png` ou `chainbreaker-hound-v1.png`, validés par l’utilisateur.
- Refonte du fond `smugglers-gallery-stage-v1.jpg`.
- Pose d’action complexe, animation image par image ou arme calée sur l’équipement réel.
- Refonte d’une autre zone, nouveau gameplay, déploiement ou refactor collatéral.

## Contrat d'implementation

- Utiliser l’étalon de CDI-117 : `chamberlain-blade-v3.png`, `deep-chamberlain-v3.png`, `deep-alchemist-v2.png`, `barricade-blade-v1.png` et `outcast-standard-bearer-v1.png`.
- Éclairage principal venant de la gauche, matières cohérentes avec les Galeries, volumes et visages au niveau de détail des références sans rendu réaliste ou trop HD.
- Contrôler sur chaque export alpha réel, franges colorées, faux fond, transparence du corps, membres/armes coupés, fragments isolés et sens de l’éclairage.
- Comparer la boîte alpha visible et non la toile carrée ; conserver pieds, profondeur, jauges et proportions crédibles face aux héros.
- Garder les clés visuelles et contrats de manifeste existants sauf nécessité démontrée ; aucune règle métier dans React.
- Valider les écrans dans l’ordre : Escorte, Dresseur, Coupe-jarret, Capitaine, Collecteur. Une validation ne vaut pas pour les suivantes.

## Dependances

- CDI-117 : étalon et verdict détaillé de la zone.

## Criteres d'acceptation

- [ ] Les onze fichiers humains sont remplacés sans modifier les deux gobelins ni le molosse validés.
- [ ] Chaque personnage conserve son rôle, son identité, son arme de référence et une silhouette distincte ; la diversité ne se limite pas à une seule carnation ou un seul genre.
- [ ] Les exports ont un alpha réel propre, une lumière venant de la gauche, des armes et membres entiers, aucun fragment isolé ni fausse transparence.
- [ ] Tailles visibles, pivots, pieds, orientations, jauges et superpositions restent cohérents avec les héros et le quai.
- [ ] Les cinq écrans sont validés séparément par l’utilisateur dans l’ordre prévu.
- [ ] Les clés historiques chargent les nouvelles ressources sans repli, modification métier ou dépendance à l’équipement réel.
- [ ] Poids, dimensions et mémoire décodée sont contrôlés ; le budget est respecté ou sa révision est décidée avant intégration finale.

## Tests

- Contrôler manifeste, dimensions, alpha, boîte visible, fragments et budget sur les onze exports modifiés et les trois ressources préservées.
- Après validation des cinq écrans : tests ciblés des visuels/projections, `npm.cmd run check:dungeon-visuals`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet`, `npm.cmd run build`, `npm.cmd run check:bundle` et `npm.cmd run board:validate`.
- Exécuter la suite navigateur PC ciblée seulement après la validation visuelle complète du ticket.

## Validation manuelle

L’utilisateur valide successivement Escorte, Dresseur, Coupe-jarret, Capitaine et Collecteur dans leur décor PC. Présenter chaque écran à taille réelle ; ne pas déduire la validation des cinq écrans d’un seul verdict.

## Preservation

- Conserver les deux gobelins, le molosse, le fond, les compositions et les positions déjà validés hors correction de pivot strictement nécessaire.
- Conserver identité CDIdle, diversité, arme propre au sprite et indépendance vis-à-vis de l’équipement réel.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Autonomie technique/Git selon AGENTS.md ; validation visuelle par l’utilisateur. Zéro déploiement sans contre-ordre explicite.

## Risques

- Le ticket unique peut masquer un écran inachevé ; les cinq jalons visuels restent donc obligatoires.
- Une nouvelle boîte alpha peut casser les proportions ou positions déjà validées.
- Une génération groupée peut uniformiser les visages, les poses ou les carnations.

## Handoff

Fournir références et prompts versionnés, liste des onze remplacements, preuves alpha/poids, diff du manifeste si nécessaire, tests et cinq verdicts visuels. Les trois créatures conservées doivent être explicitement contrôlées comme inchangées.
