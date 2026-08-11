# Secondary navigation rail background V5

## Generation contract

- Desktop-only horizontal fantasy UI rail.
- Wide, shallow composition designed to be cropped and downscaled to `1440 x 173 px`.
- Main divider centered at approximately `44%` of the usable rail width; `45/55` is acceptable.
- Left section keeps a clean rectangular interior for four DOM-rendered navigation buttons.
- Right section remains a continuous dark wooden dungeon-status panel.
- Cold grey sculpted steel matching the lion-header material, restrained aged-gold trim, green vines, one compact violet divider gem and four small amber end-cap gems.
- No rivets, no labels, no icons, no text and no baked functional content.

## Chroma-key correction

Starting from the approved rail composition, replace only these two regions with one perfectly flat cyan key color (`#06F7FC`):

1. the exterior background around the complete rail silhouette;
2. the full rectangular interior of the left navigation panel.

Preserve every ornament, vine, gem, metal edge, gold edge and the complete right wooden panel exactly. Do not recolor openings inside the ornaments and do not add, remove or redesign any object.

The cyan source is archived locally as `sources/secondary-navigation-rail-background-v5-cyan-source.png`. The production alpha was extracted from cyan hue separation, cropped to the visible subject bounds `[24, 235, 2123, 255]`, then resized to `1440 x 173 px`.
