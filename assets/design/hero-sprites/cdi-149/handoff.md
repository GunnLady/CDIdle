# Handoff et registre — CDI-149 Guerriers `combat_idle`

Date de mise à niveau documentaire : 20 septembre 2026.

## Références autoritaires

- Workflow commun :
  `docs/development/dungeon-2d-combat-idle-sprite-workflow.md`.
- Ticket : `workboard/data/Doing/CDI-149/ticket.md`.
- Bases neutres :
  `assets/design/hero-sprites/cdi-137/validated-male-v1/` et
  `assets/design/hero-sprites/cdi-137/validated-female-v1/`.
- Sources de garde archivées :
  `assets/design/hero-sprites/cdi-149/validated-male-v1/` et
  `assets/design/hero-sprites/cdi-149/validated-female-v1/`.

## Décisions Guerrier validées

- Le Guerrier est un combattant aguerri, prêt au combat, avec une garde
  crédible et une expression concentrée ou sérieuse.
- Les options autorisées sont les armes de mêlée à une main avec bouclier ou
  main libre, les armes à deux mains et les armes jumelles en dual wield.
- Les armes restent dans les familles Force ou Agilité réellement présentes
  dans le domaine partagé.
- La faux de guerre est exclue : elle n'existe pas dans le catalogue du jeu.
- Les dagues simples et les dagues jumelles sont exclues pour le Guerrier :
  leur lecture visuelle est trop fortement associée au Voleur, même si elles
  existent dans le catalogue du jeu.
- Une garde peut élargir le cadre, mais l'arme ne doit jamais être courbée ou
  repliée pour y entrer.
- Chaque nouvelle famille de garde suit la recherche historique, interculturelle
  et culturelle définie par le workflow commun.

## Limite de reconstruction

Ce registre a été créé après les validations M01–M08 et F01. Les sources
archivées et leurs empreintes sont vérifiées sur disque. Les identifiants
ImageGen, prompts exacts, armes et références de ces neuf validations ne sont
pas tous récupérables depuis les fichiers seuls ; ils restent donc marqués
`historique non retracé` plutôt que reconstitués ou inventés.

M09 possède une preuve complète du candidat et des trois références utilisées.
Son verdict utilisateur est acquis et sa source validée est archivée. Les vingt
sprites M01–M10 et F01–F10 disposent maintenant tous d'une source validée ; la
normalisation reste différée avec celle de la planche complète.

## Registre de production

| ID | Source neutre | Arme/garde | Références et prompt | Candidat et proportions | Verdict | Livraison |
| --- | --- | --- | --- | --- | --- | --- |
| M01 | `warrior-male-01-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M02 | `warrior-male-02-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M03 | `warrior-male-03-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M04 | `warrior-male-04-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M05 | `warrior-male-05-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M06 | `warrior-male-06-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M07 | `warrior-male-07-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M08 | `warrior-male-08-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| M09 | `warrior-male-09-v1.png` | Sabre à une main, main gauche libre, garde haute | Base neutre + `references/m09/open-fight-video-1.jpg` + `references/m09/kungfu-vertical-saber-candidate.jpg`; prompt exact non conservé | `exec-39889cdc-242c-405d-816a-b2d297565945.png`; proportions contrôlées et déclarées compatibles | Validé utilisateur | Source validée archivée, non normalisée |
| M10 | `warrior-male-10-v1.png` | Deux haches courtes à simple tranchant, garde asymétrique | Base neutre M10 + M02 validé pour la garde + M03 validé pour la géométrie et le style des haches ; `m10-prompt-v1.md`, `m10-prompt-v2.md` | V1 rejetée ; `exec-a36f3f8c-2c8f-4eba-9dd0-6a9caab09730.png` conforme au contrôle | Validé utilisateur | Source validée archivée, non normalisée |
| F01 | `warrior-female-01-v1.png` | Historique non retracé | Historique non retracé | Source archivée présente | Validé utilisateur | Archivé, non normalisé |
| F02 | `warrior-female-02-v1.png` | Lance à deux mains, garde basse stable ; jumelée librement à M04 | Base neutre F02 + M04 validé pour la garde + gros plan de la pointe M04 pour la géométrie ; `f02-prompt-v1.md` | `exec-34ed7c37-785e-4db0-9922-a97b9f59a986.png` ; proportions et géométrie conformes | Validé utilisateur | Source validée archivée, non normalisée |
| F03 | `warrior-female-03-v1.png` | Épée à une main et bouclier rond, garde compacte | Neutre F03 + M01 validé pour la garde et les armes + Mage F08 pour le gabarit féminin ; `f03-prompt-v1.md` | `exec-37eb394b-802c-46d1-b993-82c684125d5d.png` ; contrôle technique et proportions conformes | Validé utilisateur | Source validée archivée, non normalisée |
| F04 | `warrior-female-04-v1.png` | Masse à deux mains, garde basse diagonale | V1 : neutre F04 + M03 pour la garde + M07 pour la masse ; V2 : correction métal avec M05 ; `f04-prompt-v1.md`, `f04-prompt-v2.md` | V1 rejetée : tête en bois ; `exec-a7e38218-d4f9-4b8c-bf66-501e47b16690.png` conforme, tête entièrement métallique | Validé utilisateur | Source v2 validée archivée, non normalisée |
| F05 | `warrior-female-05-v1.png` | Deux sabres courts, garde asymétrique | Neutre F05 + M02 validé pour la logique dual wield + M09 validé pour la géométrie du sabre ; `f05-prompt-v1.md` | `exec-5049a2c1-3918-4945-baca-ebecba4f68b7.png` ; 1024 × 1536, 2 000 584 octets ; contrôle technique et proportions conformes, résidu lumineux semi-transparent à nettoyer lors de la normalisation | Validé utilisateur | Source v1 validée archivée, non normalisée |
| F06 | `warrior-female-06-v1.png` | Grande hache à deux mains, garde diagonale chargée | Neutre F06 + M03 validé pour la garde et l'axe de la hampe + gros plan de la tête M03 ; `f06-prompt-v1.md`, `f06-prompt-v2.md` | V1 rejetée : hampe coudée et tête rognée ; `exec-32409e71-8dc2-4cd3-9174-4609e2cc4315.png` : hampe rectiligne contrôlée en gros plan, tête entière, proportions conformes | Validé utilisateur | Source v2 validée archivée, non normalisée |
| F07 | `warrior-female-07-v1.png` | Marteau de guerre à une main et bouclier en amande | Neutre F07 + M05 validé pour la garde et le bouclier + gros plan du marteau M05 ; `f07-prompt-v1.md` | `exec-56936372-6b55-4498-9267-6e1ff2e89bd4.png` ; proportions conformes, face de frappe et poignet cohérents, équipement entier | Validé utilisateur | Source v1 validée archivée, non normalisée |
| F08 | `warrior-female-08-v1.png` | Hache de bataille compacte à une main, autre main libre, garde haute | V1–V4 rejetées ; V5 repartie de zéro avec neutre F08 + M09 validé pour la garde haute + F06 validée pour le rendu illustré de la hache ; `f08-prompt-v1.md` à `f08-prompt-v5.md` | `exec-376cc2c2-5c07-4578-9155-a93068859f01.png` ; proportions conformes, jonction et rendu de l'arme contrôlés | Validé utilisateur | Source v5 validée archivée, non normalisée |
| F09 | `warrior-female-09-v1.png` | Épée droite à deux mains, garde haute compacte ; jumelage libre avec M06 pour le langage graphique | Neutre F09 + garde de Fiore/Morgan + épée du Met `2023.580.1` + M06 validé pour le rendu CDI-149 ; recherche dans `references/f09/sources.md` ; `f09-prompt-v1.md` | `exec-4d5ed7f7-5e4c-4d4e-aa20-ee102de0bfa6.png` ; proportions, lame, croix, prise et cadre conformes | Validé utilisateur | Source v1 validée archivée, non normalisée |
| F10 | `warrior-female-10-v1.png` | Lance à une main et bouclier ovale moyen, garde diagonale compacte | Neutre F10 + garde *For Honor* + bouclier zoulou du Met + tête de lance chinoise/mongole du Met + F02 validée pour le rendu CDI-149 ; recherche dans `references/f10/sources.md` ; `f10-prompt-v1.md`, `f10-prompt-v2.md` | V1 rejetée : hampe coudée ; `exec-397bfa37-2ecf-4a5c-b287-809ea7bdcebe.png` : proportions compatibles, hampe droite, douille alignée, bouclier cohérent | Validé utilisateur | Source v2 validée archivée, non normalisée |

