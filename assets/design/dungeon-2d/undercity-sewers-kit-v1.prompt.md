# Kit pilote Égouts UnderCity v1

## Provenance et usage

- Génération : ImageGen intégré à Codex, 10 septembre 2026.
- Référence de style du décor : `src/assets/images/backgrounds/app-shell-background-v3-main-safe.jpg`.
- Référence de densité pixel des rats : `src/assets/images/hero-sprites/tier1/human-tier1-warrior-male-v1.png`.
- Livrables optimisés : `public/assets/images/dungeon/undercity/sewers/`.
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
  oreilles alertes et longue queue visible. Source stylisée révisée
  `exec-53b9ec12-fab2-4f75-b4a3-e038a15f6605.png`.
- `b` — Rat galeux : rat gris-brun voûté et nerveux, fourrure clairsemée,
  oreille abîmée et silhouette plus verticale, sans gore. Source stylisée
  révisée `exec-4240c98d-2dfd-45ff-8497-e8fd67b546c3.png`.
- `c` — Rat pestiféré : rat charbon accroupi, touches mousse contenues,
  oreille déchirée et yeux ambre-vert, sans horreur corporelle. Une seconde
  passe ImageGen a remplacé le faux damier initial par un canal alpha réel.
  Source stylisée révisée
  `exec-95b3e086-fc44-4d3a-9a73-f5e7d84d9faf.png`.

## Complément CDI-108 — pack complet des Égouts

- Génération : ImageGen intégré à Codex, 11 septembre 2026, mode création.
- Références visuelles inspectées avant génération : décor et trois rats du kit
  pilote ci-dessus. Aucun asset externe n'est incorporé.
- Direction commune : sprite ennemi unique sur fond transparent réel, vue en
  pied et trois-quarts face à gauche, silhouette entièrement contenue dans un
  carré, pixel art peint net cohérent avec CDIdle, lumière ambre venant du haut
  gauche et reflets teal d'égout, sans sol, ombre portée, texte, interface,
  watermark, gore ni horreur corporelle.

Variantes générées et sortie runtime :

- `beetle-swarm:a` — `beetle-swarm-carrion-cockroach-v1.png` : cafard
  charognard brun rouille, corps bas et aplati, longues antennes, six pattes
  épineuses et abdomen pestiféré. Source ImageGen
  Génération `exec-5cfcdeea-5174-4642-b61d-3266af2afc81.png`, puis extraction
  alpha `exec-34e43bc2-a361-46bc-8d74-2f150a077057.png`.
- `beetle-swarm:b` — `beetle-swarm-black-sewer-cockroach-v1.png` : cafard
  noir des égouts, silhouette basse et continue, pronotum plat et deux ailes
  longitudinales, avec résidus toxiques verts. Révision ImageGen
  `exec-ed6dcc0f-03ca-4a9f-82e8-5862f3fa8726.png`, générée avec alpha réel.
- `beetle-swarm:c` — `beetle-swarm-pipe-cockroach-v1.png` : cafard des
  conduits étroit et allongé, vert-de-gris, longues antennes et pattes fines.
  Génération `exec-40777366-880a-48bb-9472-8b793a980572.png`, puis extraction
  alpha `exec-3fc73c15-03fe-41ce-afa3-85ea031aad18.png`.
- `pipe-slime:a` — `pipe-slime-v1.png` : masse de gel ovoïde horizontale,
  comprimée au sol sans jupe, lobes ni pseudo-pattes. Deux petits capteurs
  teal à reflet vert clair sont suspendus dans la matière, sans bouche,
  autour d'un noyau
  magique parcouru par un courant interne. La pollution olive et les rares
  inclusions de cuivre donnent son identité d'égout sans surcharger la lecture.
  Pixel art de densité intermédiaire aligné sur les héros CDIdle. Source
  ImageGen chroma `exec-0a792018-2e7b-4483-9e85-38a50bfaba1e.png`, détourage
  déterministe et alpha vérifié.
- `colossal-rat:a` — `colossal-rat-v1.png` : rat quadrupède massif, fourrure
  brune humide, pattes lourdes et oreille abîmée, sans armure. Source ImageGen
  stylisée révisée `exec-d37228f5-c2ce-44bf-911f-46d07a9fe3b9.png`.
- `sewer-warden:a` — `sewer-warden-lock-biter-v1.png` : meneur élite massif,
  plaque de serrure en laiton brisée et courte chaîne au collier, incisives
  ébréchées. Source ImageGen stylisée révisée
  `exec-0bfaf0b6-60c9-4315-ae16-710c3e9f9729.png`.
- `sewer-warden:b` — `sewer-warden-iron-gnawer-v1.png` : Ronge-fer, rat-ogre
  bipède gris suie, plus imposant que le Mordeur quadrupède mais inférieur à la
  Mère ; ses deux incisives métalliques plates et biseautées remplacent toute
  muselière et évitent une lecture de crocs félins.
  Source ImageGen stylisée révisée
  `exec-e2c337bd-e09e-4efb-870c-74b0f76c81c0.png`.
- `vermin-mother:a` — `vermin-mother-v1.png` : matriarche rat-ogre bipède,
  massive et animale, petit crâne, torse hypertrophié, bras très longs et moitié
  pestiférée fusionnée à une corruption verte/violette ; proportions de boss et
  pixel art calés sur les héros CDIdle. Source ImageGen révisée sur fond chroma
  `exec-3be21b0e-1b1e-4ac6-a456-0e3b6ee5415a.png`, détourée puis réduite en
  nearest-neighbor pour le runtime.

La première source `exec-55ae9147-5912-46d5-8eca-ff43fc845412.png` a été
rejetée après revue visuelle : sa morphologie quadrupède évoquait un chien avec
une tête et une queue de rat et ne suivait pas la grammaire des héros.
La passe intermédiaire `exec-67aa17b8-8635-4dfe-898d-9a281b290881.png` fixait
la silhouette et la corruption, mais son faux damier opaque a imposé une passe
chroma explicite avant détourage.
La passe suivante `exec-f696a306-9de1-4787-8a27-5f18fbb14fd9.png` restait trop
proche d'une chamane humanoïde ; elle a été remplacée par une morphologie de
brute mutante inspirée des traits génériques des rats-ogres (sans reprise d'un
personnage existant).

## Préparation runtime et optimisation

- Décor : 1536 × 643, JPEG qualité 82.
- Acteurs ennemis : 384 × 384, PNG ARGB, redimensionnement nearest-neighbor.
- Le catalogue indexe les métadonnées et URL de tous les packs ; le navigateur
  ne télécharge les images que lorsque leur URL est affectée au décor ou aux
  acteurs de la scène visible.
- Le détourage chroma des héros reste effectué une fois par identité hors de
  la boucle d'animation, avec caches bornés et purge au changement de session.
- `npm.cmd run check:dungeon-visuals` contrôle fichiers, dimensions, alpha,
  couverture des vingt planches et budget froid de 2 MiB.
