# Pack Bastion des Exclus UnderCity v1

## Provenance et usage

- Génération : ImageGen intégré à Codex, 12 septembre 2026.
- Références internes : héros CDIdle, humanoïdes des Galeries des
  contrebandiers et premiers sprites du Bastion. Aucun asset externe n'est
  incorporé.
- Livrables optimisés :
  `public/assets/images/dungeon/undercity/bastion/`.
- Usage : scènes Donjon 2D CDIdle sur PC.
- Version : v1. Les identifiants de sources et les fichiers runtime versionnés
  ci-dessous font foi.

## Direction visuelle

Faction humaine d'exilés installée dans une fortification souterraine :
palissades réparées, fer terne, cuir usé, étoffes bordeaux et reflets teal/ambre.
Les silhouettes restent compactes et semi-chibi, avec des visages simplifiés,
de larges amas de pixels et un équipement immédiatement lisible. Aucun rendu
réaliste, peinture HD, gore, texte, interface ou décor incorporé aux sprites.

## Décor

`bastion-exiles-stage-v1.jpg` — grande nef souterraine fortifiée, échafaudages
latéraux autonomes, ouverture teal en profondeur, braseros ambre et sol pavé
continu jusqu'au bord inférieur. Chaque passerelle, échelle, balustrade,
tonneau, cage et brasero possède ses propres supports et reste séparé des murs.
Le centre et le premier plan restent libres pour les deux formations. Source
initiale `exec-43f302d0-ed52-4aa1-b0f2-6bb03fbecfbf.png`, reconstruction v2
`exec-780bec89-8073-4b62-835a-ca3e413d0174.png`, puis suppression finale de la
herse centrale `exec-45d6a53d-994f-43a1-83e7-aaebb5df5126.png`. Normalisé en
1 536 × 643, JPEG qualité 90.

## Sprites retenus

- `banished-sentinel-v1.png` — Veilleur sans-bannière, capuche, lance courte et
  bouclier réparé, en garde latérale avec bouclier avancé, longue lance à
  douille alignée prête à l'estoc et appuis décalés. Sources de conception
  `exec-6ffca5d2-17dc-43e9-909e-352ebfb28ceb.png` puis simplification
  `exec-74db624b-e580-4cf9-b6da-446415cb778b.png`, reprise de la garde
  `exec-8eaa2943-cead-4a07-8574-fa81f3124898.png`, puis correction mécanique
  de l'arme `exec-40c123bd-7c8e-473f-999f-d58d560c0fd1.png`. Échelle runtime
  finale : `1.584`, soit +10 % après calibration humaine.
- `palisade-lookout-v1.png` et `exile-blackshot-v1.png` — Guetteur mobile à
  l'arc et Trait-noir masqué à l'arbalète. Planche de conception
  `exec-3bc02a1a-4cfe-4380-9609-872e87b446c6.png`, source chroma
  `exec-32eb252e-8ef0-4ff6-80a7-8154f0d58f41.png`. Le Guetteur final reprend
  cette source avec une dague secondaire en prise inversée, basse, inclinée le
  long de l'avant-bras et presque dissimulée (`exec-0e3f847a-4600-4a69-9155-f33ccf9c21e2.png`).
  La posture a été recoupée entre des références de prise réelle, de garde CQC
  avec arme secondaire et de rôdeur, puis ces références ont été fournies à la
  génération plutôt que traduites uniquement en consignes textuelles. Le
  Trait-noir final conserve sa pose et son équipement avec peau claire et
  cheveux roux/cuivrés (`exec-de6dfcb0-c6fc-42de-ba75-0e7cd8fe999c.png`).