## Recherche F10 — lance à une main et bouclier ovale

Huit références ont été comparées dans trois familles : histoire et pratique
martiale, jeux vidéo, manga/anime. La combinaison retenue évite de demander à
une seule image de piloter simultanément l'identité, la pose et deux objets :

- le neutre F10 reste l'autorité exclusive pour le personnage et ses
  proportions ;
- la Valkyrie de *For Honor* fournit seulement une coordination de combat
  lisible entre les bras, la lance et le bouclier ;
- la photographie historique du Met fournit la forme ovale et l'échelle du
  bouclier ;
- la tête de lance chinoise ou mongole du Met fournit une géométrie droite,
  symétrique et correctement emmanchée ;
- F02 validée fournit le langage graphique CDI-149 de la hampe et de l'acier.

La lance doit rester entièrement droite et diagonale, la pointe au-dessus de la
main mais jamais repliée pour entrer dans le cadre. Le bouclier doit protéger le
flanc et le torse sans masquer la silhouette ni reprendre la forme fantaisie de
la référence de jeu. Les sources examinées, transmises et rejetées sont
détaillées dans `references/f10/sources.md`.

## Recherche M10 — deux haches courtes

Six pistes ont été comparées avant sélection :

1. hache de combat du Moyen Empire égyptien, Metropolitan Museum of Art,
   domaine public : géométrie historique claire, mais manche et lame trop longs
   pour le rendu final ;
2. hache de combat scandinave du XVe siècle, Cleveland Museum of Art, Open
   Access : utile pour la structure tête/manche, mais format proche d'une arme
   à deux mains ;
3. tomahawks nord-américains, Smithsonian Libraries, domaine public : utile
   pour l'échelle d'une arme à une main et la variété culturelle ;
4. garde à deux armes de M02 déjà validée dans CDI-149 : meilleure référence de
   pose, d'écartement et de langage visuel pour cette planche ;
5. hache de M03 déjà validée dans CDI-149 : meilleure référence de matière, de
   contour et de lisibilité graphique ;
