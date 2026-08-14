# Cartes Bâtiments V1

## Intention

Les cartes du menu Bâtiments utilisent une illustration environnementale plein
cadre, sans texte ni cadre intégré. Le bâtiment reste lisible dans les 40 %
gauches et le décor s'assombrit progressivement vers la droite pour recevoir
les informations DOM. Le rendu est un concept art fantasy mature, pictural,
avec une architecture crédible et sans proportions cartoon.

Le cadre est un asset séparé : fer noirci, filet de bronze retenu, angles à
longs chanfreins et centre transparent. Il est posé en overlay au-dessus de
l'illustration, qui se poursuit sous ses quatre montants.

## Prompt commun des illustrations

```text
Use case: stylized-concept
Asset type: full-bleed landscape background for a fantasy idle-game building selection card
Style/medium: mature painterly fantasy concept art, grounded believable architecture, subtly hand-painted texture, premium strategy-game key art, not cartoonish; coherent with dark iron, oak and parchment UI.
Composition/framing: very wide horizontal card. Place the readable architectural focal subject in the left 40 percent. Continue the environment across the image and create a natural progressive dark atmospheric fade toward the right 45 percent for light DOM text. Full image edge to edge.
Constraints: no frame, no border, no plaque, no isolated cutout, no UI chrome, no text, no watermark.
Avoid: exaggerated proportions, glossy 3D, saturated cartoon rendering, empty black rectangle on the right.
```

## Variantes de sujet

| Identifiant | Sujet principal | Lumière et palette |
| --- | --- | --- |
| `habitation` | cabane en bois et chaume, bois de chauffage | fin d'après-midi chaude, chêne et ambre |
| `ferme` | ferme, grange, champ et moulin | heure dorée, blé et bois brun |
| `scierie` | maison de bûcheron, grumes et chevalets | matin brumeux, pin sombre et lampe chaude |
| `carriere` | front de taille, blocs et grue en bois | après-midi poussiéreux, calcaire et ocre |
| `mine` | galerie étayée, wagonnet et treuil | crépuscule froid, ardoise et lanternes |
| `maison_chef` | grande halle du chef et foyer de conseil | heure bleue, chêne sombre et ambre |
| `guilde` | campement, tente de commandement et feu | coucher de soleil couvert, toile et braise |
| `temple` | petite église de pierre et cimetière clos | aube après la pluie, gris mousse et ambre |
| `caserne` | longue caserne, cour et râteliers | matin froid, bois noirci et fer mat |
| `poste_chasse` | pavillon, ligne de tir et tour de guet | automne, roux retenu et forêt sombre |
| `academie` | atelier d'arcane, instruments et livres | nuit, laiton, violet et bougies |
| `cercle` | vieux chêne, pierres levées et abri d'herbes | aube forestière, mousse et pierre grise |
| `lair` | entrepôt discret, ruelle et accès de cave | nuit pluvieuse, ardoise et lanternes |
| `forge` | atelier ouvert, foyer et enclume | heure bleue, charbon et braise orange |

## Cadre final

Le cadre V1 dérive de la troisième variante générée : les blocs d'angle lourds
ont été remplacés par des jonctions chanfreinées plus longues et plus plates.
Le damier clair produit par l'édition a été détouré localement, puis le master
alpha a été normalisé à `1024 x 328 px`. Le runtime utilise
`border-image-slice: 42 52 fill` dans un overlay absolu qui ne participe pas au
layout de la carte.

## Préparation runtime

`scripts/prepare-building-card-assets.ps1` produit les JPEG `1024 x 448 px` à
qualité 88. Les sources plus panoramiques sont recadrées depuis la gauche afin
de conserver le bâtiment et de réduire uniquement l'extrémité sombre. Le même
script normalise le cadre alpha en PNG. Les masters restent sous
`assets/design/cdi-069/sources/building-cards-v1/`, dossier local ignoré.
