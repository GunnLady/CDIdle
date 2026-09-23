# F06 — prompt v2

## Stratégie

Nouvelle génération depuis zéro. La candidate v1 rejetée n'est ni transmise ni
utilisée comme référence. Les trois références restent celles de la v1 : neutre
F06, M03 validé et gros plan de la tête M03.

## Prompt exact

> Use case: stylized-concept
> Asset type: 2D game character combat-idle sprite
> Primary request: Generate one completely new F06 warrior combat-idle sprite
> from scratch on a genuinely transparent background. Do not imitate or repair
> any prior F06 combat output. Use only the three supplied reference images for
> their roles below.
> Input images: Image 1 is authoritative for the exact F06 identity, fair skin,
> brown eyes, freckles, short tousled copper-red hair, high-collar dark red
> padded under-tunic, red-brown brigandine with alternating vertical steel
> plates, matching shoulder armor, waist panels and vambraces, leather belt,
> dark quilted trousers, round steel knee plates, wrapped brown boots, palette,
> materials and body proportions. Image 2 is reference only for a readable
> two-handed greataxe guard, realistic hand spacing, a rigid straight haft and
> grounded combat readiness; do not copy its male identity, green clothing,
> leather armor, ponytail or exact pose. Image 3 is authoritative only for the
> practical single-crescent steel axe head, compact poll, eye, collar,
> proportions and painted material style.
> Subject: The exact F06 woman from Image 1, now an experienced heavy warrior
> ready for combat. Preserve her recognizable face, short red hair, every
> garment, armor plate, color and material. Change only expression, pose and
> weapon. Focused serious expression, mouth closed, no smile.
> Weapon: exactly one practical two-handed greataxe. Its dark wooden haft is a
> single perfectly rigid straight cylinder from butt to axe eye. Treat the
> centerline of the entire haft as one ruler-straight line: the segment below
> the rear hand, the segment between both hands and the segment above the front
> hand must be perfectly collinear, with no kink, curve, bow, perspective bend
> or change of angle at either hand. Both hands encircle that same rigid line.
> Attach the single crescent steel head from Image 3 rigidly to that line using
> its eye and collar. One cutting blade only; no rear blade, spike, hammer face
> or fantasy protrusion.
> Pose: full-body three-quarter combat-ready idle, newly composed and distinct
> from Image 2. Feet staggered wider than the hips, knees flexed, torso upright
> and balanced. Hold the straight axe diagonally across the front of the body,
> head forward around shoulder height and blunt butt down near the opposite
> hip. Hands use normal forward grips and are clearly separated along the same
> shaft. Elbows naturally bent, shoulders seated, wrists neutral. The weapon
> does not rest on the shoulder and does not pass behind the body.
> Style/medium: established CDIdle polished hand-painted anime-fantasy 2D
> sprite style, clean readable silhouette, warm controlled highlights,
> practical metal, leather and cloth, no photorealism.
> Composition/framing: use a wide enough canvas and center the complete
> character-plus-weapon silhouette. Show both boots, the full axe head, every
> edge of the blade and the complete butt. Leave at least a visually obvious
> band of transparent empty space around every side, especially beyond the axe
> blade on the right. No visible pixel of character or weapon may touch any
> canvas edge. Never shorten, bend, crop or wrap the weapon to make it fit.
> Proportions: match Image 1 and the female Mage F06/F08 anatomical template.
> Preserve the same relative head size, shoulder width, torso length, arm
> length, hip placement and leg length. The stance may widen the silhouette but
> must not broaden or shorten the anatomy.
> Background: genuinely transparent alpha only.
> Constraints: one character only; exact F06 identity and outfit; exactly one
> greataxe; serious focused expression; ruler-straight uninterrupted haft;
> hands, wrists, collar and axe head sharing coherent geometry; generous empty
> transparent padding; no text, logo, scenery, floor, glow or watermark.
> Avoid: kinked haft, two shaft angles, curved wood, bowed shaft, bent weapon,
> cropped axe head, edge contact, wood axe head, double-bit axe, halberd,
> poleaxe spikes, spear point, hammer, scythe, shield, second weapon,
> shoulder-rest pose, hidden hands, extra fingers, redesigned armor, helmet,
> smile, oversized head or chibi proportions.

## Résultat v2

- fichier généré : `exec-32409e71-8dc2-4cd3-9174-4609e2cc4315.png` ;
- dimensions : 1441 × 1092 px ;
- taille : 1 017 460 octets, soit 1 017,46 Ko / 1,01746 Mo en base
  décimale ;
- SHA-256 :
  `b2a25a700ce74a56698853acadae0cf9f01d63dcb8dd1565236ee6f074540725` ;
- contrôle des proportions : `.tmp/cdi149-f06-v2-proportion-check.png` ;
- contrôle agrandi de la hampe : `.tmp/cdi149-f06-v2-shaft-crop.png` ;
- cadrage de comparaison du corps : `162,20,953,1042` ;
- proportions : conformes au neutre F06 et aux Mage F06/F08 pour la tête, les
  épaules, le tronc, les bras, les hanches, les genoux et les jambes ;
- hampe : contrôle agrandi effectué. Les segments avant, entre et après les
  mains restent collinéaires et le raccord entre droit dans le collier de la
  tête ; aucun coude visible ;
- cadrage : la tête est entière avec 27 px de marge transparente à droite.
  Dix pixels noirs à alpha 1 subsistent au bord gauche, loin de tout élément
  utile ; il s'agit d'un résidu alpha nettoyable, pas d'un objet rogné ;
- statut : techniquement conforme, en attente de validation visuelle
  utilisateur, non archivé.
