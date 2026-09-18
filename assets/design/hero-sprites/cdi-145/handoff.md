# CDI-145 — Handoff des bases Pugiliste

Date : 18 septembre 2026

## Livrables retenus

- 10 sources masculines validées :
  `validated-male-v1/pugilist-male-01-v1.png` à
  `pugilist-male-10-v1.png`.
- 10 sources féminines validées :
  `validated-female-v1/pugilist-female-01-v1.png` à
  `pugilist-female-10-v1.png`.
- 20 exports runtime RGBA dans `normalized-alpha-v1/{male,female}` sur un
  canevas commun de `341 × 692 px`.
- 2 planches alpha et 4 prévisualisations sur fonds clair/sombre dans
  `normalized-alpha-v1` et `normalized-alpha-v1/previews`.
- Script reproductible : `scripts/prepare-cdi-145-pugilist-assets.ps1`.
- Recherche culturelle, direction artistique, contrôles de proportions,
  provenances, poids et SHA-256 : `pugilist-identities-and-inspirations.md`.

Les sources stables portent toutes le suffixe runtime `v1`. Les variantes
intermédiaires rejetées pendant la production ne sont jamais chargées.

## Réattribution stable

Pour chaque genre, l’index historique est résolu par `index modulo 10` :

| Index historique | Variante CDI-145 |
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

- Le script reproduit bit pour bit les 20 exports archivés : `20/20` SHA-256
  identiques lors du rejeu de contrôle.
- Les hommes utilisent Mage M06 comme référence de hauteur et de ligne de
  pieds ; leur boîte visible mesure `623 px`, de `y = 51` à `y = 673`.
- F01 à F07 utilisent Mage F06 et mesurent `595 px`, de `y = 79` à `y = 673`.
  F08 à F10 utilisent Mage F08 et mesurent `596 px`, de `y = 78` à `y = 673`.
- Les pivots visibles restent centrés entre `x = 169,5` et `x = 170`.
- Les contrôles tête, épaules, tronc, bras, hanches, jambes et pieds ont été
  réalisés avant chaque verdict utilisateur et consignés dans la direction
  artistique.
- Les coins sont transparents et le contrôle chromatique ne détecte aucun
  résidu fuchsia dans les pixels visibles.

## Poids et mémoire

- Sources validées : `28 827 103 octets` (`28 151,5 Ko`, `27,49 Mo`).
- Exports runtime : `5 407 431 octets` (`5 280,7 Ko`, `5,16 Mo`).
- Quatre héros les plus lourds : `1 180 161 octets` (`1 152,5 Ko`, `1,13 Mo`),
  sous le budget de `2 097 152 octets` (`2 Mo`).
- Mémoire décodée : `943 888 octets` par sprite et `3 775 552 octets` pour
  quatre héros.

## Intégration et preuves

- `src/assets/pugilistCdi145Portraits.ts` charge les vingt PNG individuels et
  préserve la réattribution déterministe des anciens index.
- `src/assets/heroPortraitAssets.ts` utilise ce résolveur pour `Pugiliste` ;
  les anciennes planches restent archivées mais quittent le catalogue runtime.
- `src/assets/encounterVisuals.ts` expose la provenance CDI-145.
- Le harness PC fournit cinq pages `pugilist-cinema=1..5`, deux variantes par
  genre et par page, selon le protocole Mage.
- Validation utilisateur des planches claire/sombre et des cinq pages du vrai
  cinéma PC : acquise le 18 septembre 2026.
- Tests portraits/visuels ciblés : `36/36` réussis.
- Contrôle d’assets, typecheck, lint, build et test Playwright ciblé : réussis.
- Bundle : `258 773 octets` de JavaScript gzip ; plus gros chunk
  `118 347 octets`, sous les plafonds configurés.

## Limites

Ce lot valide uniquement les bases neutres. Il ne valide aucune pose de combat,
pose d’action, animation de compétence ou relation avec l’équipement réel.
Aucun déploiement n’est autorisé ni nécessaire.
