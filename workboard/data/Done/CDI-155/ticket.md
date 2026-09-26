---
id: CDI-155
title: Produire et intégrer les poses de combat Druide
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 15 septembre 2026 - séparer pose neutre, pose de combat et poses d’action
depends_on: ["CDI-143","CDI-148"]
blocks: ["CDI-124","CDI-128","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-combat-idle-sprite-workflow.md","src/assets/heroSpriteSheets.ts","src/domain/dungeonCombatScene.ts","src/components/dungeon/CurrentEncounterPanel.tsx","AGENTS.md"]
---

# CDI-155 — Produire et intégrer les poses de combat Druide

## Objectif

Produire pour les dix hommes et dix femmes Druide une pose de combat en garde, cohérente avec leur base neutre, puis l’utiliser comme attente pendant les affrontements du cinéma.

## Resultat utilisateur

Chaque Druide conserve exactement son identité et son équipement visuel entre la pose neutre et la garde. Dans le cinéma, le héros passe de la pose neutre à la garde au début de l’affrontement, revient en garde après chaque action et quitte la garde à la fin du combat.

## Contexte

La base neutre reste destinée au recrutement, au catalogue, au stockage et aux scènes hors combat. La pose de combat est un second asset persistant pendant l’affrontement ; elle n’est ni la compétence guard_stance, ni une pose d’attaque. Ce lot réutilise le standard validé par CDI-148 sans modifier le contrat de scène.

## Perimetre autorise

- Produire vingt poses de combat : dix hommes et dix femmes, index 0–9.
- Conserver pour chaque index le visage, la carnation, la coiffure, les couleurs, la tenue, l’arme ou l’accessoire de la base neutre.
- Garder dimensions, boîte alpha, pieds, pivot, direction et échelle compatibles avec la base neutre.
- Intégrer la sélection neutre/combat dans le catalogue de présentation et dans le vrai lecteur du cinéma.
- Utiliser la garde comme attente pendant un affrontement et comme état de retour après une action.

## Hors perimetre

- Pose d’attaque, de tir, de sort, de soin, de chant, de réaction ou de KO.
- Cycle de marche ou animation complexe.
- Modification de gameplay, de compétence, d’équipement réel ou de résultat autoritaire.
- Remplacement de la pose neutre dans le recrutement, le catalogue, le stockage ou les scènes hors combat.
- Déploiement frontend ou backend.

## Contrat d'implementation

- Commencer par un petit pilote contrasté et obtenir le verdict utilisateur avant la série complète.
- Une clé de pose explicite distingue neutral et combat_idle ; aucun choix ne dépend du texte traduit ou de l’équipement réel.
- La même clé d’identité et le même index sélectionnent les deux poses ; aucun visage générique ne remplace une variante.
- Le lecteur suit neutre → garde → action → garde → neutre en fin d’affrontement. Une pose d’action manquante retombe sur la garde, jamais sur une autre identité.
- La compétence guard_stance ajoute son geste ou son effet propre sans redéfinir la garde persistante.
- Charger uniquement les assets utiles à la scène et mesurer poids froid, cache chaud et mémoire décodée.

## Dependances

- CDI-143 : vingt bases neutres Druide validées.
- CDI-148 : standard de pose de combat et intégration cinéma validé sur les Novices.

## Criteres d'acceptation

- [x] Un pilote contrasté est validé visuellement avant la production en série.
- [x] Les vingt poses de combat correspondent une à une aux vingt bases neutres par genre et index 0–9.
- [x] Identité, équipement visuel, proportions, direction, lumière, pieds et pivot restent cohérents entre les deux poses.
- [x] Le cinéma affiche la garde pendant l’affrontement, revient en garde après chaque action et n’utilise la pose neutre qu’hors combat.
- [x] Recrutement, catalogue, stockage et autres scènes hors combat conservent la pose neutre.
- [x] La pose de combat ne remplace aucune pose d’action et ne modifie aucun résultat métier.
- [x] Alpha, chargement, cache, mémoire et budget de scène sont vérifiés ; le rendu est validé dans les écrans cinéma représentatifs.

## Tests

- Contrôler dimensions, alpha, boîte visible, pieds, pivots et correspondance stricte neutral/combat par clé.
- Tester la sélection de pose à l’entrée du combat, pendant l’attente, après une action et à la sortie de l’affrontement.
- Vérifier le repli sur la garde si une pose d’action manque et sur la pose neutre seulement hors combat.
- Exécuter les tests ciblés, npm.cmd run check:dungeon-visuals, npm.cmd run typecheck, npm.cmd run lint -- --quiet, npm.cmd run build, npm.cmd run check:bundle et npm.cmd run board:validate.

## Validation manuelle

L’utilisateur valide d’abord le pilote, puis les vingt correspondances neutral/combat et enfin le rendu dans les écrans du cinéma. Les tests complets et la documentation de livraison viennent après le verdict visuel.

## Preservation

- Conserver les vingt identités validées et leur équipement dessiné.
- Conserver compositions, placements, échelle et lisibilité des écrans cinéma.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Aucun déploiement n’est autorisé par ce ticket.

## Risques

- Dérive de visage, tenue, arme ou proportions entre la base et la garde.
- Saut visible de pivot ou d’échelle lors du changement de pose.
- Chargement des quarante images neutral/combat d’une classe alors que seules les identités présentes sont nécessaires.
- Confusion entre garde persistante, compétence guard_stance et vraie pose d’action.

## Handoff

Fournir références et prompts versionnés, table neutral/combat par genre et index, sources/exports, mesures, tests et verdicts utilisateur. Aucune pose d’action, réaction ou KO n’est déclarée livrée par ce lot.


## Préparation de la série — 26 septembre 2026

Succède à CDI-154, clôturé après validation cinéma. Les vingt neutres sont validés dans CDI-143 ; F01/F06 utilisent les sources v2. Canon vérifié dans shared/domain/items/vocation-rewards.ts : Druide reçoit basic_staff. Proposition artistique : bâtons de bois, gardes variées à une ou deux mains, mains libres en protection quand la prise le permet ; regards déterminés ; tenues et accessoires préservés, aucun effet déclenché. Pilote proposé M01, puis F01 pour une silhouette contrastée. Direction et répartition à valider avant première génération, conformément au workflow commun.

