# F02 — prompt v1

## Références transmises

1. `../cdi-137/validated-female-v1/warrior-female-02-v1.png` : identité,
   tenue et proportions propres à F02.
2. `validated-male-v1/warrior-male-04-combat-idle-v1.png` : garde à la lance,
   axe des mains et style de la planche uniquement.
3. `.tmp/cdi149-f02-refs/m04-spearhead-geometry.png` : géométrie de la pointe
   et de sa douille uniquement.

## Prompt exact

> Use case: stylized-concept. Asset type: full-body 2D fantasy RPG combat-idle
> character sprite. Generate one new F02 warrior sprite on a genuinely
> transparent background. Image 1 is the authoritative F02 neutral identity
> and outfit: preserve exactly the same Black young adult woman, warm
> dark-brown skin, short dense natural curls, face, eyes, feminine body
> proportions, blue scarf/cape, blue sleeveless tunic with ivory vertical
> trim, brown belt, chain-mail sleeves and chain-mail skirt edge, metal
> shoulder plates, leather-and-metal bracers, dark trousers, round knee plates,
> blue leg wraps and strapped brown boots. Do not redesign, simplify, recolor,
> add, remove or swap any clothing or armor element. Preserve her exact
> identity and established female proportions. Image 2 is only the approved
> reference for a credible two-handed spear guard, straight shaft, spaced
> hands and established painted sprite style; do not copy its male identity,
> face, body, clothing or exact stance. Image 3 is only the authoritative
> spearhead geometry: copy its straight socket alignment, compact leaf-shaped
> forged-steel blade and head-to-shaft junction; adapt it seamlessly to the
> sprite style. Equip exactly one simple two-handed spear, no shield and no
> other weapon. Use a distinct, more frontal combat-ready idle than Image 2:
> torso mostly frontal with a slight three-quarter turn, feet staggered with
> the opposite lead foot from Image 2, knees slightly bent, weight balanced.
> Hold the spear diagonally across and slightly in front of the body in a
> low-to-middle guard: rear hand low near the hip and butt end, forward hand
> clearly spaced farther up the shaft, both hands gripping the same perfectly
> straight axis. The spear point aims upward and outward toward the opponent
> but remains ready, not attacking. Both wrists, elbows and fingers must be
> anatomically natural; the two grips must be collinear with the shaft. The
> entire shaft must be one uninterrupted straight line through both hands and
> the socket, with no bend, kink, wrap, curve or axis change. Keep the
> spearhead complete, sharp, correctly aligned with the shaft and not
> oversized. Keep the butt end simple and visible, with no accidental second
> blade. Serious focused combat expression: closed neutral mouth, intent
> brows, eyes tracking the opponent, no smile. Match the female Mage F06/F08
> body template: normal-sized head, correct shoulder and hip widths, long
> proportional torso, arms, thighs and lower legs; no chibi, squat, oversized
> head, masculine bulk or shortened limbs. Full hair, cape, body, boots,
> spearhead and butt end all inside the canvas with generous padding. Use a
> wider canvas if necessary; never bend or crop the spear to fit. Transparent
> alpha only. No colored backdrop, scenery, ground, shadow plate, aura, magic,
> motion trails, text, label, UI, border or watermark. Match the polished
> hand-painted anime/fantasy RPG sprite rendering of the references.

## Résultat et contrôle

- Candidat : `exec-34ed7c37-785e-4db0-9922-a97b9f59a986.png`.
- SHA-256 :
  `e240a122843cec491543c5d25f651978ee71ddbb9268da1f6156b22a19c35ebb`.
- Dimensions : `1 422 × 1 106 px`.
- Poids : `831 398 octets`, `831,398 Ko`, `0,831398 Mo`.
- Alpha : transparent aux quatre coins ; zone visible globale
  `1 235 × 958 px`, élargie uniquement par la lance.
- Comparaison : `.tmp/cdi149-f02-proportion-check.png`, pieds alignés et
  hauteur corporelle normalisée sans déformation.
- Mesures manuelles approximatives : rapport tête/tronc proche de `0,63`,
  contre environ `0,66` sur F02 neutre et une plage `0,60–0,66` sur Mage
  F06/F08 en distinguant la coiffure du crâne. Épaules, bras, hanches et sommes
  cuisse–jambe restent dans le même gabarit ; la baisse verticale des hanches
  vient de la flexion et de l'écartement.
- Géométrie : hampe droite d'un bout à l'autre, prises colinéaires, poignets
  naturels, pointe complète et alignée, talon émoussé sans seconde lame.
- Identité et tenue : éléments de F02 conservés ; expression sérieuse et
  concentrée.
- Verdict technique : `conforme`.
- Verdict visuel utilisateur : validé.
- Source archivée :
  `validated-female-v1/warrior-female-02-combat-idle-v1.png` ; empreinte
  identique au candidat.
