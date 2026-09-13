# Kit des six épreuves — CDI-115

## Références et procédé

- Génération : skill ImageGen intégré, mode built-in, 12 septembre 2026.
- Références de style uniquement : `rest-camp-v2.png` et
  `treasure-chest-open-v3.png` ; aucune des deux n'est une cible d'édition.
- Éclairage demandé : lumière chaude venant du haut gauche.
- Sources : fond chroma parfaitement uniforme, magenta `#ff00ff`, sauf le
  rituel sur vert `#00ff00` pour préserver sa flamme violette.
- Détourage et normalisation : `scripts/prepare-dungeon-accessory.ps1`, ratio
  conservé, toile RGBA 768 × 512, remplissage 88 %, ancrage bas 94 % et despill
  par couleur opaque voisine.
- Les sources ImageGen restent dans le répertoire de génération Codex ; seuls
  les PNG détourés et le procédé reproductible entrent dans le dépôt.

## Contraintes communes finales

Use case: `stylized-concept`. Asset type: CDIdle 2D dungeon challenge
accessory sprite. Chaque image contient exactement un accessoire autonome,
entièrement visible et physiquement cohérent, sans personnage, mur, sol de
scène, ombre portée, texte, logo ni watermark. Le rendu est une illustration
fantasy peinte et stylisée, de densité comparable aux accessoires de référence,
avec formes lisibles et silhouette nette ; ni photoréaliste, ni pixel art, ni
chibi, ni ultra-HD. Le chroma ne doit apparaître dans aucun élément du sujet.

## Variantes générées

| Épreuve | Demande spécifique | Source ImageGen | Sortie | Octets |
|---|---|---|---|---:|
| Piège | dalle de pression fendue, mâchoires de fer relevées et pointes courtes ; mécanisme désamorcé mais menaçant | `exec-3a4b2e06-4c99-4c81-8252-a3b1501facd1.png` | `challenge-trap-v1.png` | 537 317 |
| Énigme | piédestal de pierre, trois anneaux imbriqués bronze/pierre et cristal cyan contenu | `exec-726c3061-4dc6-40f1-a92c-79e5fc8ac97b.png` | `challenge-enigma-v1.png` | 322 940 |
| Embuscade | portique de fil d'alerte, corde, deux cloches, trois carreaux fichés et fanion sombre déchiré ; aucun ennemi | `exec-e5157295-b1bd-420b-b4a8-a0f145415bfe.png` | `challenge-ambush-v1.png` | 292 957 |
| Rituel | autel bas en basalte, quatre ailettes liées et flamme magique violette/bleue contenue ; aucun symbole horrifique | `exec-8c042620-a6a2-43ef-918f-0c98a8f776a0.png` | `challenge-ritual-v1.png` | 344 496 |
| Obstacle | blocs de maçonnerie liés par une poutre éclatée et deux renforts de fer tordus ; aucun gravat détaché | `exec-c8e40423-a7c7-4037-92b1-06d0a8c6fb88.png` | `challenge-obstacle-v1.png` | 618 307 |
| Négociation | table ronde, deux tabourets vides, accord scellé sans texte, encrier et deux piles modestes de pièces | `exec-6d70bc22-a30c-46c4-a568-a2b7b41d3c45.png` | `challenge-negotiation-v1.png` | 543 799 |

Chaque scène réutilise `rest-chamber-background-v1.jpg`. Avec son accessoire,
la plus lourde est `obstacle` à 902 858 octets, sous le plafond de 2 MiB.