6. doubles armes de `Ghost of Yōtei` et double hache d'`Assassin's Creed
   Valhalla`, pages officielles PlayStation et Ubisoft : utiles pour comparer
   les silhouettes de jeu vidéo, mais les captures examinées ne fournissent pas
   une garde statique exploitable et ne sont pas transmises à ImageGen.

Décision : transmettre exactement trois images — neutre M10, M02 et M03. La
pose doit reprendre la logique asymétrique de M02 sans copier ses épées : une
hache protège l'avant et l'autre reste prête près de l'épaule. Les deux armes
doivent être des haches courtes à simple tranchant, à manches droits, avec des
poignets naturels et les lames alignées sur les prises. L'identité, la tenue et
les proportions de M10 restent prioritaires.

### Contrôle du candidat M10 v1

- Fichier : `exec-25851270-b1fd-4a34-a14c-c01e770f5afa.png`.
- Dimensions : `1 355 × 1 161 px`.
- Poids : `1 175 493 octets`, `1 175,493 Ko`, `1,175493 Mo`.
- Alpha : transparent aux quatre coins ; zone visible globale
  `1 201 × 1 126 px`, élargie par les armes.
- Comparaison reproductible :
  `.tmp/cdi149-m10-proportion-check.png`, images conservées à leur résolution,
  corps alignés sur les pieds et normalisés en hauteur sans déformation du
  ratio propre à chaque source.
- Repères relevés : la tête représente environ `25 %` de la hauteur corporelle
  verticale du candidat contre `21 %` sur le neutre M10 et environ `18–19 %`
  sur Mage M06/M08. La flexion explique une partie de l'écart vertical, mais la
  comparaison tête/tronc confirme aussi un haut du corps plus massif et plus
  court ; l'écart ne peut donc pas être attribué seulement à la garde.
- Bras : longueurs lisibles et poignets globalement naturels.
- Hanches et jambes : longueurs plausibles, mais la posture très ouverte rend
  la largeur non comparable directement ; aucun tassement supplémentaire
  certain n'est retenu sur les jambes.
- Autres défauts : expression neutre avec léger sourire au lieu d'un visage
  franchement concentré ; hache avant portée vers l'extérieur au lieu de
  couvrir la ligne centrale.
- Verdict : `rejeté avec défaut précis`. Cette image ne devient pas une
  référence et ne doit pas être archivée comme source validée.

## Recherche F02 — lance à deux mains

Le jumelage F02/M04 est retenu : les deux identités partagent un langage bleu
et cotte de mailles, sans exiger une tenue identique. La lance est déclarée
`two_handed` et Force (`str`) dans le domaine partagé.

Pistes comparées :

1. M04 validé dans CDI-149 : référence principale pour la garde basse, les
   mains espacées, la hampe droite et le style graphique de la planche ;
2. traité européen de Giacomo di Grassi, garde d'arme moyenne à deux mains :
   référence technique pour l'espacement des prises et le pied légèrement en
   avant ;
3. méthodes de lance chinoise attribuées à Qi Jiguang : référence technique
   pour le contrôle de pointe et la capacité de retrait défensif ;
4. `Muyedobotongji` coréen : comparaison interculturelle des armes d'hast et
   des prises à deux mains ;
5. modèle de pose PoseMy.Art « warrior holding spear in both hands » : lecture
   anatomique moderne, non transmis à ImageGen ;
6. `Ghost of Yōtei`, page officielle PlayStation consacrée au yari : référence
   de lisibilité jeu vidéo et de contrôle de distance ;
7. manga `Gamaran` et recommandations de manhwa à lancier : références de
   dynamisme culturel, écartées du trio final faute de garde statique et de
   licence adaptée à une transmission directe.

Décision : exactement trois images seront transmises — neutre F02, M04 validé
pour la garde et `.tmp/cdi149-f02-refs/m04-spearhead-geometry.png` pour la
géométrie de la pointe. La pose F02 doit être distincte de M04 par une
orientation plus frontale et un appui inversé, tout en conservant une hampe
parfaitement droite, deux prises colinéaires, une pointe complète et une
expression sérieuse.

## Recherche F03 — épée à une main et bouclier rond

Les dagues simples et jumelles ont été écartées avant génération, car leur
lecture de classe est trop fortement associée au Voleur. Sept pistes ont été
comparées pour obtenir une garde de Guerrier nette :

1. M01 validé dans CDI-149 : meilleure référence interne de garde compacte,
   bouclier avancé et épée disponible sans masquer le visage ;
2. `Liber de Arte Dimicatoria` (I.33), traité historique d'épée et bocle :
   référence technique pour coordonner ligne de défense, arme et bouclier ;
3. Antonio Manciolino, gardes d'épée et bocle : référence historique pour le
   bouclier projeté vers l'adversaire et l'épée tenue disponible en retrait ;
4. rotella milanaise du Metropolitan Museum of Art, vers 1570–1580, domaine
   public : référence de diamètre, convexité et construction métallique ;
5. `Goblin Slayer`, page officielle Square Enix : référence manga/fantasy pour
   la lecture immédiate d'un combattant aguerri à l'équipement pragmatique ;
6. `Monster Hunter 3 Ultimate`, documentation officielle Nintendo : référence
   jeu vidéo pour une combinaison épée-bouclier mobile et polyvalente ;
7. PoseMy.Art, collection `Sword And Shield Pose` : contrôle anatomique moderne
   de la répartition du poids, du bras de bouclier et de la silhouette.

Décision : transmettre exactement trois images — neutre F03 comme autorité
d'identité et de tenue, M01 validé pour la logique de garde et la géométrie des
armes, Mage F08 pour le gabarit féminin. La nouvelle pose ne copie pas M01 :
bouclier rond avancé devant le flanc gauche, épée courte à une main tenue sur le
côté droit avec la pointe oblique vers l'avant, poignets neutres, pieds décalés
et centre de gravité abaissé. Le visage doit être sérieux et concentré. Aucun
élément de voleur, aucune dague et aucun effet de décor ne sont autorisés.

## Recherche F04 — masse à deux mains

Sept pistes ont été comparées avant la génération :

1. M03 validé dans CDI-149 : meilleure référence interne pour une garde basse
   à deux mains, des prises espacées et un axe d'arme lisible ;
2. M07 validé dans CDI-149 : référence interne pour la construction, les
   matières et la silhouette d'une masse lourde dans le style de la planche ;
3. marteau de guerre ou pollaxe allemand du XVe siècle, Metropolitan Museum of
   Art : référence historique de longueur maniable et de construction robuste ;
4. marteau de guerre italien du XVe siècle, Metropolitan Museum of Art :
   comparaison historique des armes longues utilisées à pied en armure ;
5. pose `holding large weapon` de Clip Studio Assets : contrôle anatomique
   moderne pour une arme lourde tenue à deux mains ;
6. guerrières au marteau dans les productions japonaises, notamment Itsuki de
   `Sengoku BASARA` : référence culturelle pour une silhouette féminine lisible
   avec une arme lourde, sans reprendre l'exagération de taille ;
7. Guerrier de `World of Warcraft` et marteau du Guerrier de `Guild Wars 2` :
   références jeu vidéo pour l'association explicite Guerrier/masse à deux
   mains et la lecture d'impact, sans transmettre leurs images à ImageGen.

Décision : transmettre exactement trois images — neutre F04 comme autorité
d'identité et de tenue, M03 validé pour l'axe, les mains et la garde basse,
M07 validé pour la géométrie et le rendu de la masse. L'arme doit conserver une
tête contondante cylindrique cerclée de métal, sans lame ni bec, sur une hampe
droite légèrement plus courte que celle de M03. Les deux mains restent sur le
même axe, la tête orientée vers l'avant et le visage sérieux. L'arme ne repose
pas sur l'épaule et ne doit jamais être courbée pour entrer dans le cadre.

## Recherche F05 — deux sabres courts

Huit pistes ont été comparées avant la génération :

1. M02 validé dans CDI-149 : meilleure référence interne de garde asymétrique à
   deux armes, de séparation des mains et de silhouette immédiatement lisible ;
2. M09 validé dans CDI-149 : référence interne pour la courbure légère, le dos,
   le tranchant, la poignée et le rendu graphique d'un sabre cohérent ;
3. chapitre `Ssanggeom` du `Muyedobotongji` coréen : source historique et
   interculturelle sur l'emploi de deux épées assorties, une dans chaque main ;
4. méthodes chinoises de `shuang jian` et doubles dao : comparaison historique
   des armes jumelles légères, du contrôle de distance et des appuis ;
5. `The Twin Swords of the Sima`, manhwa d'action historique : référence
   culturelle coréenne pour la lecture fictionnelle de deux lames coordonnées ;
6. personnages dual wield de manga/anime, dont les représentations de sabreurs
   à deux armes : référence de dynamisme, écartée du trio final pour éviter les
   poses exagérées et les prises inversées ;
7. doubles lames de `Monster Hunter`, documentation officielle Capcom :
   référence jeu vidéo de mobilité et d'enchaînement à deux armes ;
8. dual katana de `Ghost of Yōtei`, page officielle PlayStation : référence jeu
   vidéo pour une silhouette asymétrique claire et deux armes non fusionnées.

Décision : transmettre exactement trois images — neutre F05 comme autorité
d'identité et de tenue, M02 validé pour la logique de garde dual wield, M09
validé pour la géométrie d'un sabre. Les deux armes seront des sabres courts
assortis, clairement plus longs que des dagues mais nettement plus compacts que
les épées de M02. Les deux prises restent normales, jamais inversées ; une lame
protège l'avant et l'autre reste disponible près de l'épaule, sans croiser les
poignets ni menacer le corps du personnage.

## Recherche F06 — grande hache à deux mains

Huit pistes ont été comparées avant la génération :

1. M03 validé dans CDI-149 : référence interne prioritaire pour une tête simple
   lame déjà approuvée, une hampe droite et une garde diagonale lisible ;
2. hache danoise du National Museum of Denmark : référence historique pour une
   grande lame mince, réellement martiale, montée sur une hampe de plus d'un
   mètre et maniée à deux mains ;
3. `Le Jeu de la Hache`, garde de la dague et garde de la queue : référence
   technique pour la prise en tiers, les mains espacées, les bras légèrement
   fléchis et l'arme chargée en diagonale sans poser sur l'épaule ;
4. `Goblin Slayer`, Female Warrior : référence manga/anime de guerrière lourde
   à grande hache, utile pour la présence martiale mais écartée comme modèle
   anatomique ;
5. `Vinland Saga`, combattants à hache : référence manga/anime pour le poids
   visuel d'une grande hache et les appuis, sans reprendre les exagérations ;
6. `Monster Hunter`, mode hache de la Switch Axe : référence jeu vidéo pour une
   silhouette large et dynamique, écartée pour éviter une arme mécanique trop
   massive ;
7. Berserker de `Bless Unleashed`, page officielle Bandai Namco : référence jeu
   vidéo fantasy pour la puissance lisible d'une grande hache ;
8. hache à deux mains de `Echoes of Aincrad`, page officielle Bandai Namco :
   référence jeu vidéo pour une arme lente, puissante et incompatible avec un
   bouclier.

Sources web principales :

- <https://en.natmus.dk/historical-knowledge/denmark/prehistoric-period-until-1050-ad/the-viking-age/weapons/axes/> ;
- <https://www.selohaar.org/CW2010/Jeu_de_la_Hache_handout.pdf> ;
- <https://www.bandainamcoent.com/news/choose-your-class-make-them-pray> ;
- <https://www.bandainamcoent.com/games/echoes-of-aincrad/weapons-and-enemy-types>.

Décision : transmettre exactement trois images — neutre F06 comme autorité
d'identité, de tenue et de proportions, M03 validé comme référence de garde,
de prise et d'axe, puis `references/f06/m03-greataxe-head.png` comme autorité de
géométrie pour la tête. La hache aura une seule lame en croissant, sans bec,
sans pointe arrière et sans seconde arme. La tête reste vers l'avant à hauteur
d'épaule, la hampe descend en diagonale devant le corps, les mains sont espacées
et les poignets restent naturels.

## Recherche F07 — marteau de guerre et bouclier en amande

Huit pistes ont été comparées avant la génération :

1. M05 validé dans CDI-149 : référence interne prioritaire pour la séparation
   nette marteau/bouclier, l'orientation de la face de frappe et une garde
   défensive immédiatement lisible ;
2. `Foot Combat with War Hammers and Tartsche Shields`, série `Freydal`, vers
   1512–1515, National Gallery of Art : référence historique directe de combat
   à pied avec marteaux et boucliers ;
3. livre de combat de Hans Talhoffer, présenté par le Metropolitan Museum of
   Art : référence historique pour les armes contondantes, les appuis et le
   caractère actif d'une garde blindée ;
4. carreau de Chertsey `Trial by Combat`, XIIIe siècle : autre preuve culturelle
   d'une combinaison marteau à une main et bouclier ;
5. boucliers normands en amande et représentations de la tapisserie de Bayeux :
   référence de silhouette, de couverture du flanc et de fixation à l'avant-bras ;
6. chevalières de manga et fantasy, notamment `How to Treat a Lady Knight
   Right` : référence culturelle pour une posture féminine martiale, écartée
   comme autorité d'arme ou d'anatomie ;
7. Paladin de `Diablo IV`, page officielle PlayStation : référence jeu vidéo
   explicite du couple marteau-bouclier et de sa lecture de classe ;
8. combinaison équilibrée marteau-bouclier de `Babylon's Fall`, article officiel
   PlayStation Blog : référence jeu vidéo d'une silhouette défensive offensive.

