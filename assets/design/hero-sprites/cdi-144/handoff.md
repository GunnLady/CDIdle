# CDI-144 — Handoff des bases Artificier

Date : 18 septembre 2026

## Livrables retenus

- 10 sources masculines validées :
  `validated-male-v1/artificer-male-01-v1.png` à
  `artificer-male-10-v1.png`.
- 10 sources féminines validées :
  `validated-female-v1/artificer-female-01-v1.png` à
  `artificer-female-10-v1.png`.
- 20 exports runtime RGBA dans `normalized-alpha-v1/{male,female}` sur un
  canevas commun de `341 × 692 px`.
- 2 planches alpha et 4 prévisualisations sur fonds clair/sombre dans
  `normalized-alpha-v1` et `normalized-alpha-v1/previews`.
- Script reproductible : `scripts/prepare-cdi-144-artificer-assets.ps1`.
- Direction artistique, recherches, contrôles de proportions, provenances,
  poids et SHA-256 : `artificer-identities-and-inspirations.md`.

Les sources stables portent toutes le suffixe runtime `v1`. Les variantes
intermédiaires rejetées pendant la production ne sont jamais chargées.

## Réattribution stable

Pour chaque genre, l’index historique est résolu par `index modulo 10` :

| Index historique | Variante CDI-144 |
| --- | --- |
| 0 / 10 | 01 |
| 1 / 11 | 02 |
| 2 / 12 | 03 |
| 3 / 13 | 04 |
| 4 / 14 | 05 |
| 5 / 15 | 06 |
| 6 / 16 | 07 |
| 7 / 17 | 08 |
| 8 / 18 | 09 |
| 9 / 19 | 10 |

Le genre reste inchangé. L’illustration est une identité visuelle et ne dépend
jamais de l’arme ou de l’équipement réellement possédé.

## Normalisation et proportions

- Le script reproduit bit pour bit les 20 exports archivés.
- Les hommes utilisent Mage M06 comme référence de hauteur et de ligne de
  pieds ; leur boîte visible mesure `623 px` de haut, de `y = 51` à `y = 673`.
- Les femmes utilisent Mage F06 ; F04 utilise Mage F08, de même hauteur que son
  Novice homologue. Leur boîte visible mesure `595 px`, sauf F04 à `596 px`, et
  se termine toujours à `y = 673`.
- Les pivots visibles restent centrés entre `x = 169,5` et `x = 170`.
- Les contrôles détaillés tête, épaules, tronc, bras, hanches et jambes ont été
  réalisés avant chaque présentation et consignés dans le document de
  direction artistique.
- Les coins sont transparents, chaque export conserve une composante visible
  unique et les contrôles sur fonds clair/sombre ne montrent ni faux fond ni
  résidu chromatique.

## Poids et mémoire

- Sources validées : `25 344 778 octets` (`24 750,8 Ko`, `24,17 Mo`).
- Exports runtime : `5 086 035 octets` (`4 966,8 Ko`, `4,85 Mo`).
- Quatre héros les plus lourds : `1 105 852 octets` (`1 079,9 Ko`, `1,05 Mo`),
  sous le budget de `2 097 152 octets` (`2 Mo`).
- Mémoire décodée : `943 888 octets` (`921,8 Ko`, `0,90 Mo`) par sprite et
  `3 775 552 octets` (`3 687,1 Ko`, `3,60 Mo`) pour quatre héros.

## Intégration et preuves

- `src/assets/artificerCdi144Portraits.ts` charge les vingt PNG individuels et
  préserve la réattribution déterministe des anciens index.
- `src/assets/heroPortraitAssets.ts` utilise ce résolveur pour `Artificier` ;
  les anciennes planches restent archivées mais quittent le catalogue runtime.
- `src/assets/encounterVisuals.ts` expose la provenance CDI-144.
- Le harness PC fournit cinq pages `artificer-cinema=1..5`, deux variantes par
  genre et par page, selon le même protocole que CDI-140 Mage.
- Validation utilisateur des planches claire/sombre et des cinq pages du vrai
  cinéma PC : acquise le 18 septembre 2026.
- Tests portraits/visuels ciblés : `34/34` réussis.
- Contrôle d’assets, typecheck, lint, build et test Playwright ciblé : réussis.
- Bundle : `258 381 octets` de JavaScript gzip ; plus gros chunk
  `118 347 octets`, sous les plafonds configurés.

## Limites

Ce lot valide uniquement les bases neutres. Il ne valide aucune pose de combat,
pose d’action, animation de compétence ou relation avec l’équipement réel.
Aucun déploiement n’est autorisé ni nécessaire.