- `banished-bulwark-v1.png`, `rampart-eye-v1.png` et
  `outcast-surgeon-v1.png` — Rempart au grand bouclier, archère Œil des
  remparts et chirurgien de terrain. Planche de conception
  `exec-a6557f02-fa36-4e27-9e5c-b12dcfaf6e70.png`, source chroma
  `exec-1cb96fc6-3ce7-49f4-a853-20df2dc2b2e7.png`. Le Rempart final reprend
  une garde bouclier-masse documentée par plusieurs références de reconstitution
  (`exec-c9a2c060-a964-4569-8d6f-5fba6ec2d283.png`) : bouclier avancé, masse
  près de l'épaule, coude fléchi et avant-bras complet. L'Œil finale vise les
  héros sans inverser l'éclairage chaud/froid
  (`exec-463e2fe8-456c-428a-b9c1-7e6f58e7842e.png`). Le Chirurgien final
  remplace son couteau par une pince de soin avec coton tout en conservant le
  bandage de l'autre main (`exec-b71757cc-2c51-4256-900d-b42ed4db4008.png`).
- `barricade-colossus-v1.png` — Brise-siège humain massif, armure de plaques de
  porte et maillet-bélier. Conception
  `exec-6b92d40e-ed61-42d6-a57a-95b7bc8d5f84.png`, source chroma
  `exec-ef39a736-dec1-48f7-ac88-58c544f14168.png`. La variante finale conserve
  exactement sa pose et son équipement, avec une crête courte inspirée de
  Zangief dans *Street Fighter II*
  (`exec-7db38bf9-7ac5-4038-be75-2dccc6e21816.png`). Échelle runtime finale :
  `2.2`, calibrée comme une silhouette de colosse face aux héros.
- `barricade-blade-v1.png` et `barricade-warden-v1.png` — duelliste et chef
  protecteur du groupe élite. Planche de conception
  `exec-7d092c9f-52fe-4c0f-a7b7-20b29887986b.png`, source chroma
  `exec-f72c2624-ee80-48ac-aa52-d861370fc599.png`. La Lame finale abandonne
  son bouclier pour une paire de sabres strictement jumeaux
  (`exec-9c1ec867-40db-4a17-9965-c3e1e01127e3.png`). Le Gardien final combat
  sans bouclier avec une lance lourde tenue à deux mains ; son cou et sa tête
  restent dégagés des épaules
  (`exec-44825c42-1886-4787-a1f1-15f419861c31.png`). Son échelle runtime finale
  est `2.0` et sa position est décalée de `1 %` vers le haut et la gauche.
- `outcast-standard-bearer-v1.png` — boss humain au sabre et grand étendard
  déchiré portant un motif abstrait de porte brisée. Conception
  `exec-1eb73ece-56b6-49d2-b7e9-d84bb04c5f7b.png`, source chroma
  `exec-5386ed8e-b743-4369-9680-dca37f5d15af.png`. La version finale corrige
  la proportion de la tête (`exec-a50cda01-cadd-478c-b43c-2cd9bf52a185.png`),
  utilise une échelle runtime de `2.2` et remonte de `1 %`. Son garde est
  décalé de `2 %` vers la gauche.

Les planches de conception affichaient un damier incorporé aux pixels et ne
constituaient donc pas des sources transparentes. Elles ont été converties en
sources à fond magenta uniforme avant détourage déterministe. Seules les
sorties runtime dont l'alpha est vérifié sont cataloguées.

## Réemplois explicites

- `outcast-surgeon-v1.png` couvre `bastion-defenders:c`,
  `barricade-warden:c` et `outcast-standard-bearer:c` : même métier et même
  faction, avec position et échelle propres à chaque groupe.
- `banished-bulwark-v1.png` couvre `bastion-defenders:a` et
  `outcast-standard-bearer:a` : le garde du boss appartient à la même ligne de
  remparts.

Les 13 clés blueprint/membre restent toutes explicites dans le manifeste.

## Préparation runtime

- Acteurs : 384 × 384, PNG ARGB, ratio conservé, pieds alignés sur le sprite
  humain de référence et redimensionnement nearest-neighbor.
- `scripts/prepare-dungeon-alpha-sprite-sheet.ps1` accepte une source alpha
  réelle ou une source chroma magenta uniforme, découpe les cellules et produit
  les fichiers individuels.
- Le catalogue charge uniquement le décor et les acteurs utilisés par la scène;
  son cache asynchrone reste borné.
- `npm.cmd run check:dungeon-visuals` contrôle inventaire, couverture canonique,
  dimensions, alpha, réemplois et budget de 2 MiB par scène.
