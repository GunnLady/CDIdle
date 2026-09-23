# F03 — prompt v1

## Références transmises

1. `../cdi-137/validated-female-v1/warrior-female-03-v1.png` : autorité pour
   l'identité, la tenue, les couleurs et les proportions propres à F03.
2. `validated-male-v1/warrior-male-01-combat-idle-v1.png` : référence de garde
   épée-bouclier validée, de lisibilité des armes et de style de la planche.
3. `../cdi-140/validated-female-v1/mage-female-08-v1.png` : référence stricte du
   gabarit féminin, sans reprendre son identité ni sa tenue.

## Prompt exact

> Use case: stylized-concept
> Asset type: 2D game character combat-idle sprite
> Primary request: Generate one completely new F03 warrior combat-idle sprite
> on a genuinely transparent background, using the three input images only as
> the explicitly assigned references below.
> Input images: Image 1 is authoritative for F03 identity, face, skin tone,
> long dark-brown low ponytail with long face-framing strands, exact olive-green
> studded high-collar armored tunic, layered metal shoulder plates, cream short
> sleeves, brown-metal bracers, dark trousers, round knee plates, olive wraps,
> strapped brown boots, palette and material treatment. Image 2 is reference
> only for a readable experienced-warrior sword-and-round-shield guard, weapon
> construction and the established painted sprite style; do not copy its male
> identity, red hair, body, outfit or exact pose. Image 3 is reference only for
> the established female Mage F08 anatomical template and overall head,
> shoulder, trunk, arm, hip and leg proportions; do not copy her identity,
> hair, skin tone or clothing.
> Subject: The exact F03 woman from Image 1, now an experienced warrior ready
> for combat. Preserve her recognizable face, hairstyle, every garment,
> armor part, color and material. Change only her expression, pose and weapons.
> Her expression is focused and serious, mouth closed, no smile.
> Weapons: exactly one practical straight one-handed arming sword and exactly
> one medium round shield. The shield is metal-faced with a simple central boss
> and restrained rim, matching F03's worn metal and olive-brown palette. The
> sword has a straight double-edged blade, compact crossguard and one-handed
> grip. No dagger, no second sword, no oversized fantasy blade, no tower shield.
> Pose: full-body three-quarter combat-ready idle, distinct from Image 2. The
> shield arm is forward and slightly bent, round shield protecting the left
> flank and part of the torso without hiding the face. The sword arm stays to
> the right side, elbow relaxed and lowered, blade angled diagonally forward and
> upward, edge and point aligned naturally with the grip. Feet are staggered,
> knees flexed, weight balanced and center of gravity low enough to read as a
> trained fighter who can block or strike immediately. Both shoulders remain
> anatomically seated; wrists are neutral; hands grip their own weapon clearly.
> Style/medium: match the established CDIdle polished hand-painted anime-fantasy
> 2D sprite style, clean readable silhouette, warm controlled highlights,
> detailed but practical materials, no photorealism.
> Composition/framing: show the entire character, both boots, the complete
> sword and complete round shield with comfortable transparent padding. Widen
> the canvas if necessary; never bend, shorten, crop or wrap a weapon to fit.
> Proportions: match Image 1 and the established female Mage F06/F08 template.
> Preserve the same relative proportions of head, shoulder width, torso length,
> arm length, hip placement and leg length. Do not enlarge the head, broaden or
> shorten the torso, shorten the arms, lower the hips or compress the legs.
> Background: genuinely transparent alpha only.
> Constraints: one character only; exact F03 identity and outfit; exactly one
> sword and one round shield; serious focused expression; coherent hands,
> wrists and weapon axes; no text, emblem, logo, scenery, floor, shadow plate,
> glow, magic, particles or watermark.
> Avoid: thief or rogue styling, daggers, dual wield, reverse grip, crossed
> wrists, warped blade, bent sword, shield fused into the arm or clothing,
> hidden hands, extra fingers, extra weapons, redesigned armor, cape, hood,
> helmet, smile, oversized head, chibi proportions, cropped equipment.

## Candidat et contrôle

- Candidat : `exec-37eb394b-802c-46d1-b993-82c684125d5d.png`.
- Dimensions : `1 145 × 1 374 px`.
- Poids : `1 292 553 octets`, `1 292,553 Ko`, `1,292553 Mo`.
- SHA-256 :
  `0b58e8b8ffa15c94e037f2b44b4edda793ae59097f221d5fe93ea5c0bea62963`.
- Alpha : transparent ; zone visible globale `1 090 × 1 355 px`, élargie par
  l'épée et le bouclier.
- Comparaison reproductible : `.tmp/cdi149-f03-proportion-check.png`, corps
  alignés sur les pieds et normalisés à hauteur égale sans déformation du ratio
  propre à chaque source ; la pointe de l'épée est exclue de la boîte corporelle.
- Tête : environ `18–19 %` de la hauteur corporelle, compatible avec F03 neutre
  et les gabarits Mage F06/F08.
- Épaules et tronc : largeur d'épaules et longueur de tronc cohérentes ; aucune
  hypertrophie ni compression visible malgré l'avancée du bouclier.
- Bras : bras d'épée lisible, coude légèrement fléchi et poignet neutre ; bras
  de bouclier partiellement masqué mais articulation d'épaule cohérente.
- Hanches et jambes : hanches au bon niveau, jambes non raccourcies ; l'écart
  apparent vient de la flexion de garde et non d'un tassement anatomique.
- Armes : une seule épée droite complète et un seul bouclier rond complet ;
  aucune dague, aucun axe déformé ou équipement rogné.
- Expression : sérieuse et concentrée, bouche fermée.
- Verdict Codex : conforme techniquement et proportionnellement.
- Verdict utilisateur : validé.
- Archive :
  `validated-female-v1/warrior-female-03-combat-idle-v1.png`, empreinte
  strictement identique au candidat source.
