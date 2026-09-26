---
id: CDI-154
title: Produire et intégrer les poses de combat Aède
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 15 septembre 2026 - séparer pose neutre, pose de combat et poses d’action
depends_on: ["CDI-142","CDI-148"]
blocks: ["CDI-125","CDI-128","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-combat-idle-sprite-workflow.md","src/assets/heroSpriteSheets.ts","src/domain/dungeonCombatScene.ts","src/components/dungeon/CurrentEncounterPanel.tsx","AGENTS.md"]
---

# CDI-154 — Produire et intégrer les poses de combat Aède

## Objectif

Produire pour les dix hommes et dix femmes Aède une pose de combat en garde, cohérente avec leur base neutre, puis l’utiliser comme attente pendant les affrontements du cinéma.

## Resultat utilisateur

Chaque Aède conserve exactement son identité et son équipement visuel entre la pose neutre et la garde. Dans le cinéma, le héros passe de la pose neutre à la garde au début de l’affrontement, revient en garde après chaque action et quitte la garde à la fin du combat.

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

- CDI-142 : vingt bases neutres Aède validées.
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

## Suivi de production — 25 septembre 2026

Matrice validée par l’utilisateur : instrument en main pour M01, F01, M02, M05, M06, F08 ; épée à une main pour F02, M04, F03, F04, F06, M08, M10, F09 ; bô en bois pour M03, F05, M07, F07, M09, F10. Pour M06, le verdict visuel ajoute une épée dans l’autre main. Le pilote contrasté M01 puis F02 est validé individuellement avant la série. Les visuels restent indépendants de l’équipement réellement porté.

Le neutre autoritaire de chaque ligne est `assets/design/hero-sprites/cdi-142/validated-{gender}-v1/aede-{gender}-{index}-v1.png`. L’ordre de reprise est M02–M10, puis F01 et F03–F10 ; ne pas régénérer M01 ou F02.

| ID | Garde | Verdict | Source de combat |
| --- | --- | --- | --- |
| M01 | Luth | Validé | `validated-male-v1/aede-male-01-combat-idle-v1.png` |
| M02 | Harpe | Validé | `validated-male-v1/aede-male-02-combat-idle-v1.png` |
| M03 | Bô | Validé | `validated-male-v1/aede-male-03-combat-idle-v1.png` |
| M04 | Épée | Validé | `validated-male-v1/aede-male-04-combat-idle-v1.png` |
| M05 | Tambour | Validé | `validated-male-v1/aede-male-05-combat-idle-v1.png` |
| M06 | Clairon et épée | Validé | `validated-male-v1/aede-male-06-combat-idle-v1.png` |
| M07 | Bô | Validé | `validated-male-v1/aede-male-07-combat-idle-v1.png` |
| M08 | Épée | Validé | `validated-male-v1/aede-male-08-combat-idle-v1.png` |
| M09 | Bô | Validé | `validated-male-v1/aede-male-09-combat-idle-v1.png` |
| M10 | Épée légère assortie | Validé | `validated-male-v1/aede-male-10-combat-idle-v1.png` |
| F01 | Luth | Validée | `validated-female-v1/aede-female-01-combat-idle-v1.png` |
| F02 | Épée légère | Validée | `validated-female-v1/aede-female-02-combat-idle-v1.png` |
| F03 | Épée | Validée | `validated-female-v1/aede-female-03-combat-idle-v1.png` |
| F04 | Épée | Validée | `validated-female-v1/aede-female-04-combat-idle-v1.png` |
| F05 | Bô | Validée | `validated-female-v1/aede-female-05-combat-idle-v1.png` |
| F06 | Épée | Validée | `validated-female-v1/aede-female-06-combat-idle-v1.png` |
| F07 | Bô | Validée | `validated-female-v1/aede-female-07-combat-idle-v1.png` |
| F08 | Sifflet et épée | Validée | `validated-female-v1/aede-female-08-combat-idle-v1.png` |
| F09 | Épée | Validée | `validated-female-v1/aede-female-09-combat-idle-v1.png` |
| F10 | Bô | Validée | `validated-female-v1/aede-female-10-combat-idle-v1.png` |

