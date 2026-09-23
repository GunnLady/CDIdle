# Handoff et registre — CDI-150 Voleurs `combat_idle`

Dernière mise à jour de session : 23 septembre 2026.

Les vingt sources et exports Voleur sont livrés dans le cinéma. L'utilisateur a
validé les cinq écrans du harness après réglage individuel de la taille :

| Écran | Réglage validé par rapport à l'export initial |
| --- | --- |
| 1 | Céleste +5 % |
| 2 | Céleste −10 % ; Milo et Abel +3 % |
| 3 | Céleste +4 % |
| 4 | Ariane +3 % |
| 5 | Céleste, Milo et Abel +5 % |

La table appliquée au rendu est dans `src/assets/rogueCdi150CombatPoses.ts`.
Le contrôle Chromium charge les vingt sprites sur les cinq pages ; le contrôle
d'assets, 35 tests ciblés, TypeScript, lint, build, budget JS (260 157 octets
gzip) et cache chaud (0 octet transféré) passent. Cette validation visuelle
porte sur le rendu de ces écrans ; les poses d'action restent hors CDI-150.

## Références autoritaires

- Workflow commun :
  `docs/development/dungeon-2d-combat-idle-sprite-workflow.md`.
- Ticket : `workboard/data/Done/CDI-150/ticket.md`.
- Bases neutres :
  `assets/design/hero-sprites/cdi-138/validated-male-v1/` et
  `assets/design/hero-sprites/cdi-138/validated-female-v1/`.
- Sources de garde validées :
  `assets/design/hero-sprites/cdi-150/validated-male-v1/` et
  `assets/design/hero-sprites/cdi-150/validated-female-v1/`.
- Exports alpha normalisés :
  `assets/design/hero-sprites/cdi-150/normalized-alpha-v1/`.

## Décisions Voleur acquises

- Le Voleur est agile, concentré ou sérieux, en garde de combat crédible.
- Armes autorisées : dague, sabre, hache et épée à une main.
- Configurations autorisées : arme seule avec main libre ou deux armes.
- L'identité, le visage, la tenue, la palette et les accessoires de la base
  neutre restent autoritaires.
- Le contrôle des proportions utilise la base neutre exacte et Mage M06/M08
  pour les hommes ou F06/F08 pour les femmes. La boîte corporelle exclut les
  extensions d'arme.
- Le contrôle de l'arme vérifie séparément la prise, le poignet, l'axe, la
  jonction, le tranchant ou la pointe et le mouvement de frappe plausible.
- Une appréciation comme « très bien » ne vaut pas validation explicite. Une
  source n'est archivée et normalisée qu'après un verdict explicite.
- Les vingt sources sont validées visuellement. Les variations de pose M09 et
  M10 sont tracées ci-dessous.

## Références de recherche conservées

Quatre fichiers de travail sont présents dans `references/` :

- `pose-solasta2-rogue.jpg` ;
- `pose-ac-mirage-sword-dagger.jpg` ;
- `reverse-grip-dagger-toor.jpg` ;
- `weapon-met-dagger.jpg`.

Leur URL, auteur, licence et décision détaillée n'ont pas été consignés au
moment de leur collecte. Cette provenance est donc **non documentée** ; elle ne
doit pas être reconstituée ou inventée. Toute nouvelle recherche doit respecter
le seuil et la traçabilité du workflow commun.

## Registre de production

