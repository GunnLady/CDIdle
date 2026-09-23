# CDI-150 M07 — recherche rapière et dague de parade

Date : 20 septembre 2026.

## Intention retenue

M07 utilisera une rapière en main principale et une dague de parade droite en
main gauche. La pose reste une garde d'attente : appuis ouverts, centre de
gravité bas, aucune attaque déjà engagée. La rapière doit être immédiatement
identifiable par sa lame longue, droite, étroite et fortement pointue, avec une
garde protégeant la main. Elle ne doit pas être remplacée par l'épée droite de
M03, un sabre ou une épée courte.

## Références examinées

| Famille | Source | Apport | Limite | Décision |
| --- | --- | --- | --- | --- |
| Histoire / escrime italienne | Ridolfo Capoferro, *The Art and Practice of Fencing*, planche 34 : https://www.freelanceacademypress.com/capoferro.aspx | Coordination explicite rapière/dague, direction des pointes, poignets et appuis | Montre un échange et une fente, pas une garde d'attente | Retenue pour les relations anatomiques et les axes, à convertir en garde statique compacte |
| Histoire / escrime italienne | Giacomo Di Grassi, *Ragione di adoprar sicuramente l'Arme*, garde haute épée et dague : https://www.thearma.org/Manuals/NewManuals/DiGrassi/digrassi.htm | Coordination des deux mains et rôle défensif de la dague | La lame principale n'est pas une référence visuelle assez explicite de rapière pour ce besoin | Écartée de la génération v2 |
| Histoire / escrime italienne | Francesco Alfieri, planche 25, présentée par Boston Academie d'Armes : https://bostonacademiedarmes.com/our-traditions/ | Lignes de défense croisées et placement relatif des armes | Échange dynamique, trop proche d'une action | Écartée de la génération |
| Histoire / objet italien | Ensemble assorti à garde en coupe, rapière et dague de parade, Naples, vers 1650–1675, Metropolitan Museum of Art, objet 51.170.1–.2 : https://www.metmuseum.org/art/collection/search/35868 | Autorité commune pour la différence de longueur, les lames droites, la pointe de rapière, les gardes et la dague de parade ; image domaine public | Ornementation trop riche pour M07 | Retenue pour la géométrie seulement ; simplifier tout décor |
| Histoire / objet moghol | Dague indienne moghole, XVIIIe–XIXe siècle, Metropolitan Museum of Art, objet 36.25.664 : https://www.metmuseum.org/art/collection/search/31836 | Bonne lecture de lame et de pointe ; image Open Access | Dague courbe et poignée sans rapport avec une dague de parade européenne | Écartée de la génération v2 |
| Jeu vidéo | *Assassin's Creed Mirage*, présentation officielle Ubisoft : https://news.ubisoft.com/en-us/article/5iPUc1xBjryc0wwuKFcZIB/how-assassins-creed-mirage-is-a-revitalized-take-on-the-series-roots | Confirme la lecture fantasy crédible d'un combattant agile épée + dague | L'image locale montre un saut, pas une garde d'attente | Écartée de la génération |
| Jeu vidéo | *Solasta II*, Class Spotlight: The Rogue : https://www.solasta-game.com/news/191-dev-update-06-class-spotlight-the-rogue | Silhouette de rogue fantasy et asymétrie des bras | Pose d'attaque, armes courbes jumelles et identité très marquée | Écartée de la génération |
| Jeu vidéo | *Diablo IV*, Quarterly Update — December 2021 : https://news.blizzard.com/en-gb/article/23746639/diablo-iv-quarterly-updatedecember-2021 | Rogue agile, attaques méthodiques et lecture immédiate des lames | Ne fournit pas une garde statique assez précise | Référence de concept seulement, non transmise |
| Manga / anime / jeu japonais | *Sword Art Online: Lost Song*, site officiel Bandai Namco : https://www.bandainamcoent.com/games/sword-art-online-lost-song | Silhouette dual wield immédiatement lisible | Deux épées de longueur proche, trop héroïque et incompatible avec épée + dague | Écartée de la génération |

## Références transmises à ImageGen

1. `assets/design/hero-sprites/cdi-138/validated-male-v1/rogue-male-07-v1.png` :
   autorité exclusive pour l'identité, la morphologie, la tenue et la palette.