M01 : candidat exact `exec-6f3de6ae-90d8-4536-92a2-f14ae4f138e6.png`, SHA-256 `B47355219540431102C0F01CF467BC3644766C101FB7B1189875BB7823E4322E`. Références transmises : [pose de combat Sumeragi](https://www.zerochan.net/2163880) (jeu, posture seule), [luth du Met](https://www.metmuseum.org/art/collection/search/500554) (construction), plus son neutre exact. Prompt retenu : « Create one full-body combat idle sprite of the exact Aède M01 in image 1. Keep his face, hair, body, clothing, colors and style. Give him the bent-knee battle-ready stance and intense focused face of image 2, but no sword. He holds his lute from image 1 in both hands, ready to play; image 3 shows the lute. He is waiting for the fight, with no song or attack started. Transparent background, full feet and lute visible, no effects, scenery or text. » Deux candidats antérieurs rejetés pour luth déformé puis attitude trop calme. Alpha et coins transparents ; export normalisé `654 × 920`, pieds à `y=900`.

M02 : candidat exact `exec-2761c3ce-006b-4cc5-a5f7-6a3874d2db87.png`, SHA-256 `E49897D6B99FDF9E3F116E1A38830E5B95B0481CD35B6BEA9AB3AB8011921B19`. Références transmises : son neutre exact, [pose de combat Sumeragi](https://www.zerochan.net/2163880) (posture seule), [harpe gothique en noyer](https://ethnicmusicalinstruments.com/products/ems-29-string-gothic-harp-solid-walnut) (construction). La harpe du neutre est passée en main, avec son sommet brun et doré ; dos vide. Deux candidats rejetés pour harpe sans rapport avec le neutre, dont un avec fond opaque. Alpha et coins transparents ; export normalisé `686 × 920`, pieds à `y=900`.

M03 : candidat validé `exec-30d6e526-49e5-48fb-ab9e-bc396f7eb17c.png`, SHA-256 `042C780F58EBAD5246D4846DCB7DA2CAC2AD2F3316031FAD7DB3288E77932855`. Références transmises : son neutre exact, [garde de Kilik](https://strategywiki.org/wiki/Soulcalibur/Kilik) (posture), [bô en chêne](https://martialartsshopdirect.com/products/bo-staff-standard-red-oak-72-6ft-grade-a-30mm-thick) (arme). Le dégradé visible dans certains aperçus occupe des pixels d’alpha nul ; PNG et coins transparents vérifiés. Export normalisé `628 × 920`, pieds à `y=900`. Les trois générations lancées après validation par mauvaise lecture de l’aperçu ne sont pas utilisées.

M04 : candidat final validé `exec-89774168-1c38-4542-b1af-e25d25e87eec.png`, SHA-256 `285727881A0D48DA420CBC43EC30B231BA13A99BA37D1004B09B81DB0F6BF3FE`. Références transmises : son neutre exact, dernière garde M04 appréciée par l’utilisateur comme référence de pose, [épée légère bleu et or du Cleveland Museum](https://www.clevelandart.org/art/2002.1). Recréé depuis le neutre après demande d’une lame droite et d’un sprite exploitable ; épée droite validée. Alpha transparent vérifié ; export normalisé `592 × 920`, pieds à `y=900`.

M05 : candidat validé `exec-c6c58275-86d0-4bd2-87bf-e86e107f5d45.png`, SHA-256 `C53F2653F247D9536FF4C67B712D746C7625AD95DF036D7EEAE51C28EF2BB747`. Références transmises : son neutre exact, [pose de combat Sumeragi](https://www.zerochan.net/2163880) (posture), [tambour à cadre médiéval](https://www.pngitem.com/middle/iobbiRJ_percussion-instruments-of-the-middle-ages-hd-png/) (construction). Un seul tambour passé du dos à la main ; maillet prêt. Alpha et coins transparents ; export normalisé `738 × 920`, pieds à `y=900`.

M06 : candidat validé `exec-8d2138b7-dbb5-4c46-b96f-bcd5e1e137ff.png`, SHA-256 `7B96C8CC27D9F25B1B78B071B6E35B75B329727D15BB587E78EFD9E4C1E8E9C0`. La recréation complète a utilisé son neutre exact, une garde de chevalier issue de Granblue Fantasy et une épée droite bleu et or ; le clairon compact reste en main et l’épée occupe l’autre main. La correction finale a utilisé le candidat précédent, le neutre exact et la même référence d’épée avec une seule consigne : retirer la longue cape ajoutée et restaurer le mantelet court sans modifier la pose, le visage, le clairon ou l’épée. Alpha et coins transparents ; export normalisé `638 × 920`, pieds à `y=900`.

M07 : candidat validé `exec-7a5ea12d-9558-4392-8bd2-9489dd324309.png`, SHA-256 `A6D23ADF1529029558B56DF35839146D932C3CA4E7F1CF319305FF4490845F27`. Références transmises : son neutre exact, la garde verticale de Billy Kane dans l’illustration officielle de *The King of Fighters XIII* et un bô droit en chêne rouge. Après rejet des gardes diagonales, basses et trop démonstratives, le candidat final tient le bô vertical d’une main avec la main libre en protection et des appuis simples. Alpha et coins transparents ; export normalisé `556 × 920`, pieds à `y=900`.

M08 : candidat validé `exec-3e39004b-8309-4880-8174-e33f0281c28d.png`, SHA-256 `4A48A245661ADC5198F43776C6B6734935843DB7154DE356BB18A19C5549F26E`. Références transmises : son neutre exact, la garde agile d’Adol dans l’illustration officielle de *Ys: Memories of Celceta* et une petite épée droite bleu et or du Cleveland Museum of Art. Les trois pochettes colorées restent fermées et visibles ; l’épée légère est tenue basse en parade. Alpha et coins transparents ; export normalisé `610 × 920`, pieds à `y=900`.

F02 : candidat exact `exec-3fa915fd-bbb1-4818-a26a-d495098c970b.png`, SHA-256 `874E6BDFD135116BE58712523AB5DAD88D2BD8AD6E13F449526062C8308E8F32`. Références transmises : [garde de Raphael dans Soulcalibur](https://www.fightersgeneration.com/characters3/rafael.html) (attitude seule), [épée légère du Met](https://www.metmuseum.org/art/collection/search/32393) (arme), plus son neutre exact. Prompt retenu : « Create one full-body CDIdle Aède F02 combat idle sprite. Keep exactly the face, short curls, skin tone, colorful blue/coral/ivory dress, light dance shoes and art style of image 1. Image 2 is only a reference for tense, poised fencing attitude; image 3 shows a light one-handed smallsword. F02 stands in a compact defensive guard with bent knees, body turned slightly, focused battle gaze, and a slender sword held in front of her ready to parry. Give the sword a modest brass and teal hilt that belongs with her costume, not a large knight's sword. Keep the entire skirt, both feet and sword visible. Transparent background. No attack in motion, magic, scenery or text. » Le premier candidat F02 a été rejeté pour sa garde et son épée trop lourde. Alpha et coins transparents ; export normalisé `482 × 920`, pieds à `y=900`.

## Reprise M09 — 26 septembre 2026

Validation utilisateur explicite du fichier `exec-9e938c63-0234-433f-a3d6-5d4d259865a7.png` du dossier `C:/Users/mathr/.codex/generated_images/01a0d84a-2598-7bc0-ac00-f4ee8c3ce76e/`. Copie exacte archivée sous `validated-male-v1/aede-male-09-combat-idle-v1.png`, SHA-256 `9C3E72A2641EFFDD308E711E2BEA4B843077BC51F55FAAEC4013C2E559D34E24`.

Bô droit derrière les épaules, main libre en protection ; visage, boucles, gilet bicolore, poignets et sablier conservés. Comparaison visuelle avec le neutre M09 et les gabarits Mage M06/M08 : aucun écart manifeste de proportions identifié, sans prétendre à une mesure anatomique exacte. Source `1024 × 1536` RGBA ; coins transparents vérifiés par le normaliseur, boîte alpha source (>32) `(26,69)–(1006,1494)`. Export normalisé `618 × 920`, bas de boîte à `y=900`, pivot horizontal `309`, poids `520 778 octets`. Pieds, pivot et échelle en cinéma restent à vérifier lors de l'intégration finale.

Limite de reprise : le prompt exact et les références de cette génération antérieure ne sont pas établis ici. Leur traçabilité reste à compléter avant clôture. Point de reprise historique : M10, initialement au bô ; remplacé ensuite par une épée sur demande utilisateur. Cette validation ne clôture pas CDI-154.
## M10 validé — 26 septembre 2026

L'utilisateur remplace explicitement le bô par une épée légère à une main. Le candidat au bô `exec-8f0f5605-a0c6-48af-b6c3-d269cb77763f.png` est écarté. La garde à l'épée `exec-fe45e276-cc3d-436d-baaa-1468008c8580.png` est appréciée, puis l'utilisateur demande d'assortir l'épée à la tenue. Validation finale explicite du fichier `exec-6952ab25-661b-4a81-bbc8-8041abf9958c.png`, conservé exactement sous `validated-male-v1/aede-male-10-combat-idle-v1.png`. Source et archive partagent le SHA-256 `BCC324828646F689DDCBD5C2B70AEC78ED54C99FB3FC24CFBED2706083ADBB48`.

Références de la création : neutre exact `assets/design/hero-sprites/cdi-142/validated-male-v1/aede-male-10-v1.png`, illustration d'Adol de Ys: Memories of Celceta (`.tmp/cdi-154/m08/pose-adol.png`), épée légère du Cleveland Museum (`.tmp/cdi-154/m04/smallsword-cleveland.jpg`, https://www.clevelandart.org/art/2002.1). Réutilisation du corpus retenu pour M08 : même famille de garde à une main et silhouette compatible. Images externes de travail non intégrées au runtime ; licence non réétablie lors de cette reprise.

Prompt de création exact :
> Create one full-body combat idle sprite of the exact Aède M10 in image 1. Preserve his face, long dark braid, body proportions, violet and orange outfit, cream sleeves, fingerless gloves, shoes, colors and drawing style. Use image 2 only for an agile defensive stance, with both feet planted, knees slightly bent and a focused expression, facing slightly right. Give him one light one-handed sword with a slender straight blade and a modest blue-and-gold hilt inspired by image 3. Hold it diagonally in front, ready to parry, with his free hand raised in protection. He is waiting, not attacking. No staff. Entire character, braid, feet and sword visible with comfortable margins. Transparent background, no effects, scenery or text.

Correction locale : trois références transmises, candidat à l'épée précédent, neutre exact M10, même épée du Cleveland Museum. Prompt exact :
> Edit image 1 with one isolated change: make the sword hilt match this character's outfit. Replace its bright royal-blue ornaments with muted violet and teal enamel, use a burnt-orange leather grip, and restrained warm brass matching his clothing fasteners. Image 2 is the exact identity and outfit color reference; image 3 is only the sword construction reference. Preserve the straight silver blade, sword geometry, guard pose, hands, face, braid, clothing, proportions, framing and drawing style of image 1. Full character and sword, transparent background. No other changes, no effects or text.

Contrôle après verdict : identité, tresse, tenue et mains préservées ; lame droite et garde lisible. Comparaison visuelle au neutre M10 et aux gabarits Mage M06/M08 : aucun écart manifeste identifié, sans mesure anatomique exacte. Coins transparents vérifiés par le normaliseur ; boîte alpha source (>32) `(29,76)–(1036,1460)`. Export `652 × 920`, bas de boîte à `y=900`, pivot horizontal `326`, poids `584 693 octets`. Le pivot et l'échelle dans le vrai cinéma restent à valider après intégration de la série.

Onze identités validées : M01–M10 et F02. Prochaine : F01 au luth, puis F03–F10. CDI-154 reste Doing.
## F01 validée — 26 septembre 2026

Validation utilisateur explicite du candidat `exec-43768e9e-e83e-4f5e-b86e-30021e207d96.png`. Archive exacte : `validated-female-v1/aede-female-01-combat-idle-v1.png`.

Décisions utilisateur pour la suite : rechercher aussi dans les langues des sources, notamment chinois et japonais, sans se limiter au français et à l'anglais. La garde, le regard et l'expression doivent évoquer le combat : adversaire fixé, concentration, bouche fermée, pas d'attitude paisible de concert.

Les candidats `exec-980d9643-d8c7-4d7e-9f1a-0864f75618f8.png` et `exec-8525b720-b5b5-4fd8-8773-b492efc282bc.png` ne sont pas retenus. Recherche élargie : capture Serval (https://www.sportskeeda.com/esports/how-complete-serval-s-parting-gift-achievement-honkai-star-rail), Ruan Mei en combat (https://duniagames.co.id/discover/article/fakta-ruan-mei-honkai-star-rail/en), fan art Ruan Mei (https://www.zerochan.net/4174175), Acheron concert (https://www.zerochan.net/4449488), I-No Strive (https://www.dustloop.com/w/GGST/I-No), illustration officielle I-No Xrd (https://www.ggxrd.com/rev/cs/character/ino.php), puis garde d'attente I-No (https://www.fightersgeneration.com/characters2/ino-a6.html). Les poses de concert ou trop calmes sont écartées ; la garde d'attente est retenue pour les appuis, le port bas de l'instrument et la main libre prête. Référence de construction réelle conservée : luth du Met, https://www.metmuseum.org/art/collection/search/500554. Licences des références externes non établies ; fichiers locaux hors livraison runtime.

Trois références effectivement transmises : neutre exact `assets/design/hero-sprites/cdi-142/validated-female-v1/aede-female-01-v1.png`, frame de garde `.tmp/f01-ino-idle.png` extraite de https://www.fightersgeneration.com/news2021/char4/ino-guiltygear-strive-x-counterside-idle-stance.gif, et `.tmp/cdi-154/m01/lute-met.jpg`. Prompt exact relu avant appel :

> Create one full-body BATTLE-READY IDLE sprite of the exact Aède F01 in image 1, preserving her face identity, coral bob, body proportions, entire burgundy/slate-blue dress, short cape, cream embroidery, boots and art style. Use image 2 only for the fighting stance and low instrument placement: staggered firmly planted feet, visibly bent knees, lowered hips, torso leaning slightly forward toward an enemy on the right. Her own single decorated wooden lute hangs low across her hips on its strap, neck nearly horizontal angled slightly upward to the right. Left hand firmly holds the neck; right hand is lifted a short distance above the strings, fingers curled and poised, not playing. Image 3 guides lute construction only. Give her an unmistakably serious combat face: brows drawn down and inward, narrowed focused eyes locked on the enemy, chin tucked, lips firmly closed, no smile. Hold still before action; no singing, strumming, attack or effects. Preserve her lute's cream inlays, with no second instrument on her back. Entire character, feet and lute visible. Transparent background, no scenery or text.

Contrôles après verdict : comparaison visuelle avec le neutre F01 et les gabarits Mage F06/F08 ; aucun écart manifeste identifié, sans prétendre à une mesure anatomique exacte. Identité, robe, cape courte, broderies et bottes conservées, luth unique en main. Coins transparents vérifiés par le normaliseur. Échelle et pivot dans le cinéma restent à valider après intégration de la série.

SHA-256 source/archive : F7F4683818CD628D36629D38AEEB875A1CDEEEA2E5B79E6B648423B622029E74. Mesure du normaliseur : aede-female-01-combat-idle-v1.png 586x920 alpha=82,137,963,1494 pivot=293,0 bytes=691300.

Douze identités validées : M01–M10 et F01–F02. Prochaine : F03 à l'épée. CDI-154 reste Doing.

## F03 validée — 26 septembre 2026

Validation explicite du fichier `exec-f1764762-f999-445e-84ac-612a356b1494.png`, copie exacte sous `validated-female-v1/aede-female-03-combat-idle-v1.png`. Le candidat `exec-1c98d52c-2882-4844-b756-79d5cb301fa9.png` avait une garde appréciée mais une profondeur des jambes rejetée. La correction `exec-e5352bcc-f484-487f-801d-0331040789fc.png` a raccourci les jambes sans résoudre le défaut : rejetée. Reprise depuis le neutre exact : `exec-cfb97e8f-4fc1-4824-88cf-e48f045e8a13.png`, pose appréciée, lame à corriger. Retouche `exec-2b677de0-e94b-4048-bd22-196299e4198d.png` : pointe encore arrondie/relevée et contour dédoublé, constat confirmé par gros plan `.tmp/f03-tip-inspection.png`. Dernière retouche validée par l'utilisateur.

Recherche de pose en japonais et chinois : `シャンファ ソウルキャリバー3 立ち絵 構え` et `香华 持剑 站姿 灵魂能力`. Référence retenue : illustration Xianghua SC3, https://8wayrun.com/attachments/xiasc3art1-jpg.4453/ (`.tmp/f03-xianghua-sc3.jpg`), après refus HTTP 403 de Creative Uncut. Arme : épée légère du Met, https://www.metmuseum.org/art/collection/search/32393 (`.tmp/cdi-154/f02/smallsword-met.jpg`). Sources externes de travail hors runtime ; licences non réétablies. La consigne utilisateur de recherche est sans restriction de langue : choisir les langues pertinentes, pas une liste fermée FR/EN/ZH/JA.

Trois références de la reprise : neutre exact F03 de CDI-142, Xianghua SC3, épée du Met. Prompt exact :
> Draw a fresh full-body combat idle sprite of Aède F03 from image 1. Preserve her exact identity, adult body proportions, low dark ponytail, green/burgundy/gold clothing, embroidery, wrist wraps, tassels and shoes. Image 2 guides coherent three-quarter pelvis and leg anatomy, not costume. Keep a wide grounded martial guard facing right: viewer-left leg bent outward, viewer-right leg extended diagonally, both soles firmly planted; open protective left palm at chest height, right hand holding a light straight sword low across the front toward the right. Build both legs from the same correctly rotated pelvis. Show believable thigh-to-knee-to-ankle connections, kneecap directions, overlapping clothing and folds describing cylindrical leg volume under one consistent eye-level perspective. Preserve her natural leg length and the wide stance; avoid a flat splayed cutout or one leg stretched toward the camera. Image 3 guides the sword, with modest green/burgundy/brass hilt. Focused eyes toward the enemy, tense brows, closed mouth, no smile. Same drawing style as image 1, entire feet and blade visible, transparent background. Waiting before action, no effects or text.

Les deux retouches utilisent chacune le candidat immédiatement précédent, le neutre exact F03 et l'épée du Met. Prompt de rectification de lame :
> Edit image 1: straighten ONLY the sword blade. Draw a rigid straight steel blade on one continuous axis from the center of the guard to the tip, aligned with the grip. Both cutting edges and the central ridge must be straight, tapering smoothly and symmetrically to one point; no bend, kink, waviness or curved tip. Keep the existing blade length and general direction, and preserve the ornate hilt and hand. Image 2 is the character identity reference; image 3 is the straight sword construction reference. Preserve everything else in image 1 exactly: the approved wide stance and leg perspective, feet, clothing, body, face, expression, hair, arms, framing, colors and drawing style. Full sword visible, transparent background, no effects or text.

Prompt final de pointe :
> Make one tiny local correction to image 1: redraw only the final quarter of the sword blade at the far right. Its current tip is rounded, slightly hooked upward and double-outlined. Replace that end with a clean sharp triangular point: two straight edges converge to one single apex exactly on the continuation of the blade's straight central ridge. No hook, curve, rounded cap, extra outline or stray pixels. Keep the existing blade direction and length. Image 2 is the identity reference; image 3 shows straight sword construction and a sharp point. Preserve all other pixels as closely as possible, including the rest of the sword, hilt, hand, approved wide leg stance, face, hair, outfit, colors, proportions and framing. Full sprite with transparent background.

Contrôle après verdict : identité et tenue conservées, comparaison visuelle avec le neutre F03 et les gabarits Mage F06/F08, sans nouvelle disproportion manifeste ; garde large et fléchie validée par l'utilisateur. Cette comparaison n'est pas une mesure anatomique exacte. Coins transparents contrôlés par le normaliseur. Pivot, échelle et transitions du vrai cinéma restent à valider avec la série intégrée.

SHA-256 source/archive : D2CBDCF16B2CD73A3285E181C39E027F674ADA07F96B213DC07F542AA66F4C3F. Mesure du normaliseur : aede-female-03-combat-idle-v1.png 818x920 alpha=31,26,1179,1275 pivot=409,0 bytes=738704.

Treize identités validées : M01–M10 et F01–F03. Prochaine : F04 à l'épée. CDI-154 reste Doing.

## F04 validée — 26 septembre 2026

Validation utilisateur explicite du fichier `exec-64ebcf16-a560-4e9e-9c1d-a4f8542cc1b1.png`, issu de `C:/Users/mathr/.codex/generated_images/01a0dd85-e926-7350-9ee3-e03849ef52f2/`. Copie exacte archivée sous `validated-female-v1/aede-female-04-combat-idle-v1.png`. SHA-256 source/archive : `17A138C6F7ED75F2DC7A84CD648BB280BA443BA10CFA819CF14BBD8866E41AEC`. Aucun redessin après validation.

La référence de pose expressément désignée par l'utilisateur était `exec-6e7de86c-1c6d-469c-b73a-349bb9d11f22.png` (bras armé bas, coude fléchi). Plusieurs essais ont utilisé à tort une autre génération avec bras levé ; ils sont écartés. La demande finale était de reprendre cette image précise au propre avec le fond à alpha zéro. Le fichier finalement retenu est celui nommé dans le verdict, indépendamment des appels interrompus.

Références de création F04 : neutre exact CDI-142 F04, garde de Raphael (`.tmp/cdi-154/f02/pose-raphael.jpg`, https://www.fightersgeneration.com/characters3/rafael.html), épée légère du Met (`.tmp/cdi-154/f02/smallsword-met.jpg`, https://www.metmuseum.org/art/collection/search/32393). Corpus réutilisé de F02 ; recherche complémentaire en japonais et chinois. Dernier prompt soumis sur la référence correcte : « Refais cette image au propre sur fond transparent. Conserve exactement le personnage, sa tenue, son expression et cette pose, surtout le bras armé bas avec le coude fléchi et la position de la main. Dessine l'épée bien droite dans le prolongement de sa poignée. Personnage et pointe entièrement visibles. Aucun autre changement. » Le retour de cet appel a été interrompu : son association exacte au fichier validé reste à confirmer avant clôture, sans remettre en cause le verdict explicite ni l'archive.

Contrôles après verdict : source 1024 × 1536 Format32bppArgb ; alpha=0 aux quatre coins et aux points de fond (100,200) et (900,800), alpha=253 sur le personnage en (500,600). L'aperçu coloré ne suffit pas à conclure à un fond opaque. Comparaison visuelle au neutre F04 et aux gabarits Mage F06/F08 : identité, tresse, tenue et proportions générales cohérentes avec la garde validée, sans mesure anatomique exacte. Export normalisé `598 × 920`, boîte alpha source (>32) `(18,8)–(1011,1499)`, pivot horizontal `299`, bas de boîte `y=900`, poids `619 579 octets`. Échelle, pivot et transitions en cinéma restent à vérifier lors de l'intégration.

Décision utilisateur pour la suite : varier librement entre épée, bô et instrument selon le personnage et la pose ; la répartition des lignes restantes est indicative. Prompts courts, référence exacte vérifiée avant appel, aucun changement de pose lors d'une correction locale demandée. Ne pas multiplier les générations pour un défaut non diagnostiqué.

Quatorze identités validées : M01–M10 et F01–F04. Prochaine identité : F05. CDI-154 reste Doing.
## F05 validée — 26 septembre 2026

Validation explicite du candidat `exec-f4e0a9d5-7db9-4564-9c78-1a1981ea8416.png`, dossier de génération `01a0dd85-e926-7350-9ee3-e03849ef52f2`. Copie exacte sous `validated-female-v1/aede-female-05-combat-idle-v1.png`. SHA-256 source/archive identique : `DD89E9D9B09195F6EA3CA09B48BB7ED3450516BEAC2DEACBE3C84F7EE1AC843B`. Le premier candidat `exec-0ce80fb5-0042-4e9e-b921-64076c661853.png` est rejeté pour sa pose raide et ses jambes simplement écartées.

Recherche élargie à la demande utilisateur aux mangas, BD, fantasy et fan arts, dans toutes les langues pertinentes. Comparaison de Balsa (Seirei no Moribito), d'un fan art de Mulan et d'une illustration de moine de Critical Role. La pose de Mulan est retenue : jambe avant fléchie, jambe arrière en appui, bâton transversal et mains espacées, compatible avec la jupe. Source de pose : https://tr.pinterest.com/pin/sophiesartstuff-in-2022--413979390757495678/ ; image https://i.pinimg.com/originals/b7/90/a2/b790a2706571a52f2783c29ab3fcca13.png ; copie de travail `.tmp/f05-mulan.png`. Attribution d'origine et licence non vérifiées ; référence externe hors runtime.

Exactement trois images transmises : neutre exact `assets/design/hero-sprites/cdi-142/validated-female-v1/aede-female-05-v1.png`, fan art Mulan, bô de chêne `.tmp/cdi-154/m03/bo-red-oak.jpg` (https://martialartsshopdirect.com/products/bo-staff-standard-red-oak-72-6ft-grade-a-30mm-thick). Prompt exact :

> Dessine le personnage exact de l'image 1 dans la garde au bâton de l'image 2 : jambe avant fléchie vers la droite, jambe arrière en appui, torse tourné, mains bien séparées tenant le bâton en travers devant elle. Reprends cette pose, pas le personnage ni le style de Mulan. Conserve les proportions, boucles, tenue, broderies, chaussures et étui de marionnettes de l'image 1. Utilise le bô droit en bois de l'image 3. Expression sérieuse, regard fixé sur l'adversaire à droite. Garde stable avant l'action, sans mouvement ni effet. Même style dessiné que l'image 1. Pieds et bâton entièrement visibles. Fond transparent avec alpha zéro hors du sprite.

Contrôles après verdict : comparaison visuelle avec le neutre F05 et les gabarits Mage F06/F08 déjà examinés ; identité, tenue et proportions générales cohérentes, compte tenu de la flexion et de la perspective, sans mesure anatomique exacte. Bô unique, pieds visibles et étui conservé. Coins transparents vérifiés par le normaliseur. Boîte alpha source (>32) `(47,44)–(1358,1102)`. Export normalisé `1090 × 920`, pivot horizontal `545`, bas de boîte `y=900`, poids `1 031 589 octets`. Largeur liée au bô transversal ; budget d'assets, échelle, pivot et transitions cinéma restent à vérifier lors de l'intégration de la série. Aucun redessin après verdict.

Quinze identités validées : M01–M10 et F01–F05. Prochaine identité : F06 ; choix d'arme adaptable selon la consigne utilisateur. CDI-154 reste Doing.
## F06 validée — 26 septembre 2026

Validation explicite du candidat `exec-8c6d7b68-0716-498e-8bb7-eb136ab0f9fc.png`, dossier de génération `01a0dd85-e926-7350-9ee3-e03849ef52f2`. Copie exacte sous `validated-female-v1/aede-female-06-combat-idle-v1.png`. SHA-256 source/archive identique : `D5667475952FB87DD8C9A22BED800E0ECDBD902897A1AE2646992543852DFA80`. Aucun redessin après validation.

Le premier candidat `exec-472c848d-021f-4236-b3ce-432884de95b3.png` est rejeté pour la profondeur des jambes. Les reprises `exec-8e47f424-3ef7-4499-832c-f8166a62f947.png`, `exec-c86cf05a-0bfb-4477-a5bb-51941aae9af5.png` et `exec-963bb36a-2c19-4fd0-ad63-ac8159c5a86f.png` ne sont pas retenues : rotation insuffisante puis buste déformé, entretenu par la réutilisation des candidats comme références. Solution retenue : écarter toutes les générations rejetées et repartir du neutre exact en limitant le changement aux bras et à l'expression.

Recherche japonaise, manga et fantasy : Asuna, fan art d'escrime attribué à Kishino sur Zerochan (https://www.zerochan.net/2578527), Saber (https://www.zerochan.net/2395886). Référence retenue : Asuna du site officiel SAO Progressive, https://sao-p.net/story-character/character/ ; image https://sao-p.net/assets/img/character/chara_asuna.png, copie de travail `.tmp/f06-asuna.png`. Posture du haut du corps uniquement ; pas de jambes croisées ni de décor repris.

Exactement trois images transmises pour le candidat final : neutre exact `assets/design/hero-sprites/cdi-142/validated-female-v1/aede-female-06-v1.png`, Asuna, épée légère du Met `.tmp/cdi-154/f02/smallsword-met.jpg` (https://www.metmuseum.org/art/collection/search/32393). Références externes hors runtime ; licence de l'illustration non réétablie. Prompt exact :

> Modifie l'image 1 uniquement aux bras et à l'expression. Garde son buste, ses épaules, sa taille, son bassin, sa robe et ses jambes exactement comme dans cette image : mêmes formes, proportions et orientation. Place le bras armé comme dans l'image 2, poignée près de l'épaule et lame en diagonale devant elle ; main libre ouverte en protection. Utilise l'épée légère de l'image 3, poignée bordeaux et garde dorée. Regard de combat concentré, sans sourire. Aucun changement de corps, aucune torsion de taille. Conserve son identité, sa tenue et son style. Personnage et épée entiers, fond transparent, aucun effet.

Contrôles après verdict : comparaison visuelle au neutre F06 et aux gabarits Mage F06/F08 déjà examinés ; proportions générales et orientation revenues à celles du neutre, identité, robe et chaussures conservées. Cette comparaison n'est pas une mesure anatomique exacte. Source `880 × 1786`, Format32bppArgb ; coins transparents vérifiés par le normaliseur. Boîte alpha source (>32) `(13,44)–(873,1697)`. Export normalisé `474 × 920`, pivot horizontal `237`, bas de boîte `y=900`, poids `561 098 octets`. Échelle, pivot, budget d'assets et transitions cinéma restent à vérifier lors de l'intégration de la série.

Seize identités validées : M01–M10 et F01–F06. Prochaine identité : F07. CDI-154 reste Doing.
## F07 validée — 26 septembre 2026

Validation finale explicite du candidat `exec-719958be-875d-4acf-a97f-4da225c9096d.png`, dossier `01a0dd85-e926-7350-9ee3-e03849ef52f2`. Archive exacte `validated-female-v1/aede-female-07-combat-idle-v1.png`, SHA-256 source/archive `F6E0AC4D9E03105C4180A56DDEBC0E456CE553DE4B4A730161BFEBE9A6E9536C`. La proposition de marionnette comme arme est refusée : elle reste rangée à la ceinture ; garde au bô retenue.

Trois références de création : neutre exact F07 de CDI-142, fan art Balsa de Seirei no Moribito (`.tmp/f05-balsa.jpg`, https://i.pinimg.com/originals/5d/43/86/5d43867c81f4ca2d95ea7a200466a324.jpg, repéré via https://www.pinterest.com/haileybenefiel/seirei-no-moribito/), bô en chêne (`.tmp/cdi-154/m03/bo-red-oak.jpg`, https://martialartsshopdirect.com/products/bo-staff-standard-red-oak-72-6ft-grade-a-30mm-thick). Attribution et licence du fan art non établies ; références externes hors runtime.

Prompt initial :
> Dessine le personnage exact de l'image 1 en garde au bô. Conserve son identité, ses proportions naturelles, sa tenue et sa marionnette rangée dans son étui à la ceinture. Image 2 : inspiration pour une garde de trois-quarts, torse et bassin orientés ensemble, appuis décalés et genoux fléchis. Elle regarde vers la droite et tient le bô droit en bois de l'image 3 à deux mains, en diagonale basse devant le corps, prêt à parer. Mains espacées, une près de la taille, l'autre en avant. Expression concentrée sans sourire. Garde immobile, aucune attaque ni magie. Même style dessiné que l'image 1, pieds et bâton entièrement visibles, fond transparent.

Le candidat initial `exec-80f923e6-426b-4e95-bed1-00356558b18b.png` est rejeté pour un bô trop court et coudé. Correction avec ce candidat, le neutre exact et le bô de référence :
> Corrige uniquement le bâton de l'image 1. Trace un bô rigide parfaitement rectiligne sur un seul axe passant par les deux prises : aucune cassure au niveau des mains. Allonge-le aux deux extrémités pour que sa longueur totale soit environ égale à la hauteur du personnage. Élargis le cadre pour montrer les deux bouts avec une marge ; ne raccourcis pas le bâton pour le faire entrer. Image 3 : référence de sa forme droite en bois. Image 2 : identité à préserver. Conserve exactement le personnage, la pose, les mains, les proportions, la tenue, le visage et la marionnette rangée de l'image 1. Fond transparent.

Résultat `exec-4a2aca17-8729-42a6-9bee-d51fda5295e5.png` : angle du bâton et main haute modifiés, signalés à l'utilisateur. Validation initiale révisée avant archivage : jambe à droite trop longue. Correction avec ce candidat, le neutre et le bô :
> Retouche locale de l'image 1 : raccourcis légèrement la jambe située à DROITE de l'image, principalement le segment genou-cheville, d'environ 10 %. Remonte et rapproche un peu la cheville et sa chaussure en conséquence, en gardant un appui naturel et la même taille de chaussure. Conserve le genou et le bassin en place. Ne raccourcis pas l'autre jambe. Ne change rien d'autre : visage, corps, robe, pose des bras, mains, long bô droit et cadrage identiques. Image 2 : proportions d'origine ; image 3 : bô à préserver. Fond transparent.

Jambes du résultat `exec-2de24b91-7b41-4ba5-adaf-f6713d692d69.png` explicitement validées. Demande de corriger la main à gauche pour le spectateur, initialement mal interprétée : la retouche de la main basse `exec-3901e9c3-743c-48af-9f74-0802fd8c240e.png` est écartée. Reprise depuis le candidat aux jambes validées, avec neutre et bô ; prompt final :
> Corrige uniquement la MAIN HAUTE À GAUCHE POUR LE SPECTATEUR, près de l'épaule, dans l'image 1. Redessine sa prise autour du bâton et son poignet : doigts enroulés naturellement, pouce opposé, poignet dans le prolongement de l'avant-bras sans angle cassé. Ne touche pas à la main basse à droite. Conserve exactement le reste : jambes validées, pose, visage, tenue, proportions et long bâton droit dans sa position actuelle. Image 2 : identité ; image 3 : bâton. Fond transparent, même cadrage.

Après verdict : comparaison visuelle au neutre F07 et aux gabarits Mage F06/F08 déjà examinés ; identité, tenue et proportions générales cohérentes avec les corrections validées, sans mesure anatomique exacte. Coins transparents vérifiés par le normaliseur. Boîte alpha source (>32) `(11,115)–(939,1422)`. Export `636 × 920`, pivot horizontal `318`, bas de boîte `y=900`, poids `685 648 octets`. Contrôles de pivot, échelle et budget en cinéma à effectuer lors de l'intégration.

Dix-sept identités validées : M01–M10 et F01–F07. Prochaine : F08. Consigne utilisateur : enchaîner le personnage suivant après chaque validation et archivage, sans attendre un nouveau « go ». CDI-154 reste Doing.
## F08 validée — 26 septembre 2026

Validation explicite de `exec-fbaa3062-3895-4ed7-b572-2af5c8340c5d.png`, dossier `01a0dd85-e926-7350-9ee3-e03849ef52f2`. Archive exacte `validated-female-v1/aede-female-08-combat-idle-v1.png`, SHA-256 source/archive `4D929BE9D373596472F3B1568C1BB205FF839AF7285C26C1B5B99EEA53D80784`. L'utilisateur demande de redessiner le sifflet et d'ajouter une épée après le premier candidat `exec-e9f32268-e2d9-4d2a-b843-7dd4820ca61f.png`.

Références initiales : neutre exact F08 CDI-142, Tayuya (https://www.zerochan.net/2503292 ; `.tmp/f08-tayuya.png`), sifflet court en bois (https://www.ebay.com/itm/335140050777 ; `.tmp/f08-whistle.jpg`). Recherche en japonais et chinois pour l'attitude musicale de combat. Références externes hors runtime, licences non établies.

Prompt initial :
> Dessine le personnage exact de l'image 1 en garde de combat. Conserve son visage, sa peau, ses longues tresses, ses proportions, sa robe et ses chaussures. Image 2 inspire seulement l'attitude : appuis stables légèrement fléchis, corps de trois-quarts vers la droite, regard intense fixé sur l'adversaire. Son petit sifflet en bois est sorti de sa ceinture et tenu d'une main juste sous le menton, prêt à être porté aux lèvres, sans souffler. L'autre main est ouverte en protection devant elle. Image 3 montre la construction d'un sifflet court ; conserve la taille et les décorations de celui de l'image 1. Un seul sifflet, attache vide à la ceinture. Expression sérieuse sans sourire. Même style, personnage entier, fond transparent, aucune magie ni effet.

Trois références finales : candidat initial, neutre exact F08, épée du Met (`.tmp/cdi-154/f02/smallsword-met.jpg`, https://www.metmuseum.org/art/collection/search/32393). Prompt final :
> Modifie l'image 1 en conservant le personnage, sa pose et ses proportions. Redessine le sifflet tenu près du menton : petit cylindre de bois sculpté élégant, embout net et encoche de sifflet lisible, reprenant celui de la ceinture dans l'image 2 ; pas de forme ronde en bouchon. Dans la main actuellement ouverte à droite de l'image, ajoute une épée légère inspirée de l'image 3, tenue en garde devant elle, lame droite inclinée vers le haut à droite. Prise naturelle, poignée et lame sur le même axe, pointe nette. Garde en laiton discret, poignée prune et détail sarcelle assortis à la tenue. Conserve visage, tresses, robe, jambes et pieds. Cadre assez large pour toute l'épée. Fond transparent, sans effet ni attaque.

Écart visible signalé avant le verdict : le générateur a ajouté un second sifflet à la ceinture. L'utilisateur valide ensuite le candidat exact ; il est conservé sans retouche. Le doublon demeure documenté, sans prétendre qu'il a été retiré. Avant clôture du ticket, expliciter son acceptation comme accessoire supplémentaire ou faire valider une correction ciblée ; ne pas remplacer silencieusement le fichier validé.

Contrôles après verdict : identité, tresses, tenue et proportions générales comparées au neutre F08 et aux gabarits Mage F06/F08 déjà examinés, sans mesure anatomique exacte. Coins transparents vérifiés par le normaliseur. Boîte alpha source (>32) `(6,14)–(869,1751)`. Export `454 × 920`, pivot horizontal `227`, bas de boîte `y=900`, poids `509 096 octets`. Échelle, pivot, budgets et transitions cinéma restent à vérifier lors de l'intégration de la série.

Dix-huit identités validées visuellement : M01–M10 et F01–F08. Prochaine : F09. CDI-154 reste Doing.
## F09 validée — 26 septembre 2026

Validation explicite de `exec-8320dc55-50e1-41e4-92fb-e9fee4757db1.png`, dossier `01a0dd85-e926-7350-9ee3-e03849ef52f2`. Archive exacte `validated-female-v1/aede-female-09-combat-idle-v1.png`, SHA-256 source/archive `AE53D5B2779FAE378D22240781D1BB275EA830357342A2D8D6EBFEBD8CBB8B83`. Un seul candidat, aucune retouche après validation.

Trois références : neutre exact F09 CDI-142, garde de Clare de Claymore (`.tmp/f09-clare-guard.jpg`, https://www.pinterest.com/pin/redirect-notice--458663543311558621/ ; image https://i.pinimg.com/736x/80/8b/e0/808be07f1d50159fd769fbf9cc7aa036.jpg), épée légère du Met (`.tmp/cdi-154/f02/smallsword-met.jpg`, https://www.metmuseum.org/art/collection/search/32393). Recherche japonaise et comparaison avec un fan art de Clare (https://www.zerochan.net/1039666). La pose retenue guide le port de l'épée en travers, sans reprendre la vue plongeante ni la grande lame. Sources externes hors runtime ; attribution et licence de la référence relayée sur Pinterest non réétablies.

Prompt exact :
> Crée une garde de combat du personnage exact de l'image 1. Préserve visage, cheveux, proportions, robe, chaussures et sablier attaché à la ceinture. Image 2 guide seulement le port de l'épée : main armée basse près de la hanche, lame en travers devant le corps dirigée en diagonale vers le haut à droite, main libre prête en retrait. Remplace la grande épée par une épée légère droite de l'image 3, poignée bordeaux et garde de laiton assorties à la tenue. Vue à hauteur du personnage, appuis naturels légèrement fléchis, torse et bassin cohérents sans torsion excessive. Regard déterminé à droite, bouche fermée sans sourire. Attente avant l'action. Même style que l'image 1, pieds et lame entièrement visibles avec marge, fond transparent, aucun effet.

Après verdict : comparaison visuelle au neutre F09 et aux gabarits Mage F06/F08 déjà examinés ; identité, tenue, sablier et proportions générales cohérents, sans mesure anatomique exacte. Coins transparents contrôlés par le normaliseur. Boîte alpha source (>32) `(17,147)–(870,1684)`. Export `504 × 920`, pivot horizontal `252`, bas de boîte `y=900`, poids `575 368 octets`. Pivot, échelle, budgets et transitions en cinéma restent à vérifier lors de l'intégration.

Dix-neuf identités validées visuellement : M01–M10 et F01–F09. Prochaine et dernière : F10. CDI-154 reste Doing.
## F10 validée — 26 septembre 2026

Validation explicite de `exec-c67613b3-e3aa-43eb-b6e3-87fde556444b.png`, dossier `C:/Users/mathr/.codex/generated_images/01a0dd85-e926-7350-9ee3-e03849ef52f2/`. Archive exacte `validated-female-v1/aede-female-10-combat-idle-v1.png`. SHA-256 source/archive identique : `627400628DD5B6EA7EAA08FCE6BBE76B5DE8FD7C557F5E41B41DD151ED542941`. Aucun redessin après verdict.

Le premier candidat `exec-b78a8852-ef88-41fe-9a7f-01e09e6cce1a.png` a une attitude appréciée, mais la réalisation de la main et la longueur du bô sont refusées. Les retouches `exec-a086a1c0-26fc-4aa1-aeeb-8eb610cce063.png`, `exec-b6246883-0b5d-4001-ad0d-64b2067c5487.png` et `exec-c0d3ed35-7d9a-4ee3-8f51-f0a73226fffa.png` sont écartées : changement injustifié de prise ou maintien de la main mal dessinée. L'utilisateur précise que la prise d'origine était bonne, mais son anatomie mal réalisée. Comparaison directe avec la main de Gambit avant la dernière retouche, restée inefficace. Solution finalement validée : nouvelle génération depuis le neutre, sans réinjecter les candidats défectueux. Modification de l'angle du bras et des appuis signalée avant le verdict explicite.

Trois références finales : neutre exact `assets/design/hero-sprites/cdi-142/validated-female-v1/aede-female-10-v1.png`, pose de Gambit (`.tmp/f10-gambit-guard.png`, https://freepngimg.com/png/21550-gambit-free-download/icon ; image https://freepngimg.com/download/gambit/21550-1-gambit-free-download.png), bô droit en chêne (`.tmp/cdi-154/m03/bo-red-oak.jpg`, https://martialartsshopdirect.com/products/bo-staff-standard-red-oak-72-6ft-grade-a-30mm-thick). Référence BD sélectionnée pour la garde au bâton derrière les épaules ; auteur et licence de l'illustration relayée non établis. Références externes hors runtime.

Prompt exact du candidat validé :
> Nouvelle illustration du personnage exact de l'image 1, même style, visage, cheveux, vêtements, proportions et carnet fermé à la hanche. Garde de combat immobile : tournée de trois-quarts vers la droite, pieds largement écartés au sol, genoux légèrement fléchis, main ouverte devant le visage. L'autre main tient un bô derrière les épaules, montant en diagonale vers la droite. Prends directement modèle sur la main de Gambit dans l'image 2 pour dessiner cette prise en perspective et son raccord à l'avant-bras, adaptée à une main nue féminine. Image 3 : bô en bois droit, aussi long que le personnage est grand. Regard déterminé vers la droite, bouche fermée. Aucun costume, gant, carte ni effet de Gambit. Composition assez large pour montrer les deux bouts du bô et les pieds avec marge. Fond entièrement transparent, alpha 0.

Contrôles après verdict : copie exacte vérifiée par SHA-256, coins transparents contrôlés par le normaliseur. Boîte alpha source (>32) `(13,10)–(1301,1190)`. Export `966 × 920`, pivot horizontal géométrique `483`, bas de boîte `y=900`, poids `583 496 octets`. Le pivot géométrique ne prouve pas le pivot des pieds dans le lecteur. Comparaison anatomique technique détaillée, échelle, pivot, budgets et transitions cinéma restent à effectuer avant clôture ; la validation utilisateur porte sur le candidat affiché.

Vingt identités validées visuellement et archivées : M01–M10 et F01–F10. Série complète également présente dans `normalized-alpha-v1`. CDI-154 reste Doing : intégration et contrôles du vrai cinéma non réalisés. Reprendre les critères d'acceptation et le plan de production avant l'intégration. Conserver les réserves de traçabilité M09/F04 et le doublon de sifflet F08 documentés plus haut ; aucune correction silencieuse d'un visuel validé.
## Intégration locale — 26 septembre 2026

Vingt gardes raccordées au cinéma, exports WebP et manifeste avec empreintes. Réglages initiaux d'échelle/pivot par identité ; sources validées intactes. Preuves, commandes, budgets, mesures et limites : [handoff intégration CDI-154](../../../../docs/development/session-2026-09-26-cdi-154-aede-combat-integration.md).

74 tests ciblés réussis ; cinq pages Aède à quatre largeurs, quatre images chargées par page, aucune image entière hors scène. Régression Mage/Acolyte réussie après simplification de leurs tables URL pour le budget. Typecheck, lint, contrôles d'assets, build et budget passent. JS gzip 261 962 / 262 144 octets, marge 182. Quatre gardes les plus lourdes 547 516 octets. Mesures réseau locales, pas une preuve CDN.

CDI-154 reste Doing : verdict utilisateur sur cinq écrans, continuité visuelle neutre/garde et réserves M09/F04/F08 ouverts. Aucun commit/push/déploiement. Conformité visuelle complète non déduite des tests.

Réglage utilisateur du cinéma : écran 1, F01/M01/F02/M02, coefficients d'échelle portés à 1. Les autres identités et pivots restent inchangés. Verdict visuel après ce réglage encore attendu.

Réglage utilisateur suivant : écran 1, F01/M01/F02/M02 passent de 1 à 0.7. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur suivant : écran 1, F01/M01/F02/M02 passent de 0.7 à 0.8. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur suivant : écran 1, F01/M01/M02 passent à 0.75 ; F02 reste à 0.8. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur : écran 2, F03/M03/F04/M04 passent à 0.75. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur suivant : écran 2, F03 à 0.65, M04/F04 à 0.8 ; M03 reste à 0.75. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur suivant : écran 2, F03 à 0.7 et M03 à 0.78 ; F04/M04 restent à 0.8. Verdict visuel attendu.

Réglage utilisateur suivant : écran 2, M04/F04 passent à 0.85 ; F03 reste à 0.7 et M03 à 0.78. Verdict visuel attendu.

Réglage utilisateur suivant : écran 2, M04/F04 passent à 0.88 ; F03 reste à 0.7 et M03 à 0.78. Verdict visuel attendu.

Réglage utilisateur : écran 3, F05/M05 à 0.7, F06 à 0.78 et M06 à 0.8. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur : écran 4, F07/M07/M08 à 0.75 et F08 à 0.8. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur suivant : F07 passe à 0.78. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur suivant : M07 passe à 0.78. Autres identités et pivots inchangés ; verdict visuel attendu.

Réglage utilisateur : écran 5, F09/M10 à 0.75 et F10 à 0.7. M09 reste à 0.73 ; pivots inchangés ; verdict visuel attendu.

Réglage utilisateur suivant : M09 passe à 0.75. Autres identités et pivots inchangés ; verdict visuel attendu.

## Validation finale du cinéma — 26 septembre 2026

Verdict utilisateur explicite : « cinéma validé », après réglage des cinq écrans. Les vingt gardes et leur composition aux échelles finales sont validées. F08 est conservée exactement telle que validée individuellement puis dans le cinéma : le second sifflet déjà signalé fait partie du visuel accepté, sans retouche supplémentaire.

Échelles finales F01–F10 : `0.75, 0.8, 0.7, 0.88, 0.7, 0.78, 0.78, 0.8, 0.75, 0.7`.
Échelles finales M01–M10 : `0.75, 0.75, 0.78, 0.88, 0.7, 0.8, 0.78, 0.75, 0.75, 0.75`.

Réserves de traçabilité levées après lecture des journaux locaux : événements ImageGen `completed` pour F04 le 26 septembre à 12:34:45.041 UTC et M09 à 11:33:38.611 UTC. Prompts, références transmises et identifiants exacts conservés dans `assets/design/hero-sprites/cdi-154/recovered-generation-provenance.json`, sans contenu d'image encodé ni journal complet. Pour F04, la référence unique résulte de la demande utilisateur de reprendre l'image exacte ; pour M09, les trois références de la retouche du regard sont retrouvées. Les limites historiques mentionnées plus haut sont donc résolues par cette preuve.

Audit final : correspondances vingt identités, séparation neutre/garde, retour après action et résultat, sources intactes, aucune modification métier. Nouvelle exécution des 74 tests ciblés : réussite. Recette des cinq pages avec les valeurs finales à 1440/1280/1024/512 px : réussite, images entières contenues et quatre téléchargements image par page. Build réussi ; budget final 261 955 / 262 144 octets gzip JS, plus gros chunk 118 347 octets. Typecheck/lint et vérifications d'assets précédemment réussis ; seuls les coefficients numériques et commentaires ont changé depuis. Pas de mesure CDN ni de déploiement revendiqués. Aucun écart de ce ticket laissé ouvert.

Validation visuelle : utilisateur. Contrôles techniques : Codex. Aucun commit, push ou déploiement dans cette étape. Clôture locale de CDI-154 ; les poses d'action restent dans leurs tickets dédiés.