| ID | Source neutre | Arme et garde | Candidat exact | Contrôles et verdict | Livraison |
| --- | --- | --- | --- | --- | --- |
| M01 | `rogue-male-01-v1.png` | Sabre à une main, main libre | `exec-92f9e932-ec2a-4185-a7de-039a0d5cac5c.png` | Proportions et arme contrôlées ; validé utilisateur | Source archivée et export alpha normalisé |
| M02 | `rogue-male-02-v1.png` | Deux haches compactes | `exec-9c8131ea-828c-4380-8866-1d83f0f7bf83.png` | Validé utilisateur malgré une réserve technique signalée sur l'orientation du tranchant de la hache haute | Source archivée et export alpha normalisé ; exception conservée |
| M03 | `rogue-male-03-v1.png` | Épée droite à une main, main libre | `exec-6503a1de-c2fe-473f-bba7-977be0c4b22c.png` | Proportions et arme contrôlées ; validé utilisateur | Source archivée et export alpha normalisé |
| M04 | `rogue-male-04-v1.png` | Dague simple, main libre | `exec-7752c5bc-2b08-4712-9698-df9322794002.png` | Pilote masculin ; proportions et arme contrôlées ; validé utilisateur | Source archivée et export alpha normalisé |
| M05 | `rogue-male-05-v1.png` | Deux dagues | `exec-abbadd0a-0b65-46dd-a801-09d2d0a87768.png` | Proportions et armes contrôlées ; validé utilisateur | Source archivée et export alpha normalisé |
| M06 | `rogue-male-06-v1.png` | Hache courte à une main en garde basse, autre main fermée | `exec-7c0a7b1b-c2eb-4b8d-ab22-29111eb21315.png` / `rogue-male-06-combat-idle-v2.png` | V1 rejetée. V2 inspectée ; comparatifs de proportions et d'arme présents ; validé explicitement par l'utilisateur | Source archivée et export alpha normalisé |
| M07 | `rogue-male-07-v1.png` | Rapière et dague de parade | V1 `exec-e4d59473-2a83-4630-b9b9-3d932a1ac662.png` rejetée ; V2 `exec-8ae0ce8a-5104-446e-89cd-7a597ea72171.png` ; V3 validée `exec-e534b80b-97ed-4909-9298-11ce587fb9ea.png` / `rogue-male-07-combat-idle-v3.png` | V3 et comparatif de proportions V4 validés explicitement par l'utilisateur ; candidat calé sur le neutre, M06/M08 conservés à leur cadrage commun, cadres faciaux recentrés et centres matérialisés | Source V3 archivée et export alpha normalisé corrigé |
| M08 | `rogue-male-08-v1.png` | Deux sabres non japonais de longueur proche, garde haute et basse | V9 `exec-cf7c9cf3-940e-4e9b-82be-9849ab621a11.png` rejetée (katanas et longueurs) ; V10 `exec-df04d839-13be-480d-920e-63f95fbda308.png` rejetée (sabre haut trop court) ; V11 validée `exec-8636a06a-ed5f-465d-a041-e7c3e52b0cec.png` / `rogue-male-08-combat-idle-v11.png` | V11 validée explicitement par l'utilisateur ; planches faciale, anatomique, de proportions et des deux armes examinées ; source au bord droit opaque, export normalisé sans pixel opaque sur les bords | Source V11 archivée et export alpha normalisé ; détail et réserves ci-dessous |
| M09 | `rogue-male-09-v1.png` | Deux épées droites courtes croisées devant le torse ; deux fourreaux vides | V1/V2 rejetées ; V3–V8 essais ; V9 `exec-cff16d5f-69d7-422a-854c-281a7dd89285.png` pose validée ; V10 retouche ; V11 `exec-dfd13249-81ef-438a-b5ba-41db00cdefd1.png` / `rogue-male-09-combat-idle-v11.png` image validée visuellement | SHA-256 `ddf0d576c9e8a2c1ce518f77ad82f264f4c20b7e8da46d7a917963d5f22b8707` ; alpha et proportions revus ; variation de pose acceptée | Source archivée et export alpha normalisé |
| M10 | `rogue-male-10-v1.png` | Dague seule en prise inversée, main libre en avant ; deux fourreaux vides | V12 `exec-ad89fb89-952c-4c97-9cc7-7b7a328c9549.png` / `rogue-male-10-combat-idle-v12.png` ; source manhwa réellement transmise | V2 pose validée ; V12 image validée explicitement par l'utilisateur ; visage, alpha et cadrage contrôlés | Source V12 archivée et export alpha normalisé ; détail ci-dessous |
| F01 | `rogue-female-01-v1.png` | Garde à une dague | `validated-female-v1/rogue-female-01-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F02 | `rogue-female-02-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-02-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F03 | `rogue-female-03-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-03-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F04 | `rogue-female-04-v1.png` | Sabre et dague ; prise inversée corrigée | `exec-9ac0fa82-3705-4647-a3e0-be76be71811a.png` | Pilote féminin ; proportions et armes contrôlées ; validé utilisateur | Source archivée et export alpha normalisé |
| F05 | `rogue-female-05-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-05-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F06 | `rogue-female-06-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-06-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F07 | `rogue-female-07-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-07-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F08 | `rogue-female-08-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-08-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F09 | `rogue-female-09-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-09-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |
| F10 | `rogue-female-10-v1.png` | Garde Voleur | `validated-female-v1/rogue-female-10-combat-idle-v1.png` | Validé utilisateur | Export alpha normalisé |