| ID | Neutre exact | Arme/garde proposée | État |
| --- | --- | --- | --- |
| M01 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-01-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M02 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-02-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M03 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-03-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M04 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-04-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M05 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-05-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M06 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-06-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M07 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-07-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M08 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-08-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M09 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-09-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| M10 | `assets/design/hero-sprites/cdi-143/validated-male-v1/druid-male-10-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F01 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-01-v2.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F02 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-02-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F03 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-03-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F04 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-04-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F05 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-05-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F06 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-06-v2.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F07 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-07-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F08 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-08-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F09 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-09-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |
| F10 | `assets/design/hero-sprites/cdi-143/validated-female-v1/druid-female-10-v1.png` | Bâton de bois ; prise et garde à définir sur références | Proposition à valider |

Après accord : rechercher les références, transmettre exactement trois images, prompt court relu, un seul candidat immédiatement montré. Aucun candidat généré à cette étape.

## Décision actuelle et M01 validé — 26 septembre 2026

La proposition de vingt bôs ci-dessus est remplacée par la répartition validée : 6 bâtons naturels longs (3F/3M), 4 baguettes/rameaux sculptés (2F/2M), 6 lances sobres (3F/3M), 4 griffes/armes de poing (2F/2M). Total 10 magiques et 10 martiaux, 5F/5M chacun. Aucun changement de gameplay.

Attribution de production proposée : bâtons M01/M04/M10 et F05/F07/F09 ; rameaux M02/M05 et F01/F08 ; lances M03/M08/M09 et F04/F06/F10 ; griffes M06/M07 et F02/F03.

M01 approuvé : exec-7049243f-5cc5-497a-9af4-03ee10b9a9f1.png, archivé à l'identique dans assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-01-combat-idle-v1.png. SHA256 4EB0F507FACEEEAEB45DABCE46440A03F83088E56A1128DAE74D82143088237D. PNG 1024×1536 : 1 025 029 pixels alpha zéro, 547 835 partiels. L'affirmation antérieure de fond opaque était fausse ; la deuxième génération exec-7ab93152-1077-42f9-940f-db639683048b.png est écartée. Normalisation dérivée 584×920, boîte source alpha >32 [24,17,973,1480], source préservée. Comparaison visuelle aux Mages M06/M08 effectuée ; mesures anatomiques détaillées et cinéma restent ouverts.

Références M01 : neutre exact CDI-143 M01 ; Schierke https://gamebiz.jp/news/267611 ; bois naturel https://www.pinterest.com/pin/772226667329744677/. Références locales .tmp/cdi-155/m01/pose-schierke.jpg et wood-staff.jpg. Prompt : identité et tenue exactes, garde magique vers la droite, appuis décalés, bâton diagonal à une main, main libre prête, regard déterminé, aucun effet, transparence.

F01 : pilote contrasté à rameau sculpté, neutre exact v2. Références recherchées : Fern (collaboration officielle Colopl, https://prtimes.jp/main/html/rd/p/000001795.000004473.html) pour la garde à adapter sans effets ; baguette en chêne sculptée https://www.etsy.com/listing/241740442/grape-vine-wand-fully-hand-carved-oak. Verdict requis avant normalisation et intégration.

## Direction remplaçant la proposition initiale — 26 septembre 2026

Répartition validée : 10 magiques et 10 martiaux, chacun 5F/5M. Les anciens tableaux restent historiques, supersédés par cette décision. Aucun changement de gameplay.

| Arme | Hommes proposés | Femmes proposées |
| --- | --- | --- |
| Bâton naturel long | M01, M04, M10 | F05, F07, F09 |
| Baguette / rameau sculpté | M02, M05 | F01, F08 |
| Lance sobre | M03, M08, M09 | F04, F06, F10 |
| Griffes / armes de poing | M06, M07 | F02, F03 |

Familles et quantités validées ; attribution individuelle de production selon les identités.

M01 validé : exec-7049243f-5cc5-497a-9af4-03ee10b9a9f1.png. Archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-01-combat-idle-v1.png. SHA256 4EB0F507FACEEEAEB45DABCE46440A03F83088E56A1128DAE74D82143088237D.
PNG 1024×1536 : 1 025 029 pixels alpha 0 ; 547 835 partiels ; aucun alpha 255. Affirmation antérieure de fond opaque erronée, basée sur aperçu sans mesure. La deuxième génération exec-7ab93152-1077-42f9-940f-db639683048b.png est inutile, écartée, non archivée.
Normalisation sans redessin : 584×920 ; boîte source alpha >32 [24,17,973,1480]. Comparaison anatomique détaillée aux Mages reste à effectuer ; pilote F01 et cinéma ouverts.
Références M01 : neutre exact CDI-143 ; Schierke https://gamebiz.jp/news/267611 ; bois https://www.pinterest.com/pin/772226667329744677/. Images .tmp/cdi-155/m01/pose-schierke.jpg et wood-staff.jpg.
Prompt résumé : identité exacte, garde magique vers la droite inspirée de Schierke, appuis décalés, une main sur bâton diagonal, autre prête à canaliser, bois naturel long, regard déterminé, aucun effet, entier, transparence.
F01 suivant : neutre exact druid-female-01-v2.png et rameau sculpté ; verdict avant contrôle.

## F01 validée et pilote contrasté approuvé — 26 septembre 2026

L'utilisateur valide F01 (exec-96183dde-634a-48d7-92e5-9ea36dcc6877.png), après M01. Archive exacte : assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-01-combat-idle-v1.png. SHA256 source/archive : 1C611DDE3E5930B6C88A1FF23EA5F7157EDB15675427AA98E537365198068146.
PNG source 1024×1536, 997 539 pixels alpha zéro, 575 325 partiels ; quatre coins alpha zéro. Normalisé sans redessin en 646×920 ; boîte source alpha >32 [55,88,1012,1413]. Source intacte conservée. Comparaison visuelle effectuée avec le neutre F01 v2 et les Mages F06/F08 ; échelle cinéma encore à calibrer.
Trois références : neutre F01 v2 ; .tmp/cdi-155/f01/pose-fern.jpg (Colopl/Frieren) ; .tmp/cdi-155/f01/wand-small.jpg (chêne sculpté, Etsy). Prompt : préserver identité et tenue, garde magique au sol vers la droite, pieds décalés, bassin/buste cohérents, baguette courte pointée, main libre près du torse, regard ferme bouche fermée, aucun effet, entier et transparent. Prochain candidat : M02 au rameau sculpté ; aucun autre sprite déclaré validé.

## M02 validé — 26 septembre 2026

Verdict utilisateur : validé. Source exec-7ccd3a72-66e8-4340-b716-dc73f7dd42d4.png, archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-02-combat-idle-v1.png. SHA256 source/archive C7D684FA00E0269A7EE61B233F4E530DC62C1217E715D46E41CA6463944FBBE4. PNG 1024×1536, 937 029 pixels alpha zéro, 635 835 partiels, quatre coins alpha zéro. Copie normalisée 592×920 ; boîte source alpha >32 [37,24,1017,1510]. Identité et tenue confrontées au neutre M02, proportions examinées avec les repères Mages M06/M08 ; échelle cinéma à calibrer.

Références : neutre M02 exact ; fan art Harry Potter par mikang HR https://www.zerochan.net/4554421 ; rameau de sorbier https://www.whisperingwindsshop.com/listing/612914974/forked-rowan-wood-wand-alter-wand-rowan. Images .tmp/cdi-155/m02/pose-harry.jpg et rowan-wand.jpg. Prompt : identité exacte, garde compacte vers la droite, rameau court près de l'épaule coude plié, main libre devant le torse, appuis décalés, bassin et torse cohérents, petite fourche, expression déterminée bouche fermée, aucun effet, entier et transparent.

Trois sprites validés : M01, F01, M02. Prochain candidat F02 : armes de poing compactes, tenue et identité neutres conservées.

## F02 validée après correction des griffes — 26 septembre 2026

Source approuvée exec-cfbf03c7-75d4-4c95-a5dd-e71550fc0b78.png, archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-02-combat-idle-v1.png. SHA256 source/archive 3A45F7167DF92085F329C3E0B63EE9E2AAF22D8BA3C3259E7BD4961CFD5C1E8A. PNG 1024×1536, 1 026 406 pixels alpha zéro, 546 458 partiels, quatre coins transparents. Normalisation 606×920, boîte source alpha >32 [46,64,996,1474]. Identité/tenue comparées au neutre F02 ; gabarits féminins F06/F08 conservés comme références, calibration cinéma à venir.

Références initiales : neutre F02 exact ; garde de Tifa par EvilApai https://www.pinterest.com/pin/394698354827922426/ ; griffes de cuir https://id.pinterest.com/pin/922604673660341011/. Images .tmp/cdi-155/f02/pose-tifa-guard.jpg et claws.jpg. La première génération exec-869a6707-5c58-4a95-be09-2fc12ea0e52b.png et la première correction exec-4ce431e9-3a73-4513-8d3f-c66674603234.png ne sont pas validées. Correction finale demandée et approuvée : trois griffes courtes sombres sur chaque gant, dans le prolongement poignet-poing au-dessus des jointures, orientations en perspective ; pose, poignets, tenue et identité conservés. Ne pas archiver les versions refusées comme sources finales.

Quatre sprites validés : M01, F01, M02, F02. Prochain candidat M03 : lance sobre, garde à deux mains.

## M03 validé — 26 septembre 2026

Source approuvée exec-21aaacd7-b9bc-4233-8971-ba52e88ffc5e.png, archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-03-combat-idle-v1.png. SHA256 source/archive 18108C40EE5D45AE965736B8CEB6FC6233AE4635FA750DB712CA7A9A9804879F. PNG 1024×1536 ; 1 118 392 pixels alpha zéro, 454 472 partiels ; quatre coins transparents. Normalisation 632×920 ; boîte source alpha >32 [14,43,1008,1455]. Copie examinée après normalisation, identité comparée au neutre M03 et gabarit aux Mages M06/M08 ; hauteur avec lance à distinguer de la hauteur corporelle lors du calibrage cinéma.

Références : neutre exact M03 ; Balsa par sbel02 https://www.pinterest.com/pin/706713366542961701/ ; lance de collection https://www.roots.gov.sg/Collection-Landing/listing/1072450. Images .tmp/cdi-155/m03/pose-balsa.jpg et spear-museum.jpg. Prompt : identité et tenue exactes, garde à deux mains espacées, lance diagonale vers la droite, hampe droite et fer aligné, appuis décalés, bassin/buste tournés ensemble, regard ferme, aucun effet, entier et transparent.

Cinq sprites validés : M01, F01, M02, F02, M03. Prochain candidat F03 : griffes courtes dans l'axe des poings, garde inspirée de Makoto (https://www.eventhubs.com/artwork/makoto-artwork-2-street-fighter-3/), référence mécanique https://www.pinterest.com/pin/780319072905615051/ simplifiée en cuir et bois sans tête animale ni ornement monumental.

## F03 validée après correction de la main à gauche de l'image — 26 septembre 2026

Source approuvée exec-914f7bbc-d5cf-4fed-8175-12443c2a1f91.png, archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-03-combat-idle-v1.png. SHA256 source/archive AFD3A93E33D81ECA7870D11393E7C368B62408194E3F3992814AB6ABD03407BA. PNG 1037×1516 ; 980 899 pixels alpha zéro, 589 199 partiels ; quatre coins transparents. Normalisation 620×920, boîte source alpha >32 [15,9,1032,1482]. Copie contrôlée après normalisation, identité et tenue comparées au neutre F03 ; échelle cinéma encore à calibrer.

La première génération exec-e58ce1ce-9476-475d-93b1-126361bdf39c.png est écartée. Correction validée : sur la main située à gauche de l'image, près de la taille, déplacer les bases des griffes sur le dessus du gant au-dessus des jointures, dans l'axe du poing, en conservant position de la main, autre gant, pose et tenue. Références initiales : neutre exact F03, .tmp/cdi-155/f03/pose-makoto.jpg et claws.jpg (liens ci-dessus).

Répartition par sexe reconfirmée : chaque sexe reçoit 3 bâtons, 2 rameaux, 3 lances et 2 paires de griffes, soit 5 magiques/5 martiaux. Six sprites validés : M01/F01/M02/F02/M03/F03. Prochain candidat M04 : bâton naturel long ; références Miroku par Ciro Art https://www.pinterest.com/pin/330029478959663440/ et noisetier https://www.houseofbruar.com/hazelthumbstickncn/ ; garde adaptée au sol sans effet.

## M04 validé avec nœud de racines et cristal brut — 26 septembre 2026

L'utilisateur demande et valide le remplacement de la fourche par un nœud de racines enserrant un cristal brut non taillé. Cette décision artistique explicite autorise cet accessoire pour M04 ; aucune modification de gameplay.
Source finale exec-8e04e109-aeba-40df-99c4-9ee739e24d51.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-04-combat-idle-v1.png. SHA256 source/archive B294F63B2B331C55B0688AB30AEF90D22D61F3139EEF3665AC1EAA35B2540B3F. Source 1024×1536 : 1 036 514 pixels alpha zéro, 536 350 partiels, quatre coins transparents. Normalisation 578×920, boîte source alpha >32 [54,13,997,1484]. Identité/tenue comparées au neutre M04, copie normalisée examinée ; calibration cinéma encore ouverte.
Références initiales : neutre M04 exact, .tmp/cdi-155/m04/pose-miroku.jpg et hazel-staff.jpg (sources ci-dessus). Prompt initial : identité exacte, bâton en retrait, main libre en protection, deux pieds au sol, garde tournée vers la droite, aucun effet. Édition finale sur exec-abc7585b-31a2-4615-b3a5-c6e38a316443.png : changer seulement le sommet en racines compactes autour d'un petit cristal gris bleu brut sans lueur ; préserver personnage, pose, bâton et cadrage. La version fourchue n'est pas archivée comme finale.

Sept sprites validés : M01/F01/M02/F02/M03/F03/M04. Prochain F04 : lance sobre, garde basse à deux mains inspirée d'Ephraim https://www.zerochan.net/3752564 ; référence de lance muséale déjà examinée (.tmp/cdi-155/m03/spear-museum.jpg).

## F04 et nouvelle lance M03 validées — 26 septembre 2026

F04 approuvée : lance entièrement végétale, pointe issue de racines, jonction en ronces avec épines à la place des feuilles. Source exec-02b0e7d0-78ee-4ee5-af84-0b03c824be6c.png, archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-04-combat-idle-v1.png. SHA256 source/archive 716957757B38ADF2434419DB7DFE1644CA090B2CFFFE77DCCBD3E456DB579C1D. PNG 1500×1049 : 1 170 662 pixels alpha zéro, 401 001 partiels, 1 837 opaques ; coins [0,0,1,0]. Normalisation dérivée 1280×920, boîte source alpha >32 [21,20,1493,1028]. Références initiales : neutre exact F04 CDI-143, .tmp/cdi-155/f04/pose-ephraim.jpg et .tmp/cdi-155/m03/spear-museum.jpg. Garde basse à deux mains, identité et tenue conservées ; modifications végétales demandées puis validées par l'utilisateur.

M03 : remplacement explicitement demandé, puis validé sur exec-b3268259-fc7d-47a5-a921-37e2651ed07a.png. Direction distincte de F04 : hampe de roseau, jonction brune en tête de roseau et pointe naturelle en bois fibreux, sans facettes forgées. Pose conservée. Archive finale assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-03-combat-idle-v2.png ; la v1 reste historique et ne doit pas être intégrée comme version courante. SHA256 source/archive 9E7D9360A91C6495964A287C747B3B9A8D9E549EF8AD125F3CCFA80304C356AD. PNG 1024×1536 : 1 114 468 pixels alpha zéro, 458 396 partiels, quatre coins alpha zéro. Normalisation dérivée 634×920, boîte source alpha >32 [15,20,1008,1423]. Le script de préparation sélectionne désormais M03 v2 ; son ancienne copie normalisée reste historique.

Dernière édition M03 sur exec-2d2be0da-3d0f-41f8-97f2-8b31e5bb4f00.png : modifier uniquement la pointe en prolongement de bois fibreux naturellement effilé, contours légèrement irréguliers, sans facettes ni biseaux, alignée avec la hampe ; conserver jonction, hampe, mains, pose, personnage et cadrage. La variante racines/ronces exec-c24ec20d-f355-46d7-9fb5-030b12de07f1.png est refusée car trop similaire à F04 ; la première pointe de roseau est remplacée car trop forgée.

Huit identités validées : M01–M04 et F01–F04. Sources archivées sans modification, alphas contrôlés avant toute régénération ; aucune régénération technique nécessaire. Calibration cinéma et intégration restent ouvertes. Prochaine identité prévue : M05, baguette / rameau sculpté.

## M05 validé avec baguette ivoire — 26 septembre 2026

Version finale approuvée : exec-80e74f3c-6d4b-48ef-8232-69574469c22e.png. L'utilisateur a demandé une baguette blanche assortie aux motifs du haut après avoir validé la garde de exec-fd4bba8a-1239-4920-851d-4943f5a3f217.png ; cette première version brune n'avait pas encore été archivée. Seule la version ivoire est retenue pour intégration.

Archive exacte : assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-05-combat-idle-v1.png. SHA256 source/archive vérifié : A52B6C87CFB0E4E2318661293FD7C723456D4AD3C7A0879CFA6299AE99E89628. PNG 1122×1402 : 1 037 270 pixels alpha zéro, 533 650 partiels, 2 124 opaques ; quatre coins alpha zéro. Normalisation dérivée sans redessin : 626×920, boîte source alpha >32 [133,30,1066,1365]. Source conservée intacte ; aucune nouvelle génération pour les alphas.

Trois références initiales : neutre exact CDI-143 M05 ; garde stylisée Harry Potter https://www.mobygames.com/game/23580/harry-potter-and-the-sorcerers-stone/promo/group-157863/image-1237838/ (.tmp/cdi-155/m05/pose-harry.png) ; baguette torsadée https://www.heartwoodwands.com/ (.tmp/cdi-155/m05/wood-wand.jpg). Prompt relu : identité et tenue exactes, garde moins accroupie que la référence, deux pieds au sol, genoux souples, bassin et buste orientés ensemble vers la droite, bras armé levé en retrait, main libre devant le torse, regard déterminé, aucun sort, fond transparent. Édition finale : modifier uniquement la couleur de la baguette en bois blanc ivoire assorti aux broderies, préserver relief torsadé, forme, position, personnage et pose.

Neuf identités validées : M01–M05 et F01–F04. Calibration cinéma et intégration restent ouvertes. Prochaine identité : F05, bâton naturel long.

## F05 validée après correction de l'appui droit de l'image — 26 septembre 2026

L'utilisateur reprend explicitement le concept de M04 : long bâton naturel, nœud de racines enserrant un cristal brut non taillé. Déclinaison F05 approuvée : bois acajou sombre, racines allongées asymétriques, cristal ambré sans lueur. La première version exec-77d3532e-3cca-4d2e-a4c6-ca1f74bf8c03.png a été validée puis réouverte avant archivage pour corriger le pied situé à droite pour le spectateur. Version finale approuvée : exec-4764487b-72dc-43fb-a70c-20383d5b8998.png, appui de la botte redressé et cheville réalignée ; garde conservée.

Archive exacte : assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-05-combat-idle-v1.png. SHA256 source/archive vérifié : BCB187F62BA27677823A35AF07122F60BD70A24C902CC1E875793F91DABA0B6E. PNG 880×1787 : 947 496 pixels alpha zéro, 624 676 partiels, 388 opaques ; quatre coins alpha zéro. Normalisation dérivée sans redessin 438×920, boîte source alpha >32 [41,12,867,1738]. Source intacte ; aucune régénération technique des alphas.

Trois références transmises : neutre exact CDI-143 F05 ; Yumina https://fehnote.gamedbs.jp/chara/show/1269 (.tmp/cdi-155/f05/pose-yumina.png) ; M04 validé comme référence du concept de bâton. Prompt relu : identité et tenue exactes, prise à deux mains et bâton diagonal sommet à droite, deux pieds au sol, appuis décalés, bassin et buste orientés ensemble, regard déterminé, aucune magie déclenchée, entier et transparent. Édition locale demandée : corriger uniquement botte et cheville à droite de l'image, talon et avant-pied sur un même plan de sol, réduire l'inclinaison plongeante, préserver longueur de jambe, genou, écartement et reste du sprite.

Dix identités validées : M01–M05 et F01–F05. Calibration cinéma et intégration restent ouvertes. Prochaine identité : M06, griffes / armes de poing dans l'axe des doigts.

## M06 validé après différenciation des griffes — 26 septembre 2026

Source finale approuvée : exec-b6bb205c-7c39-4f38-b7eb-7f907698b01e.png. Archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-06-combat-idle-v1.png ; SHA256 source/archive vérifié 1B5562A86005987CAFC9407FCC7EEBFC048486F68BC9708163C1435349EC9925. PNG 985×1596 : 912 147 pixels alpha zéro, 657 858 partiels, 2 055 opaques ; quatre coins transparents. Normalisation dérivée 558×920, boîte source alpha >32 [25,20,980,1562]. Source intacte.

Références initiales : neutre exact CDI-143 M06 ; Rock Lee https://www.zerochan.net/4147048 (.tmp/cdi-155/m06/pose-lee.png) ; gantelet https://id.pinterest.com/pin/922604673660341011/ (.tmp/cdi-155/f02/claws.jpg). Garde compacte adaptée vers la droite, poing levé et poing bas, pieds décalés au sol, expression déterminée sans attaque. Premier candidat exec-6ce7f048-28d4-4b65-83ca-258f4d789a81.png rejeté : modèle de griffes trop répétitif et griffe déviée sur la main à droite de l'image. Nouvelle conception exec-0bb6898b-e025-4dea-8630-ac608fbdb42c.png : cuir rouille, fibres et écorce charbon, trois pointes de bois sombre par gant. Dernière correction validée : griffes du bras à gauche du spectateur réorientées dans le prolongement longitudinal du gantelet, pose conservée.

Onze identités validées : M01–M06 et F01–F05. L'utilisateur demande désormais l'enchaînement immédiat après chaque validation, sans accord supplémentaire de lancement ; chaque candidat conserve son verdict visuel. Suite : F06, lance végétale distincte des modèles racines/ronces et roseau. Calibration cinéma et intégration restent ouvertes.

## F06 validée avec longue pique — 26 septembre 2026

Source finale exec-a0200839-d687-4c39-b3e3-2231edd54df0.png. Archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-06-combat-idle-v1.png. SHA256 source/archive vérifié 7C8304E6155A1A194EEA1CE8AE4AA0DAA01BF3C49EF578C37D6593E0155AB853. PNG 1536×1024 : 1 238 061 pixels alpha zéro, 334 803 partiels, quatre coins transparents. Normalisation dérivée 1380×920, boîte source alpha >32 [39,23,1499,950]. Source intacte ; le fond coloré de l'aperçu ne représente pas une opacité du canal alpha.

Références : neutre exact F06 v2 CDI-143 ; Florina https://www.zerochan.net/3554235?lang=ja (.tmp/cdi-155/f06/pose-florina.webp) ; pointe de bois https://www.instructables.com/Wooden-Spear-for-the-Dispatching-of-Vampires/ (.tmp/cdi-155/f06/wood-spear.jpg). Garde à deux mains adaptée au sol, identité et longue tenue conservées, aucun effet. Candidats intermédiaires non finaux : exec-4ddf89c8-15be-4000-a2c2-df3afa590287.png (tête trop large), exec-08a5be91-14ce-44e9-87f7-514b19c68b59.png (pique fine), exec-722038e6-82b4-4e85-86a9-daa4d442d32a.png (pointe seule allongée). Dernière demande correctement appliquée et validée : allonger toute l'arme, particulièrement la hampe derrière la main, conserver prises et garde, agrandir le canevas pour l'arme entière. Bois flotté clair, ligatures vert varech, pointe fine dans l'axe.

Douze identités validées : M01–M06 et F01–F06. Suite immédiate : M07, armes de poing différenciées. Intégration et calibration cinéma restent ouvertes.

## M07 validé avec bâton de druide — 26 septembre 2026

L'utilisateur abandonne explicitement les gantelets à pointes en os après les échecs de doigts, de perspective et d'alignement des cornes, puis demande un bâton de druide et valide le nouveau candidat. Aucun candidat M07 à gantelets n'est retenu. La dernière tentative à cornes exec-90160962-8675-448e-9014-80f9c1a9f55a.png reste rejetée. Ne pas reprendre ces corrections ni remplacer l'image approuvée par une nouvelle génération.

Source approuvée : exec-fec3eeaf-c4b6-4895-89ca-faa655597c9c.png, dossier généré 01a0dd85-e926-7350-9ee3-e03849ef52f2. Archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-07-combat-idle-v1.png ; SHA256 source/archive vérifié 9E9AD7A1C5D5B85003164A0B35F6EC9D34B1700B3CD80A9B12FB9955AA410B50. PNG 1024×1536 : 1 053 893 pixels alpha zéro, 518 971 partiels, aucun opaque ; quatre coins alpha zéro. Fond coloré de l'aperçu non assimilé à une opacité réelle. Normalisation dérivée 566×920, boîte source alpha >32 [67,32,993,1506], 566 294 octets ; source intacte.

Trois références : neutre exact M07 CDI-143 ; pose Yumina https://fehnote.gamedbs.jp/chara/show/1269 (.tmp/cdi-155/f05/pose-yumina.png) ; bâton du M04 approuvé (assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-04-combat-idle-v1.png). Prompt : même identité/tenue/style, garde à deux mains espacées, bâton diagonal, appuis décalés au sol, regard déterminé, bois brun chaud et nœud de racines autour d'un cristal brut vert mousse, aucun gantelet/corne ni effet, entier sur fond transparent. Génération intégrée ImageGen à partir du neutre, sans réutiliser les candidats déformés.

Cette décision remplace l'attribution M07 des tableaux historiques : bâtons M01/M04/M07/M10 et F05/F07/F09 ; rameaux M02/M05 et F01/F08 ; lances M03/M08/M09 et F04/F06/F10 ; griffes M06 et F02/F03. Totaux désormais 7 bâtons, 4 rameaux, 6 lances, 3 griffes ; 11 magiques/9 martiaux (hommes 6/4, femmes 5/5). Aucune réaffectation compensatoire d'un autre personnage n'est autorisée par cette seule décision ; aucun changement de gameplay.

Treize identités validées : M01–M07 et F01–F06. Prochaine identité prévue F07, bâton naturel long. Calibration cinéma et intégration restent ouvertes.

## F07 validée avec bâton naturel sans embout rapporté — 26 septembre 2026

Source finale approuvée exec-ca2fa101-bec1-4420-be24-25ef062aaa3d.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-07-combat-idle-v1.png. SHA256 source/archive vérifié C47D81869E83495BF0E38D0005AC07DF95C65C2C555AB6809087E9F56840C7C8. PNG 1024×1536 : 846 150 pixels alpha zéro, 726 714 partiels, aucun opaque ; quatre coins transparents. Normalisation dérivée 586×920, boîte source alpha >32 [26,4,1007,1512], 753 025 octets. Source conservée à l'identique ; calibration cinéma encore ouverte.

Trois références initiales : neutre exact F07 CDI-143 ; Miroku par Ciro Art https://www.pinterest.com/pin/330029478959663440/ (.tmp/cdi-155/m04/pose-miroku.jpg) ; bâton en noisetier https://www.houseofbruar.com/hazelthumbstickncn/ (.tmp/cdi-155/m04/hazel-staff.jpg). Prompt : identité/tenue exactes, garde stable tournée vers la droite, bâton tenu en retrait et main libre en protection, appuis décalés au sol, regard concentré, aucun effet, entier et transparent.

La fourche du premier candidat exec-b6673e6c-23ff-4f06-ad59-1d80bec214c3.png est rejetée. Nouveau sommet exec-3983b3e1-c6fd-4fad-9d6f-9c4593f54d99.png : racines claires torsadées autour d'un cristal brut bleu ardoise. L'utilisateur rejette ensuite l'embout noir hérité de la référence de canne ; correction finale validée : prolonger le bois naturel jusqu'au bout arrondi, sans capuchon ni bague. Le reste de la pose est conservé. Ne pas réintroduire cet embout de canne dans les prochains bâtons de druide.

Quatorze identités validées : M01–M07 et F01–F07. Prochaine identité M08, lance végétale. Intégration et calibration cinéma restent ouvertes.

## M08 validé avec lance sombre à épine — 26 septembre 2026

Source approuvée exec-df541885-35b3-4563-b6c3-77bb0a4449ac.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-08-combat-idle-v1.png. SHA256 source/archive vérifié 68D14AB11E5B53A8F355992FB64E40DC7E70E1437E03AF76084749B622314FC6. PNG 1391×1131 : 1 040 016 pixels alpha zéro, 531 833 partiels, 1 372 opaques ; quatre coins transparents. Normalisation dérivée 1094×920, boîte source alpha >32 [10,10,1388,1119], 1 062 676 octets ; source intacte.

Références initiales : neutre exact M08 CDI-143 ; Ephraim https://www.zerochan.net/3752564 (.tmp/cdi-155/f04/pose-ephraim.jpg) ; lance végétale F04 approuvée. Garde à deux mains espacées, appuis décalés, regard combat vers la droite, aucune attaque déclenchée, cadrage entier transparent. Le bambou du premier candidat exec-eab2c5ca-409b-4bd4-9394-5f9c73da8b3a.png est rejeté comme répétitif. Remplacement demandé puis accepté : hampe en bois sombre continu, longue pointe d'épine d'acacia, ligature de fibres végétales tressées (exec-4dd089b6-e584-4475-9386-771054f9e579.png).

Corrections intermédiaires non validées : exec-567e8ae5-4ab5-4a88-9b60-a85d1b28624b.png ne redresse pas correctement l'arme ; exec-9ac8401d-e975-45eb-87a1-4d27842ff13f.png abaisse trop la partie avant et crée un coude. Dernière correction validée : faire pivoter la partie avant depuis la sortie de la main pour prolonger la pente de la hampe entre les deux mains, sans coude, en conservant sa longueur et le design. Ne pas réutiliser les versions rejetées.

Quinze identités validées : M01–M08 et F01–F07. Suite F08, baguette / rameau sculpté. Intégration et calibration cinéma restent ouvertes.

## F08 validée avec nouvelle garde et rameau à bourgeon — 26 septembre 2026

Source approuvée exec-cfea30c6-be14-40f7-a513-74e344bb4197.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-08-combat-idle-v1.png. SHA256 source/archive vérifié D1ADC0F6B803E324803EA853195332352D01A181B1CA1BDB5C8D8EE034E84785. PNG 1024×1536 : 789 710 pixels alpha zéro, 783 154 partiels, aucun opaque ; quatre coins transparents. Normalisation dérivée 596×920, boîte source alpha >32 [18,17,998,1500], 765 654 octets ; source intacte.

Le premier candidat exec-cee87bb1-4a44-4674-b2b0-a315ca264366.png est rejeté pour répétition du design torsadé et de la pose. Nouvelle génération depuis le neutre exact F08, avec deux nouvelles références : Hermione stylisée au bras avancé https://www.pngaaa.com/detail/814510 (.tmp/cdi-155/f08/pose-hermione.png) et bourgeon terminal de magnolia https://herbarium.ncsu.edu/tnc/magnolia.htm (.tmp/cdi-155/f08/magnolia-bud.jpg). Prompt : identité/tenue exactes, garde de trois quarts vers la droite, bras armé avancé et main libre près des côtes, appuis décalés au sol, rameau court brun sombre à poignée d'écorce et bourgeon fermé vert sauge, sans torsade, sans effet, entier transparent. Pose et arme validées ensemble.

Seize identités validées : M01–M08 et F01–F08. Suite M09, lance végétale distincte. Intégration et calibration cinéma restent ouvertes.

## M09 validé en garde basse — 26 septembre 2026

Source approuvée exec-cea211b5-176f-477d-98fc-6a0a49278724.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-09-combat-idle-v1.png. SHA256 source/archive vérifié EBC74D88320FEF492428AED55C3A738DDC530E6D95696AA0FA123615D8A0C273. PNG 1145×1374 : 1 023 931 pixels alpha zéro, 548 387 partiels, 912 opaques ; quatre coins transparents. Normalisation dérivée 826×920, boîte source alpha >32 [22,87,1125,1275], 915 670 octets ; source intacte.

Trois références : neutre exact M09 CDI-143 ; Dimitri https://fehpass.fire-emblem-heroes.com/en-US/00003001000554/ (.tmp/cdi-155/m09/pose-dimitri.png) ; construction de lance https://sketchfab.com/3d-models/prehistoric-spear-6a8ce2f7a25240f59149809bca5f71c5 (.tmp/cdi-155/m09/spear-reference.jpg). Prompt : identité/tenue hivernale exactes, garde basse adaptée au sol vers la droite, deux mains espacées, longue hampe en bouleau clair, pointe étroite en bois dur sombre à la place de la pierre de référence, jonction liée de racines sèches ; arme droite, aucun effet, entier transparent. Premier candidat validé.

Dix-sept identités validées : M01–M09 et F01–F08. Suite F09, bâton naturel long. Intégration et calibration cinéma restent ouvertes.

## F09 validée avec bâton recourbé — 26 septembre 2026

Source approuvée exec-7800faa3-cc82-4fa4-943f-61accf8e1bc9.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-09-combat-idle-v1.png. SHA256 source/archive vérifié 18FD9DDDDE8E8C9327FFA90652124D96F26497B7E8C5B0BC4284AAA2C9FD58A3. PNG 1024×1536 : 883 147 pixels alpha zéro, 689 717 partiels, aucun opaque ; quatre coins transparents. Normalisation dérivée 622×920, boîte source alpha >32 [30,77,1008,1492], 753 999 octets ; source intacte.

Trois références : neutre exact F09 CDI-143 ; Kilik https://www.fightersgeneration.com/characters2/kilik.html (.tmp/cdi-155/f09/pose-kilik.jpg) ; bâton recourbé https://www.etsy.com/listing/4331012201/druids-root-of-life-wooden-staff-larp (.tmp/cdi-155/f09/root-staff.jpg). Prompt : identité/tenue exactes, garde à deux mains espacées, appuis décalés au sol, buste vers la droite et regard ferme, longue hampe en bois patiné et crosse organique de saule avec prises en fibres, sans embout noir ni métal, entier transparent sans effet. Premier candidat validé.

Dix-huit identités validées : M01–M09 et F01–F09. Suite M10, bâton naturel long, puis F10, lance. Intégration et calibration cinéma restent ouvertes.

## M10 validé avec bâton noueux et quartz fumé — 26 septembre 2026

Source approuvée exec-25490cb6-90f5-4adf-8639-19cabeeaf5fd.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-male-v1/druid-male-10-combat-idle-v1.png. SHA256 source/archive vérifié 7E69097C4E22B31B1E69795CA6578363C9F66DDBB51AE2C2636C00FC58C2A731. PNG 1024×1536 : 936 986 pixels alpha zéro, 635 878 partiels, aucun opaque ; quatre coins transparents. Normalisation dérivée 592×920, boîte source alpha >32 [19,12,1013,1519], 642 934 octets ; source intacte.

Trois références : neutre exact M10 CDI-143 ; Gandalf illustré https://in.pinterest.com/pin/493847915373838569/ (.tmp/cdi-155/m10/pose-gandalf.jpg) ; bâton massif https://www.etsy.com/market/wooden_wizard_staff (.tmp/cdi-155/m10/wood-staff.jpg). Prompt : identité/tenue exactes, appuis décalés, buste légèrement penché, bâton presque vertical en protection, main libre près du torse à la place de l'épée, nœud de bois massif et petit quartz fumé brut directement enchâssé, sans cage de racines ni embout rapporté, entier transparent sans effet. Premier candidat validé.

Dix-neuf identités validées : M01–M10 et F01–F09. Dernier candidat F10, lance végétale. Intégration et calibration cinéma restent ouvertes.

## F10 validée — vingt poses approuvées — 26 septembre 2026

Source approuvée exec-527cb359-18db-4ba4-8bfe-002cfbf9af09.png ; archive exacte assets/design/hero-sprites/cdi-155/validated-female-v1/druid-female-10-combat-idle-v1.png. SHA256 source/archive vérifié 0332C28F3A7BCFD0B5AF7B364FF5CE25209AA707BAF6B93FCDE003F30D54A170. PNG 1200×1310 : 1 024 856 pixels alpha zéro, 546 498 partiels, 646 opaques ; quatre coins transparents. Normalisation dérivée 844×920, boîte source alpha >32 [27,53,1182,1268], 835 791 octets ; source intacte.

Trois références : neutre exact F10 CDI-143 ; Ingrid en combat https://fehnote.gamedbs.jp/chara/show/1110 (.tmp/cdi-155/f10/pose-ingrid-combat.png) ; lance en bois https://www.instructables.com/Wooden-Spear-for-the-Dispatching-of-Vampires/ (.tmp/cdi-155/f06/wood-spear.jpg). La pose neutre d'Ingrid téléchargée au préalable est écartée des trois entrées. Prompt : identité/tenue exactes, garde stable au sol à deux mains espacées, lance diagonale pointe relevée vers la droite, bois rouge brun d'une seule pièce et pointe effilée dans la continuité, sans métal, sans bambou ni symbole, entier transparent, aucun effet. Premier candidat validé.

Les vingt identités M01–M10/F01–F10 sont validées visuellement, archivées et normalisées. M03 v2 remplace sa v1 historique. M07 conserve le bâton explicitement demandé en remplacement des gantelets : aucune redistribution compensatoire. Le critère des vingt poses est coché ; le ticket reste Doing. Restent l'intégration des assets de combat, les contrôles techniques du lecteur et la calibration visuelle du cinéma (échelles/pivots), puis les critères de livraison du ticket. La validation des illustrations ne vaut pas validation du cinéma.

## Intégration locale et ouverture du cinéma — 26 septembre 2026

Vingt WebP exportés, catalogue CDI-155 branché au lecteur, manifeste identité/source/normalisation/runtime avec SHA-256. M03 v2 sélectionnée explicitement, v1 historique exclue du runtime. Neutres CDI-143 conservés. Échelles initiales toutes à 1 et pivots à 0,5 : calibration utilisateur encore requise.

Preuves : 25 tests encounterVisuals réussis, TypeScript et check:dungeon-visuals réussis ; Playwright vérifie les vingt gardes sur les cinq pages cinéma à 1440×1000. Total WebP 2 410 730 octets ; quatre plus lourds 642 510 octets ; mémoire RGBA des quatre plus grands 16 920 640 octets.

Suivi, commandes, limites et critères de clôture : [intégration CDI-155](../../../../docs/development/session-2026-09-26-cdi-155-druid-combat-integration.md). Ticket Doing jusqu'au verdict cinéma et aux contrôles finaux, dont budget JS, responsive, transitions et cache. Aucun commit/push/déploiement.

Réglage cinéma demandé par l'utilisateur : les vingt échelles F01–F10/M01–M10 passent de 1 à 0,75. Valeurs relues dans le catalogue ; pivots inchangés. Verdict visuel global toujours attendu.

Réglage suivant demandé par l'utilisateur : les vingt échelles F01–F10/M01–M10 passent à 0,8. Pivots inchangés ; validation cinéma encore ouverte.

Réglage écran 2 demandé par l'utilisateur : F03 à 0,75 ; F04 à 0,7 ; M03 et M04 à 0,83. Les autres échelles restent à 0,8. Validation cinéma encore ouverte.

Réglage suivant demandé par l'utilisateur : F01 et F02 à 0,75. Autres valeurs conservées ; validation cinéma encore ouverte.

Réglage suivant demandé par l'utilisateur : M03 et M04 passent de 0,83 à 0,85. Autres valeurs conservées ; validation cinéma encore ouverte.

Réglage suivant demandé par l'utilisateur : F05 à 0,83, F06 à 0,75 et M05 à 0,75. Autres valeurs conservées ; validation cinéma encore ouverte.

Réglage suivant demandé par l'utilisateur : M08 à 0,7, F07 et M07 à 0,83. Autres valeurs conservées ; validation cinéma encore ouverte.

Réglage suivant demandé par l'utilisateur : M08 passe à 0,75. Autres valeurs conservées ; validation cinéma encore ouverte.

Réglage suivant demandé par l'utilisateur : M09 à 0,7, F09 et F10 à 0,75, M10 à 0,83. Autres valeurs conservées ; validation cinéma encore ouverte.

## Clôture cinéma et technique — 27 septembre 2026

Verdict utilisateur explicite : « cinéma druide valide continue ». Les vingt illustrations et les cinq écrans sont validés aux échelles consignées ci-dessus. Les adaptations d'armes sont les choix explicites déjà documentés, dont le remplacement des gantelets M07 par un bâton.

Audit pré-publication : débordements F04/F06 corrigés avec pivots 0,47/0,4 sans toucher aux échelles ; cinq pages vérifiées à 1440/1280/1024/512 px. Dépassement JS initial de 203 octets corrigé par les tables d'URL compactes Druide/Aède, sans relever le seuil. Budget final 261 981 / 262 144 octets gzip JS.

75 tests ciblés réussis ; typecheck, lint, build, check:bundle et check:dungeon-visuals réussis. Sources/empreintes, transparence, mapping des vingt identités et portraits neutres vérifiés. Cache froid/chaud, mémoire et planches clair/sombre documentés dans le [compte rendu de livraison](../../../../docs/development/session-2026-09-26-cdi-155-druid-combat-integration.md). Aucun changement métier, aucune pose d'action livrée, aucun déploiement. Aucun écart fonctionnel de ce ticket laissé ouvert.

Demande utilisateur suivante : arrêter après clôture et Git ; CDI-156 n'est pas lancé. Publication Git demandée avec le lot Aède déjà validé encore non commité et ses dépendances locales, hors essais et fichiers de déploiement sans rapport.
