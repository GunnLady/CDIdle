# Handoff — CDI-144 Artificiers

Date : 18 septembre 2026
État : terminé, validé et classé dans `Done`
Ticket : `workboard/data/Done/CDI-144/ticket.md`

## Décisions visuelles validées

- Vingt identités neutres, dix hommes et dix femmes, ont été validées
  individuellement après contrôle des proportions contre Mage M06/M08 ou
  F06/F08.
- L’Artificier T1 est un fabricant et réparateur de terrain. La silhouette
  combine une coupe d’aventurier martial inspirée du fusilier du début du
  XIXe siècle avec des marqueurs techniques fonctionnels de fantasy et de
  steampunk, sans uniforme historique copié ni accessoires décoratifs sans
  fonction.
- Chaque tenue conserve des marqueurs forts répartis sur la silhouette : coupe
  structurée, spécialité technique lisible et signature individuelle.
- Les silhouettes féminines peuvent employer robe, jupe ou robe-manteau, avec
  pantalon dessous lorsque le concept le demande. Les ouvertures frontales ou
  latérales doivent rester lisibles et compatibles avec le mouvement.
- Le jumelage M/F est facultatif et limité à un langage de métier ou de matière ;
  il ne force jamais une tenue identique.
- Les deux planches complètes sur fonds clair et sombre ont été validées par
  l’utilisateur le 18 septembre 2026.
- Les cinq pages du vrai cinéma PC `artificer-cinema=1..5` ont ensuite été
  présentées selon le protocole Mage et validées par l’utilisateur le même jour.

La recherche, les règles visuelles, les variantes finales, les corrections et
les preuves individuelles sont consignées dans
`assets/design/hero-sprites/cdi-144/artificer-identities-and-inspirations.md`.
Le handoff technique chiffré est dans
`assets/design/hero-sprites/cdi-144/handoff.md`.

## Assets et reproductibilité

- Sources masculines :
  `assets/design/hero-sprites/cdi-144/validated-male-v1/`.
- Sources féminines :
  `assets/design/hero-sprites/cdi-144/validated-female-v1/`.
- Exports runtime :
  `assets/design/hero-sprites/cdi-144/normalized-alpha-v1/{male,female}/`.
- Planches de contrôle :
  `assets/design/hero-sprites/cdi-144/normalized-alpha-v1/previews/`.
- Script : `scripts/prepare-cdi-144-artificer-assets.ps1`.

Le script a été rejoué dans un dossier temporaire : les SHA-256 des vingt
exports produits correspondent exactement aux vingt exports archivés. F04
emploie Mage F08 comme référence ; les dix hommes et les neuf autres femmes
emploient respectivement Mage M06 et Mage F06.

## Contrat runtime

- `src/assets/artificerCdi144Portraits.ts` expose dix variantes par genre.
- Une clé historique `0–19` devient `clé modulo 10`, sans changement de genre.
- `src/assets/heroPortraitAssets.ts` résout désormais `Artificier` vers les PNG
  individuels CDI-144.
- `src/assets/heroSpriteSheets.ts` ne charge plus les deux anciennes planches
  Artificier au runtime ; elles restent présentes comme archives historiques.
- `src/assets/encounterVisuals.ts` expose la provenance CDI-144.
- Le visuel ne dépend jamais de l’arme équipée et ne porte aucune règle métier.

## Mesures et validations acquises

- `npm.cmd run check:dungeon-visuals` : réussi.
  - 20 sprites Artificier détectés ;
  - poids froid total : `5 086 035 octets` ;
  - quatre héros les plus lourds : `1 105 852 octets`, sous le budget de
    `2 097 152 octets` ;
  - mémoire décodée : `943 888 octets` par sprite et `3 775 552 octets` pour
    quatre sprites.
- Tests unitaires portraits/visuels : `34/34` réussis.
- Scénario Playwright CDI-144 : réussi (`1/1`) ; les vingt sprites chargent sur
  les cinq pages PC à `341 × 692`, sans débordement.
- Typecheck, lint et build : réussis.
- Budget bundle : réussi, `258 381 octets` gzip JS ; plus gros chunk
  `118 347 octets`.
- Validation visuelle utilisateur : planches puis cinq pages PC acquises.

## État de clôture

Les critères fonctionnels et visuels de CDI-144 sont couverts. Le ticket porte
les cases de validation, les preuves de clôture et les liens de handoff ; il a
été déplacé dans `Done`. `npm.cmd run board:validate` confirme 157 tickets et
zéro erreur.

Les fichiers non suivis
`docs/deployment/2026-09-10-back-front-plan.md` et
`docs/deployment/preflight-2026-09-10.sql` sont étrangers à CDI-144 et doivent
rester intacts. Aucun déploiement n’est autorisé.
