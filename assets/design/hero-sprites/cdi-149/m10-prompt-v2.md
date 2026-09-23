# M10 — prompt v2

## Références transmises

1. `../cdi-137/validated-male-v1/warrior-male-10-v1.png` : identité, tenue et
   proportions propres à M10.
2. `validated-male-v1/warrior-male-02-combat-idle-v1.png` : logique de garde
   asymétrique à deux armes uniquement.
3. `validated-male-v1/warrior-male-03-combat-idle-v1.png` : construction et
   rendu de la hache uniquement.

La v1 rejetée n'a pas été transmise.

## Prompt exact

> Use case: stylized-concept. Asset type: full-body 2D fantasy RPG combat-idle
> character sprite. Generate a completely new M10 candidate from the three
> supplied references; do not reuse or imitate any rejected generation. Image
> 1 is authoritative for M10 identity, face, hairstyle and braid, skin tone,
> exact outfit, colors, body build and proportions. Image 2 is only a reference
> for an asymmetric, grounded dual-wield guard and natural hand/arm
> relationships. Image 3 is only a reference for the established axe
> construction, materials and painted sprite style. Preserve M10 exactly: same
> young adult face, dark-brown hair and long braid, olive-green scarf/cape with
> round clasp, dark gray horizontal plate chest armor and brown buckles,
> olive-and-cream split tunic panels, brown trousers, knee plates, bracers and
> strapped brown boots. Do not redesign, simplify, recolor, add or remove
> clothing. Critical proportion correction: match the neutral M10 and the
> established male Mage M06/M08 anatomical template, with a clearly smaller
> head relative to the body than the rejected draft, a longer non-compressed
> torso, normal shoulder width, non-bulky arms, correctly placed hips, and long
> proportional thighs and lower legs. The stance may bend the knees but must
> not create a squat, chibi, oversized-head or top-heavy silhouette. Equip
> exactly two matching short one-handed battle axes. Each axe has one compact
> single cutting edge, a straight short wooden haft, and a believable
> forged-metal head-to-haft junction. No double-headed axes, no polearms, no
> swords, no oversized weapons. Use a real defensive combat-ready idle: feet
> staggered and grounded, knees only slightly bent, torso upright and alert.
> The forward hand holds its axe low-to-mid directly in front of the torso so
> the blade covers the centerline; it must not point far out to the side. The
> rear hand holds the second axe ready beside and slightly behind the shoulder,
> not mid-swing. Both wrists stay straight and natural, fingers grip correctly,
> elbows remain believable, blade planes align with their hands and hafts.
> Serious focused expression with closed neutral mouth, lowered intent brows
> and eyes tracking an opponent; absolutely no smile. Full head, braid, cape,
> body, boots and both complete axes remain inside the canvas with generous
> padding; use a wider canvas if needed and never bend or wrap an axe to fit.
> Transparent alpha background only. No colored backdrop, scenery, ground,
> shadow plate, aura, magic, motion trails, text, labels, UI, border or
> watermark. Match the same polished hand-painted anime/fantasy RPG sprite
> rendering as the references.

## Résultat et contrôle

- Candidat : `exec-a36f3f8c-2c8f-4eba-9dd0-6a9caab09730.png`.
- SHA-256 :
  `713626be86bc7cfee70ee7e3b4669deffee94bd182d2f5d79395949c6db07025`.
- Dimensions : `1 312 × 1 199 px`.
- Poids : `1 017 118 octets`, `1 017,118 Ko`, `1,017118 Mo`.
- Alpha : transparent aux quatre coins ; zone visible globale
  `895 × 1 126 px`.
- Comparaison : `.tmp/cdi149-m10-v2-proportion-check.png`, pieds alignés et
  hauteur corporelle normalisée sans déformation.
- Mesures manuelles approximatives sur les articulations visibles : rapport
  tête/tronc proche de `0,65`, contre environ `0,65` sur M10 neutre et une
  plage approximative `0,61–0,72` sur Mage M06/M08. Les épaules, bras, hanches
  et sommes cuisse–jambe restent dans le même gabarit. La réduction de hauteur
  verticale vient de la flexion et de l'écartement des jambes, pas d'un
  raccourcissement des segments.
- Géométrie : deux manches droits, têtes cohérentes avec leur axe, deux prises
  naturelles, hache avant sur la ligne centrale et hache arrière en réserve.
- Expression : sérieuse et concentrée, bouche fermée.
- Verdict technique : `conforme`.
- Verdict visuel utilisateur : validé.
- Source archivée :
  `validated-male-v1/warrior-male-10-combat-idle-v1.png` ; empreinte identique
  au candidat.
