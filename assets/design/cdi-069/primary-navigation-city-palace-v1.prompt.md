# Icône de navigation Cité — palais civique V1

## Production

- Outil : ImageGen intégré, sans clé API.
- Mode : génération raster avec référence visuelle issue de l'itération
  précédente du château compact, puis édition ciblée de luminosité validée par
  l'utilisateur.
- Fond demandé : chroma uniforme `#00ff00`.
- Détourage et redimensionnement :
  `scripts/prepare-primary-navigation-icon.ps1`.
- Runtime : canevas transparent `192 x 192 px`, affiché dans une boîte CSS de
  `64 x 64 px` sur desktop et `20 x 20 px` en format compact.

## Prompt final

```text
Use case: stylized-concept
Asset type: tiny raster navigation icon concept for the CDIdle primary navigation destination Cité
Input image: the previous tiny castle is a palette, scale, clarity, and rendering-style reference only. Replace its military fortress identity completely.
Primary request: create one very small medieval civic palace / town hall representing administration, prosperity, and the heart of a city. Use a broad symmetrical façade, a taller central entrance pavilion, two lower wings, a steep elegant dark-blue slate roof, a small gold-capped civic spire, several large warm amber-lit arched windows, and one welcoming central doorway. Add only two restrained antique-gold vertical civic pennants integrated against the façade.
Semantic goal: unmistakably a town hall or governor's palace, not a fortress, dungeon, castle, church, house, bank, or treasure chest.
Style/medium: compact hand-painted dark-fantasy game UI sprite/icon, chunky readable shapes, strong silhouette, broad highlights, dark dressed stone, cold steel-blue slate, restrained aged-gold trim, consistent with CDIdle.
Composition/framing: a genuinely tiny building centered exactly in the large square canvas, comparable in visible size to the small previous castle. Near-front view, symmetrical, entire building visible, extremely large empty padding. Simplified specifically to remain recognizable after reduction for a navigation button.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Constraints: exactly one isolated civic building; absolutely no crenellations, defensive towers, battlements, walls, portcullis, moat, weapons, shield, surrounding badge, external frame, ground, landscape, crown, characters, text, letters, numbers, watermark, cast shadow, contact shadow, reflection, smoke, particles, or green inside the building. No clock face because it may become unreadable. The background must be perfectly uniform #00ff00 with no gradient, texture, shadow, floor plane, glow, or lighting variation. Crisp clean outer silhouette suitable for chroma-key removal.
```

## Invariants

- bâtiment civique, sans vocabulaire défensif de Donjon ;
- silhouette lisible à petite taille ;
- aucune interaction ni aucun libellé aplati dans le bitmap ;
- ratio préservé dans une boîte DOM de `64 x 64 px` sur desktop ;
- cadenas historique conservé lorsque la navigation est verrouillée.

## Édition finale de luminosité

La version runtime utilise la sortie de cette édition ciblée du palais généré :

```text
Use case: precise-object-edit
Asset type: tiny raster navigation icon for the CDIdle primary navigation destination Cité
Input image: edit target. Preserve the civic palace exactly.
Primary request: increase only the palace's visual brightness and small-size contrast. Lift the dark dressed-stone midtones noticeably, brighten the cold steel-blue slate roofs, make the aged-gold trim clearer and warmer, and strengthen the warm amber window light moderately. The icon should remain dark-fantasy and aged, but read distinctly against a very dark walnut button.
Invariants: preserve the exact building design, silhouette, geometry, symmetry, proportions, viewpoint, placement, scale on canvas, windows, doors, pennants, roof, spire, materials, edge shape, and perfectly flat solid #00ff00 chroma-key background. Change lighting, exposure, and contrast only. Keep the palace isolated and centered.
Constraints: no new or removed architectural elements; no redesign; no crop; no enlargement; no surrounding glow; no halo; no cast shadow; no contact shadow; no ground; no text; no watermark; no gradient, texture, or lighting variation in the #00ff00 background; no green introduced inside opaque palace surfaces. Preserve crisp edges suitable for chroma-key removal.
```
