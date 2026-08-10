# Ornements indépendants du header v1

## Contrat commun

- génération neuve inspirée de `references/header-reference.png`, sans découpe
  ni agrandissement de ses pixels ;
- aucun bois, rail, bordure horizontale ou fond rectangulaire dans les assets ;
- canevas préparés de `1024 px` de haut ;
- silhouette normalisée sur `928 px`, entre `y=48` et `y=976` ;
- axe de raccord horizontal commun à `y=512` ;
- fond chroma retiré avec matte progressif et despill ;
- statut `draft` jusqu'à validation du composite.

## Ornement gauche

```text
Use case: stylized-concept
Asset type: brand-new isolated left-end ornament for a responsive fantasy game menu bar
Input image 1: style reference only for medieval-fantasy UI craftsmanship, aged gold, dark steel, deep green heraldry, violet gemstone, and polished high-definition rendering. Do not crop, extract, upscale, or reuse its pixels.
Primary request: create a NEW standalone left ornamental overlay inspired by the reference. Include a crowned heraldic shield with a golden lion, crossed dark-steel weapons behind it, layered aged-gold filigree, one violet gemstone on the outer-left flourish, and restrained emerald vines trailing organically a short distance to the right. The result will be placed over a separate wooden menu rail.
Canvas/composition: target canvas 1536 x 1024. The complete ornament must occupy the shared vertical subject zone y=48 through y=976, centered on the horizontal attachment axis y=512. Crown top and shield tip must have equal breathing room. Keep the main crest in the left half and let only lightweight filigree and vines extend toward the right attachment edge. Provide generous transparent-production padding around the full silhouette.
Height contract: the visible ornament height is exactly the design reference for a matching right ornament. Strongest horizontal attachment point is centered at y=512. Do not crop any crown point, weapon tip, shield point, vine, or gemstone.
Style/medium: crisp high-definition fantasy game UI ornament, refined semi-realistic painted rendering, sharp materials and clean antialiased silhouette; rich but controlled contrast; not blurry, not low-resolution pixel art, not cartoon.
Background: perfectly flat uniform solid #00ff00 chroma-key background. No gradient, shadow, texture, glow, floor, or lighting variation on the green. Do not use #00ff00 inside the ornament.
Constraints: ornament only; absolutely NO wood, wooden plank, menu rail, horizontal border, rectangular backing, resource icon, text, number, button, slot, character, scenery, watermark, cast shadow, or external glow.
```

## Ornement droit

```text
Use case: stylized-concept
Asset type: brand-new isolated right-end ornament matching a responsive fantasy game menu bar
Input image 1: original art-direction reference for the compact right-end flourish and violet gemstone. Input image 2: newly generated left ornament; authoritative reference for exact rendering sharpness, aged-gold material, dark-steel accents, violet gemstone treatment, lighting direction, contrast, and the shared 1024-pixel height contract. Do not reuse or duplicate the lion crest.
Primary request: create a NEW standalone right ornamental overlay that visually pairs with Image 2. Build a compact vertical aged-gold and dark-steel filigree finial around one central violet gemstone, with layered leaf-like metalwork and restrained emerald vine accents trailing organically a short distance to the left. The result will be placed over a separate wooden menu rail.
Canvas/composition: target canvas 1024 x 1024. The complete ornament must occupy the same shared vertical subject zone y=48 through y=976 as Image 2 and be centered on the same horizontal attachment axis y=512. Top and bottom tips must have equal breathing room. Keep the main gem and finial in the right half; only lightweight filigree and vines may extend toward the left attachment edge. Full silhouette visible with generous padding.
Height contract: match Image 2's visible top and bottom exactly in normalized canvas coordinates. Strongest horizontal attachment point centered at y=512. Match the apparent metal thickness and gemstone scale of Image 2. Do not crop any tip, leaf, vine, or gemstone.
Style/medium: crisp high-definition fantasy game UI ornament matching Image 2, refined semi-realistic painted rendering, sharp materials and clean antialiased silhouette; rich but controlled contrast; not blurry, not low-resolution pixel art, not cartoon.
Background: perfectly flat uniform solid #00ff00 chroma-key background. No gradient, shadow, texture, glow, floor, or lighting variation on the green. Do not use #00ff00 inside the ornament.
Constraints: ornament only; absolutely NO wood, wooden plank, menu rail, horizontal border, rectangular backing, shield, lion, crown, crossed weapons, resource icon, text, number, button, slot, character, scenery, watermark, cast shadow, or external glow.
```