Sources web principales :

- <https://www.nga.gov/artworks/216087-foot-combat-war-hammers-and-tartsche-shields> ;
- <https://www.metmuseum.org/de/essays/hans-talhoffers-fight-book-a-sixteenth-century-manuscript-about-the-art-of-fighting> ;
- <https://chertseytiles.holycross.edu/the-chertsey-tiles/trial-by-combat-tile/> ;
- <https://www.playstation.com/en-th/games/diablo-iv/> ;
- <https://blog.playstation.com/?p=350253>.

Décision : transmettre exactement trois images — neutre F07 comme autorité
d'identité, tenue et proportions, M05 validé pour la garde et le bouclier, puis
`references/f07/m05-warhammer-head-tight.png` pour la géométrie du marteau. Le
bouclier sera en amande, tenu devant le flanc gauche sans masquer le visage ni
toute la tenue. La face carrée du marteau sera orientée vers l'adversaire ; le
bec arrière restera court et ne devra jamais devenir une seconde lame.

## Recherche F08 — hache à une main et main gauche libre

Huit pistes ont été comparées avant la génération :

1. M09 validé dans CDI-149 : référence interne prioritaire pour une garde haute
   à une main, un poignet naturel et une main opposée libre mais active ;
2. M10 validé dans CDI-149 : référence interne de géométrie, de matières et de
   lisibilité d'une hache courte à simple tranchant ;
