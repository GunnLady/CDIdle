---
id: CDI-138
title: Refaire les bases Voleur selon l’étalon CDIdle
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 13 septembre 2026 - toutes les classes héros à refaire selon l’étalon CDIdle
depends_on: ["CDI-117","CDI-136"]
blocks: ["CDI-118","CDI-125","CDI-134","CDI-135","CDI-150"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-sprite-audit.md","assets/design/hero-sprites/human-tier1-class-spritesheets-v1.prompt.md","src/assets/heroSpriteSheets.ts","src/domain/heroPortrait.ts","src/assets/heroPortraitAssets.ts","AGENTS.md"]
---

# CDI-138 — Refaire les bases Voleur selon l’étalon CDIdle

> **Portée livrée : poses neutres uniquement.** Les gardes de combat Voleur relèvent de CDI-150 et les poses d’action de leurs tickets dédiés.

## Objectif

Remplacer les deux planches Voleur par des bases **en pose neutre uniquement**, de meilleure qualité et mieux proportionnées, cohérentes avec l’étalon humanoïde CDIdle confirmé.

## Resultat utilisateur

Les vingt identités Voleur, dix hommes et dix femmes, proposent des tenues, carnations, coupes, couleurs de cheveux et particularités variées, avec la qualité et la présence des références validées.

## Contexte

CDI-117 classe les dix classes historiques à refaire. Les bases Novice validées issues de CDI-136 s’ajoutent aux cinq références humanoïdes confirmées. Ce ticket reste borné à une classe : deux planches de dix variantes, réattribution stable des anciens index, détourage, intégration et validation. Il couvre uniquement les poses neutres ; les poses de combat et d’action ont leurs propres tickets.

Les anciennes planches historiques Voleur ont été retirées du workspace après remplacement par les ressources CDI-138 validées.

## Perimetre autorise

- Refaire les bases neutres masculine et féminine Voleur, dix variantes chacune.
- Préserver pour chaque case l’idée de tenue, la carnation, la coupe, la couleur de cheveux et les signes distinctifs ; adapter dessin, volumes, proportions, contours, matières et éclairage aux références.
- Conserver une diversité forte sur les vingt nouvelles identités. Les armes ou accessoires peuvent varier entre sprites d’une même classe, mais ne suivent jamais l’équipement réel.
- Produire sur fond monochrome éloigné des couleurs du personnage, détourer hors runtime et livrer un alpha propre avec cadrage, boîte visible, pieds et pivot homogènes.
- Intégrer les nouvelles bases dans les surfaces existantes et mesurer poids, taille visible et coût de chargement.

## Hors perimetre

- Rupture de compatibilité des anciennes clés ou réattribution instable d’une sauvegarde.
- Déclinaison selon l’arme réellement équipée.
- Cycle de marche, animation complexe ou poses de compétences ; celles-ci viennent après validation des bases et seulement si un mouvement simple ne suffit pas.
- Refonte d’une autre classe ou d’un monstre.
- Nouveau gameplay, déploiement ou refactor du système de portraits sans nécessité démontrée.

## Contrat d'implementation

- Utiliser comme références `chamberlain-blade-v3.png`, `deep-chamberlain-v3.png`, `deep-alchemist-v2.png`, `barricade-blade-v1.png` et `outcast-standard-bearer-v1.png`, puis les bases Novice validées de CDI-136.
- Commencer par une petite planche pilote d’identités contrastées ; obtenir le verdict utilisateur avant la production des vingt variantes.
- Maintenir une table de réattribution stable des index historiques 0–19 vers les nouvelles variantes 0–9 du même genre ; aucune correspondance visuelle individuelle avec les quarante anciennes identités n’est requise.
- Vérifier alpha réel sur fonds clair/sombre, faux fond, franges, transparence du personnage, armes/accessoires coupés et éléments isolés.
- Normaliser taille alpha visible, pieds et pivot afin d’éviter les sauts de taille et le flottement en scène.
- Réutiliser le chargement actuel si son coût reste raisonnable ; justifier et tester toute modification de pipeline.
- Garder les règles métier dans le domaine partagé ; aucune classe, arme équipée ou statistique ne se déduit de l’image.

## Dependances

- CDI-117 : étalon, verdict et inventaire.
- CDI-136 : bases Novice validées ajoutées aux références.

## Criteres d'acceptation

- [x] Une planche pilote d’identités contrastées est validée par l’utilisateur avant la série.
- [x] Dix hommes et dix femmes Voleur sont validés, avec une réattribution stable des index historiques 0–19 vers 0–9 pour le même genre.
- [x] Qualité, proportions, détail, contours, matières et lumière correspondent aux références sans uniformiser corps ou visages.
- [x] Les exports ont un alpha réel propre, une taille visible et des pivots cohérents ; aucun faux fond, frange, détail isolé ou personnage translucide.
- [x] Les vingt variantes se chargent par les clés compatibles dans les écrans concernés, sans refléter l’équipement réel.
- [x] Poids froid/cache et mémoire décodée sont mesurés ; le budget est respecté ou sa révision demandée avant généralisation.
- [x] L’utilisateur valide les bases en planche puis dans une scène PC représentative ; les poses d’action restent distinctes.

## Tests

- Étendre les contrôles de manifeste/extraction sur les deux ressources, vingt variantes et la compatibilité des anciens index.
- Vérifier dimensions, alpha, boîte visible, pivots et correspondance stable des clés.
- Tests ciblés des portraits/visuels, puis `npm.cmd run check:dungeon-visuals`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet`, `npm.cmd run build`, `npm.cmd run check:bundle` et `npm.cmd run board:validate`.
- Après validation de l’écran, exécuter la suite navigateur PC ciblée ; ne pas déclarer les poses ou autres classes couvertes.

## Validation manuelle

L’utilisateur valide d’abord le pilote, puis les deux planches complètes et leur rendu dans une scène PC. Présenter les variantes à taille visible comparable aux références, sur fonds clair/sombre et dans le décor.

## Livraison et preuves

- Vingt sources validées une par une : `assets/design/hero-sprites/cdi-138/validated-male-v1/` et `validated-female-v1/`. Les premières identités masculine et féminine ont servi de pilote avant la poursuite de la série.
- Vingt exports alpha individuels `341 × 692` : `assets/design/hero-sprites/cdi-138/normalized-alpha-v1/`. Les planches alpha et leurs aperçus clair/sombre ont été contrôlés ; pieds, hauteur visible et pivot sont normalisés sur les Novices CDI-136.
- Les cinq pages `?rogue-cinema=1` à `5`, couvrant les vingt identités dans le vrai composant de cinéma, ont été validées par l’utilisateur le 16 septembre 2026.
- `src/assets/rogueCdi138Portraits.ts` conserve la compatibilité : les index historiques 0–19 sont repliés de façon déterministe vers 0–9 du même genre. L’arme dessinée reste indépendante de l’équipement réel.
- Le chargement de production utilise les vingt PNG individuels ; les deux anciennes planches Voleur ne sont plus importées ni émises par le build.
- Mesures : 5 228 437 octets encodés pour les vingt fichiers, 1 162 281 octets pour les quatre plus lourds, 943 888 octets RGBA décodés par sprite et 3 775 552 octets pour quatre sprites. Le cache chaud transfère 0 octet et les ressources sont `immutable`.
- Validations réussies : tests Vitest ciblés (23), test navigateur des cinq pages cinéma (1), `check:dungeon-visuals`, `typecheck`, `lint -- --quiet`, `build`, `check:bundle` et `board:validate`.
- La livraison reste strictement neutre. La garde de combat Voleur demeure dans CDI-150.

## Preservation

- Conserver vingt identités diverses et la compatibilité déterministe des anciennes clés, sans promettre de préserver individuellement les quarante anciens visuels.
- Arme propre au sprite, variable dans une classe, sans relation avec l’équipement réel.
- Conserver compositions et placements validés hors ajustement nécessaire au nouveau pivot.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Autonomie technique/Git du chantier selon AGENTS.md ; validation visuelle par l’utilisateur. Zéro déploiement sans contre-ordre explicite.

## Risques

- Une production en série dérive les visages, tenues ou carnations malgré une qualité supérieure.
- Les nouvelles proportions changent l’échelle en scène ou décalent pieds, nom et jauges.
- Une planche lourde ou un détourage runtime augmente fortement chargement et mémoire.

## Handoff

Fournir références/prompts versionnés, table de réattribution 0–19 → 0–9, vingt sources/exports, poids et mesures, comparaisons, tests et verdicts utilisateur. Aucune pose de combat ou d’action n’est déclarée validée par ce lot.