## Empreintes des sources validées

| ID | Octets | Ko | Mo | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| M01 | 1 816 255 | 1 816,255 | 1,816255 | `b13a53e0d088b5d0e205007535932f64cd6ee35ca6a519e90f6b77d0bbbfe8de` |
| M02 | 1 983 086 | 1 983,086 | 1,983086 | `3888d560db1a29dde6137c483bb5062b797b651d5dd24dccdd66bace87a092fa` |
| M03 | 1 195 491 | 1 195,491 | 1,195491 | `13f880b716a5f14e6e373dfb2bd93ef45a969eb4ad96f27fca6d815ab26be81f` |
| M04 | 1 810 030 | 1 810,030 | 1,810030 | `96dd720c9f222280d7df3aea3dff8dd6a7f93adfd887a452ad48791d4946dd96` |
| M05 | 1 928 704 | 1 928,704 | 1,928704 | `a5f15d42e62fd85f3809becfb7ac372ad2507dd77f36fac1ecbca855d3465cbb` |
| M06 | 1 944 710 | 1 944,710 | 1,944710 | `6aa24e55280a7d69c1a825d68b67c6b65eccc5edbfb185406c4fe8df6702e998` |
| M07 | 2 132 257 | 2 132,257 | 2,132257 | `0d597bfdec9e47d3dbd60644ac272421c75c26a4166669ccd00ffa706df30108` |
| M08 | 1 253 540 | 1 253,540 | 1,253540 | `0710e9fbe687bb61c417c44830fa4bac9aaff2628118f3a108f514f5af77353a` |
| F04 | 2 051 413 | 2 051,413 | 2,051413 | `fe41e4c98939b8d7dd8cff1842d3596ea2fa6c08506d71663c159bc2527dd8ed` |

## Validation et livraison — M06 v2

- Fichier candidat :
  `assets/design/hero-sprites/cdi-150/candidates/male/rogue-male-06-combat-idle-v2.png`.
- Fichier ImageGen exact :
  `exec-7c0a7b1b-c2eb-4b8d-ab22-29111eb21315.png`.
- SHA-256 :
  `6aa24e55280a7d69c1a825d68b67c6b65eccc5edbfb185406c4fe8df6702e998`.
- Dimensions : `1024 × 1536 px`.
- Poids : `1 944 710 octets`, `1 944,710 Ko`, `1,944710 Mo`.
- Comparatif de proportions :
  `rogue-male-06-combat-idle-v2-proportion-check.png`.
- Comparatif de l'arme :
  `rogue-male-06-combat-idle-v2-weapon-check.png`.
- Lecture finale : identité, tenue et proportions cohérentes avec le neutre ;
  garde basse lisible ; poignet, prise et hache sans défaut disqualifiant observé.
- Verdict : validation utilisateur explicite acquise.
- Archive :
  `validated-male-v1/rogue-male-06-combat-idle-v1.png`, dont le SHA-256 est
  identique au candidat.
- Export :
  `normalized-alpha-v1/male/rogue-male-06-combat-idle-v1.png`.

## Normalisation technique

Le script générique `scripts/prepare-combat-idle-sprite.ps1` exige une boîte
corporelle, une boîte faciale source et une boîte faciale du neutre. L'échelle
est calculée sur le diamètre facial équivalent `sqrt(largeur × hauteur)`, jamais
sur la hauteur de la pose, la boîte alpha ou l'arme. Le bas de la boîte
corporelle est aligné sur la ligne des pieds, puis le personnage est centré sur
le milieu de l'écart entre les pieds.

Les cadres revus de Mage M06, Mage M08 et du neutre Rogue M07 sont désormais
mis en cache dans
`assets/design/hero-sprites/combat-idle-proportion-references.json`. Le contrôle
et l'export les chargent par clé, vérifient leur SHA-256 et refusent toute
référence absente, non revue ou modifiée. Les coordonnées ne doivent plus être
ressaisies pour M07.

