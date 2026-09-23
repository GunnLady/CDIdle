# F08 — prompt v4

## Références transmises

1. `assets/design/hero-sprites/cdi-137/validated-female-v1/warrior-female-08-v1.png`
   — autorité stricte pour l'identité, la tenue et les proportions.
2. `assets/design/hero-sprites/cdi-149/validated-male-v1/warrior-male-09-combat-idle-v1.png`
   — référence structurelle uniquement pour une garde haute à une main, les
   appuis et la main opposée active ; la composition est inversée afin de porter
   l'arme du côté droit de l'image.
3. `assets/design/hero-sprites/cdi-149/references/f08/crkt-woods-chogan-vertical-blade-right.png`
   — autorité mécanique pour toute la hache : manche continu, œil traversé,
   dépassement de bois au-dessus de la tête, petit poll contondant à gauche et
   lame unique à droite.

Source de l'image 3 : vue de profil officielle CRKT du `Woods Chogan T-Hawk`,
longueur `19 in / 482,60 mm`, tête en acier forgé et manche en hickory. La vue a
été tournée rigidement en bloc ; aucune pièce n'a été déplacée ou redessinée.

Les v1, v2 et v3 rejetées ne sont pas transmises.

## Contraintes déterminantes du prompt transmis

- générer depuis zéro le personnage exact du neutre F08, avec identité,
  coiffure, tenue, couleurs, détails et proportions conservés ;
- expression sérieuse et concentrée, bouche fermée, regard vers la droite ;
- exactement une hache de bataille compacte à une main, tenue dans la main
  située à droite de l'image ; l'autre main reste vide et active ;
- placer toute la hache du côté droit extérieur de la silhouette, avec une
  séparation nette entre la tête et le visage, les tresses et l'épaule ;
- reprendre la construction de l'image 3 : un manche en bois continu traverse
  le centre de l'œil métallique et dépasse visiblement au-dessus de la tête ;
- conserver la tête en travers du manche, le petit poll contondant à gauche et
  la lame unique à droite ; aucune douille latérale, aucun cylindre vide, aucun
  bois terminé sous la lame ;
- adapter les matières au style illustré de F08, sans copier le photoréalisme,
  les marquages ou le logo du produit ;
- garde haute crédible, poignet neutre, coude fléchi, pieds décalés et genoux
  souples ; la lame regarde vers la droite et reste éloignée du corps ;
- personnage, bottes et hache intégralement visibles sur fond transparent ;
- proportions conformes au neutre F08 et aux Mages F06/F08 ;
- exclure ancienne hache F08, tête décalée, manche à côté de l'œil, douille
  vide, tête flottante, cassure d'axe, lame tournée vers les cheveux, seconde
  arme, bouclier, hache géante, double lame, pointe arrière, prise inversée,
  perspective forcée, sourire, décor, texte, logo et filigrane.

## Résultat et contrôle

- Candidat : `exec-6ccf44fb-3a11-46bc-86b7-2cf8bd9505e6.png`.
- Dimensions : `1 024 × 1 536 px`.
- Poids : `2 021 454 octets`, `2 021,454 Ko`, `2,021454 Mo`.
- SHA-256 :
  `f79eb495f660c153c100c540b82e8a22c8dcac5140403575dc2aa7022573b1fb`.
- Contrôle de proportions : `.tmp/cdi149-f08-v4-proportion-check.png`.
- Contrôle d'arme complet et jonction agrandie :
  `.tmp/cdi149-f08-v4-weapon-reference-check.png`.
- Résultat mécanique : manche traversant l'œil et dépassant au-dessus, tête
  centrée, lame et poll correctement opposés, axe continu dans la prise.
- Écart : arme placée à gauche de l'image au lieu du côté droit demandé ; la
  géométrie reste fonctionnelle et séparée des tresses.
- Verdict structurel et technique : conforme ; en attente de validation
  visuelle utilisateur sur le rendu et l'écart de composition.
