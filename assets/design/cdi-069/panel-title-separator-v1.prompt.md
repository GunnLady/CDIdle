# Separateur de titre des panneaux V1

## Statut

- Generation : ImageGen integre, a partir du cadre universel V1.
- Source chroma locale ignoree : `sources/panel-title-separator-v1-chroma.png`.
- Preparation : `scripts/prepare-panel-title-separator.ps1`.
- Validation visuelle de l'application runtime : en attente.

## Contrat runtime

Le separateur est une traverse decorative extensible horizontalement. Le titre
et le sous-titre restent en DOM. Les embouts reprennent les angles chanfreines
du cadre; le centre reste uniforme pour l'etirement en trois zones.

## Prompt final

```text
Use case: stylized-concept
Asset type: scalable horizontal title separator for the CDIdle fantasy RPG panel component.
Input image: the existing universal panel frame is the strict visual-language reference.
Primary request: create one long, thin, front-facing horizontal divider that looks like a structural crosspiece from that exact frame rather than a brown CSS line.
Subject: a narrow blackened-steel rail with the same faceted NMM values as the outer frame, one restrained aged-gold inner accent line, and compact symmetrical clipped end caps echoing the frame corners. The middle 70% must be perfectly straight, uniform, and ornament-free so it can be horizontally stretched or three-sliced. Keep it elegant and understated beneath a panel title.
Composition: centered horizontal object, approximately 6:1 visible aspect ratio, generous empty space around it, orthographic, perfectly symmetric, no perspective, no shadow.
Style: polished hand-painted 2D fantasy UI, dark steel and aged gold, broad readable value planes, restrained wear, matching the reference exactly.
Background extraction requirement: perfectly flat solid #ff00ff chroma-key background, uniform with no gradient, texture, shadow, reflection, or lighting variation. Do not use #ff00ff in the separator.
Constraints: no text, no icons, no gems, no rivets in the stretchable middle, no wood plank, no brown bar, no filigree, no central medallion, no watermark. Keep the separator thin enough for a compact panel header.
```
