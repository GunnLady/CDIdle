# Primary navigation buttons V1 — runtime preparation V2

## Generation

Built-in ImageGen generation using the integrated secondary-navigation rail V5
and the approved header as direct material references.

The source sheet contains exactly two front-facing button states on a flat
`#00ff00` chroma background:

- normal: dark aged walnut, cold steel and restrained aged-gold accents;
- selected: the same walnut and silhouette, with an aged-gold frame and a
  controlled amber inner glow.

Both states exclude text, icons, heraldry, gems, rivets, vines and functional
content. Icons, labels, interaction, focus and active state remain in the DOM.

## Deterministic preparation

The generated source measured `1536 x 1024`. The normal subject bounds were
`[77, 307, 638, 410]`; the selected bounds were `[817, 307, 641, 410]`.

`scripts/prepare-primary-navigation-buttons.ps1`:

1. removes the green chroma by channel dominance and despills antialiased
   edges;
2. crops the two states independently;
3. scales each state uniformly to `364 px` high;
4. preserves `88 px` on each side and removes only the excess central span;
5. exports both states at exactly `462 x 364 px`;
6. for V2, removes `6 px` from each horizontal edge and restores the exact
   `462 px` width, so the lateral metal contour reaches the asset bounds;
7. composes four buttons at runtime scale inside the rail V5 for validation.

The runtime button boxes measure `124 x 105 px`, with no CSS gap or padding.
Only the raster image is displayed at `124 x 107 px`, extending `2 px` below
its button box and offset `2 px` upward inside it. The `496 px` group extends
`2 px` beneath each lateral edge and starts `1 px` below the top of the rail's
`492 x 103 px` transparent navigation window. The upward image offset covers
that top pixel and the PNG's first transparent alpha row. Transparent bevel
corners remain unchanged for the later ornament pass.
