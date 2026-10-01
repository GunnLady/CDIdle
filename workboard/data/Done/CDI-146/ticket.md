---
id: CDI-146
title: Refaire les humanoïdes des Galeries des contrebandiers
status: Done
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
- Produire avec alpha natif, comme les candidats validés dans ce lot, ou sur fond monochrome à détourer hors runtime ; intégrer un alpha réel propre.
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

- [x] Les onze fichiers humains sont remplacés sans modifier les deux gobelins ni le molosse validés.
- [x] Chaque personnage conserve son rôle, son identité, son arme de référence et une silhouette distincte ; la diversité ne se limite pas à une seule carnation ou un seul genre.
- [x] Les exports ont un alpha réel propre, une lumière venant de la gauche, des armes et membres entiers, aucun fragment isolé ni fausse transparence.
- [x] Tailles visibles, pivots, pieds, orientations, jauges et superpositions restent cohérents avec les héros et le quai.
- [x] Les cinq écrans sont validés séparément par l’utilisateur dans l’ordre prévu.
- [x] Les clés historiques chargent les nouvelles ressources sans repli, modification métier ou dépendance à l’équipement réel.
- [x] Poids, dimensions et mémoire décodée sont contrôlés ; le budget est respecté ou sa révision est décidée avant intégration finale.

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

### Escorte — 1er octobre 2026

Trois sprites approuvés individuellement puis exportés localement : garde,
arbalétrier, médecin. Sources et prompts :
`assets/design/dungeon-2d/cdi-146/escort.prompt.md`.
Proportions retenues : tête modérée, buste moins tassé, touche chibi légère.
Écran intégré validé par l’utilisateur après réduction des trois échelles de 0,05
(garde 1,39 ; arbalétrier 1,47 ; médecin 1,36).

### Dresseur — 1er octobre 2026

Maître-chaînes approuvé et exporté ; molosse inchangé. Source et prompt :
`assets/design/dungeon-2d/cdi-146/chainmaster.prompt.md`.
Écran intégré validé par l’utilisateur. La suite est consignée ci-dessous.

### Coupe-jarret — reprise du 1er octobre 2026

Sprite validé explicitement par l’utilisateur à la reprise :
`exec-661ac035-aab1-4e13-9e19-7365a6ab0798.png`. Copie exacte conservée dans
`assets/design/dungeon-2d/cdi-146/tribute-cutthroat-v3-approved.png` ; source et
prompt dans `assets/design/dungeon-2d/cdi-146/cutthroat.prompt.md`.
Export local 384 × 384 avec `-MatchReferenceHeight`, ancien sprite sauvegardé
dans `originals/tribute-cutthroat-v2.png`. Échelle 1,5 et pivot 0,93 conservés.
Le candidat généré par erreur après la reprise n’est pas retenu.
Contrôles de reprise réussis : `check:dungeon-visuals`, `board:validate`
(157 tickets, zéro erreur) et `git diff --check`. Export : 92 832 octets.
Écran intégré validé par l’utilisateur le 1er octobre 2026 (« validé »),
avec échelle 1,5 et pivot 0,93 conservés.

Correction utilisateur ultérieure : le bon sprite validé est
`exec-a077b7bc-3c8b-4eac-8101-8b5135fbe0e5.png` (bras corrigé), conservé dans
`tribute-cutthroat-v4-approved.png` et désormais exporté à la place de la v3.
Export : 92 400 octets ; mêmes hauteur, ligne de pieds, échelle et pivot.
Le verdict d’écran précédent concernait la v3. L’utilisateur valide ensuite
explicitement la v4 en scène le 1er octobre 2026 (« validés », avec le groupe du Capitaine).

### Capitaine — 1er octobre 2026

Lame jurée validée individuellement par l’utilisateur (« je valide la lame »).
Source : `exec-549fba8c-a860-492c-9e32-083da6797cf6.png`, copie exacte
`assets/design/dungeon-2d/cdi-146/smuggler-sworn-blade-v3-approved.png`.
Prompt : `assets/design/dungeon-2d/cdi-146/captain.prompt.md`.
Export local 384 × 384, 158 060 octets, `-MatchReferenceHeight` ; ancien sprite
sauvegardé, échelle 1,36 et pivot 0,93 conservés.

