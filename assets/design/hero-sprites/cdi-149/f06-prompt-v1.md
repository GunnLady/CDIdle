# F06 — prompt v1

## Références transmises

1. `../cdi-137/validated-female-v1/warrior-female-06-v1.png` : autorité pour
   l'identité, la tenue, les couleurs et les proportions propres à F06.
2. `validated-male-v1/warrior-male-03-combat-idle-v1.png` : référence de garde
   à grande hache, d'écartement des mains, d'axe de hampe et de lisibilité ; ne
   pas copier son identité, sa tenue, sa morphologie ou sa pose exacte.
3. `references/f06/m03-greataxe-head.png` : autorité pour la géométrie et le
   rendu de la tête de hache simple lame déjà validée.

## Prompt exact

> Use case: stylized-concept
> Asset type: 2D game character combat-idle sprite
> Primary request: Generate one completely new F06 warrior combat-idle sprite
> on a genuinely transparent background, using the three input images only for
> their explicitly assigned roles below.
> Input images: Image 1 is authoritative for the exact F06 identity, fair skin,
> brown eyes, freckles, short tousled copper-red hair, high-collar dark red
> padded under-tunic, red-brown brigandine with alternating vertical steel
> plates, matching shoulder armor, waist panels and vambraces, leather belt,
> dark quilted trousers, round steel knee plates, wrapped brown boots, palette,
> materials and body proportions. Image 2 is reference only for the readable
> two-handed greataxe guard, straight haft, separated grips, weapon axis and
> grounded combat readiness; do not copy its male identity, green clothing,
> leather armor, ponytail or exact pose. Image 3 is authoritative only for the
> greataxe head: reproduce its practical single crescent steel blade, compact
> poll, eye, collar, proportions and painted material style; do not copy any
> body or clothing from it.
> Subject: The exact F06 woman from Image 1, now an experienced heavy warrior
> ready for combat. Preserve her recognizable face, short red hair, every
> garment, armor plate, color and material. Change only expression, pose and
> weapon. Her expression is focused and serious, brows engaged, mouth closed,
> no smile.
> Weapon: exactly one practical two-handed greataxe with a straight dark wooden
> haft and the single crescent steel head from Image 3. The head has one cutting
> blade only, no second blade, rear spike, top spike, hammer face or decorative
> fantasy protrusion. Keep the head rigidly aligned with the haft and preserve
> the clear eye-and-collar attachment. The haft is long but controllable,
> approximately from the ground to her upper chest, not taller than the whole
> character and never oversized.
> Pose: full-body three-quarter combat-ready idle, inspired by but distinct from
> Image 2. Feet staggered slightly wider than the hips, forward knee flexed,
> rear leg grounded, torso upright and balanced. Hold the axe diagonally across
> the front of the body: the steel head points forward at shoulder height,
> ready for a short descending cut, while the blunt butt of the haft trails
> down and across near the opposite hip. Both hands grip the same straight haft
> in normal forward grips, spaced roughly one third of the haft apart. Keep the
> elbows naturally bent, shoulders seated, wrists neutral and both hands on the
> exact same straight axis. The weapon does not rest on the shoulder.
> Style/medium: match the established CDIdle polished hand-painted anime-fantasy
> 2D sprite style, clean readable silhouette, warm controlled highlights,
> detailed practical metal, leather and cloth, no photorealism.
> Composition/framing: show the entire character, both boots, the full axe head
> and the complete haft with comfortable transparent padding. Widen the canvas
> if necessary; never bend, shorten, crop or wrap the haft or blade to fit.
> Proportions: match Image 1 and the established female Mage F06/F08 anatomical
> template. Preserve the same relative proportions of head, shoulder width,
> torso length, arm length, hip placement and leg length. The combat stance may
> widen the silhouette but must not enlarge the head, broaden or shorten the
> trunk, shorten the arms, lower the hips or compress the legs.
> Background: genuinely transparent alpha only.
> Constraints: one character only; exact F06 identity and outfit; exactly one
> two-handed greataxe; serious focused expression; coherent hands, wrists, haft
> and axe-head axes; no text, emblem, logo, scenery, floor, shadow plate, glow,
> magic, particles or watermark.
> Avoid: wood axe head, double-bit axe, halberd, poleaxe spikes, spear point,
> hammer head, scythe, shield, second weapon, shoulder-rest pose, crossed arms,
> warped or bent haft, twisted axe head, hidden hands, extra fingers, redesigned
> armor, helmet, smile, oversized head, chibi proportions or cropped equipment.

## Résultat v1

- fichier généré : `exec-ec3db292-f5a4-4e4a-be0b-76b830cf618e.png` ;
- dimensions : 1222 × 1287 px ;
- taille : 1 190 941 octets, soit 1 190,941 Ko / 1,190941 Mo en base
  décimale ;
- SHA-256 :
  `77138cff4f0fbb4d2b74837b1204a63ab7f1b3b8d2a8121dc4a7aa75ff1af53a` ;
- contrôle : `.tmp/cdi149-f06-v1-proportion-check.png` ;
- cadrage de comparaison du corps : `15,18,966,1240` ;
- proportions : conformes au neutre F06 et aux Mage F06/F08. La tête et la
  ligne d'épaules se placent aux mêmes niveaux relatifs ; longueur du tronc,
  coudes, mains, hanches, genoux et longueur des jambes restent compatibles. La
  largeur supérieure vient de la garde et non d'un élargissement anatomique ;
- pose et arme : expression sérieuse, mains espacées sur un même axe, poignets
  naturels, hampe droite et tête simple lame correctement alignée ;
- défaut bloquant : `CandidateRightEdgeAlpha = 16`. La tête de hache atteint le
  bord droit et son contour est très légèrement rogné ; le critère d'équipement
  entièrement contenu dans le cadre n'est donc pas satisfait ;
- statut : rejeté utilisateur. En plus du cadrage, la hampe change visiblement
  d'angle au niveau des mains ; le verdict initial qui la disait droite était
  erroné. Candidate non archivée et interdite comme référence de régénération.
