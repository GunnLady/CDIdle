# Progression autoritaire du donjon

`supabase/functions/game-api/dungeon-authority.ts` porte la navigation
canonique : cinq salles à l'étage 1, puis cinq salles supplémentaires par
étage jusqu'au plafond de 50 à partir de l'étage 10. La victoire dans la
dernière salle réelle ouvre l'étage suivant. Le record reste monotone et la
sélection est limitée aux étages déjà atteints. Le combat et
les rencontres sont résolus par le domaine autoritaire partagé.

## Objectifs

- Éviter le double scaling historique entre statistiques de catalogue et
  multiplicateur global d'étage.
- Placer les boss nommés aux étages 10, 20, 30, 40 et 50.
- Faire arriver les Novices au niveau 10 lorsque plusieurs bâtiments de classe
  sont accessibles, sans créer d'or passif ni de mode de farm dédié.
- Conserver les étages déjà sécurisés comme voie de récupération rejouable.

## Courbe des rencontres ordinaires

Le budget d'une rencontre est interpolé entre les ancres suivantes. Le monstre
tiré conserve une variation d'archétype plafonnée entre 75 % et 130 % du budget.

| Étage | Attaque | XP | Or |
| ---: | ---: | ---: | ---: |
| 1 | 4 | 14 | 4 |
| 3 | 6 | 18 | 4 |
| 5 | 8 | 24 | 5 |
| 10 | 10 | 42 | 6 |
| 20 | 24 | 126 | 18 |
| 30 | 45 | 350 | 45 |
| 40 | 75 | 770 | 105 |
| 50 | 120 | 1 400 | 200 |

La dernière salle de chaque étage est un mini-boss d'élite aux étages
ordinaires. Aux étages 10, 20, 30, 40 et 50, elle utilise dans l'ordre le
registre des cinq boss nommés et
leur table de butin autoritaire. Tous les tirages restent canoniques.

## XP de groupe et première sécurisation

Chaque héros actif reçoit une part du budget d'XP selon la taille du groupe :

| Héros actifs | Part par héros |
| ---: | ---: |
| 1 | 100 % |
| 2 | 50 % |
| 3 | 40 % |
| 4 | 35 % |

La première victoire dans la dernière salle ajoute une prime déterministe d'or et un pool
d'XP soumis au même partage. Cette prime n'est pas rejouée sur un étage déjà
sécurisé. Les seuils de niveau restent inchangés.

L'or des coffres et des rencontres non combattues dérive du même budget que les
combats ordinaires : coffre et énigme ×2, embuscade ×1, négociation ×3. La
longueur croissante des étages n'est donc plus doublée par une seconde formule
linéaire indépendante.

## Économie des vocations T1

Les sept bâtiments de classe deviennent indépendants dès l'étage 3. Ils ont
tous pour unique socle Campement niveau 1 et Mine niveau 1. Leur premier niveau
coûte désormais entre 300 et 600 or, avec des besoins matériels également
réduits. Caserne, Poste de chasse, Repaire et Église coûtent ensemble 1 400 or.
Leur chaîne commune de prérequis ajoute 295 or, soit un besoin réel de 1 695 or.
Les primes de première sécurisation des étages 1 à 7 apportent 950 or, sans
revenu d'or passif. Elles financent le socle et au moins une voie ; les salles
ordinaires, coffres et rencontres complètent progressivement le budget de trois
ou quatre voies avant le niveau 10, sans créer plusieurs milliers d'or de
surplus.

## Simulation de contrôle

La simulation de réglage exécute les vraies commandes de donjon, le RNG et la
progression. Les héros vaincus sont soignés et réactivés entre deux tentatives ;
les héros supplémentaires démarrent avec le groupe afin d'isoler l'effet du
partage d'XP, sans simuler le coût de recrutement.

Sur 20 seeds par taille après réglage de la longueur des étages et de
l'attrition initiale :

| Groupe | Tous niveau 10 avant 750 rencontres | Étage médian |
| ---: | ---: | ---: |
| 2 | 20/20 | 10 |
| 3 | 20/20 | 11 |
| 4 | 20/20 | 12 |

Ces chiffres sont un contrôle d'équilibrage, pas un contrat de replay. La
simulation ne dépense pas les ressources de la ville ; la viabilité économique
est donc couverte séparément par les contrats de primes, prérequis et coûts dans
`tests/dungeonProgression.test.ts`.