Capitaine validée individuellement (« Validé »), source
`exec-2bd3f321-94b7-4015-b5e2-175bd57e643e.png`, copie
`assets/design/dungeon-2d/cdi-146/smuggler-captain-v2-approved.png`.
Export local 384 × 384, 111 618 octets, `-MatchReferenceHeight` ; ancien sprite
sauvegardé, échelle 1,42 et pivot 0,94 conservés. Prompt dans le même document.
Alchimiste validé après atténuation légère du chibi (« validé »), source
`exec-6c200823-b8b1-4910-9a59-a0e119dd0ec3.png`, copie
`assets/design/dungeon-2d/cdi-146/smuggler-alchemist-v3-approved.png`.
Export 384 × 384, 114 424 octets, `-MatchReferenceHeight` ; ancien sauvegardé,
échelle 1,36 et pivot 0,93 conservés. Prompt dans le même document.
Lame jurée corrigée après demande d’atténuation du chibi, puis validée :
`exec-b7c832f6-6949-45f0-a3f2-954097b5b389.png`, copie
`assets/design/dungeon-2d/cdi-146/smuggler-sworn-blade-v4-approved.png`.
Cette v4 remplace la v3 dans l’export runtime ; même procédure, échelle 1,36
et pivot 0,93. Les trois sprites du groupe sont intégrés et validés individuellement.
Export Lame v4 : 155 174 octets. Contrôles du groupe réussis :
`check:dungeon-visuals` (pack Galeries : 1 936 394 octets), `board:validate`
(157 tickets, zéro erreur), `git diff --check`. Aperçu du Capitaine disponible
sur le harness local (HTTP 200) ; cela ne constitue pas une validation visuelle.
Écran complet du Capitaine validé par l’utilisateur le 1er octobre 2026
(« validés », avec le Coupe-jarret corrigé). Le verdict du Collecteur suit ci-dessous.

### Collecteur — 1er octobre 2026

Garde validé individuellement (« validé »), source
`exec-f5b269f5-4fda-49a5-8a65-e828e53c26f4.png`, copie
`assets/design/dungeon-2d/cdi-146/tribute-guard-v2-approved.png`.
Export 384 × 384, 113 137 octets, `-MatchReferenceHeight` ; ancien sauvegardé,
échelle 1,44 et pivot 0,93 conservés. Prompt dans
`assets/design/dungeon-2d/cdi-146/collector.prompt.md`.
Collecteur validé après correction des pièces enchaînées à la main : une seule
pièce libre dans la paume. Source `exec-43123640-ea15-487a-8215-6e54ec5cd75c.png`,
copie `assets/design/dungeon-2d/cdi-146/tribute-collector-v3-approved.png`.
Export 384 × 384, 182 642 octets, `-MatchReferenceHeight` ; ancien sauvegardé,
échelle 1,45 et pivot 0,95 conservés. Le premier candidat avec chaînes à la main
a été rejeté et n’a pas été intégré.
Apothicaire validée individuellement (« validé »), source
`exec-3e61fc34-af8b-4cfc-ba46-64da681b84fa.png`, copie
`assets/design/dungeon-2d/cdi-146/tribute-apothecary-v2-approved.png`.
Export 384 × 384, 106 582 octets, `-MatchReferenceHeight` ; ancien sauvegardé,
échelle 1,36 et pivot 0,93 conservés. Les onze sprites humains sont intégrés ;
écran complet du Collecteur validé ensuite par l’utilisateur (« validé »).

Contrôles des onze exports après intégration de l’apothicaire :
`check:dungeon-visuals` réussi (pack Galeries : 1 928 907 octets),
`board:validate` réussi (157 tickets, zéro erreur), `git diff --check` réussi.
Git confirme exactement onze PNG modifiés dans les Galeries ; les deux gobelins,
le molosse et le fond sont identiques à HEAD. Harness Collecteur accessible
(HTTP 200), sans préjuger de sa validation visuelle.

## Clôture technique — 1er octobre 2026

Les cinq écrans ont reçu leur verdict utilisateur distinct : Escorte, Dresseur,
Coupe-jarret (avec seconde validation de la bonne version au bras corrigé),
Capitaine et Collecteur. Les onze identités ont été approuvées individuellement.
Les corrections de chibi de la Lame et de l’alchimiste et le retrait des chaînes
à la main du Collecteur sont inclus, avec les sources finales dans les prompts.

### Contrôles exécutés par Codex