3. hache de bataille viking du British Museum : référence historique pour une
   lame martiale mince plutôt qu'une masse de fantasy surdimensionnée ;
4. tête de hache scandinave des XIe–XIIe siècles du Metropolitan Museum of Art :
   comparaison historique de l'œil, du col et du profil de coupe ;
5. hache de bataille viking du London Museum : référence culturelle et
   archéologique complémentaire pour une silhouette fonctionnelle ;
6. gardes à la hache dans les mangas, manhwa et illustrations fantasy : utiles
   pour la lisibilité d'une garde haute, mais écartées comme autorité anatomique
   afin d'éviter la perspective forcée et les armes géantes ;
7. `God of War`, documentation officielle PlayStation : référence jeu vidéo
   pour le poids lisible d'une hache à une main et l'alignement du corps ;
8. rétrospective officielle PlayStation sur la conception de la Leviathan Axe :
   référence jeu vidéo pour une silhouette immédiatement identifiable sans
   reprendre sa taille ni son design propriétaire.

Pour la v3, la référence de détail partielle M10 est remplacée par la photo CC0
de la hache de bataille scandinave du XVe siècle, accession `1916.1601`, du
Cleveland Museum of Art. La photo complète montre la continuité réelle du
manche, de l'œil et de la tête. Une copie miroir complète — sans recadrage ni
rotation indépendante de la tête — place le tranchant vers la droite :
`references/f08/cleveland-battle-axe-full-facing-right.jpg`.

Pour la v4, la référence du Cleveland Museum est abandonnée comme entrée
ImageGen : sa construction latérale reste trop ambiguë visuellement pour le
modèle. Elle est remplacée par la vue de profil officielle du `Woods Chogan
T-Hawk` de CRKT, arme complète de `48,26 cm` à tête forgée et manche en hickory.
La vue source `references/f08/crkt-woods-chogan-profile.png` montre clairement
le manche traversant l'œil. La version
`references/f08/crkt-woods-chogan-vertical-blade-right.png` est uniquement la
rotation rigide de toute l'image : tête en haut, manche en bas, lame à droite.
Elle conserve notamment le témoin visuel décisif du bois qui dépasse au-dessus
de l'œil.

Décision : transmettre exactement trois images — neutre F08 comme autorité
d'identité, tenue et proportions, M09 validé uniquement pour la garde haute à
une main et la logique de la main libre, puis
`references/f08/m10-single-axe-head-facing-right.png` pour la géométrie et le rendu d'une
hache compacte à simple tranchant. F08 tient exactement une hache dans la main
droite, près de l'épaule sans la poser sur le corps ou les cheveux. Le tranchant
regarde vers l'adversaire, la hampe courte reste rectiligne dans le poing et le
poignet reste neutre. La main gauche vide protège la ligne centrale. Aucun
bouclier, aucune seconde arme, aucune double lame et aucune hache géante.

### Contrôle F08 v1

- Fichier : `exec-57004d60-3016-429d-b1e1-584d49d70fae.png`.
- Dimensions : `882 × 1 783 px`.
- Poids : `1 374 514 octets`, `1 374,514 Ko`, `1,374514 Mo`.
- SHA-256 :
  `2902773ff176952a7f0f9223899bee610abf035fd1382a335c37a6977620b6c0`.
- Proportions : compatibles avec le neutre F08 et les Mages F06/F08.
- Défaut bloquant : le personnage et l'adversaire implicite sont orientés vers
  la droite, mais la lame est placée à gauche de l'œil de la hache. Le talon ou
  le plat mènerait donc le mouvement suggéré vers l'adversaire.
- Verdict : rejet technique ; la v1 n'est ni archivée ni réutilisée comme
  référence.

### Contrôle F08 v2

