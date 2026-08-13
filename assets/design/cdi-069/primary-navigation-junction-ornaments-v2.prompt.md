# Primary navigation junction ornaments v2

## Final production prompt

Create exactly two tiny fantasy-game UI junction covers, vertically stacked and clearly separated on a flat chroma-green background.

- Upper ornament: a compact dark aged-metal and antique-gold cap pointing downward, with one clearly visible centered violet gemstone.
- Lower ornament: a matching compact cap without a gemstone, designed to point upward after a 180-degree production rotation.
- Same painterly medieval-fantasy art direction as the existing carved dark-wood, worn-bronze and restrained-gold navigation bar.
- Symmetrical, front-facing, crisp silhouette, strong value separation and readable at miniature scale.
- No text, letters, icons, buttons, frames, shadows outside the object, extra ornaments, glow, particles or perspective.
- Keep each subject compact and isolated with generous green clearance for deterministic chroma-key extraction.
- Intended final runtime size for each extracted ornament: exactly 38 × 25 px.
- Intended placement: centered over only the three internal seams between four equal 124 px navigation buttons; never on the outer left or right edges.

## Production notes

- Generator: built-in ImageGen.
- Source layout: vertical.
- Chroma-key extraction: `scripts/prepare-primary-navigation-junction-ornaments.ps1`.
- Exact runtime resize: `scripts/resize-navigation-junction-ornaments.ps1`.
- The lower source is rotated 180 degrees during extraction.
