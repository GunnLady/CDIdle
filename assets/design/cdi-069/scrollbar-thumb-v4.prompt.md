# Scrollbar lancette V4

## Statut

- Generation : ImageGen integre, creation sans image de reference.
- Source locale ignoree : `sources/scrollbar-thumb-lancet-v4.png`.
- Preparation : `scripts/prepare-scrollbar-assets.ps1`.
- Validation visuelle de l'application runtime : en attente.

## Contrat runtime

Le rail est entierement transparent. La poignee est separee en une grande
pointe haute fixe de 14 x 32 px, une tige centrale de 14 x 4 px et un petit pic
bas fixe de 14 x 14 px. Les versions horizontales sont des rotations des memes
tranches. Aucune extremite n'est etiree. La tige centrale est redimensionnee
uniquement dans l'espace entre les deux extremites : elle n'est jamais peinte
sous leurs zones transparentes.

La source retournee par ImageGen possede deja un canal alpha natif malgre la
demande de fond chroma. Le script conserve directement cet alpha ; aucun
detourage chroma approximatif n'est applique.

## Prompt final V4

```text
Use case: stylized-concept
Asset type: source artwork for a tiny three-slice vertical scrollbar thumb.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, absolutely uniform with no gradient, texture, shadow, floor plane, reflection, or lighting variation.
Primary request: create one extremely slender vertical medieval metal lancet handle, designed from scratch.
Subject geometry: a long narrow straight shaft only about one third as wide as the upper spearhead; at the top, one crisp compact leaf-shaped spear point with straight angular shoulders that taper cleanly into the shaft; at the bottom, one much smaller simple downward thorn point, no second spearhead. The middle 60 percent must be a perfectly straight, uniform, vertically repeatable shaft with parallel edges, constant width and no ornament, seam, collar, rivet, hotspot, or width change.
Composition/framing: one object only, centered, front-facing, orthographic, perfectly vertical; approximately 1:5 overall width-to-height ratio; generous magenta padding on every side; complete silhouette visible.
Style/medium: polished hand-painted 2D fantasy UI asset, crisp restrained pixel-readable shapes; blackened steel shaft with a very thin muted aged-brass edge highlight; low ornament, elegant and sharp rather than bulky.
Constraints: the metal silhouette is fully opaque; no hole or transparent interior; the upper spear point and lower thorn are fixed terminal shapes; readable after reduction into a 14-pixel-wide scrollbar lane.
Avoid: rail, groove, rope, ring, round cap, bulb, ball, handle grip, oversized shoulder, symmetrical equal-sized end caps, hollow center, gem, rune, text, cast shadow, perspective, watermark; do not use #ff00ff anywhere in the object.
```
