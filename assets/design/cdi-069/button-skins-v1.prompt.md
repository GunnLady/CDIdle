# Button skins v1

## Statut

- Matiere chene et variantes visuellement validees par l'utilisateur.
- Integration runtime via le composant partage `Button`.
- Texte, icones, focus et interactions restent rendus en DOM/CSS.

## Sources et preparation

- Masters locaux ignores : `sources/button-skins-v1/`.
- Extraction chroma des prototypes : `../../../scripts/prepare-button-prototype.ps1`.
- Normalisation runtime : `../../../scripts/prepare-button-skin.ps1`.
- Sortie commune : `768 x 240`, PNG avec alpha.
- Contrat CSS : `border-image-slice: 38 50 fill`, largeur `10 x 12 px`
  en taille `md` et `8 x 10 px` en taille `sm`.

## Prompt du chene primaire

```text
Use case: precise-object-edit
Asset type: CDIdle fantasy game UI button prototype
Primary request: replace only the central copper face with a medium
honey-brown oak plank face. Use clearly readable stylized oak grain, a few
restrained hand-painted scratches, and a subtly worn surface. The oak must be
distinctly lighter and more golden-neutral than the dark walnut panel, but not
orange.
Invariants: preserve the exact outer silhouette, proportions, clipped corners,
blackened/silver metal outer frame, thin aged-gold inner trim, perspective,
lighting, edge positions, and blank center.
Style: polished hand-painted fantasy game UI, illustrated and readable at
small size, not photorealistic.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Constraints: no text, letters, icon, emblem, rune, gem, watermark or cast
shadow.
```

## Variantes derivees

### Secondary

Repaint the validated oak as deep smoked medium-brown oak with its own grain,
wear and highlights. Replace bright gold with restrained aged bronze and reduce
the shine of the metal frame. Do not use a flat color overlay.

### Danger

Repaint the oak as deep charred oxblood-stained oak with dark red-brown grain
and scorched edge wear. Use dark forged iron and a narrow muted crimson enamel
accent. No translucent overlay, glow, symbol, blood, flames or bright red fill.

### Ghost

Remove the entire oak center and all solid interior fill. Retain only a thin,
low-contrast blackened iron perimeter with a hairline aged-bronze accent. The
center uses the chroma color so it becomes genuinely transparent after
extraction. No opaque plate, wood, glow or filled inner shadow.

## Empreintes runtime

- `button-primary-oak-v1.png` :
  `a1c5ac9acd57f27837e0f6fe58e4c2378984b5178d8929c688bda8c73bdf1d81`
- `button-secondary-oak-v1.png` :
  `69a7d6e0fd3961f35dda468910df6637c18b294f5b08d43ae40e51d298e51f6f`
- `button-danger-oak-v1.png` :
  `638a5f28891008a01c68035b3d30428c42d0d6c2d5b39aac35cfda7d85169d4d`
- `button-ghost-oak-v1.png` :
  `b502b3cc4c82fad3e1597a79081f334a7d1350165a0b70d87de0f16ab1d5fa6d`
