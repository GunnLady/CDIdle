# Kit pilote Égouts UnderCity v1

## Provenance et usage

- Génération : ImageGen intégré à Codex, 10 septembre 2026.
- Référence de style du décor : `src/assets/images/backgrounds/app-shell-background-v3-main-safe.jpg`.
- Référence de densité pixel des rats : `src/assets/images/hero-sprites/tier1/human-tier1-warrior-male-v1.png`.
- Livrables optimisés : `src/assets/images/dungeon/undercity/sewers/`.
- Usage autorisé : scène Donjon 2D CDIdle, kit pilote PC.
- Version : v1. Les originaux de génération ne sont pas requis au runtime ; les prompts et sorties optimisées versionnées font foi.

## Prompt du décor

Créer une chambre d'égouts souterraine sombre dans l'identité visuelle CDIdle,
avec maçonnerie humide, canal central, grilles, conduites et arches lointaines.
Composition panoramique sans personnage, avec avant-plan jouable dégagé et
espaces lisibles à gauche et à droite pour deux équipes. Pixel art peint,
gothique médiéval, palette charbon/ardoise/ambre/teal, sans texte ni interface.

## Prompts des membres de `rat-pack`

Direction commune : un seul rat fantastique en pied, trois-quarts face à
gauche, silhouette lisible, pixel art net assorti aux héros CDIdle, fond alpha
réel, aucune interface, arme, armure, scène, texte ou watermark.

- `a` — Rat des canaux : rat brun maigre, posture basse, fourrure humide,
  oreilles alertes et longue queue visible.
- `b` — Rat galeux : rat gris-brun voûté et nerveux, fourrure clairsemée,
  oreille abîmée et silhouette plus verticale, sans gore.
- `c` — Rat pestiféré : rat charbon accroupi, touches mousse contenues,
  oreille déchirée et yeux ambre-vert, sans horreur corporelle. Une seconde
  passe ImageGen a remplacé le faux damier initial par un canal alpha réel.

## Préparation runtime et optimisation

- Décor : 1536 × 643, JPEG qualité 82.
- Rats : 384 × 384, PNG ARGB, redimensionnement nearest-neighbor.
- Le catalogue charge seulement le décor et les acteurs visibles.
- Le détourage chroma des héros reste effectué une fois par identité hors de
  la boucle d'animation, avec caches bornés et purge au changement de session.
- `npm.cmd run check:dungeon-visuals` contrôle fichiers, dimensions, alpha,
  couverture des vingt planches et budget froid de 2 MiB.
