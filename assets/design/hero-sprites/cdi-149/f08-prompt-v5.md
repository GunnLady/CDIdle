# F08 — prompt v5

## Décision de reprise

Recréation complète depuis zéro. Aucune version F08 rejetée (v1 à v4) n'est
transmise. La v4 est rejetée parce que sa hache ressemble trop à un outil
moderne/photographique et n'est pas rendue dans le langage visuel fantasy de la
série.

## Références transmises

1. `assets/design/hero-sprites/cdi-137/validated-female-v1/warrior-female-08-v1.png`
   — autorité stricte pour l'identité, la coiffure, la tenue, les couleurs et
   les proportions de F08.
2. `assets/design/hero-sprites/cdi-149/validated-male-v1/warrior-male-09-combat-idle-v1.png`
   — référence de garde haute à une main uniquement : appuis, bras armé levé,
   poignet neutre et main libre active. Ne pas reprendre le personnage ni son
   épée.
3. `assets/design/hero-sprites/cdi-149/validated-female-v1/warrior-female-06-combat-idle-v1.png`
   — autorité visuelle pour le rendu de la hache : acier martelé dessiné,
   tranchant clair, bois peint, contours et lumière cohérents avec CDI-149.
   Réduire cette logique en une hache compacte à une main ; ne pas reprendre la
   taille de la grande hache, la pose, le personnage ou la tenue de F06.

## Contraintes déterminantes

- générer depuis zéro le personnage exact du neutre F08 ; conserver son visage,
  sa peau, ses longues box braids en queue haute, sa tenue bordeaux et violette,
  ses proportions et tous ses marqueurs ;
- expression sérieuse, concentrée et prête au combat, bouche fermée ;
- garde de combat dynamique et lisible, avec exactement une hache de bataille
  compacte à une main ; l'autre main est vide et active ;
- hache fantasy pratique et sobre, clairement conçue comme une arme de
  guerrière, pas comme une hache de camping ou un outil moderne ;
- tête à lame unique, silhouette légèrement en croissant, poll arrière court et
  contondant, collerette/ferrure discrète ; aucun double tranchant, aucune
  pointe arrière, aucune ornementation excessive ;
- reprendre le rendu illustré de la hache F06 : acier sombre martelé avec
  facettes et petites irrégularités peintes, tranchant argenté net, contours
  sombres, reflets chauds cohérents avec l'armure, manche en bois stylisé ;
- construction lisible et crédible : un seul manche droit et continu, centré
  dans l'œil de la tête, sans décalage latéral, cassure d'axe, pièce flottante
  ni raccord impossible ; la tête est rigide et perpendiculaire au manche ;
- la tête, la lame, le manche, la main et le poignet doivent rester entièrement
  visibles et séparés des cheveux ; aucune fusion avec les tresses ou l'épaule ;
- poignet neutre, coude fléchi, prise ferme, pieds décalés et genoux souples ;
- cadrage assez large pour montrer le personnage, les bottes et toute la hache
  sans plier, raccourcir ou déformer l'arme pour la faire entrer ;
- fond transparent ; proportions conformes au neutre F08 et aux Mages F06/F08 ;
- exclure rendu photo/produit, acier gris uniforme, bois photoréaliste, hache
  utilitaire moderne, logo, texte, filigrane, seconde arme, bouclier, sourire,
  décor et sol.

## Résultat et contrôle

- Candidat : `exec-376cc2c2-5c07-4578-9155-a93068859f01.png`.
- Dimensions : `1 146 × 1 373 px`.
- Poids : `1 189 326 octets`, `1 189,326 Ko`, `1,189326 Mo`.
- SHA-256 :
  `1cac398ffa3f1c74b7b0ba9ec790e111e3dc2174e61ad532ab9ebbc9a4e8093f`.
- Contrôle de proportions : `.tmp/cdi149-f08-v5-proportion-check.png`.
- Contrôle de l'arme et de sa jonction :
  `.tmp/cdi149-f08-v5-weapon-reference-check.png`.
- Verdict structurel et technique : recevable ; rendu de hache cohérent avec
  F06, construction et prise lisibles.
- Verdict utilisateur : validé le 20 septembre 2026.
- Archive :
  `validated-female-v1/warrior-female-08-combat-idle-v1.png`.