2. `capoferro-rapier-dagger-plate34.jpg` : coordination des bras, poignets,
   appuis et axes de rapière/dague ; la fente et les personnages ne doivent pas
   être copiés.
3. `met-cup-hilt-rapier-parrying-dagger.jpg` : géométrie autoritaire de la
   rapière et de la dague de parade ; l'ornementation ne doit pas être copiée.

M03 est explicitement exclu des références : son arme est une épée droite à une
main, pas une rapière.

## Génération v1 rejetée

- Fichier : `exec-e4d59473-2a83-4630-b9b9-3d932a1ac662.png`.
- Motif : M03 avait été transmis comme référence graphique d'épée alors que la
  cible fonctionnelle est une rapière ; le résultat montre une lame courte et
  large qui ne lit pas comme une rapière.
- Décision : rejet utilisateur ; repartir de zéro avec les trois références
  corrigées ci-dessus. Ne pas utiliser v1 comme référence.

## Génération v2 remplacée

- Fichier exact : `exec-8ae0ce8a-5104-446e-89cd-7a597ea72171.png`.
- Candidat : `../../candidates/male/rogue-male-07-combat-idle-v2.png`.
- Dimensions : `1536 × 1024 px`.
- Poids : `1 632 589 octets`, `1 632,589 Ko`, `1,632589 Mo`.
- SHA-256 :
  `2f2fcd3b940608aba54e58958f9340a1b209030e55638a6a5667a6929df1281c`.
- L'ancien comparatif de proportions est annulé : il égalisait à tort la
  hauteur totale d'une garde fléchie et d'une pose debout.
- Rapière : lame longue, étroite, droite et entière ; pointe, garde, poignée,
  poignet et axe continu vérifiés contre l'ensemble 51.170.1–.2 du Met.
- Dague : lame droite nettement plus courte, garde de parade, poignée et poignet
  lisibles ; géométrie vérifiée contre le même ensemble.
- Planches : `../../candidates/male/rogue-male-07-combat-idle-v2-proportion-check.png`,
  `../../candidates/male/rogue-male-07-combat-idle-v2-rapier-check.png` et
  `../../candidates/male/rogue-male-07-combat-idle-v2-dagger-check.png`.
- Verdict : remplacée par V3 afin d'orienter tout le personnage vers la droite.

## Génération v3 et contrôle V4 validés

- Fichier ImageGen exact : `exec-e534b80b-97ed-4909-9298-11ce587fb9ea.png`.
- Candidat : `../../candidates/male/rogue-male-07-combat-idle-v3.png`.
- Dimensions : `1536 × 1024 px`.
- Poids : `2 132 257 octets`, `2 132,257 Ko`, `2,132257 Mo`.
- SHA-256 :
  `0d597bfdec9e47d3dbd60644ac272421c75c26a4166669ccd00ffa706df30108`.
- Verdict artistique : validation utilisateur explicite acquise.
- Archive : `../../validated-male-v1/rogue-male-07-combat-idle-v1.png`, même
  SHA-256 que le candidat.
- Contrôle corrigé : comparaison à diamètre facial équivalent commun, sans
  égalisation de la hauteur corporelle. La garde fléchie conserve sa hauteur
  naturelle. Comparatif :
  `../../candidates/male/rogue-male-07-combat-idle-v3-proportion-check-v4.png`.
  Les V2 et V3 du comparatif sont rejetées : V2 redimensionnait à tort chaque
  gabarit d'après son propre cadre facial ; V3 conservait le cadrage commun,
  mais ses cadres faciaux restaient décentrés vers l'oreille, surtout sur M08.
  V4 exclut oreilles et cheveux et matérialise chaque centre par une croix.
- Verdict du contrôle V4 : validation utilisateur explicite acquise.
- Export runtime définitif :
  `../../normalized-alpha-v1/male/rogue-male-07-combat-idle-v1.png`,
  `1042 × 920 px`, `329 675 octets`, SHA-256
  `c6db9c9e216fb6855afc59d202e022bd892ce54bdf2626d17cd4520b0223daba`.
- Contrôle alpha : un seul composant, aucun pixel sur les bords et aucun résidu
  fuchsia détecté.
