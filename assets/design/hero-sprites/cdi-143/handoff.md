# CDI-143 — Handoff des bases Druide

Date : 18 septembre 2026

## Livrables retenus

- 10 sources masculines : `validated-male-v1/druid-male-01-v1.png` à
  `druid-male-10-v1.png`.
- 10 sources féminines retenues : F01 et F06 en `v2`, F02–F05 et F07–F10 en
  `v1`.
- 20 exports runtime RGBA : `normalized-alpha-v1/{male,female}` sur canevas
  `341 × 692 px`.
- 2 planches alpha et 4 prévisualisations sur fonds clair/sombre dans
  `normalized-alpha-v1` et `normalized-alpha-v1/previews`.
- 2 captures PC réelles du harness : page 1 (F01/M01/F02/M02) et page 3
  (F05/M05/F06/M06), dans `normalized-alpha-v1/previews`.
- Les sources féminines F01 v1 et F06 v1 sont conservées comme versions
  rejetées et ne sont jamais chargées par le runtime.

## Réattribution stable

Pour chaque genre, l'index historique est résolu par `index modulo 10` :

| Index historique | Variante CDI-143 |
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

Le genre reste inchangé. L'illustration est une identité visuelle et ne dépend
jamais de l'arme réellement équipée.

## Contrôles techniques

- 20/20 exports : PNG RGBA `341 × 692 px`, coins transparents, une seule
  composante visible, pieds alignés sur le Novice homologue et pivot horizontal
  centré.
- Hauteur visible : `623 px` pour les hommes et `595–596 px` pour les femmes,
  conforme aux gabarits Mage M06/M08 et F06/F08.
- Poids froid cumulé des 20 exports : `6 006 274 octets` (`5 865,5 Ko`,
  `5,73 Mo`).
- Pire scène de quatre héros : `1 339 903 octets` (`1 308,5 Ko`, `1,28 Mo`),
  sous le budget de `2 097 152 octets` (`2 Mo`).
- Mémoire décodée : `943 888 octets` par sprite (`921,8 Ko`, `0,90 Mo`) et
  `3 775 552 octets` pour quatre héros (`3 687,1 Ko`, `3,60 Mo`).

## Intégration et preuves

- `src/assets/druidCdi143Portraits.ts` charge les fichiers individuels et
  préserve la réattribution déterministe des 20 index historiques.
- Les planches Druide historiques restent dans le dépôt comme archives, mais ne
  figurent plus dans le catalogue runtime des planches.
- Tests unitaires ciblés : 32 réussis.
- Contrôle d'assets, typecheck, lint, build et budget bundle : réussis.
- Test Playwright responsive CDI-143 : 1 scénario réussi, cinq pages et vingt
  variantes chargées à leurs dimensions naturelles, sans débordement.
- Validation visuelle utilisateur des planches claire/sombre et des cinq pages
  PC `druid-cinema=1..5` : acquise le 18 septembre 2026.

## Clôture

Ce lot valide uniquement les bases neutres. Les poses de combat et d'action
restent hors périmètre. Tous les critères de CDI-143 sont couverts ; aucun
déploiement n'est autorisé ni nécessaire.
