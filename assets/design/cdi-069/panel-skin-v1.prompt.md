# Skin universel de panneau V1

## Statut

- Proposition source validée visuellement par l'utilisateur le 14 août 2026.
- Génération : ImageGen intégré.
- Validation visuelle de l'application runtime : en attente.
- Master chroma local : `sources/panel-skin-v1-chroma.png`.
- Préparation : `scripts/prepare-panel-skin.ps1`.

## Contrat runtime

Le skin utilise deux assets afin de rester compatible avec les panneaux de
largeurs et hauteurs variables :

- `panel-background-tile-v1.png` : texture bois `512 x 512 px`, répétable par
  miroir avec correspondance exacte des bords opposés ;
- `panel-frame-v1.png` : cadre transparent `512 x 512 px`, appliqué en neuf
  zones avec une slice source de `55 px`.

Le cadre s'affiche à `12 px` sur les panneaux standards et `14 px` sur les
panneaux `strong`. Le DOM conserve titres, séparateurs, contenus et
interactions.

## Prompt final

```text
Use case: stylized-concept
Asset type: universal scalable panel-skin source for CDIdle fantasy RPG UI,
intended to be separated into a repeatable center texture and a CSS nine-slice
frame.
Input images: Image 1 is the primary visual-language reference for the dark
stained wood surface, blackened steel outer frame, restrained aged-gold corner
braces, clipped corners, and hand-painted NMM. Image 2 is a supporting
reference for broad readable wood values and a long scalable frame. Image 3 is
a supporting reference for the established thin steel-and-gold edge hierarchy.
Do not copy their fixed aspect ratios or decorative gems.
Primary request: create one clean square universal empty panel, front-facing
and orthographic, whose construction can scale to any rectangular width and
height without visual distortion.
Panel structure: large uninterrupted nearly-black warm walnut center, matte and
low contrast, with broad subtle hand-painted grain but no plank seams. Surround
it with a slim inner aged-gold line, then a slightly thicker faceted
blackened-steel outer frame. Use four identical clipped 45-degree corners with
one small simple aged-gold brace at each corner. Keep every straight edge
visually uniform through its full middle section so it can be nine-sliced. Keep
corners compact.
Style: CDIdle header and menu DA; polished hand-painted 2D fantasy UI;
illustrated non-metallic metal; broad value planes; restrained scratches and
edge wear; dark, warm, readable, and understated.
Composition: square canvas; panel centered; perfectly symmetric left/right and
top/bottom; straight edges; frame occupies about 8% of the panel width;
interior occupies at least 78% of width and height. No directional lighting
that would break tiling. No cast shadow.
Background extraction requirement: outside the complete opaque panel, use one
perfectly flat solid #ff00ff chroma-key background, uniform with no gradient or
texture. Do not use #ff00ff in the panel.
Constraints for nine-slice production: no object, rivet, notch, scratch
cluster, highlight hotspot, wood knot, seam, or ornament in the middle 50% of
any edge; no internal header divider; no text; no content; no icon. The center
must be visually quiet enough behind body text and controls.
Avoid: purple gems, green ivy, crowns, lions, swords, runes, corner flourishes,
ornate filigree, photorealistic wood, glossy PBR metal, thick frame, large gold
areas, perspective, bevel asymmetry, vignette, watermark.
```

## Empreintes

- cadre :
  `d06f893e6ee14291eda3db285f82e3385913fc7ce7aeb79795e1275d3c5af180` ;
- texture :
  `05a1fc838c3d635c42674e1db9ade61d0c4cc0866c86612fb9ab9e729a17d4bf`.
