# Pack Cour du Roi des Rats UnderCity v1

## Provenance et usage

- Génération : ImageGen intégré à Codex, 12 septembre 2026.
- Références internes : héros CDIdle et packs UnderCity validés des Égouts,
  Galeries, Citernes et Bastion. Aucun asset externe n'est incorporé.
- Livrables optimisés :
  `public/assets/images/dungeon/undercity/court/`.
- Usage : scènes Donjon 2D CDIdle sur PC.
- Version : v1. Les identifiants de sources et fichiers runtime versionnés
  ci-dessous font foi.

## Direction visuelle

Dernière zone du souterrain : cour royale décadente mêlant pierre sombre,
tentures bordeaux et or terni, profondeur teal et lumière ambre. Les humains
restent compacts et semi-chibi, avec des visages simplifiés et une distribution
visible de genres et de carnations. La vermine royale reprend les volumes
bestiaux et rat-ogres établis dans les Égouts, enrichis d'armures et insignes
de Cour. Aucun réalisme HD, gore, texte, interface ou décor incorporé aux
sprites.

## Décor

`rat-king-court-stage-v1.jpg` — vaste salle du trône souterraine, sol pavé
continu jusqu'au bord inférieur, axe central libre, trône surélevé au fond,
bannières bordeaux et or, cages, braseros et passerelles latérales autonomes.
La scène conserve une aire de combat large pour quatre héros et jusqu'à trois
ennemis sans fusion d'éléments de décor dans les murs. Source ImageGen
`exec-b6701686-657d-444b-bcac-5ef08b1519f5.png`, normalisée en 1 536 × 643,
JPEG qualité 90.

## Sprites retenus

- `court-living-bulwark-v4.png`, `court-royal-crossbowman-v4.png` et
  `dungeon-medic-v4.png` — Pavois vivant asiatique, Arbalétrier royal noir et
  Médecin des oubliettes métisse plus âgée, avec silhouettes, rôles et
  équipements immédiatement distincts. La planche chroma initiale
  `exec-9f417a8b-a327-427b-8354-fe54247caae9.png` a été rejetée pour ses franges
  violettes et son éclairage incohérent. Le Pavois
  et son éclairage incohérent. Les sources finales utilisent un fond vert pur
  éloigné de leur palette : Pavois
  `exec-351a78b9-1f4e-4046-8e9b-43c851672b5c.png`, Arbalétrier
  `exec-37815fb3-4c48-4173-a96a-8358a6ad9b9c.png` et Médecin
  `exec-76c55585-5ceb-4e04-81fb-b9a01c2d3152.png`. Leur détourage déterministe
  conserve des aplats opaques, un contour anticrénelé propre et la lumière
  principale venant de gauche. Le Médecin possède une silhouette propre :
  manteau à capuche bordeaux, tenue bleu sombre, ceinture de fioles ambrées,
  potion et bandage, sans reprendre le chirurgien du Bastion.
  Validation utilisateur : les trois silhouettes sont agrandies d'environ
  10 % par rapport à leur première intégration (`1.632`, `1.599`, `1.565`) ;
  le Pavois est décalé de 1 % à gauche et l'Arbalétrier de 1 % à gauche et en
  hauteur sur la composition PC.
- `court-rat-v4.png` et `court-dungeon-devourer-v3.png` — Rat de la Cour
  quadrupède sans couronne littérale, identifié par son collier bordeaux et ses
  ornements de Cour, et Dévoreur rat-ogre massif. Les sources finales sur fond
  vert pur sont `exec-01ae702e-b9af-4577-86e6-ed473d924755.png` et
  `exec-c268c770-0643-400f-aa29-fc6cbacae700.png`. Le détourage applique une
  dépollution verte déterministe aux contours fins, notamment aux moustaches,
  sans modifier leur dessin. Les deux sprites reçoivent leur lumière principale
  depuis la gauche et ne conservent ni reflet violet ni fragment de queue isolé.
  Validation utilisateur : le Rat de la Cour est décalé de 1 % à gauche et de
  1 % vers le bas dans la composition PC.