L'export runtime définitif de M07 est
`normalized-alpha-v1/male/rogue-male-07-combat-idle-v1.png` : `1042 × 920 px`,
`329 675 octets`, SHA-256
`c6db9c9e216fb6855afc59d202e022bd892ce54bdf2626d17cd4520b0223daba`.
Le contrôle alpha relève un seul composant, aucun pixel sur les bords et aucun
résidu fuchsia détecté. Ce résultat clôt M07 ; le pourcentage facial affiché par
le script est une mesure descriptive et non une tolérance automatique.

### M08 V11 — validation du 22 septembre 2026

- Source exacte : `candidates/male/rogue-male-08-combat-idle-v11.png`, copiée
  sans modification dans `validated-male-v1/rogue-male-08-combat-idle-v1.png`.
  SHA-256 : `0710e9fbe687bb61c417c44830fa4bac9aaff2628118f3a108f514f5af77353a`.
- Verdict utilisateur : « perso ça me va » sur V11, après demande d'allonger
  le sabre haut. V9 et V10 ne sont pas validées.
- Références finales : neutre M08, sabre kilij du Metropolitan Museum of Art
  (objet 31300, `cdi-149/references/m09/met-kilij-31300.jpg`) ; la provenance
  précise de `historical-saber-guards.jpg`, également utilisée en V10, n'est
  pas documentée dans le dépôt.
- Prompts exacts V9 à V11 et ordre des références :
  `references/m08/prompts-v9-v11.md`.
- Preuves : `references/m08/rogue-male-08-v11-face-frame-review.png`,
  `references/m08/rogue-male-08-v11-anatomy-review.png`,
  `candidates/male/rogue-male-08-combat-idle-v11-proportion-check.png` et les
  deux planches `-upper-weapon-check.png` / `-lower-weapon-check.png`.
- Contrôle facial et anatomique : entrée `rogue-male-08-candidate-v11` revue
  dans `combat-idle-proportion-references.json`. La planche de proportions
  compare le candidat au neutre exact et à Mage M06/M08 ; elle ne donne aucun
  verdict automatique. À l'inspection, la garde fléchie ne montre pas de
  rupture anatomique disqualifiante.
- Source : `1100 × 1430 px`, avec 48 pixels opaques sur le bord droit près du
  sabre haut. Le gros plan de l'arme montre une pointe entière. L'export
  normalisé ajoute une marge, sans redessiner la source validée ; il mesure
  `572 × 920 px`, `399 500` octets, SHA-256
  `d10e0f250ccf3bc4c3570a869c342df4a0def6c2b33ed2c088b32116eb3f9660`,
  et aucun pixel opaque sur ses quatre bords. La proximité du sabre haut avec
  le bord dans la source reste une réserve de cadrage tracée.
- `prepare-combat-idle-sprite.ps1` attend désormais le schéma `2` du catalogue
  réellement utilisé ; l'ancien contrôle `schemaVersion -ne 1` empêchait
  l'export avant même le traitement de l'image.

Le précédent export M06 a été produit avec l'ancien calcul fautif par hauteur
corporelle :

```text
458x920 | bounds=9,278,422,623 | bodyHeight=623
visibleBottomY=900 | feetMidpointX=229,2 | 322962 octets
```

Ces chiffres restent une trace historique et ne servent pas d'autorité.
M01–M06 et F04 ont depuis été réexportés après revue des cadres faciaux.
La validation artistique des sources est conservée.

### M09 V11 — pose croisée validée et exportée

- L'utilisateur a rejeté V2, quasi identique à V1, puis les gardes ouvertes ou
  trop proches de M08. V7 présentait aussi une épée encore au fourreau et une
  prise basse incohérente. V8, techniquement transparent, dupliquait la lecture
  haute/basse de M08. La pose en X de V9 a été validée, puis l'utilisateur a
  validé explicitement la dernière image V11 et demandé l'arrêt des générations.
