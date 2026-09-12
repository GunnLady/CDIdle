# Pack Citernes oubliées UnderCity v1

## Provenance et usage

- Génération : ImageGen intégré à Codex, 11 septembre 2026, mode création.
- Références de direction inspectées : kits Égouts et Galeries UnderCity v1,
  héros et ennemis CDIdle existants. Aucun asset externe n'est incorporé.
- Livrables optimisés :
  `public/assets/images/dungeon/undercity/cisterns/`.
- Usage autorisé : scènes Donjon 2D CDIdle sur PC.
- Version : v1. Les prompts, identifiants de sources retenues et sorties
  runtime versionnées font foi.
- Révision des créatures organiques : ImageGen intégré à Codex, 12 septembre
  2026, le Crabe des vannes servant de référence autoritaire de rendu pixel.

## Direction commune des sprites

Créer exactement un ennemi détouré sur fond réellement transparent, entier,
orienté vers la gauche et posé sur une ligne de sol claire. Les humanoïdes et
constructions bipèdes reprennent l'anatomie chibi compacte, les formes simples,
les contours pixel sombres, les palettes limitées et la densité de pixels des
héros CDIdle. Les créatures organiques conservent leur silhouette bestiale.
Palette bleu-noir, pierre, fer rouillé, vert-de-gris et lumière teal/ambre.
Aucun sol, ombre portée, décor, eau périphérique, texte, logo, interface, gore,
rendu réaliste, peinture détaillée ou 3D.

## Décor

`forgotten-cisterns-stage-v1.jpg` — immense citerne gothique, colonnes et
vannes rouillées, eau reléguée derrière une large chaussée de pierre sèche qui
occupe les 42 % inférieurs. Axe de combat dégagé, profondeur par les arches et
les reflets teal, points chauds ambre latéraux. Aucun personnage, animal, texte
ou interface.

Source ImageGen révisée : `exec-1204d00b-e7e2-4989-a777-bd774281c274.png`.
La façade verticale du quai de la première version a été remplacée par le
prolongement du sol pavé jusqu'au bord inférieur pour libérer l'aire de combat.

## Sprites retenus

- `mud-lamprey-v2.png` — lamproie de vase lovée aux volumes épais, gueule
  circulaire simplifiée et palette olive/teal en larges aplats pixel. Source
  ImageGen chroma `exec-672fa420-dea8-4240-8c12-b2e69c31d385.png`, détourage
  déterministe et alpha vérifié.
- `valve-crab-v1.png` — crabe stylisé bleu-noir et vert-de-gris, volumes chibi,
  pince principale lisible et motif de vanne. Source révisée
  `exec-1262c908-eff0-4b0b-9d56-a442ace5cf4a.png`.
- `black-pit-eel-v2.png` — anguille noire épaisse en S, tête expressive,
  grandes marques minérales et palette bleu-noir/teal simplifiée. Source
  ImageGen chroma `exec-7981aea6-e941-403d-94e4-b9b32caafe91.png`, détourage
  déterministe et alpha vérifié.
- `dead-water-slime-v2.png` — adaptation directe du slime des Égouts validé :
  même masse ovoïde horizontale, même visage sans bouche et même densité pixel,
  avec une palette bleu-noir/teal, un noyau cyan, des dépôts minéraux et un
  fragment de vanne incorporé. Source ImageGen chroma
  `exec-9fe0fe96-16d2-470c-8885-ac7b04cb10fa.png`, détourage déterministe et
  alpha vérifié.
- `drowned-refuge-warden-v2.png` — veilleur humain noyé, visage bleu-gris
  détrempé au regard vitreux, amaigri et asymétrique en larges aplats pixel
  cohérents avec les autres humanoïdes, étoffes décolorées et effilochées, une botte
  perdue sous un pantalon déchiré, cuir gonflé et refroidi autour du cou et de
  la taille, col textile sombre effiloché, gants craquelés aux coutures rompues,
  métal rouillé et piqué de vert-de-gris, demi-épaulière cassée et ourlets
  localement endommagés, harpon diagonal tenu à
  deux mains et lanterne éteinte au verre froid bleu-vert. Direction croisée depuis
  plusieurs archétypes de noyés morts-vivants, sans reprise d'un personnage
  existant. Source ImageGen chroma
  `exec-c91a917d-c04e-4bb9-8252-8538bbcc216a.png`, détourage déterministe et
  alpha vérifié.
- `pale-cistern-leech-v2.png` — Sangsue blême compacte, corps ivoire segmenté,
  ombres teal et volumes en larges aplats pixel repris du Crabe des vannes.
  Source ImageGen chroma `exec-e6c43b9b-4a3e-4035-8967-82f493e01134.png`,
  détourage déterministe et alpha vérifié.
- `armored-cistern-leech-v2.png` — Sangsue cuirassée bleu-noir, massive, dotée
  de grandes plaques minéralisées rouille et vert-de-gris inspirées du Crabe
  des vannes. Source ImageGen chroma
  `exec-846768b2-6a33-4533-b2fc-412ac9231b52.png`, détourage déterministe et
  alpha vérifié.
- `water-sentinel-v1.png` — automate élite de pierre et fer, bouclier, masse et
  motifs de vanne. Source révisée
  `exec-c2570f2d-f34c-47e8-99b1-92513b3509a2.png`.
- `dead-water-warden-v2.png` — boss en lourde armure noyée anthracite,
  cabossée, oxydée et localement rompue, avec étoffes teal détrempées et
  croissance olive assourdie. Le traitement de l'armure reprend la Sentinelle
  hydrique validée et son état de dégradation le Veilleur noyé validé.
  Hallebarde-clef de vanne à double croissant entièrement contenue et
  silhouette monumentale calibrée à au moins une fois et demie un humain.
  Source ImageGen chroma `exec-4bf4f98f-9d3d-4285-b854-d50f051768f1.png`,
  détourage déterministe et alpha vérifié.

Les deux premières sorties révisées du veilleur
(`exec-b481a18f-c7a0-4308-9a2e-d02625112b58.png`) et du Gardien
(`exec-7b7631b3-4f37-4450-a1f0-aec54a573db5.png`) ont été rejetées au runtime :
le damier de transparence était incorporé aux pixels. Les sources finales
ci-dessus possèdent un canal alpha réel.

## Réemploi explicite

`valve-crab-v1.png` couvre `water-parasites:b` et `valve-sentinel:b`. Les dix
clés blueprint/membre restent présentes dans le manifeste ; la sentinelle
unique porte la lecture élite de la seconde rencontre.

## Préparation runtime

- Décor : recadrage central de 2 172 × 724 vers le ratio cible, puis
  1 536 × 643 en JPEG qualité 82.
- Acteurs : 384 × 384, PNG ARGB, redimensionnement nearest-neighbor.
- Les révisions chroma sont préparées par
  `scripts/prepare-dungeon-character-sprite.ps1` en reprenant les limites alpha
  du sprite de référence.
- Le catalogue indexe les métadonnées et URL de tous les packs ; le navigateur
  ne télécharge les images que lorsque leur URL est affectée aux acteurs ou au
  décor visibles. Le cache de résolution commun reste borné.
- `npm.cmd run check:dungeon-visuals` vérifie couverture canonique, inventaire,
  dimensions, alpha, métadonnées de réemploi et budget de 2 MiB par scène.
