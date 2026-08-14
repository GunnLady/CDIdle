# Plaques de classes T1 V1

## Production

- Outil : ImageGen intégré, une génération par classe.
- Références : source carrée Novice V3 et planche conceptuelle argent T1.
- Livrables locaux :
  `sources/dungeon-tier1-<classe>-silver-plaque-v1.png`.
- La correction Voleur utilise
  `sources/dungeon-tier1-voleur-silver-plaque-v2.png`.
- Les neuf plaques sont intégrées au runtime et leur validation visuelle finale
  a été rapportée par l'utilisateur depuis le catalogue privé.

## Socle commun

```text
Use case: stylized-concept
Asset type: individual large square master source for a Tier 1 fantasy game UI
class plaque
Input images: Image 1 is the exact source composition, small-symbol scale,
hand-painted relief, scratches, oxidation, and crop-margin reference. Image 2
is the approved aged-silver Tier 1 concept-sheet material and symbol-style
reference.
Style/medium: polished hand-painted 2D fantasy game UI illustration; aged
silver rendered as non-metallic metal; controlled graphic value blocks; crisp
emblem silhouette; readable after reduction to 72 px.
Material: a seamless edge-to-edge aged-silver field with broad shallow
hammered relief, cool charcoal-gray shadow planes, muted silver midtones,
restrained pale-silver highlights, sparse scratches, small dark oxidized
patches, and subtle illustrated wear.
Composition/framing: perfectly square, straight-on orthographic view; one
centered class emblem occupying approximately 25% of the full canvas width and
height; very large uninterrupted margins for later center-cropping and
circular masking.
Symbol treatment: raised bright-silver NMM with deep charcoal-violet shadow
faces and a narrow dark outline for strong contrast.
Constraints: exactly one requested class emblem; preserve the Novice source's
symbol scale and crop-safe margins; no text, letters, numbers, runes, extra
icons, decorative frame, circular plaque edge, rivets, gems, corner ornaments,
or watermark.
Avoid: copper, gold, bronze, photorealistic metal, PBR reflections, chrome,
mirror finish, fine uniform noise, leather texture, dense pitting, excessive
rust, oversized emblem, perspective, vignette, cast shadow.
```

## Variantes de classe

- Guerrier : une épée large verticale devant un bouclier rond simple ; aucun
  second armement ni héraldique.
- Voleur : une capuche fermée vue de face, vide et sombre à l'intérieur, sans
  visage, yeux, masque, épaules ni arme.
- Archer : un arc tendu avec une flèche complète et continue — pointe, hampe et
  empennage ; aucun carquois ni seconde flèche.
- Mage : un orbe arcanique compact avec une spirale interne discrète ; aucune
  baguette, étoile, particule ou glyphe.
- Acolyte : un disque solaire avec huit rayons courts et émoussés ; ne pas
  reprendre la géométrie de rose des vents du Novice.
- Aède : une lyre compacte en U avec exactement cinq cordes verticales droites ;
  aucune note ou aile.
- Druide : une feuille unique verticale, une nervure centrale et quelques
  nervures latérales larges ; aucune branche ou seconde feuille.
- Artificier : un engrenage compact avec exactement huit dents et une ouverture
  centrale ronde ; aucun outil ou second engrenage.
- Pugiliste : un poing fermé bandé vu de face, avec quelques bandes larges au
  poignet ; aucun second poing ou effet d'impact.

## Correction Aède

La première génération ne comportait que quatre cordes. Une édition ciblée a
conservé toute l'image et imposé exactement cinq cordes droites et régulièrement
espacées. La source locale correspond à cette version corrigée.

## Correction Voleur

La dague descendante ressemblait trop à une épée à cause de sa garde et de sa
longueur. Une édition ciblée l'a remplacée par une capuche compacte, sans
modifier le matériau, la texture ni la lumière de la plaque argent.

## Découpes runtime

Toutes les sorties utilisent un canevas `192 x 192 px`, un disque opaque de
rayon `70 px` et un affichage de `72 x 72 px` sous le cadre V3. Les crops et
offsets sont adaptés à la silhouette afin de conserver une masse visuelle
homogène. Le centrage se fait sur la boîte visible du symbole : ses marges
gauche/droite et haut/bas doivent être optiquement égales dans le disque, même
si son centre géométrique diffère du centre de la source. La boîte exclut les
ombres portées. Une compensation optique explicite reste possible pour une
silhouette asymétrique, comme l'arc visuellement plus chargé à gauche.

| Classe | Crop source | Offset source X/Y |
| --- | ---: | ---: |
| Guerrier | `980 px` | `[0, 0]` |
| Voleur | `1000 px` | `[4, -18]` |
| Archer | `980 px` | `[0, -18]` |
| Mage | `700 px` | `[1, 4]` |
| Acolyte | `900 px` | `[6, 19]` |
| Aède | `700 px` | `[0, -15]` |
| Druide | `920 px` | `[0, 20]` |
| Artificier | `920 px` | `[0, 40]` |
| Pugiliste | `840 px` | `[20, 27]` |
