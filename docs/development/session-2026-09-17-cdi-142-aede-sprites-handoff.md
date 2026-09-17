# Handoff — CDI-142 Aèdes

Date : 17 septembre 2026
État : terminé et validé
Ticket : `workboard/data/Done/CDI-142/ticket.md`

## Décisions visuelles validées

- Vingt identités : dix hommes et dix femmes, toutes issues de leur Novice
  correspondant et validées individuellement.
- L’Aède est un interprète professionnel formé à l’Académie, avec du standing ;
  ce n’est ni un barde de taverne, ni un vagabond, ni un coureur des chemins.
- La série couvre chant, cour et diplomatie, théâtre, danse, cirque, procession,
  récit épique, consolation, joute verbale, mime et narration par images.
- Instruments facultatifs ; en pose neutre, les mains restent libres. Tout
  instrument ou accessoire porté conserve une échelle, un axe et des attaches
  physiquement crédibles.
- Tuniques et pantalons droits sont valides pour les deux sexes ; robes et jupes
  sont réservées aux femmes. Les chaussures de danse restent fines et souples.
- Les couleurs peuvent être plus vives et bariolées que celles des Mages, mais
  restent harmonisées et ne basculent pas dans le costume de bouffon.
- La nudité adulte n’est admise que si elle est fonctionnelle, neutre et non
  sexualisée. Aucun symbole, métier ou institution absent du canon n’est ajouté.

La bible détaillée et les verdicts individuels sont dans
`assets/design/hero-sprites/cdi-142/aede-identities-and-inspirations.md`.

## Assets

- Sources validées :
  - `assets/design/hero-sprites/cdi-142/validated-male-v1/`
  - `assets/design/hero-sprites/cdi-142/validated-female-v1/`
- Exports runtime :
  - `assets/design/hero-sprites/cdi-142/normalized-alpha-v1/male/`
  - `assets/design/hero-sprites/cdi-142/normalized-alpha-v1/female/`
- Planches de contrôle validées :
  - `assets/design/hero-sprites/cdi-142/normalized-alpha-v1/previews/`
- Script reproductible : `scripts/prepare-cdi-142-aede-assets.ps1`

Les exports runtime sont vingt PNG alpha de `341 × 692`. Les quatre planches de
contrôle, hommes/femmes sur fonds clair/sombre, ont été validées par
l’utilisateur le 17 septembre 2026.

## Contrat runtime

- `src/assets/aedeCdi142Portraits.ts` découvre les vingt PNG et expose dix
  variantes par genre.
- Une clé historique `0–19` devient `clé modulo 10` pour le même genre.
- `src/assets/heroPortraitAssets.ts` utilise ces exports pour la classe `Aède`
  via le résolveur mutualisé des classes déjà migrées.
- `src/assets/encounterVisuals.ts` expose la provenance
  `CDI-142 validated Aede alpha sprites` via des métadonnées mutualisées.
- Le visuel ne dépend jamais de l’arme réellement équipée et ne porte aucune
  règle métier.

## Mesures et validations acquises

- `npm.cmd run check:dungeon-visuals` : réussi.
  - poids froid total : `5 522 745 octets` ;
  - quatre héros les plus lourds : `1 234 784 octets` ;
  - mémoire décodée : `943 888 octets` par sprite et `3 775 552 octets` pour
    quatre sprites.
- `npm.cmd test -- --run tests/heroPortrait.test.ts tests/encounterVisuals.test.ts` :
  `30/30` tests réussis.
- `npm.cmd run typecheck` : réussi.
- `npm.cmd run lint -- --quiet` : réussi.
- `npm.cmd run build` : réussi.
- `npm.cmd run check:bundle` : réussi après accord utilisateur pour un plafond
  global borné à `254 Kio` ; `257 368 octets` gzip JS au total, plus gros chunk
  `118 347 octets` sous le plafond indépendant de `300 Kio`.
- Scénario Playwright PC ciblé : réussi (`1/1`) ; les vingt sprites sont chargés
  sur les cinq pages `aede-cinema=1..5`, aux dimensions `341 × 692`, sans
  débordement de la scène.
- Validation visuelle utilisateur des planches et des cinq pages PC : acquise
  le 17 septembre 2026.

Les premiers lancements de Vitest, Vite et Playwright ont été bloqués avant
exécution par `spawn EPERM` dans le sandbox Windows. Leurs relances ciblées hors
sandbox ont réussi ; ce n’était pas un échec du projet.

## Clôture

Tous les critères de CDI-142 sont couverts. Le ticket est déplacé vers `Done`.
Les poses de combat ou d’action relèvent de CDI-154 et ne sont pas couvertes par
ce lot de bases neutres. Aucun déploiement n’est autorisé ni nécessaire.
