# F05 — prompt v1

## Références transmises

1. `../cdi-137/validated-female-v1/warrior-female-05-v1.png` : autorité pour
   l'identité, la tenue, les couleurs et les proportions propres à F05.
2. `validated-male-v1/warrior-male-02-combat-idle-v1.png` : référence de logique
   dual wield, de garde asymétrique et de lisibilité ; ne pas copier ses épées,
   son identité, sa tenue ou sa pose exacte.
3. `validated-male-v1/warrior-male-09-combat-idle-v1.png` : référence de
   géométrie, courbure, tranchant, poignée et style d'un sabre ; ne pas copier
   son identité, sa tenue ou sa pose.

## Prompt exact

> Use case: stylized-concept
> Asset type: 2D game character combat-idle sprite
> Primary request: Generate one completely new F05 warrior combat-idle sprite
> on a genuinely transparent background, using the three input images only for
> their explicitly assigned roles below.
> Input images: Image 1 is authoritative for F05 identity, warm medium-brown
> skin, brown eyes, voluminous shoulder-length dark-brown curls, exact red
> shoulder mantle and round red-gold clasp, ochre stitched lamellar armor,
> layered shoulder plates, golden short sleeves, bracers, belt, dark quilted
> trousers, round knee plates, pale leg wraps, strapped brown boots, palette,
> materials and body proportions. Image 2 is reference only for readable
> asymmetric dual-wield logic, separation of the arms and grounded combat
> readiness; do not copy its male identity, red tunic, cape, straight swords or
> exact pose. Image 3 is reference only for a practical short saber's gentle
> curve, single cutting edge, point, guard, grip and painted sprite rendering;
> do not copy its male identity, blue clothing or high one-weapon pose.
> Subject: The exact F05 woman from Image 1, now an experienced agile warrior
> ready for combat. Preserve her recognizable face, curls, every garment,
> armor part, color and material. Change only expression, pose and weapons. Her
> expression is focused and serious, mouth closed, no smile.
> Weapons: exactly two matching practical short sabers, one in each hand. Both
> have gently curved single-edged steel blades, compact guards and brown wrapped
> one-handed grips. Each blade is clearly sword-length and longer than the
> wielder's forearm, but compact enough for dual wield; neither is a dagger,
> katana, oversized fantasy blade or straight double-edged sword. Both sabers
> have identical geometry and scale.
> Pose: full-body three-quarter combat-ready idle, distinct from Image 2. Feet
> are staggered a little wider than the hips, knees flexed, torso upright and
> center of gravity balanced. The forward-hand saber guards low-to-mid height
> in front of the centerline with its point angled outward and slightly upward.
> The rear-hand saber stays beside and just behind the opposite shoulder, point
> upward and outward, ready to cut. Use normal forward grips for both weapons.
> Keep wrists neutral, elbows naturally bent, shoulders seated and both blade
> spines aligned with their grips. No crossed wrists, crossed blades, reverse
> grip, self-cutting angle or blade passing behind the head.
> Style/medium: match the established CDIdle polished hand-painted anime-fantasy
> 2D sprite style, clean readable silhouette, warm controlled highlights,
> detailed practical materials, no photorealism.
> Composition/framing: show the entire character, both boots and both complete
> sabers with comfortable transparent padding. Widen the canvas if necessary;
> never bend, shorten, crop or wrap either blade to fit.
> Proportions: match Image 1 and the established female Mage F06/F08 anatomical
> template. Preserve the same relative proportions of head, shoulder width,
> torso length, arm length, hip placement and leg length. Do not enlarge the
> head, broaden or shorten the trunk, shorten the arms, lower the hips or
> compress the legs.
> Background: genuinely transparent alpha only.
> Constraints: one character only; exact F05 identity and outfit; exactly two
> matching short sabers; serious focused expression; coherent hands, wrists and
> blade axes; no text, emblem, logo, scenery, floor, shadow plate, glow, magic,
> particles or watermark.
> Avoid: dagger, knife, reverse grip, straight longsword, two-handed weapon,
> shield, scabbard, chain, fused blades, crossed arms, warped or bent blade,
> hidden hands, extra fingers, extra weapons, redesigned armor, helmet, smile,
> oversized head, chibi proportions or cropped equipment.

## Résultat v1

- fichier généré : `exec-5049a2c1-3918-4945-baca-ebecba4f68b7.png` ;
- dimensions : 1024 × 1536 px ;
- taille : 2 000 584 octets, soit 2 000,584 Ko / 2,000584 Mo en base
  décimale ;
- SHA-256 :
  `a2734d465a9fb88deb8152c725bf556e1fc57d1b026effdb9e263a25bbec6ea9` ;
- contrôle : `.tmp/cdi149-f05-v1-proportion-check.png` ;
- cadrage de comparaison du corps : `86,204,877,1254` ;
- verdict technique : proportions conformes au neutre F05 et aux Mage F06/F08.
  La tête, la ligne d'épaules, le tronc, les bras, les hanches et les jambes
  gardent les mêmes rapports verticaux ; l'écartement apparent est produit par
  la garde et les jambes fléchies, sans raccourcissement anatomique détecté ;
- armes et pose : deux sabres complets, non croisés, axes cohérents avec les
  poignets, garde asymétrique lisible et expression sérieuse ;
- fond : l'alpha existe, mais un halo brun/noir semi-transparent occupe presque
  tout le cadre (`alpha bounds 0,37,1012,1499`) et devra être nettoyé pendant la
  normalisation si la candidate est validée. Aucun élément utile n'est coupé ;
- statut : en attente de validation visuelle utilisateur, non archivé.
