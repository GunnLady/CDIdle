# Insigne de classe Novice V3

## Production

- Outil : ImageGen intégré, mode édition avec références locales.
- Source locale : `sources/dungeon-novice-copper-plaque-v2.png`.
- Références : source carrée Novice V1 et preview NMM contrastée.
- Préparation runtime : `scripts/prepare-dungeon-class-plaque.ps1` avec un
  crop central de `710 px` et un disque de rayon `70 px`. Le crop plus large
  conserve l'échelle runtime de la rose V2 malgré un sujet plus grand dans la
  nouvelle source. Le centre du crop est décalé de `+15 px` en Y dans la
  source afin de remonter la rose de `4 px` au runtime.

## Prompt final

```text
Use case: style-transfer
Asset type: large square master source for a fantasy game UI class plaque
Input images: Image 1 is the exact composition and scale reference; Image 2 is
the approved contrast and hand-painted non-metallic-metal style reference.
Primary request: Recreate Image 1 as a large square source sheet, using Image
2's strong symbol contrast and illustrated NMM rendering. The entire square
canvas must be an uninterrupted copper-painted field, with one small centered
eight-point compass rose occupying approximately 25% of the full canvas width
and height. This large margin is essential because the project will center-crop
and circular-mask the source later.
Style/medium: polished 2D fantasy game UI illustration; hand-painted
non-metallic metal; controlled value blocks, crisp symbol edges, restrained
painterly brushwork.
Color palette: make the field unmistakably copper: richer warm burnt orange,
reddish copper midtones, ochre highlights, and deep umber shadows. Keep it
warmer and more copper-colored than Image 2, not muddy brown. The compass rose
uses pale ochre-copper lit faces and deep brown with subtle cool
charcoal-violet shadow faces for strong readability.
Materials/textures: simplified painted copper surface, broad subtle brush
variation only; no realistic hammered pores or photographic patina.
Composition/framing: perfectly square, straight-on, seamless material
extending edge-to-edge; exact centered symmetric eight-point rose; symbol
approximately one quarter of canvas width; very large uninterrupted margin
around it.
Constraints: preserve exactly eight points, compass orientation, symmetry,
small source-sheet scale, centered placement, and strong light-dark contrast;
no circular plaque edge because the circle will be cut later; no border; no
frame; no corner ornament; no text; no watermark.
Avoid: large symbol, circular disc silhouette, vignette, rim, bevel around the
canvas, photorealistic metal, PBR reflections, realistic specular glare,
leather-like texture, excessive noise, tiles, seams, rivets, gems, cast shadow.
```

## Itération intégrée — relief et usure

```text
Use case: precise-object-edit
Asset type: large square master source for a fantasy game UI class plaque
Input images: Image 1 is the edit target and exact composition reference.
Primary request: Add stylized material depth and readable age to the copper
field while preserving the centered eight-point compass rose exactly.
Changes to the copper field: introduce broad shallow hammered relief expressed
as hand-painted value planes; add a small number of deliberate medium-width
scratches and claw-like scoring marks; add restrained irregular rust and
oxidized dark-red-brown patches. Make these features large and graphic enough
to remain perceptible after center-cropping and reduction to a 72 px game UI
medallion.
Symbol treatment: preserve the rose's exact size, position, eight-point
geometry, symmetry, crisp edges, strong light-dark contrast, and current
non-metallic-metal shading. Allow only two or three tiny painted nicks; do not
cover or blur it.
Style/medium: polished hand-painted 2D fantasy game UI illustration;
non-metallic-metal copper; controlled value blocks and illustrated wear.
Constraints: change only surface relief and wear; preserve canvas size,
composition, scale, centered placement, symbol proportions, eight points,
orientation, and crop-safe margins; no circular plaque edge; no border; no
frame; no text; no watermark.
Avoid: photorealistic metal, PBR reflections, glossy highlights, fine uniform
noise, leather texture, dense pitting, excessive rust, bright orange rust,
verdigris takeover, cracks through the symbol, large dents, rivets, gems, new
ornaments, vignette, cast shadow.
```
