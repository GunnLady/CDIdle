# F04 — prompt v2

## Motif de reprise

La v1 conserve une bonne garde et des proportions conformes, mais la tête de
masse en bois ne convient pas au rendu attendu. La v2 est une correction ciblée
de matériau et non une nouvelle direction de pose.

## Références transmises

1. `exec-2623fed7-7def-4fdd-bb4e-58342e53302e.png` : cible à corriger ; autorité
   pour l'intégralité de F04, la pose, la hampe, le cadrage et les proportions.
2. `validated-male-v1/warrior-male-05-combat-idle-v1.png` : référence uniquement
   pour la matière de métal forgé de la tête d'arme ; ne pas copier sa forme de
   marteau, sa pointe, sa pose, son personnage, sa tenue ou son bouclier.

## Prompt exact

> Use case: precise-object-edit
> Asset type: 2D game character combat-idle sprite
> Primary request: Edit Image 1 with one targeted change only: replace every
> visible wooden surface of the great-mace head with dark forged steel. Preserve
> all other pixels and design decisions as closely as possible.
> Input images: Image 1 is the edit target and absolute authority for F04's
> identity, face, serious expression, warm medium-brown skin, hairstyle and
> braid, exact outfit, armor, blue mantle, body proportions, stance, hands,
> straight haft, weapon angle, mace-head size and cylindrical silhouette,
> lighting, framing and transparent background. Image 2 is reference only for
> believable forged-steel color, highlights, wear and painted sprite material;
> do not copy its hammer shape, rear spike, character, pose, clothing or shield.
> Object edit: keep Image 1's compact cylindrical/barrel mace-head geometry,
> metal bands and modest rounded studs in exactly the same place and scale.
> Convert the complete cylindrical core between the bands from wood to solid
> dark gunmetal steel, with subtle hammered facets and restrained worn edges.
> The finished head must read as one coherent all-metal blunt war mace. Keep the
> wooden haft below the metal socket unchanged.
> Constraints: change only the material of the mace head; preserve F04, pose,
> anatomy, expression, outfit, colors, scale, hand placement, straight weapon
> axis, complete framing and genuine alpha transparency. Exactly one great mace.
> No text, scenery, floor, glow, magic, particles or watermark.
> Avoid: any wood on the mace head, axe blade, cutting edge, hammer face copied
> from Image 2, rear spike, pick, spear point, flanges large enough to change the
> silhouette, extra weapon, bent haft, changed hands, changed pose, changed
> proportions, redesigned clothing, new background or opaque halo.

## Candidat et contrôle

- Candidat : `exec-a7e38218-d4f9-4b8c-bf66-501e47b16690.png`.
- Dimensions : `1 374 × 1 145 px`.
- Poids : `1 083 544 octets`, `1 083,544 Ko`, `1,083544 Mo`.
- SHA-256 :
  `acb7f684f42cfa1aa182d74f7495b4b83915b30eb7ce970bb733677fd3612786`.
- Alpha : transparent ; zone visible `1 212 × 1 086 px`, aucun pixel opaque ou
  semi-transparent sur les quatre bords.
- Comparaison reproductible :
  `.tmp/cdi149-f04-v2-proportion-check.png`, produite avec
  `scripts/new-combat-idle-proportion-check.ps1` et la même boîte corporelle
  `150,46,1060,1095` que la v1.
- Proportions : tête, épaules, tronc, bras, hanches et jambes inchangés par
  rapport à la v1 conforme ; comparaison toujours compatible avec F04 neutre
  et Mage F06/F08.
- Garde et géométrie : deux prises collinéaires, hampe droite, tête complète et
  axe inchangé.
- Correction demandée : noyau de la tête désormais entièrement en métal forgé
  sombre ; aucun bois ne reste sur la tête, tandis que la hampe demeure en bois.
- Verdict Codex : conforme techniquement et proportionnellement.
- Verdict utilisateur : validé.
- Archive :
  `validated-female-v1/warrior-female-04-combat-idle-v1.png`, empreinte
  strictement identique au candidat v2.
