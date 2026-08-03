# Convergence des Novices — CDI-038 / CDI-072

## Décision de vocation au niveau 10

Un Novice devient éligible à une classe T1 dès le niveau 10. Les anciens
seuils progressifs des niveaux 10 à 13 ne sont plus utilisés.

Le serveur calcule l'affinité brute avec les deux attributs principaux
ordonnés et la moyenne pondérée des statistiques dérivées, puis calibre chaque
classe séparément sur un corpus déterministe de Novices. Il retire ensuite les
classes dont le bâtiment n'est pas construit et conserve celles situées à
moins de 1 % relatif du meilleur indice calibré.

Pour une classe dont les attributs principaux ordonnés sont `a1` et `a2`, la
formule est :

```text
brut = 0,6 × a1 + 0,4 × a2
     + moyenne(poids(statistique dérivée) × valeur)
z = (brut - moyenne_classe) / écart_type_classe
affinité = CDF_normale(z) + 0,03 × z + offset_classe
```

Les poids dérivés sont : PV max `0,05`, mana max `0,10`, dégâts et défenses
`0,40`, vitesse, critique et esquive `0,50`. La moyenne empêche une classe
d'être favorisée simplement parce qu'elle déclare davantage de sous-stats.

Les moyennes et écarts-types proviennent des 5 000 premiers Novices du corpus
fixe `affinity-{index}`, avec un RNG de progression initialisé par
`0x51f15e + index × 7919`. Le test recalcule ces valeurs à chaque exécution.
Les offsets sont des paramètres d'équilibrage versionnés, validés sur le
scénario complet de 10 000 héros :

| Classe | Moyenne | Écart-type | Offset |
| --- | ---: | ---: | ---: |
| Guerrier | 16,6796666667 | 6,3447304732 | -0,1379824 |
| Voleur | 16,8806725 | 5,5472834042 | -0,022274 |
| Archer | 18,1626366667 | 5,6618825426 | -0,0209528 |
| Mage | 18,18271 | 6,8454770064 | 0,0697166 |
| Acolyte | 16,1854833333 | 5,4869293669 | -0,0213552 |
| Aède | 17,9173333333 | 7,5547409103 | 0,072152 |
| Druide | 17,9654933333 | 7,8508390182 | 0,0783162 |
| Artificier | 18,08515 | 6,1210040462 | 0,068637 |
| Pugiliste | 18,43442 | 5,658954051 | -0,0862574 |

Toute modification de génération, de croissance, de formule ou d'offset doit
donc mettre à jour explicitement cette table et conserver les contraintes du
test `tests/classAffinity.test.ts`.

Une seule vocation dans la fenêtre de 1 % est appliquée automatiquement dans la
même récompense canonique. Plusieurs vocations dans cette fenêtre créent une
`pendingClassTransition` : le héros adresse alors une prière aux dieux et le
joueur tranche. L'affinité est un indice de classement calibré, pas une
probabilité.

La simulation déterministe de référence porte sur 10 000 Novices réellement
générés puis montés au niveau 10 avec tous les bâtiments. Elle impose un écart
maximal de 3 points entre les parts de classes, au moins 80 % de listes à choix
unique et au moins 98 % des listes contenant une des trois meilleures
affinités brutes.

Les classes T1 actuellement admissibles sont Guerrier et Pugiliste via la
Caserne, Voleur via le Repaire, Archer via le Poste de chasse, Mage et Aède via
l Académie, Acolyte via le Temple, Druide via le Cercle et Artificier via la
Forge. Les races et classes T2 restent hors périmètre.

## Prière et état canonique

Le héros concerné reste actif et l'auto-donjon continue après la rencontre qui
a déclenché la prière. Le choix peut donc être différé sans interrompre la
progression.

La fenêtre de prière peut être différée. Un rappel compact reste affiché tant
que le choix canonique n'est pas résolu, afin de rendre immédiatement la ville
et les autres héros à nouveau accessibles.

Chaque onglet affiche la même prière canonique. L'onglet maître permet le
choix ; un onglet observateur présente les mêmes candidats en lecture seule,
peut différer localement la fenêtre, puis reprendre le contrôle avant de
valider la vocation.

`hero.choose_vocation` ne consomme aucun tirage pour le choix. La commande
consomme ensuite seulement les tirages nécessaires aux compétences, à l'arme
et à l'accessoire, puis applique atomiquement la transition. Les Novices déjà
niveau 10 ou plus sont réconciliés en attente sans tirage RNG, y compris
lorsqu'une sauvegarde historique ne contient qu'un candidat. Cette
réconciliation recalcule les candidats selon les bâtiments actuels ; une
attente obsolète est retirée si le héros ne correspond plus à sa classe et à
son tier source.

## Compétences lors de la vocation

Une vocation acceptée consomme les rolls de compétences après les rolls de
croissance du niveau :

- classe T1 ordinaire : actif, puis passif, soit deux rolls ;
- Mage : deux actifs élémentaires distincts sans remise, puis un passif, soit
  trois rolls ;
- Acolyte : `minor_heal` sans roll, puis un autre actif et un passif, soit deux
  rolls.

Une vocation acceptée consomme ensuite exactement deux rolls d'équipement :
arme, puis accessoire. Les pools et les règles d'attribution sont documentés
dans `docs/architecture/tier1-class-equipment.md`.

Le donjon ne réalise pas lui-même cette transition. Toute source d'XP passe
par `applyHeroProgression`, qui enchaîne le calcul des niveaux, la résolution
générique de transition puis la politique `0->1`.

Le passif obtenu comme Novice est conservé. L’actif Novice est remplacé et les
cooldowns antérieurs sont effacés.

Lorsqu'une récompense franchit plusieurs niveaux, la parité historique fait
toutes les croissances avec la classe présente au début de la récompense, puis
évalue une seule vocation sur le niveau final. La récupération de niveau est
elle aussi unique : 20 % PV max et 30 % PM max. Une vocation acceptée remplace
ensuite cette récupération par une restauration complète.
