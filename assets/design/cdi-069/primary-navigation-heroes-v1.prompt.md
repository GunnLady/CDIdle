# Icône de navigation Aventuriers V1

## Production

- Outil : ImageGen intégré, sans clé API.
- Références : palais civique lumineux, bouton normal et direction artistique
  du header CDIdle.
- Fond demandé : chroma uniforme `#00ff00`.
- Détourage et redimensionnement :
  `scripts/prepare-primary-navigation-icon.ps1`.
- Runtime : canevas transparent `192 x 192 px`, affiché dans une boîte CSS de
  `64 x 64 px` sur desktop et `20 x 20 px` en format compact.

## Prompt final

```text
Use case: stylized-concept
Asset type: tiny raster icon for the CDIdle primary navigation destination Aventuriers
Input images: Image 1 defines the established icon brightness, small-scale clarity, palette, and rendering finish; Image 2 defines the dark-walnut button context; Image 3 defines CDIdle's medieval dark-fantasy materials and restrained gold accents. Use them as style references only.
Primary request: create one compact emblem representing a mixed adventuring party: a broad medieval longsword and a sturdy arcane mage staff crossed in a clear X in the foreground, with a warm wooden lute centered upright behind them. The sword represents martial heroes, the staff represents mages, and the lute represents support and bard adventurers.
Object details: sword with a bright cold-steel blade, simple aged-gold crossguard, and dark leather grip; mage staff made of dark carved wood with one solid faceted violet crystal held in a compact antique-gold mount; lute with a rounded warm walnut body, short readable neck, restrained gold edging, and only a few broad string lines.
Style/medium: polished hand-painted dark-fantasy game UI sprite/icon, chunky shapes, strong clean silhouette, broad highlights, bright enough to read on dark walnut, consistent with the approved luminous civic-palace icon.
Composition/framing: a genuinely small compact emblem centered exactly in a large square canvas with very large empty padding; near-front orthographic presentation; sword runs bottom-left to top-right, staff runs bottom-right to top-left, lute remains vertically centered behind both; crossing point near the center; all three objects fully visible and clearly separable. Simplify aggressively for recognition at 64 × 64 px.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Constraints: exactly one sword, one mage staff, and one lute; no people, hands, faces, armor, shield, bow, arrows, helmet, castle, building, treasure chest, banner, ribbon, surrounding badge, external frame, ground, landscape, text, letters, numbers, runes, watermark, cast shadow, contact shadow, reflection, smoke, particles, or green inside the objects. No external glow or aura around the emblem. The background must be perfectly uniform #00ff00 with no gradient, texture, shadow, floor plane, or lighting variation. Keep crisp clean outer edges suitable for chroma-key removal.
```

## Invariants

- exactement une épée, un bâton de mage et un luth ;
- silhouette lisible à `64 x 64 px` ;
- aucune interaction ni aucun libellé aplati dans le bitmap ;
- cadenas historique conservé lorsque la navigation est verrouillée ;
- libellé DOM décalé de `-5 px` sur desktop, comme Cité.