- Fichier : `exec-2448624a-c5af-4833-9df1-0520366016de.png`.
- Dimensions : `1 076 × 1 462 px`.
- Poids : `1 298 509 octets`, `1 298,509 Ko`, `1,298509 Mo`.
- SHA-256 :
  `a18f58bf6dc41ef0fb6192a12ef63550e99d92b381904e046c1bdb239965a5bb`.
- Comparaison : `.tmp/cdi149-f08-v2-proportion-check.png`, corps alignés sur les
  pieds et normalisés à hauteur égale sans modifier le ratio propre de chaque
  source.
- Proportions : tête, épaules, tronc, bras, hanches et jambes compatibles avec
  le neutre F08 et les Mages F06/F08 ; l'écartement supplémentaire vient de la
  garde et non d'un changement anatomique.
- Arme : tête entière, lame à droite de l'œil et dirigée comme le regard ; hampe
  droite et colinéaire avec le poing, poignet et coude cohérents. Le contrôle
  initial a toutefois omis la jonction avec la tête : l'axe de l'œil/du col
  métallique n'est pas continu avec celui de la hampe et crée une cassure
  mécanique nette.
- Main gauche : vide, entière et active ; stylisation lisible sans anomalie
  structurelle certaine.
- Alpha : `7` pixels semi-transparents sur le bord gauche, résidu mineur à
  nettoyer lors de la normalisation ; aucun équipement n'est rogné.
- Verdict technique corrigé : rejeté. Le verdict `conforme` initial était faux
  car il s'appuyait sur la rectitude de la hampe et l'orientation du tranchant
  sans contrôler séparément l'axe de l'œil/du col. La v2 n'est pas archivée et
  ne doit pas servir de référence.

### Contrôle F08 v3

- Fichier : `exec-34f044c5-a40c-4c04-8e3e-7458c8dffd19.png`.
- Dimensions : `1 024 × 1 536 px`.
- Poids : `1 943 755 octets`, `1 943,755 Ko`, `1,943755 Mo`.
- SHA-256 :
  `92c57443815dfbd8a1ad7b460ee7ea1f382e908dc6444bb22fd9004546083dfb`.
- Comparaison : `.tmp/cdi149-f08-v3-proportion-check.png`, corps alignés sur les
  pieds et normalisés à hauteur égale sans déformer le ratio de chaque source.
- Comparaison d'arme avec la référence réellement transmise :
  `.tmp/cdi149-f08-v3-weapon-reference-check-v2.png`, produite par le script
  générique `scripts/new-combat-idle-weapon-reference-check.ps1`. Le montage
  conserve le ratio propre du candidat et de la photo CC0, sans les déformer,
  et ajoute obligatoirement un gros plan séparé de chaque jonction.
- Proportions : tête, épaules, tronc, bras, hanches et jambes compatibles avec
  le neutre F08 et les Mages F06/F08 ; la largeur supplémentaire vient de la
  garde et des appuis.
- Manche : axe continu du pommeau à la ligature supérieure ; la prise et le
  poignet suivent cet axe sans cassure.
- Œil/douille, verdict corrigé après inspection agrandie à `4×` : le manche ne
  traverse pas l'œil. Le bois remonte à droite de la douille métallique et se
  termine sous la naissance de la lame, tandis que le cylindre de douille reste
  décalé à gauche. La tête est donc fixée à côté du manche. Le contrôle précédent
  avait confondu le contour extérieur du col avec le trajet réel du bois.
- Tête et frappe : tête entière et rigide, lame unique à droite de l'œil ; le
  tranchant mène le mouvement vers la droite comme le regard, sans frappe par
  le plat ou le talon.
- Taille : arme entière et proportionnée comme hache à une main. Le montage
  montre toutefois que le manche a été raccourci relativement à la tête par
  rapport à la hache de musée de `93,3 cm`. C'est l'adaptation fonctionnelle
  voulue vers une arme à une main, mais ce n'est pas la « réduction uniforme »
  demandée littéralement dans le prompt ; la référence reste autoritaire pour
  l'emmanchement, la tête et le tranchant, pas pour la longueur totale.
- Mains : prise armée et poignet cohérents ; poing libre entier et actif.
- Fond : halo brun semi-transparent important et `7` pixels visibles au bord
  gauche, à nettoyer lors de la normalisation ; aucun personnage, membre ou
  équipement n'est rogné.
- Verdict technique corrigé : rejeté pour géométrie mécaniquement impossible de
  l'emmanchement. La v3 n'est pas archivée et ne doit pas servir de référence.

### Contrôle F08 v4

- Fichier : `exec-6ccf44fb-3a11-46bc-86b7-2cf8bd9505e6.png`.
- Dimensions : `1 024 × 1 536 px`.
- Poids : `2 021 454 octets`, `2 021,454 Ko`, `2,021454 Mo`.
- SHA-256 :
  `f79eb495f660c153c100c540b82e8a22c8dcac5140403575dc2aa7022573b1fb`.
- Proportions : `.tmp/cdi149-f08-v4-proportion-check.png` ; tête, épaules,
  tronc, bras, hanches et jambes compatibles avec le neutre F08 et les Mages
  F06/F08 après alignement des pieds et normalisation en hauteur sans
  déformation des ratios.
- Arme et référence : `.tmp/cdi149-f08-v4-weapon-reference-check.png`, avec arme
  entière et jonction agrandie du candidat comparées à
  `references/f08/crkt-woods-chogan-vertical-blade-right.png`.
- Emmanchement : le bois traverse le centre de l'œil et dépasse visiblement
  au-dessus de la tête ; aucun cylindre vide, montage latéral ou tête flottante.
- Axe et prise : manche continu du pommeau au capuchon de bois, colinéaire dans
  le poing ; poignet et coude cohérents.
- Tête et frappe : poll contondant à gauche, lame unique à droite, tranchant
  orienté comme le regard ; tête entière et espace visible avec les tresses.
