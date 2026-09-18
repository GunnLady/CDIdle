# Handoff — CDI-145 Pugilistes

Date : 18 septembre 2026
État : terminé, validé et classé dans `Done`
Ticket : `workboard/data/Done/CDI-145/ticket.md`

## Décisions visuelles validées

- Vingt identités neutres, dix hommes et dix femmes, ont été validées
  individuellement après contrôle des proportions contre Mage M06/M08 ou
  F06/F08.
- La direction retenue est celle d’arts martiaux asiatiques lisibles, nourrie
  de références chinoises, coréennes, japonaises, sud-est et centre-asiatiques,
  ainsi que de wuxia, murim, manga et jeux vidéo, sans copier de symbole réel.
- Les tenues sont très majoritairement textiles : vestes croisées, attaches
  nouées, panneaux fendus, pantalons coordonnés, bandes de frappe, guêtres et
  chaussons fins. Cuir massif, bottes rigides et équipement d’aventurier
  générique sont exclus.
- Une carrure masculine martiale légèrement plus fine est acceptée lorsque la
  hauteur, la tête, les hanches, les jambes et les pieds restent cohérents.
- Les deux planches complètes sur fonds clair et sombre ont été validées par
  l’utilisateur le 18 septembre 2026.
- Les cinq pages du vrai cinéma PC `pugilist-cinema=1..5` ont ensuite été
  présentées selon le protocole Mage et validées par l’utilisateur.

La recherche, les règles visuelles, les variantes finales et les preuves
individuelles sont consignées dans
`assets/design/hero-sprites/cdi-145/pugilist-identities-and-inspirations.md`.
Le handoff technique chiffré est dans
`assets/design/hero-sprites/cdi-145/handoff.md`.

## Assets et reproductibilité

- Sources masculines :
  `assets/design/hero-sprites/cdi-145/validated-male-v1/`.
- Sources féminines :
  `assets/design/hero-sprites/cdi-145/validated-female-v1/`.
- Exports runtime :
  `assets/design/hero-sprites/cdi-145/normalized-alpha-v1/{male,female}/`.
- Planches de contrôle :
  `assets/design/hero-sprites/cdi-145/normalized-alpha-v1/previews/`.
- Script : `scripts/prepare-cdi-145-pugilist-assets.ps1`.

Le script a été rejoué dans `tmp/cdi-145-repro-check` : les SHA-256 des vingt
exports produits correspondent exactement aux vingt exports archivés. F08 à
F10 emploient Mage F08 ; les autres femmes emploient Mage F06 ; les dix hommes
emploient Mage M06.

## Contrat runtime

- `src/assets/pugilistCdi145Portraits.ts` expose dix variantes par genre.
- Une clé historique `0–19` devient `clé modulo 10`, sans changement de genre.
- `src/assets/heroPortraitAssets.ts` résout désormais `Pugiliste` vers les PNG
  individuels CDI-145.
- `src/assets/heroSpriteSheets.ts` ne charge plus les deux anciennes planches
  Pugiliste au runtime ; elles restent présentes comme archives historiques.
- `src/assets/encounterVisuals.ts` expose la provenance CDI-145.
- Le visuel ne dépend jamais de l’arme équipée et ne porte aucune règle métier.

## Mesures et validations acquises

- `npm.cmd run check:dungeon-visuals` : réussi.
  - 20 sprites Pugiliste détectés ;
  - poids froid total : `5 407 431 octets` ;
  - quatre héros les plus lourds : `1 180 161 octets`, sous le budget de
    `2 097 152 octets` ;
  - mémoire décodée : `943 888 octets` par sprite et `3 775 552 octets` pour
    quatre sprites.
- Tests unitaires portraits/visuels : `36/36` réussis.
- Scénario Playwright CDI-145 : réussi (`1/1`) ; les vingt sprites chargent sur
  les cinq pages PC à `341 × 692`, sans débordement.
- Typecheck, lint et build : réussis.
- Budget bundle : réussi, `258 773 octets` gzip JS ; plus gros chunk
  `118 347 octets`.
- Validation visuelle utilisateur : planches puis cinq pages PC acquises.

## Limites et clôture

CDI-145 couvre uniquement les poses neutres. La garde Pugiliste relève de
CDI-157 et les actions de leurs tickets dédiés. Aucun déploiement n’appartient à
ce lot.

Les fichiers non suivis
`docs/deployment/2026-09-10-back-front-plan.md` et
`docs/deployment/preflight-2026-09-10.sql` sont étrangers à CDI-145 et doivent
rester intacts.
