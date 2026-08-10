# Background du shell CDIdle v3 — zone centrale adaptée au main

## Cadrage fonctionnel

Le `main` desktop mesure au maximum `1440 px`. Sur le canevas `3440×1440`, il
occupe la zone centrée `x=1000–2440`.

La composition réserve donc :

- `x=120–940` à la ville et à la maison du chef ;
- `x=1000–2440` à une vallée calme et peu contrastée sous le `main` ;
- `x=2500–3320` au donjon, à son portail et à son escalier.

## Mode de génération et préparation

ImageGen intégré, édition du master v2. Aucune référence pixel-art ou UI n'a
été utilisée. La sortie brute
`sources/app-shell-background-v3-main-safe-generated.png` mesure `1939×811`.
Un pixel de bord droit a été retiré avant rééchantillonnage bicubique haute
qualité vers le master `3440×1440`. Le runtime JPEG est encodé en qualité 90.

## Prompt final

```text
Use case: precise-object-edit
Asset type: decorative authenticated app-shell background for CDIdle
Input image 1: edit target and authoritative reference for smooth realistic cinematic dark-fantasy matte-painting style, palette, lighting, architecture, landscape identity, and 43:18 ultrawide framing
Primary request: recompose the same scene so the entire centered UI occlusion zone is as wide as the app main panel. On a 3440 x 1440 canvas, reserve x=1000 through x=2440 (exactly 1440 pixels, about 29% through 71% of the width) as a calm low-detail valley-only zone behind the main UI. Move and compact the complete fortified village and manor entirely into the left visible gutter, x=120 through x=940. Move and compact the complete monumental dungeon, its entrance, stairs, fixed violet beacons, and attached mountain architecture entirely into the right visible gutter, x=2500 through x=3320.
Composition/framing: keep the wide canvas and camera altitude. The left gutter must visibly show the interesting village architecture rather than only mountains. The right gutter must visibly show the interesting dungeon architecture rather than only mountains. The central 1440-pixel zone must contain only continuous distant valley, subdued cloudy sky, atmospheric mountains, river, bridge and road, with low contrast and no landmark, major building, stairway, portal, beacon, or bright focal point. Maintain coherent geographic connection across all three zones. Keep monuments away from the outer image edges and leave sky above their highest points.
Style/medium: preserve the current smooth, highly detailed, realistic cinematic fantasy matte painting. Explicitly not pixel art, not pseudo-pixel-art, not isometric game art, not cartoon, not painterly brush strokes.
Lighting/mood: preserve the dark but readable cool overcast twilight, realistic materials, atmospheric depth, restrained warm windows, and restrained violet dungeon light.
Invariants: same recognizable village structures on the left; same recognizable monumental dungeon on the right; quiet central valley with continuous river and coherent stone bridge; exactly four fixed violet beacon lights associated with the dungeon plus its portal; no functional information in the bitmap.
Avoid: placing any interesting landmark under the central x=1000–2440 UI zone; mountains-only side gutters; zooming in; cropping monument tops; fused buildings; duplicated landmarks; new magic; extra violet beacons; characters; animals; monsters; combat; text; logo; interface; watermark; pixel art; paths without destinations; vegetation intersecting structures; seams; mirrored repetition.
```