- Écart de composition : ImageGen a replacé l'arme et la main armée à gauche de
  l'image au lieu de la garde inversée demandée à droite. Cet écart n'introduit
  pas de défaut mécanique certain mais doit être accepté ou refusé par la
  validation visuelle utilisateur.
- Fond : halo brun semi-transparent important et `1` pixel visible au bord
  gauche, à nettoyer lors de la normalisation ; aucun équipement n'est rogné.
- Verdict final : rejet visuel utilisateur. Malgré une géométrie exploitable,
  le rendu de la hache paraît trop proche d'un outil moderne/photographique et
  n'emploie pas assez le langage illustré fantasy des armes déjà validées. La
  v4 n'est pas archivée et ne doit pas servir de référence.

### Contrôle F08 v5

- Recréation complète depuis zéro ; aucune version F08 rejetée n'a été
  transmise.
- Fichier : `exec-376cc2c2-5c07-4578-9155-a93068859f01.png`.
- Dimensions : `1 146 × 1 373 px`.
- Poids : `1 189 326 octets`, `1 189,326 Ko`, `1,189326 Mo`.
- SHA-256 :
  `1cac398ffa3f1c74b7b0ba9ec790e111e3dc2174e61ad532ab9ebbc9a4e8093f`.
- Références réellement transmises : neutre F08 pour l'identité, la tenue et
  les proportions ; M09 validé pour la structure d'une garde haute à une main ;
  F06 validée pour le rendu illustré de la hache uniquement.
- Proportions : `.tmp/cdi149-f08-v5-proportion-check.png` ; tête, épaules,
  tronc, bras, hanches et jambes compatibles avec le neutre F08 et les Mages
  F06/F08 après alignement des pieds et normalisation en hauteur sans
  déformation des ratios.
- Arme et référence : `.tmp/cdi149-f08-v5-weapon-reference-check.png`, avec la
  hache entière et la jonction agrandie comparées à la hache validée de F06.
- Rendu de l'arme : acier martelé dessiné, tranchant clair, contours sombres,
  reflets chauds et bois peint cohérents avec CDI-149 ; l'aspect outil moderne
  et photoréaliste de la v4 a disparu.
- Géométrie observée : manche rectiligne et continu dans la prise et jusqu'à la
  tête ; tête rigide, lame unique en croissant et poll arrière court. Le gros
  plan ne montre ni tête flottante, ni raccord latéral, ni cassure d'axe.
- Garde : prise haute à une main, poignet neutre, coude fléchi, main opposée
  vide et active, appuis larges et stables. L'arme reste entière et séparée du
  visage ; quelques tresses passent derrière la partie basse du manche sans
  masquer la jonction.
- Alpha : aucun pixel visible sur les quatre bords ; aucun personnage, membre
  ou équipement rogné.
- Verdict structurel et technique : recevable.
- Verdict utilisateur : validé le 20 septembre 2026.
- Source validée archivée :
  `validated-female-v1/warrior-female-08-combat-idle-v1.png`.
- L'empreinte de l'archive est identique à celle du candidat ; la normalisation
  reste différée avec celle de la planche complète.

## Empreintes des sources archivées

Les poids utilisent les unités décimales demandées : `1 Ko = 1 000 octets` et
`1 Mo = 1 000 000 octets`.

| ID | Chemin archivé | Octets | Ko | Mo | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| M01 | `validated-male-v1/warrior-male-01-combat-idle-v1.png` | 1 129 865 | 1 129,865 | 1,129865 | `c8b7982285d6433ee4fc9e4bc991e70e9b70c4017b4352c7f37af643a2814e82` |
| M02 | `validated-male-v1/warrior-male-02-combat-idle-v1.png` | 1 165 857 | 1 165,857 | 1,165857 | `086ced5070c9424597e322269e48403e7091fdf2627e45cc0715f2a931f6cacd` |
| M03 | `validated-male-v1/warrior-male-03-combat-idle-v1.png` | 1 034 424 | 1 034,424 | 1,034424 | `cfac867115bf3477c795ab51f56c9b033ed8102cf05563b8b75226c87ec84999` |
| M04 | `validated-male-v1/warrior-male-04-combat-idle-v1.png` | 716 502 | 716,502 | 0,716502 | `c88268d1d38560544187ba5405845d6245c82a7d9a9e55c2708f05f285a9b7cd` |
| M05 | `validated-male-v1/warrior-male-05-combat-idle-v1.png` | 1 134 462 | 1 134,462 | 1,134462 | `d54a9adaf53adae66300abaf05882995d07358f9a1ef95e262d43b612d468831` |
| M06 | `validated-male-v1/warrior-male-06-combat-idle-v1.png` | 1 609 932 | 1 609,932 | 1,609932 | `0bfb52dba01b4ff7532eb1123406092abb4a73e1985ccc09244f5cdfe7696439` |
| M07 | `validated-male-v1/warrior-male-07-combat-idle-v1.png` | 910 813 | 910,813 | 0,910813 | `c559435202044d65c0974c3d3a4ba6031c3df15e0b48f3337affe6825dcff802` |
| M08 | `validated-male-v1/warrior-male-08-combat-idle-v1.png` | 1 759 216 | 1 759,216 | 1,759216 | `b906b362c3cf0b9d035f060e16dbdc6fc77dd3b307e5f6401f95fc88156ab3b1` |
| M09 | `validated-male-v1/warrior-male-09-combat-idle-v1.png` | 1 312 100 | 1 312,100 | 1,312100 | `e7427223d859320761d4aa88184989a3331eafbecd9d78d8233330957cdea646` |
| M10 | `validated-male-v1/warrior-male-10-combat-idle-v1.png` | 1 017 118 | 1 017,118 | 1,017118 | `713626be86bc7cfee70ee7e3b4669deffee94bd182d2f5d79395949c6db07025` |
| F01 | `validated-female-v1/warrior-female-01-combat-idle-v1.png` | 1 518 548 | 1 518,548 | 1,518548 | `f5e9772fb08ccae08bb7bb9fb3ba2325d5a289e7817942f13c6f14451daff4bf` |
| F02 | `validated-female-v1/warrior-female-02-combat-idle-v1.png` | 831 398 | 831,398 | 0,831398 | `e240a122843cec491543c5d25f651978ee71ddbb9268da1f6156b22a19c35ebb` |
| F03 | `validated-female-v1/warrior-female-03-combat-idle-v1.png` | 1 292 553 | 1 292,553 | 1,292553 | `0b58e8b8ffa15c94e037f2b44b4edda793ae59097f221d5fe93ea5c0bea62963` |
| F04 | `validated-female-v1/warrior-female-04-combat-idle-v1.png` | 1 083 544 | 1 083,544 | 1,083544 | `acb7f684f42cfa1aa182d74f7495b4b83915b30eb7ce970bb733677fd3612786` |
| F05 | `validated-female-v1/warrior-female-05-combat-idle-v1.png` | 2 000 584 | 2 000,584 | 2,000584 | `a2734d465a9fb88deb8152c725bf556e1fc57d1b026effdb9e263a25bbec6ea9` |
| F06 | `validated-female-v1/warrior-female-06-combat-idle-v1.png` | 1 017 460 | 1 017,46 | 1,01746 | `b2a25a700ce74a56698853acadae0cf9f01d63dcb8dd1565236ee6f074540725` |
| F07 | `validated-female-v1/warrior-female-07-combat-idle-v1.png` | 2 352 559 | 2 352,559 | 2,352559 | `98966104259b3ffbacf1230113fd96f84121f5e39200ff75292ce65fc9e6ead7` |
| F08 | `validated-female-v1/warrior-female-08-combat-idle-v1.png` | 1 189 326 | 1 189,326 | 1,189326 | `1cac398ffa3f1c74b7b0ba9ec790e111e3dc2174e61ad532ab9ebbc9a4e8093f` |
| F09 | `validated-female-v1/warrior-female-09-combat-idle-v1.png` | 1 791 538 | 1 791,538 | 1,791538 | `2994142e7097f324ed90af744f75b4b992161c9cb4f07b8ff3745cc8aef4ff47` |
| F10 | `validated-female-v1/warrior-female-10-combat-idle-v1.png` | 1 104 638 | 1 104,638 | 1,104638 | `8530d3bbda8857fc1ed5a504a72b8a51a1dc8acffc91f0d2e5339d24b68a5921` |

