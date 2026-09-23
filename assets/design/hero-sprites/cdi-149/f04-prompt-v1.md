# F04 — prompt v1

## Références transmises

1. `../cdi-137/validated-female-v1/warrior-female-04-v1.png` : autorité pour
   l'identité, la tenue, les couleurs et les proportions propres à F04.
2. `validated-male-v1/warrior-male-03-combat-idle-v1.png` : référence de garde
   basse à deux mains, d'espacement des prises et d'axe de hampe ; ne pas
   reproduire sa hache.
3. `validated-male-v1/warrior-male-07-combat-idle-v1.png` : référence de
   géométrie, matières et rendu de la masse ; ne pas reprendre sa pose.

## Prompt exact

> Use case: stylized-concept
> Asset type: 2D game character combat-idle sprite
> Primary request: Generate one completely new F04 warrior combat-idle sprite
> on a genuinely transparent background, using the three input images only for
> their explicitly assigned roles below.
> Input images: Image 1 is authoritative for F04 identity, warm medium-brown
> skin, brown eyes, long dark-brown hair in a thick side braid with loose curled
> face-framing strands, exact blue shoulder mantle and round gold clasp, scale
> armor tunic, layered shoulder plates, cream short sleeves, bracers, belt,
> dark quilted trousers, round knee plates, strapped brown boots, palette and
> materials. Image 2 is reference only for the low two-handed combat guard,
> straight weapon axis, spaced grips and grounded stance; do not copy its male
> identity, outfit, axe head or exact body. Image 3 is reference only for the
> cylindrical blunt mace-head construction, metal bands, studs, wood-and-metal
> materials and established painted sprite style; do not copy its male
> identity, outfit or over-the-shoulder pose.
> Subject: The exact F04 woman from Image 1, now an experienced warrior ready
> to fight. Preserve her recognizable face, hairstyle and braid, every garment,
> armor piece, color and material. Change only expression, pose and weapon. Her
> expression is focused and serious, mouth closed, no smile.
> Weapon: exactly one practical two-handed great mace. It has one straight
> wooden haft, slightly shorter than Image 2's polearm, and one compact heavy
> cylindrical wooden striking head reinforced by dark steel bands and modest
> rounded studs, adapted from Image 3. The mace is blunt on every side: no axe
> blade, no spear point, no pick, no beak, no chain, no second weapon.
> Pose: full-body three-quarter combat-ready idle. Use the logic of Image 2 but
> make a distinct pose: feet staggered and wider than the hips, knees flexed,
> center of gravity lowered. Hold the mace diagonally across the front of the
> body with both hands on the same perfectly straight haft. Rear hand grips the
> lower third near the rear hip; forward hand grips around the middle in front
> of the torso. The mace head projects forward and upward beyond the forward
> shoulder, ready to intercept or strike. It must not rest on the shoulder.
> Both wrists are neutral and collinear with the haft; elbows stay naturally
> bent; shoulders remain seated; the head, hands and haft share one coherent
> perspective and depth.
> Style/medium: match the established CDIdle polished hand-painted anime-fantasy
> 2D sprite style, clean readable silhouette, warm controlled highlights,
> detailed practical materials, no photorealism.
> Composition/framing: show the entire character, both boots and the complete
> mace with comfortable transparent padding. Widen the canvas if necessary;
> never bend, shorten, crop or wrap the haft or mace head to fit.
> Proportions: match Image 1 and the established female Mage F06/F08 anatomical
> template. Preserve the same relative proportions of head, shoulder width,
> torso length, arm length, hip placement and leg length. Do not enlarge the
> head, broaden or shorten the trunk, shorten the arms, lower the hips or
> compress the legs.
> Background: genuinely transparent alpha only.
> Constraints: one character only; exact F04 identity and outfit; exactly one
> two-handed blunt great mace; serious focused expression; coherent hands,
> wrists and weapon axis; no text, emblem, logo, scenery, floor, shadow plate,
> glow, magic, particles or watermark.
> Avoid: dagger, sword, axe, poleaxe, halberd, spear point, war pick, sharp
> blade, one-handed grip, shoulder-rest pose, warped haft, bent weapon, detached
> mace head, hidden hands, extra fingers, extra weapons, redesigned armor,
> helmet, smile, oversized head, chibi proportions, cropped equipment.

## Candidat et contrôle

- Candidat : `exec-2623fed7-7def-4fdd-bb4e-58342e53302e.png`.
- Dimensions : `1 374 × 1 145 px`.
- Poids : `1 106 784 octets`, `1 106,784 Ko`, `1,106784 Mo`.
- SHA-256 :
  `8dc9a28e75fd8f306e680c97122d47f64c0158493e30e03868ca7a743a4e78d8`.
- Alpha : transparent ; zone visible globale `1 342 × 1 124 px`. Trois pixels
  alpha isolés touchent le bord gauche sans appartenir à la silhouette ; ils
  seront nettoyés de façon déterministe après validation éventuelle.
- Comparaison reproductible : générée par
  `scripts/new-combat-idle-proportion-check.ps1` dans
  `.tmp/cdi149-f04-proportion-check.png`, avec boîte corporelle candidat
  `150,46,1060,1095`, pieds alignés et hauteur corporelle normalisée sans
  déformation du ratio propre à chaque source.
- Tête : environ `20 %` de la hauteur corporelle, compatible avec F04 neutre et
  les gabarits Mage F06/F08.
- Épaules et tronc : proportions cohérentes ; l'ouverture apparente vient de la
  garde et des bras, sans élargissement structurel du torse.
- Bras : longueurs plausibles, deux coudes fléchis et deux poignets collinéaires
  avec la hampe ; mains distinctes et prises lisibles.
- Hanches et jambes : placement des hanches conservé, cuisses et jambes non
  tassées ; largeur accrue uniquement par la garde fléchie.
- Arme : hampe droite, tête contondante complète, aucune lame ni déformation ;
  les deux mains suivent le même axe.
- Expression : sérieuse et concentrée, bouche fermée.
- Verdict Codex : conforme techniquement et proportionnellement ; validation
  visuelle utilisateur requise avant nettoyage alpha et archivage.
