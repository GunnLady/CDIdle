# Vélin de coût de bâtiment V1

## Statut

- Génération : ImageGen intégré, sans image de référence.
- Source chroma locale ignorée : `sources/building-cost-vellum-v1-chroma.png`.
- Préparation : `scripts/prepare-building-cost-vellum.ps1`.
- Runtime : `src/assets/images/ui/buildings/building-cost-vellum-v1.png`.
- Texte et valeurs : DOM uniquement.
- Validation visuelle de l'application runtime : en attente.

## Contrat runtime

Le PNG alpha de 1024 x 256 px est utilisé en neuf zones avec
`border-image-slice: 64 96 fill`. Les plans techniques restent près des bords,
le centre demeure calme et les coins ne sont pas étirés. Aucun coût, libellé ou
icône métier n'est intégré à l'image.

## Prompt final

```text
Use case: stylized-concept
Asset type: nine-slice decorative background for a compact building-cost UI block.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, absolutely uniform with no gradient, texture, shadow, floor plane, reflection, or lighting variation.
Primary request: one wide horizontal sheet of aged vellum used as a medieval architectural blueprint and cost ledger background.
Subject: warm desaturated ivory parchment with slightly darkened worn edges, small irregular clipped corners, subtle creases and fibers. Add very faint blue-gray and sepia technical construction lines only near the outer margins: partial floor-plan geometry, measurement ticks, compass arcs, straightedge marks and tiny abstract material tally symbols. Keep the central 65 percent calm, low-contrast and mostly empty for live interface text.
Composition/framing: a single centered front-facing orthographic sheet, approximately 3:1 width-to-height ratio, generous magenta padding on all sides. Flat silhouette with four readable corners and straight stable edge sections suitable for nine-slice scaling.
Style/medium: polished hand-painted 2D medieval fantasy interface asset; restrained, practical artisan drafting vellum rather than an ornate magic scroll.
Color palette: warm bone, tan and faded brown parchment; muted blue-gray ink; sparse dark sepia linework.
Constraints: no readable words, letters, numbers or prices; no baked UI text; no resource icons; no building illustration; no wax seal; no rolled scroll rods; no cast shadow; the sheet must be fully opaque and only its exterior may use #ff00ff.
Avoid: bright white paper, saturated blue, modern blueprint grid, glowing runes, magic effects, ornate gold frame, book, desk, tools, perspective, watermark; do not use #ff00ff inside the sheet.
```