## Candidat M09 validé et archivé

- Fichier exact : `exec-39889cdc-242c-405d-816a-b2d297565945.png`.
- Emplacement temporaire vérifié :
  `C:/Users/mathr/.codex/generated_images/01a0b368-820d-79e1-b360-6054bfdbbb9e/exec-39889cdc-242c-405d-816a-b2d297565945.png`.
- Dimensions vérifiées avant validation : `882 × 1784 px`.
- Poids : `1 312 100 octets`, `1 312,100 Ko`, `1,312100 Mo`.
- SHA-256 :
  `e7427223d859320761d4aa88184989a3331eafbecd9d78d8233330957cdea646`.
- Références réellement transmises : base neutre M09,
  `references/m09/open-fight-video-1.jpg` et
  `references/m09/kungfu-vertical-saber-candidate.jpg`.
- Verdict utilisateur : validé le 20 septembre 2026.
- Source validée archivée :
  `validated-male-v1/warrior-male-09-combat-idle-v1.png`.
- La normalisation reste différée avec celle de la planche complète.

## Jalon de série et previews validé

- Les vingt sources validées ont été normalisées en alpha sans utiliser
  l'enveloppe des armes pour fixer l'échelle du personnage.
- M01 définit le diamètre facial masculin et F01 le diamètre facial féminin.
  Les ajustements finaux demandés sont conservés dans
  `scripts/prepare-cdi-149-warrior-combat-assets.ps1`.
- Tous les exports partagent un canevas de `920 px` de haut et un bas d’alpha
  visible à `y = 900`. La largeur reste libre afin de ne jamais réduire, tordre
  ou rogner une arme longue.
- Les previews claires et sombres finales sont versionnées `v2` sous
  `normalized-alpha-v1/previews/`.
- Verdict utilisateur du 20 septembre 2026 : previews masculine et féminine
  validées.
- Intégration technique préparée : les clés Warrior `combat_idle` utilisent
  un rendu par hauteur autoritaire afin qu'une arme large ne réduise pas le
  personnage dans le lecteur réel.

## Jalon cinéma validé

- Le cinéma autoritaire est le harness réel
  `tests/browser/fixtures/dungeon-harness.html?warrior-cinema=1..5` ; les
  captures PNG temporaires de revue ne font pas partie de la livraison.
- Après la première revue, le centrage horizontal a été corrigé : chaque
  variante possède un pivot placé au milieu de l’écart entre ses deux zones
  d’appui, indépendamment de la géométrie de son arme.
- Le lecteur sépare désormais la position centrale de l’acteur (`50 %`) du
  pivot interne propre au sprite. Le contrôle Playwright tolère au plus `1 px`
  d’écart entre ces deux points rendus.
- Verdict utilisateur du 20 septembre 2026 : les cinq pages du harness sont
  validées après cette correction de pivot.
- Preuves techniques finales : `20/20` sprites CDI-149 chargés dans les cinq
  pages ; `69/69` tests unitaires ciblés ; `3/3` scénarios Playwright de retour
  en garde ; test Playwright CDI-149 `5/5` ; typecheck, lint, build, contrôle du
  bundle, contrôle des assets et validation Workboard réussis.
- Budget compressé du pire groupe de quatre sprites : `2 087 142 octets` sur
  `2 097 152 octets`. La marge restante est de `10 010 octets` ; toute
  régénération d’un PNG doit donc repasser le contrôle de budget.
