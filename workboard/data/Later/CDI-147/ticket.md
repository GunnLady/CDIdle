---
id: CDI-147
title: Refaire la sentinelle et la patrouille du Bastion
status: Later
area: ui
priority: P1
size: M
risk: medium
source: Verdict utilisateur du 13 septembre 2026 - reprendre trois sprites précis du Bastion
depends_on: ["CDI-117"]
blocks: ["CDI-118","CDI-121","CDI-126","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-sprite-audit.md","src/assets/undercityBastionVisualManifest.ts","src/assets/encounterVisuals.ts","src/domain/dungeonCombatScene.ts","AGENTS.md"]
---

# CDI-147 — Refaire la sentinelle et la patrouille du Bastion

## Objectif

Refaire trois humanoïdes ciblés du Bastion des Exclus selon l’étalon CDIdle, sans modifier les sept autres sprites validés de la zone.

## Resultat utilisateur

Le Veilleur sans-bannière et les deux membres de la Patrouille des exilés rejoignent la qualité et les proportions des humanoïdes validés, tout en conservant leur rôle, leur identité et leur composition de combat.

## Contexte

Le tri CDI-117 demande uniquement la reprise de `banished-sentinel-v1.png`, `palisade-lookout-v1.png` et `exile-blackshot-v1.png`. Les deux écrans concernés sont regroupés dans ce ticket, avec un verdict visuel distinct pour chacun.

## Perimetre autorise

- Refaire `banished-sentinel-v1.png` pour l’écran Veilleur sans-bannière.
- Refaire `palisade-lookout-v1.png` et `exile-blackshot-v1.png` pour l’écran Patrouille des exilés.
- Préserver identité, diversité, tenue, arme de référence, orientation et rôle lisible de chacun.
- Produire sur fond monochrome éloigné des couleurs des personnages, détourer hors runtime et livrer un alpha réel propre.
- Ajuster seulement échelle, pivot et placement rendus nécessaires par les nouvelles boîtes visibles, sans recomposer les scènes validées.

## Hors perimetre

- Modification de `banished-bulwark-v1.png`, `barricade-blade-v1.png`, `barricade-colossus-v1.png`, `barricade-warden-v1.png`, `outcast-standard-bearer-v1.png`, `outcast-surgeon-v1.png` ou `rampart-eye-v1.png`.
- Refonte de `bastion-exiles-stage-v1.jpg`.
- Pose d’action complexe, cycle image par image, autre zone, gameplay, déploiement ou refactor collatéral.

## Contrat d'implementation

- Utiliser les cinq références humanoïdes de CDI-117, dont `barricade-blade-v1.png` et `outcast-standard-bearer-v1.png` issues du Bastion.
- Conserver une lumière venant de la gauche, des silhouettes lisibles et un niveau de détail cohérent sans rendu réaliste ou trop HD.
- Contrôler alpha réel, franges, faux fond, transparence du corps, membres/armes coupés, fragments isolés et sens de l’éclairage.
- Comparer la boîte alpha visible et non la toile carrée ; garder pieds, profondeur, jauges et proportions cohérentes face aux héros.
- Conserver les clés visuelles actuelles et valider séparément Veilleur sans-bannière puis Patrouille des exilés.

## Dependances

- CDI-117 : étalon et tri de la zone.

## Criteres d'acceptation

- [ ] Les trois fichiers ciblés sont remplacés et les sept autres sprites du Bastion restent inchangés.
- [ ] Les personnages conservent leur identité, rôle, équipement de référence, diversité et silhouette propre.
- [ ] Alpha, éclairage gauche, membres, armes, contours et matières sont propres et cohérents avec l’étalon.
- [ ] Taille visible, pivots, pieds, orientations, jauges et superpositions fonctionnent dans les deux compositions existantes.
- [ ] L’utilisateur valide séparément l’écran Veilleur sans-bannière et l’écran Patrouille des exilés.
- [ ] Les clés historiques chargent les nouveaux fichiers sans repli ni modification métier.
- [ ] Dimensions, poids et mémoire décodée sont contrôlés dans le budget artistique.

## Tests

- Contrôler manifeste, dimensions, alpha, boîte visible, fragments et budget sur les trois exports modifiés et les sept ressources préservées.
- Après validation des deux écrans : tests ciblés des visuels/projections, `npm.cmd run check:dungeon-visuals`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet`, `npm.cmd run build`, `npm.cmd run check:bundle` et `npm.cmd run board:validate`.
- Exécuter la suite navigateur PC ciblée seulement après les validations visuelles.

## Validation manuelle

L’utilisateur valide Veilleur sans-bannière puis Patrouille des exilés dans leur décor PC. Une validation ne vaut pas automatiquement pour l’autre écran.

## Preservation

- Conserver les sept autres sprites, le fond, les compositions et les positions déjà validés hors correction de pivot strictement nécessaire.
- Conserver identité CDIdle, diversité et armes propres aux sprites.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Autonomie technique/Git selon AGENTS.md ; validation visuelle par l’utilisateur. Zéro déploiement sans contre-ordre explicite.

## Risques

- Une nouvelle boîte alpha peut casser proportions, placement ou jauges.
- Une reprise trop large peut altérer des sprites explicitement validés.

## Handoff

Fournir références et prompts versionnés, trois remplacements, preuves alpha/poids, tests et deux verdicts visuels. Les sept ressources conservées doivent être contrôlées comme inchangées.