- `chamberlain-blade-v3.png`, `deep-chamberlain-v3.png` et
  `deep-alchemist-v2.png` — Lame du chambellan sud-asiatique aux deux haches
  strictement jumelles, Chambellan humain âgé dont les atours de dignitaire
  sont humides, ternis et réparés, et Alchimiste est-asiatique. Les sources
  finales sur fond vert pur sont respectivement
  `exec-4a661013-2795-4db4-8cb1-5434178eaffe.png`,
  `exec-88dc3dad-5c40-4c43-af46-1da3c7e044a3.png` et
  `exec-f0760ddf-d8e5-489e-a75c-8e332e2f4983.png`. Tous trois sont éclairés
  depuis la gauche et détourés avec dépollution verte. Validation utilisateur :
  Lame à l’échelle `1.58` et décalée de 2 % à gauche ; Chambellan décalé de
  1 % à gauche et de 1 % vers le haut sur PC.
- `court-champion-v3.png` — rat-ogre en armure lourde, guisarme entièrement
  cadrée et garde agressive. Première génération rejetée pour arme coupée
  (`exec-fce107f3-6316-415a-8255-9a95d53495f9.png`). La source finale sur fond
  vert pur `exec-4446d270-472d-47ac-896e-1189783d253c.png` conserve le design
  retenu, place la lumière chaude à gauche et supprime le liseré cyan à droite.
  Validation utilisateur : échelle finale `2.24` sur PC.
- `herald-blade-bearer-v4.png` et `rat-king-herald-v5.png` — Porte-lame humain
  à peau claire, crête et barbe blond cendré, et Héraut ratfolk au bâton
  couronné, orienté et pointant vers les héros à gauche. Le Médecin validé est
  réemployé comme troisième membre. Les sources finales sur fond vert pur sont
  `exec-70e00d82-800a-4433-b32a-9e17ca06ce81.png` et
  `exec-9f4977c8-5698-4994-b482-8262fb506b0f.png`. Le détourage vert spécialisé
  restitue les détails fins et neutralise le liseré cyan en bord d’alpha sans
  toucher aux couleurs internes. Validation utilisateur : Porte-lame à
  l’échelle `1.55` et 2 % à gauche ; Héraut à l’échelle `1.41` et 1 % à gauche
  sur PC.
- `rat-king-left-blade-v2.png`, `rat-king-right-blade-v2.png` et
  `rat-king-v3.png` — Lames senestre et dextre distinctes encadrant un Roi
  colossal et musculeux, encore armé de sa hache royale en phase 1. Les deux
  gardes sont décalés respectivement de 5 % et 6 % vers la gauche sur PC.
- `rat-king-monster-form-v3.png` — phase 2 canonique du Roi après la mort de ses
  deux gardes : mutation bestiale, posture basse à trois appuis, épaules et bras
  hypertrophiés, griffes et mâchoire renforcées, armure royale partiellement
  arrachée et aucune arme. La couronne, les lambeaux bordeaux/or et les plaques
  brisées préservent son identité ; aucune aura violette, tentacule ni gore.
  Source finale ImageGen sur fond vert pur
  `exec-b574de30-4aaa-47c9-8e05-aec22f2766c7.png`, détourée en conservant son
  cadrage large : 384 × 345 pixels opaques utiles dans un PNG 384 × 384.
  Validation utilisateur : échelle runtime `2.6` sur PC.

## Réemploi explicite

`dungeon-medic-v4.png` couvre `court-guard:c` et `king-herald:c` : le même
métier de Cour accompagne la garde régulière et le Héraut. Les quinze clés
blueprint/membre restent toutes explicites dans le manifeste ; le Roi et ses
deux Lames ont trois fichiers distincts.

## Préparation runtime

- Acteurs : 384 × 384, PNG ARGB, ratio conservé, pieds alignés sur le sprite
  humain de référence et redimensionnement nearest-neighbor.
- `scripts/prepare-dungeon-character-sprite.ps1 -PreserveCanvasFraming`
  conserve le cadrage complet d'une source chroma lorsque le sujet doit remplir
  le PNG final, au lieu de le recaler sur les limites opaques d'un ancien sprite.
- `scripts/prepare-dungeon-alpha-sprite-sheet.ps1` prépare les planches dont
  les sujets restent dans leur cellule. Pour la planche du Roi, les trois
  grandes composantes opaques ont été isolées avant mise à l'échelle afin de
  tolérer des plages X qui se chevauchent sans mélanger les acteurs. Ce besoin
  ponctuel ne laisse pas de nouvel outil runtime ou de maintenance dans le
  dépôt.
- Le catalogue charge uniquement le décor et les acteurs du groupe visible ;
  le cache commun reste borné.
- `npm.cmd run check:dungeon-visuals` contrôle inventaire, couverture des six
  blueprints et quinze membres, dimensions, alpha, réemploi et budget de
  2 MiB par scène.