- V11 : `exec-dfd13249-81ef-438a-b5ba-41db00cdefd1.png`,
  `candidates/male/rogue-male-09-combat-idle-v11.png`, 1024×1536,
  SHA-256 `ddf0d576c9e8a2c1ce518f77ad82f264f4c20b7e8da46d7a917963d5f22b8707`.
  Les quatre bords ont zéro pixel opaque. Le halo visible dans `view_image` est
  composé de valeurs RGB avec alpha nul ; le compositing sur fond quadrillé
  prouve que le fond est transparent. Aucun nettoyage artistique n'a été fait.
- Les planches `references/m09/rogue-male-09-v11-face-frame-review.png`,
  `references/m09/rogue-male-09-v11-anatomy-review.png` et
  `candidates/male/rogue-male-09-combat-idle-v11-proportion-check.png`
  comparent V11 au neutre exact et à Mage M06/M08. Le premier cadre facial
  était trop large ; le cadre corrigé `[464,205,177,176]` rapproche la taille
  du visage et la largeur des épaules du neutre. Le rapport épaule–hanche reste
  plus court, avec un buste penché et une garde fermée. L'utilisateur a confirmé
  que le rendu visuel est acceptable après examen de cette réserve. Aucun
  défaut anatomique indépendant n'a été établi. Cette variation est acceptée
  pour M09 et ne vaut pas précédent pour les autres sprites.
- Source archivée : `validated-male-v1/rogue-male-09-combat-idle-v1.png`, SHA-256
  identique au candidat V11. Export :
  `normalized-alpha-v1/male/rogue-male-09-combat-idle-v1.png`, 366×920,
  240 945 octets, SHA-256
  `e96697a7ccf91ffc32e51999d4a8e051e084b3ed0f21d383a2aebe70e9bbb418`.
  Les quatre bords sont transparents ; `bodyHeight=553,1` contre 623 pour le
  neutre normalisé, ce qui suit la flexion et l'échelle faciale retenues.

### M10 V12 — dague seule validée et exportée

- L'utilisateur a validé la pose V2 puis, après plusieurs reprises de la dague,
  a validé explicitement V12 (« je valide tu arrivera pas à mieux »). Aucune
  génération supplémentaire de M10 n'est nécessaire. L'image exacte est
  `exec-ad89fb89-952c-4c97-9cc7-7b7a328c9549.png`, copiée dans
  `candidates/male/rogue-male-10-combat-idle-v12.png`.
- Le neutre validé, la pose V2 et le panneau du manhwa *Solo Leveling* ont été
  transmis ensemble à ImageGen pour V12. La provenance, les rejets et le prompt
  exact sont dans `references/m10/sources.md` et `prompt-v12.md`.
- Le candidat mesure 1083×1453, 1 305 985 octets ; SHA-256
  `4e6e954caeb4e621dc1f8ae837684b3ef89cf35c6f89d340fa3928d08c8d0d26`.
  Les quatre bords sont transparents. Les cadres faciaux revus sont
  `references/m10/rogue-male-10-neutral-face-frame-review.png` et
  `references/m10/rogue-male-10-v12-face-frame-review.png`. Après calibration
  par le visage, la hauteur corporelle visible est 525,3 px contre 623 px au
  neutre ; les jambes écartées et fléchies expliquent cette hauteur projetée.
- Source exacte archivée :
  `validated-male-v1/rogue-male-10-combat-idle-v1.png`, même SHA-256 que V12.
  Export déterministe :
  `normalized-alpha-v1/male/rogue-male-10-combat-idle-v1.png`, 436×920,
  268 845 octets, SHA-256
  `db17d80f77bb6a9eb1b99f89ab7b0db878f333b8bd7f803dd002373610b2fe02`.
  Aucun pixel opaque sur les quatre bords ; l'export ne modifie pas la source.
- Le contrôle facial et le cadrage sont revus. Les repères articulaires détaillés
  de M10 restent à relever avant les planches comparatives finales ; ce contrôle
  ne modifiera pas la source artistiquement validée. Critère de clôture : aucune
  incohérence indépendante de la flexion de pose dans les segments, les appuis
  et les pivots neutral/combat.

## État de fin de session

Les vingt variantes sont intégrées dans le vrai lecteur du cinéma et les cinq
écrans ont été validés par l'utilisateur. Aucun autre réglage de taille n'est
en attente sur CDI-150. Le ticket ne couvre ni les poses d'action ni le
déploiement.
