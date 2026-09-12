# Pack Galeries des contrebandiers UnderCity v1

## Provenance et usage

- Génération : ImageGen intégré à Codex, 11 septembre 2026, mode création.
- Références de direction inspectées : kit Égouts UnderCity v1, héros et
  ennemis CDIdle existants. Aucun asset externe n'est incorporé.
- Livrables optimisés :
  `src/assets/images/dungeon/undercity/smugglers/`.
- Usage autorisé : scènes Donjon 2D CDIdle sur PC.
- Version : v1. Les prompts, identifiants de sources retenues et sorties
  runtime versionnées font foi.
- Variantes de diversité humaine : ImageGen intégré à Codex, 12 septembre
  2026, fond chroma magenta puis détourage déterministe.

## Direction commune des sprites

Créer exactement un ennemi détouré sur fond réellement transparent, en pied,
trois-quarts face à gauche, entièrement contenu dans un carré avec marge et
pieds posés sur une ligne de sol claire. Les planches de héros CDIdle sont la
référence autoritaire : anatomie chibi compacte, tête lisible, membres courts,
visage simplifié, contours pixel sombres, palettes limitées et densité de
pixels comparable. Lumière ambre supérieure et rebond teal contenu. Aucun sol,
ombre portée, décor, texte, logo, interface, watermark, gore, objet moderne,
rendu réaliste, peinture détaillée ou 3D.

## Décor

`smugglers-gallery-stage-v1.jpg` — longue galerie souterraine voûtée, pierres
humides, renforts en bois, lanternes, caisses, tonneaux, ballots, cordes et
treuil relégués aux murs. Sol continu et dégagé sur les 42 % inférieurs pour
quatre héros à gauche et trois ennemis à droite ; axe central libre, profondeur
par une arche et un tunnel noyé de teal. Palette charbon, ardoise, chêne sombre,
rouille, ambre et teal. Aucun personnage, animal, texte ou interface.

Source ImageGen : `exec-9b7bf17a-3acb-4c48-8e25-203266322362.png`.

## Sprites retenus

- `smuggler-guard-v1.png` — protecteur humain robuste, manteau de cuir sombre,
  cotte de mailles, sabre court et bouclier compact. Source
  `exec-28a0a4d5-82f0-4549-b067-99361158fd1e.png`.
- `smuggler-crossbowman-v1.png` — arbalétrier humain nerveux, posture basse,
  arbalète compacte et carquois court. Source
  `exec-8ab3542e-4eb6-4631-806f-803524b6697c.png`.
- `tunnel-medic-v2.png` — médecin humain encapuchonné à la peau brune,
  bandages beiges sans symbole, sacoche et flacon ambre. Source ImageGen chroma
  `exec-8bb55731-1709-40c7-a66f-88e46071750d.png`, détourage déterministe et
  alpha vérifié.
- `goblin-copper-scavenger-v1.png` — gobelin fouilleur compact, pioche courte,
  sac de cuivre et protections improvisées. Source
  `exec-d64ea523-d562-4030-9326-e735c8d9c76e.png`.
- `goblin-lookout-v1.png` — gobelin guetteur plus mince et vertical, fronde,
  corne d'alerte et clés. Source
  `exec-87b8463b-4226-43f8-a65d-43939ab3e282.png`.
- `chainbreaker-hound-v1.png` — molosse bringé massif, anatomie stylisée par
  grands volumes pixelisés, collier usé et courte chaîne brisée. Source
  ImageGen chroma `exec-220deb50-277e-49c0-af35-72aafa0ebfcf.png`, détourage
  déterministe et alpha vérifié.
- `gallery-chainmaster-v1.png` — maître-chaînes humain, chaîne lovée et crochet
  court, sans animal ni imagerie de torture. Source
  `exec-9274c571-1a45-4679-87e2-65185eda90b7.png`.
- `tribute-cutthroat-v2.png` — coupe-jarret humain masqué à la peau brune,
  posture agile et deux lames courtes contenues. Source ImageGen chroma
  `exec-c31d32cf-8a0e-479b-9c01-ddd918feacb5.png`, détourage déterministe et
  alpha vérifié.
- `smuggler-sworn-blade-v2.png` — Lame jurée humaine à la peau brune et au
  visage découvert, carré auburn asymétrique, tempe rasée et mèche claire. Son
  sabre large, bouclier renforcé et fermoir de serment la distinguent du garde
  commun. Source ImageGen chroma
  `exec-f80b912c-2873-490f-9573-affcb6e9046d.png`, détourage déterministe et
  alpha vérifié.
- `smuggler-captain-v1.png` — capitaine humaine en armure d'écailles et long
  manteau, sabre, fermoir de laiton et écharpe bordeaux. Source
  `exec-dcd8e9a9-8bf4-4151-80b0-b1d58812bb1c.png`.
- `smuggler-alchemist-v1.png` — alchimiste humain âgé, harnais de fioles et
  réactifs teal/ambre non magiques. Source
  `exec-ec323e87-6f69-4f0e-996f-f8305863aa83.png`.
- `tribute-collector-v1.png` — boss humain très massif, armure partielle,
  registre chaîné, jetons de tribut et lourd bâton-masse. Source
  `exec-5ef5c90a-424b-4424-9038-b46534dcc553.png`.
- `tribute-guard-v1.png` — variante dédiée du garde : homme à peau mate,
  cheveux courts et barbe, posture légèrement ouverte, bouclier renforcé plus
  carré. Source ImageGen chroma
  `exec-5df5c2d4-bb09-4b24-9912-b781a6835d1f.png`, détourage déterministe et
  alpha vérifié.
- `tribute-apothecary-v1.png` — variante dédiée de l'apothicaire : femme d'âge
  mûr à peau cuivrée, cheveux attachés avec une mèche grise, disposition de
  fioles et sacoches légèrement différente. Source ImageGen chroma
  `exec-730796f2-8e4e-4b95-a829-f25c60efabdb.png`, détourage déterministe et
  alpha vérifié.

Une première génération du médecin, source
`exec-14f70ff5-d82a-43fe-8207-67657c9f87fa.png`, a été rejetée et n'est pas
versionnée au runtime : un bandage portait une croix rouge identifiable.

Les sources peintes de la première passe ont été rejetées après revue visuelle :
anatomie réaliste, micro-détails et proportions trop éloignés des héros. Le
molosse conserve son design initial, mais son rendu a été harmonisé avec la
densité de pixels du dresseur et des héros.

## Identités dédiées

- Les 14 clés blueprint/membre restent toutes présentes dans le manifeste.
- Le Garde et l'Apothicaire du tribut ont leurs propres variantes ; aucun
  sprite humain du groupe du Collecteur n'est réemployé depuis une rencontre
  précédente.

## Préparation runtime

- Décor : recadrage central de 2 172 × 724 vers le ratio cible, puis
  1 536 × 643 en JPEG qualité 82.
- Acteurs : 384 × 384, PNG ARGB, redimensionnement nearest-neighbor.
- Les variantes chroma sont préparées par
  `scripts/prepare-dungeon-character-sprite.ps1` en reprenant les limites alpha
  du sprite de référence.
- Le catalogue indexe les métadonnées et URL de tous les packs ; le navigateur
  ne télécharge les images que lorsque leur URL est affectée aux acteurs ou au
  décor visibles. Le cache de résolution commun reste borné.
- `npm.cmd run check:dungeon-visuals` vérifie couverture canonique, inventaire,
  dimensions, alpha, métadonnées de réemploi et budget de 2 MiB par scène.
