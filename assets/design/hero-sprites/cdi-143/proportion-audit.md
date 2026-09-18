# Audit des proportions des Druides validés

Date : 18 septembre 2026

## Méthode

- Sources contrôlées : fichiers PNG archivés dans `validated-male-v1` et
  `validated-female-v1`.
- Normalisation : canevas `341 × 692 px`, hauteur visible alignée sans
  déformation du ratio de la source.
- Gabarits masculins : Mages M06 et M08.
- Gabarits féminins : Mages F06 et F08.
- Contrôle visuel sur canevas identique : tête, ligne d'épaules, longueur et
  largeur du tronc, longueur des bras et niveau des mains, largeur des hanches,
  longueur des cuisses et des jambes, niveau des genoux et ancrage des pieds.
- Les cheveux, capes, mantelets et panneaux textiles sont distingués des
  proportions anatomiques. Ils peuvent modifier la largeur visible sans
  modifier le gabarit corporel.

Limite : les vêtements masquent certains contours anatomiques. Le verdict
porte donc sur l'alignement visible des articulations et des segments, pas sur
une identité pixel à pixel de la silhouette habillée.

## Références mesurées

| Gabarit | Zone visible normalisée |
| --- | ---: |
| Mage M06 | `269 × 623 px` |
| Mage M08 | `271 × 623 px` |
| Mage F06 | `288 × 595 px` |
| Mage F08 | `229 × 596 px` |

## Druides masculins

| Sprite | Zone visible | Taille source | Contrôle tête/épaules/tronc/bras/hanches/jambes | Verdict |
| --- | ---: | ---: | --- | --- |
| M01 | `252 × 623 px` | 1 493,7 Ko / 1,46 Mo | Articulations et longueurs alignées ; tenue plus près du corps | Conforme |
| M02 | `262 × 623 px` | 1 490,8 Ko / 1,46 Mo | Tous les segments alignés | Conforme |
| M03 | `258 × 623 px` | 1 284,6 Ko / 1,25 Mo | Tous les segments alignés ; manches et bottes expliquent le contour | Conforme |
| M04 | `280 × 623 px` | 1 396,6 Ko / 1,36 Mo | Segments alignés ; largeur supplémentaire limitée au mantelet | Conforme, débordement textile |
| M05 | `268 × 623 px` | 1 422,7 Ko / 1,39 Mo | Tous les segments alignés | Conforme |
| M06 | `255 × 623 px` | 1 406,3 Ko / 1,37 Mo | Tous les segments alignés ; tenue plus près du corps | Conforme |
| M07 | `267 × 623 px` | 1 364,3 Ko / 1,33 Mo | Tous les segments alignés | Conforme |
| M08 | `288 × 623 px` | 1 915,1 Ko / 1,87 Mo | Segments alignés ; largeur supplémentaire due au mantelet et aux panneaux | Conforme, débordement textile |
| M09 | `286 × 623 px` | 1 657,2 Ko / 1,62 Mo | Segments alignés ; largeur supplémentaire due aux couches hivernales | Conforme, débordement textile |
| M10 | `270 × 623 px` | 1 651,2 Ko / 1,61 Mo | Tous les segments alignés | Conforme |

## Druides féminins

| Sprite | Zone visible | Taille source | Contrôle tête/épaules/tronc/bras/hanches/jambes | Verdict |
| --- | ---: | ---: | --- | --- |
| F01 v2 | `245 × 596 px` | 1 502,6 Ko / 1,47 Mo | Tous les segments alignés ; largeur supplémentaire limitée au mantelet et aux panneaux de robe | Conforme, version retenue |
| F02 | `244 × 596 px` | 1 254,2 Ko / 1,22 Mo | Tous les segments alignés ; volume capillaire distingué de la tête | Conforme |
| F03 | `249 × 596 px` | 1 394,4 Ko / 1,36 Mo | Tous les segments alignés | Conforme |
| F04 | `231 × 596 px` | 1 438,4 Ko / 1,40 Mo | Tous les segments alignés | Conforme |
| F05 | `247 × 596 px` | 1 345,4 Ko / 1,31 Mo | Tous les segments alignés ; volume des boucles distingué de la tête | Conforme |
| F06 v2 | `291 × 596 px` | 1 818,7 Ko / 1,78 Mo | Tous les segments alignés ; largeur supplémentaire limitée à la robe et au mantelet | Conforme, version retenue |
| F07 | `284 × 596 px` | 1 952,8 Ko / 1,91 Mo | Tous les segments alignés ; largeur supplémentaire limitée à la robe | Conforme |
| F08 | `252 × 596 px` | 1 935,0 Ko / 1,89 Mo | Tous les segments alignés | Conforme |
| F09 | `282 × 596 px` | 1 795,1 Ko / 1,75 Mo | Tous les segments alignés ; ourlet propre sur la version retenue | Conforme |
| F10 | `280 × 596 px` | 1 669,1 Ko / 1,63 Mo | Tous les segments alignés ; largeur supplémentaire limitée à la robe | Conforme |

La source `druid-female-01-v1.png` est conservée pour l'historique mais rejetée :
sa tenue était trop simple par rapport au niveau de détail de la série. La
source `druid-female-01-v2.png` enrichit le mantelet, les panneaux textiles et
le matériel d'herboriste sans modifier l'anatomie ni le gabarit.

La source `druid-female-06-v1.png` est conservée pour l'historique mais rejetée :
le pan intérieur bleu de la cape fusionnait visuellement avec le corsage près du
col. La source `druid-female-06-v2.png`, séparée par un liseré ivoire et une
ombre de contact, est la seule version utilisée pour l'export runtime
`female/druid-female-06-v1.png`.

## Conclusion

Les vingt sprites validés utilisent le même gabarit anatomique que leurs
références de genre. Aucun sprite ne nécessite une régénération pour un défaut
de proportions. M04, M08, M09, F06, F07 et F10 doivent conserver la mention de
débordement textile lors de la composition des planches, afin que leur largeur
de tenue ne soit pas interprétée comme une largeur corporelle différente. F01
v2 ajoute elle aussi du volume textile, tout en restant entre les largeurs des
gabarits Mage F08 (`229 px`) et F06 (`288 px`).
