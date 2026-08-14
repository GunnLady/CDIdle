# Insigne Humain V1

## Statut

- Proposition visuelle validée par l'utilisateur le 14 août 2026.
- Génération : ImageGen intégré.
- Référence DA : `src/assets/images/ui/header-menu-ornament-left-v1.png`.
- Source chroma locale : `sources/dungeon-human-insignia-v1-chroma.png`.
- Source transparente locale : `sources/dungeon-human-insignia-v1.png`.
- Dimensions : `1254 x 1254 px`.
- SHA-256 chroma :
  `2d13b2a9a0b4eb2de2116c58b2ff8e894f1a02a3b1fe5fa43222258c4d1c4404`.
- SHA-256 transparent :
  `602ee9f75c2b9c2e9978e198661d621e9d4cb24fdecdc628b6bd696df76a4483`.
- Cible validée : fiche héros, comme insigne de race Humain.
- L'intégration runtime reste différée jusqu'au sous-lot de la fiche héros.

## Intégration différée

L'insigne ne doit pas apparaître dans le bandeau de progression du Donjon, qui
reste réservé aux plaques de classe. La fiche héros devra associer la race
`Humain` ou `Humaine` à cet asset dans un modèle de présentation hors React.

Critères de clôture : taille et emplacement validés sur la fiche héros,
mapping de race testé, comportement responsive vérifié et asset runtime ajouté
au manifeste CDI-069.

## Références visuelles consultées

- Alliance Warcraft : hiérarchie forte bouclier, champ coloré et métal clair,
  sans reprendre son lion frontal ni sa silhouette exacte.
- Heraldic badge and shield, Metropolitan Museum of Art : fonction
  d'identification immédiate du blason.
- Heraldic objects, British Museum : contraste et simplification des motifs.

## Prompt final

```text
Use case: stylized-concept
Asset type: detachable Human race insignia for CDIdle fantasy RPG UI
Input image: authoritative CDIdle header art-direction and identity reference.
Reuse its own visual vocabulary: deep green heraldic field, warm aged-gold
rampant lion, broad dark-steel facets, curling green ivy, one faceted purple
gemstone, regal crown language, hand-painted NMM. Simplify aggressively for a
small UI insignia; do not reproduce the entire header ornament one-for-one.
Primary request: create one grand but readable human heraldic crest as a single
connected cutout silhouette.
Subject hierarchy: central large pointed shield with deep forest-green field
and one bold gold rampant lion; a compact five-point gold crown integrated
directly above the shield; one large faceted purple gemstone centered in the
crown; two broad asymmetric ivy scrolls growing outward from behind the lower
left and right of the shield, with a few large leaves. Add only two or three
broad dark-steel backing facets behind the shield for depth. No swords.
Style: polished hand-painted 2D fantasy game UI; CDIdle header DA; illustrated
non-metallic metal with broad graphic highlights and dark outlines; rich but
slightly weathered; restrained scratches; no photorealism.
Detail budget: grandiose overall silhouette but low internal complexity. Use
large shapes, thick contours, few leaves, simplified lion anatomy, broad crown
points, and one large gem so every element survives reduction. Avoid filigree
and tiny decoration.
Composition: perfectly square, centered by the real subject silhouette
excluding any shadow; the whole connected crest occupies about 68% of the
canvas width and 70% of its height; generous clear padding on every side;
straight-on orthographic view.
Background extraction requirement: place the crest on a perfectly flat solid
#ff0000 chroma-key background. The background must be one uniform pure red
color with no shadows, gradients, texture, reflections, floor plane, glow, or
lighting variation. Do not use #ff0000 or red anywhere in the crest. Crisp
separated edges. No cast shadow, contact shadow, or reflection.
Constraints: exactly one shield, one rampant lion, one crown, one purple gem,
and two ivy scroll groups; all pieces visually connected for easy cutout; no
text, banner, runes, blue field, towers, castle, wings, gryphons, extra gems,
circular frame, watermark, or Warcraft Alliance lion-head logo.
```

## Détourage

Le fond réellement généré variait légèrement autour de `#f50101`. Le matte a
donc été calculé depuis la moyenne du pourtour plutôt que depuis le rouge
théorique. Un démélange du chroma a supprimé le liseré rouge des pixels
anticrénelés.

- Alpha aux quatre coins : `[0, 0, 0, 0]`.
- Limites utiles pour `alpha > 8` : `[108, 34, 1141, 1198]`.
