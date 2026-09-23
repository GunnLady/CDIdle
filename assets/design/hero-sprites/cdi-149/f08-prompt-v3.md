# F08 — prompt v3

## Références transmises

1. `assets/design/hero-sprites/cdi-137/validated-female-v1/warrior-female-08-v1.png`
   — autorité stricte pour l'identité, la tenue et les proportions.
2. `assets/design/hero-sprites/cdi-149/validated-male-v1/warrior-male-09-combat-idle-v1.png`
   — référence structurelle uniquement pour une garde haute à une main, les
   appuis, le poignet et la main opposée libre ; exclure le personnage, sa tenue
   et son sabre.
3. `assets/design/hero-sprites/cdi-149/references/f08/cleveland-battle-axe-full-facing-right.jpg`
   — autorité mécanique pour toute l'arme assemblée : continuité pommeau–manche–
   œil/douille–tête, montage de la tête et tranchant orienté vers la droite.

Source de l'image 3 : Cleveland Museum of Art, `Battle Axe`, accession
`1916.1601`, Scandinavie (?), XVe siècle, acier et bois, image CC0. La photo a
été retournée horizontalement dans son ensemble sans modifier les relations
géométriques entre ses pièces.

Les v1 et v2 rejetées ne sont pas transmises.

## Contraintes déterminantes du prompt transmis

- générer depuis zéro le personnage exact du neutre F08, avec identité,
  coiffure, tenue, couleurs, détails et proportions conservés ;
- expression sérieuse et concentrée, bouche fermée, regard et adversaire
  implicite vers la droite ;
- exactement une hache de bataille à une main dans la main droite, sans
  bouclier ni seconde arme ;
- reprendre de l'image 3 toute la construction assemblée de l'arme, mais la
  réduire proportionnellement à une longueur maniable d'environ avant-bras plus
  main ; ne jamais raccourcir une seule pièce ou faire pivoter la tête seule ;
- tenir la hache en garde haute presque verticale près de l'épaule : manche
  montant depuis le poing vers le haut, œil/douille dans le prolongement exact
  du manche, lame projetée vers la droite comme sur l'image 3 ;
- aucune cassure d'angle à la jonction manche–œil, aucune tête désaxée, aucune
  fusion du métal et du bois ;
- poignet droit neutre, coude fléchi et légèrement abaissé ; main gauche vide,
  entière et active près de la ligne centrale ;
- personnage, bottes et arme intégralement visibles sur fond transparent ;
- proportions conformes au neutre F08 et aux Mages F06/F08 ;
- exclure hache à deux mains, double hache, double lame, pointe arrière, prise
  inversée, arme derrière la tête, arme touchant les cheveux, manche tordu,
  tête montée de travers, plat menant la frappe, perspective forcée, sourire,
  décor, texte et filigrane.

## Résultat et contrôle

- Candidat : `exec-34f044c5-a40c-4c04-8e3e-7458c8dffd19.png`.
- Dimensions : `1 024 × 1 536 px`.
- Poids : `1 943 755 octets`, `1 943,755 Ko`, `1,943755 Mo`.
- SHA-256 :
  `92c57443815dfbd8a1ad7b460ee7ea1f382e908dc6444bb22fd9004546083dfb`.
- Contrôle de proportions : `.tmp/cdi149-f08-v3-proportion-check.png`.
- Contrôle mécanique côte à côte :
  `.tmp/cdi149-f08-v3-weapon-reference-check-v2.png`, candidat comparé à la
  photo CC0 réellement transmise, à même hauteur et sans déformation des ratios,
  avec un gros plan obligatoire de la jonction pour chaque image.
- Résultat corrigé après inspection agrandie à `4×` : le manche remonte à droite
  de la douille et se termine sous la lame au lieu de traverser l'œil métallique.
  La tête est montée à côté du manche ; la géométrie est mécaniquement impossible.
- Écart explicite : le manche est plus court relativement à la tête que sur la
  hache de musée de `93,3 cm`. Cette adaptation donne la hache à une main
  demandée mais ne respecte pas littéralement l'instruction de réduction
  uniforme du prompt. La photo reste l'autorité de jonction et de tête, pas de
  longueur finale.
- Limite technique non bloquante : halo brun semi-transparent à retirer pendant
  la normalisation.
- Verdict technique corrigé : rejeté. La v3 n'est pas archivée et ne doit pas
  servir de référence.
