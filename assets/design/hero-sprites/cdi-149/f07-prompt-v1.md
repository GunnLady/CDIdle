# F07 — prompt v1

## Références transmises

1. `../cdi-137/validated-female-v1/warrior-female-07-v1.png` : autorité pour
   l'identité, la tenue, les couleurs et les proportions propres à F07.
2. `validated-male-v1/warrior-male-05-combat-idle-v1.png` : référence de garde
   marteau-bouclier, de protection du flanc, d'orientation de la frappe et de
   lisibilité ; ne pas copier son identité, sa tenue ou sa morphologie.
3. `references/f07/m05-warhammer-head-tight.png` : autorité pour la géométrie,
   l'orientation et le rendu de la tête du marteau déjà validé.

## Prompt exact

> Use case: stylized-concept
> Asset type: 2D game character combat-idle sprite
> Primary request: Generate one completely new F07 warrior combat-idle sprite
> on a genuinely transparent background, using the three input images only for
> their explicitly assigned roles below.
> Input images: Image 1 is authoritative for the exact F07 identity, fair skin,
> green eyes, long loose wavy ash-blonde hair, ochre shoulder mantle with round
> clasp, dark steel horizontal chest plates, layered dark pauldrons, leather
> belt, ochre split armored skirt, steel-and-leather vambraces, dark quilted
> trousers with thigh patches, round knee plates, wrapped brown boots, palette,
> materials and body proportions. Image 2 is reference only for a readable
> one-handed warhammer-and-kite-shield combat guard, separation of both arms,
> shield coverage and striking-face orientation; do not copy its male identity,
> blue clothing, silver breastplate, blond short hair or exact pose. Image 3 is
> authoritative only for the compact warhammer head: square striking face,
> short rear beak, eye, neck and painted steel material.
> Subject: The exact F07 woman from Image 1, now an experienced heavy warrior
> ready for combat. Preserve her recognizable face, long wavy ash-blonde hair,
> every garment, armor part, color and material. Change only expression, pose,
> shield and weapon. Focused serious expression, eyes tracking the opponent,
> mouth closed, no smile.
> Equipment: exactly one practical one-handed warhammer in the right hand and
> exactly one medium almond-shaped kite shield strapped to the left forearm.
> The hammer has a straight dark wooden haft with a wrapped one-handed grip and
> the compact steel head from Image 3. Show the square striking face clearly
> aimed toward the opponent and ready to hit; the short rear beak points safely
> away from her body. The hammer is not a mace, axe, pickaxe or oversized
> fantasy maul. The shield has a dark weathered steel face, ochre-brown leather
> rim and small rivets, no emblem, no spike and no magical decoration.
> Pose: full-body three-quarter combat-ready idle, related to but distinct from
> Image 2. Left foot and shield side slightly forward, feet staggered, knees
> flexed, torso upright and balanced. The shield is projected forward and
> angled to protect the left shoulder, ribs and upper thigh without hiding her
> face or the whole torso. Hold the hammer beside the right shoulder in a short
> ready position, head forward rather than resting on the shoulder. Right elbow
> lowered enough for a neutral wrist; left elbow naturally bent behind the
> shield. Both shoulders remain seated and anatomically connected.
> Style/medium: established CDIdle polished hand-painted anime-fantasy 2D
> sprite style, clean readable silhouette, warm controlled highlights,
> practical worn metal, leather and cloth, no photorealism.
> Composition/framing: show the full character, both boots, complete shield,
> hammer head, haft and rear beak with comfortable transparent padding. Widen
> the canvas if necessary. No useful pixel may touch an edge; never bend, crop
> or wrap the equipment to fit.
> Proportions: match Image 1 and the female Mage F06/F08 anatomical template.
> Preserve the same relative head size, shoulder width, torso length, arm
> length, hip placement and leg length. The shield may widen the silhouette but
> must not broaden or shorten the body.
> Background: genuinely transparent alpha only.
> Constraints: one character only; exact F07 identity and outfit; one hammer;
> one almond shield; serious focused expression; coherent hands, wrists,
> striking face and shield arm; no text, emblem, logo, scenery, floor, shadow
> plate, glow, magic, particles or watermark.
> Avoid: round shield, buckler, tower shield, shield covering face, two-handed
> hammer, mace head, axe blade, double weapon, wooden hammer head, giant maul,
> striking with the side of the head, backward hammer, shoulder-rest pose,
> broken wrist, hidden weapon hand, extra fingers, redesigned armor, helmet,
> cape, smile, oversized head, chibi proportions or cropped equipment.

## Résultat v1

- fichier généré : `exec-56936372-6b55-4498-9267-6e1ff2e89bd4.png` ;
- dimensions : 1024 × 1536 px ;
- taille : 2 352 559 octets, soit 2 352,559 Ko / 2,352559 Mo en base
  décimale ;
- SHA-256 :
  `98966104259b3ffbacf1230113fd96f84121f5e39200ff75292ce65fc9e6ead7` ;
- contrôle : `.tmp/cdi149-f07-v1-proportion-check.png` ;
- cadrage de comparaison du corps : `59,81,949,1415` ;
- proportions : conformes au neutre F07 et aux Mage F06/F08. Le volume des
  cheveux ne modifie pas l'échelle du crâne ; tête, épaules, tronc, bras,
  hanches, genoux et jambes conservent les mêmes rapports ;
- marteau : poignet neutre, manche droit, tête cohérente et face carrée dirigée
  vers l'adversaire, dans la même direction que le regard ;
- bouclier : forme en amande complète, couverture de l'épaule à la cuisse sans
  masquer le visage ni déformer la silhouette anatomique ;
- cadrage : tous les éléments utiles sont entiers. Le marteau conserve environ
  33 px de marge à gauche. Les 14 pixels présents sur le bord gauche sont des
  résidus colorés à alpha 1, nettoyables lors de la normalisation ;
- statut : techniquement conforme, en attente de validation visuelle
  utilisateur, non archivé.