- `npm.cmd exec --offline -- vitest run tests/encounterVisuals.test.ts tests/dungeonCombatScene.test.ts tests/dungeonPresentation.test.ts` : bilan Vitest de 4 fichiers, 97 tests réussis.
- `npm.cmd run test:layout-browser -- tests/browser/dungeonCombatScene.responsive.browser.spec.ts`, avec `CDIDLE_REUSE_LAYOUT_SERVER=1` : 18 tests Chromium réussis, dont PC 1024/1280/1440 et équivalent zoom 200 %.
- `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet`, `npm.cmd run build` : réussis.
- `npm.cmd run check:bundle` : 261 395 octets JS gzip, plus gros chunk 118 106 octets ; plafonds inchangés.
- `npm.cmd run check:dungeon-visuals` : réussi ; pack Galeries complet 1 928 907 octets.
- `npm.cmd run board:validate` : 157 tickets, zéro erreur ; `git diff --check` réussi.
- Inspection .NET en lecture seule : les 14 PNG du pack sont en 384 × 384 avec alpha transparent et une seule composante visible au seuil alpha > 4. Pour les onze remplacements, pieds identiques aux originaux et centre horizontal à ±1 px au seuil alpha > 32. Aucune modification des pivots.
- Comparaison Git : les deux gobelins, le molosse et le fond sont identiques à HEAD ; exactement les onze PNG humains ciblés sont remplacés.

### Exports définitifs

Boîtes visibles au seuil alpha > 32 : `x, y, largeur, hauteur`.
Chaque PNG représente 589 824 octets RGBA décodés ; onze humains : 6 488 064 octets.

| Fichier runtime | Octets PNG | Boîte visible |
| --- | ---: | --- |
| `smuggler-guard-v1.png` | 123 547 | 50, 60, 284, 289 |
| `smuggler-crossbowman-v1.png` | 97 369 | 53, 69, 277, 274 |
| `tunnel-medic-v2.png` | 106 609 | 88, 66, 207, 295 |
| `gallery-chainmaster-v1.png` | 129 469 | 62, 57, 259, 306 |
| `tribute-cutthroat-v2.png` | 92 400 | 56, 66, 271, 270 |
| `smuggler-sworn-blade-v2.png` | 155 174 | 14, 13, 355, 360 |
| `smuggler-captain-v1.png` | 111 618 | 59, 53, 266, 308 |
| `smuggler-alchemist-v1.png` | 114 424 | 78, 45, 227, 306 |
| `tribute-guard-v1.png` | 113 137 | 55, 60, 274, 289 |
| `tribute-collector-v1.png` | 182 642 | 38, 50, 308, 315 |
| `tribute-apothecary-v1.png` | 106 582 | 81, 44, 222, 307 |

### Budget des cinq scènes intégrées

Mesure Chromium locale à 1280 × 1000, avec les quatre gardes du harness
(Guerrière F02, Mage M03, Archère F08, Acolyte M02), les ennemis et le décor
1536 × 643. Images chargées et décodées sans repli, réponses HTTP de type image
vérifiées. Somme des fichiers uniques, sans prétendre mesurer le cache réseau,
le GPU ou la fluidité ; ces mesures restent à CDI-116. Les nouvelles gardes
sont incluses, contrairement à une simple mesure du pack ennemi.

| Écran | Octets images complets | Octets RGBA théoriques |
| --- | ---: | ---: |
| Escorte | 1 418 028 | 15 773 824 |
| Dresseur | 1 390 801 | 15 184 000 |
| Coupe-jarret | 1 182 903 | 14 594 176 |
| Capitaine | 1 471 719 | 15 773 824 |
| Collecteur | 1 492 864 | 15 773 824 |

Les cinq compositions mesurées respectent 2 MiB ; aucune révision de budget.
Cette preuve ne couvre pas toutes les combinaisons possibles de héros.

### Audit final

Aucun écart fonctionnel restant identifié. Clés historiques, armes propres aux
sprites, placement et domaine conservés. Seules les trois échelles de l’Escorte
ont été réduites de 0,05 sur verdict utilisateur. Aucun refactor, helper supprimé
ou changement React. Écart documentaire P2 corrigé : statuts, cinq verdicts,
sources finales, alpha natif utilisé et mesures synchronisés avec les deux plans
et l’audit des sprites. Aucun déploiement.
