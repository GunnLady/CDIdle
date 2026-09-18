# Handoff — CDI-143 Druides

Date : 18 septembre 2026
État : terminé et validé
Ticket : `workboard/data/Done/CDI-143/ticket.md`

## Décisions visuelles validées

- Vingt identités neutres : dix hommes et dix femmes, toutes validées
  individuellement avec contrôle de proportions contre Mage M06/M08 ou F06/F08.
- Le Druide est un praticien de terrain du vivant : botanique, soin, cultures,
  sols, climats et observation animale structurent les tenues.
- Le niveau de détail retenu combine couches textiles, broderies végétales,
  matériel d'herboriste et accessoires fonctionnels, sans effet magique ni
  copie d'un symbole culturel ou religieux réel.
- F01 v1 est conservée mais rejetée parce que sa tenue était trop simple. F01
  v2, enrichie sans changement d'identité ni de gabarit, est la source retenue.
- F06 v1 est conservée mais rejetée parce que le pan intérieur de la cape
  fusionnait visuellement avec le corsage. F06 v2 est la source retenue.
- Les planches complètes sur fonds clair et sombre, puis les cinq pages PC
  `druid-cinema=1..5`, ont été validées par l'utilisateur le 18 septembre 2026.

La recherche, les identités et leurs inspirations sont consignées dans
`assets/design/hero-sprites/cdi-143/druid-identities-and-inspirations.md`. Le
contrôle détaillé des gabarits est dans
`assets/design/hero-sprites/cdi-143/proportion-audit.md`.

## Assets

- Sources masculines validées :
  `assets/design/hero-sprites/cdi-143/validated-male-v1/`.
- Sources féminines validées et versions rejetées conservées :
  `assets/design/hero-sprites/cdi-143/validated-female-v1/`.
- Exports runtime :
  `assets/design/hero-sprites/cdi-143/normalized-alpha-v1/{male,female}/`.
- Planches et captures de contrôle :
  `assets/design/hero-sprites/cdi-143/normalized-alpha-v1/previews/`.
- Script reproductible : `scripts/prepare-cdi-143-druid-assets.ps1`.
- Handoff technique détaillé :
  `assets/design/hero-sprites/cdi-143/handoff.md`.

Les vingt exports runtime sont des PNG RGBA de `341 × 692`. F01 et F06 sont
produites depuis leurs sources v2, mais gardent un nom runtime v1 afin de ne pas
casser les clés existantes.

## Contrat runtime

- `src/assets/druidCdi143Portraits.ts` expose dix variantes par genre.
- Une clé historique `0–19` devient `clé modulo 10` pour le même genre.
- `src/assets/heroPortraitAssets.ts` utilise les exports individuels pour la
  classe `Druide`; les anciennes planches restent archivées mais non chargées.
- `src/assets/encounterVisuals.ts` expose la provenance CDI-143.
- Le visuel ne dépend jamais de l'arme réellement équipée et ne porte aucune
  règle métier.

## Mesures et validations acquises

- `npm.cmd run check:dungeon-visuals` : réussi.
  - poids froid total : `6 006 274 octets` ;
  - quatre héros les plus lourds : `1 339 903 octets`, sous le budget de
    `2 097 152 octets` ;
  - mémoire décodée : `943 888 octets` par sprite et `3 775 552 octets` pour
    quatre sprites.
- Tests unitaires ciblés portraits/visuels : `32/32` réussis.
- Typecheck, lint, build et budget bundle : réussis.
- Scénario Playwright PC ciblé : réussi (`1/1`) ; les vingt sprites sont
  chargés sur les cinq pages, à `341 × 692`, sans débordement.
- `npm.cmd run board:validate` : réussi, `157` tickets et `0` erreur.

## Clôture

Tous les critères de CDI-143 sont couverts. Les poses de combat ou d'action
restent hors périmètre. Aucun déploiement n'est autorisé ni nécessaire.
