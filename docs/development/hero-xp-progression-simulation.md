# Simulation de progression d'XP des héros

## Objectif

Les tests distinguent deux courbes canoniques complémentaires :

- `xpNeeded(level)` : coût du prochain niveau, modèle
  `harmonized-level-bands-v2` ;
- `xpGained(floor, source)` : budget attribué par le contenu, modèle
  `level-aligned-v2`.

La première dépend uniquement du niveau du héros, jamais de sa classe ni de
son tier. La seconde dépend de l'étage et de la source de récompense. Leur
rapport doit produire un léger ralentissement de la progression, dans l'esprit
des idle games, sans mur brutal avant le niveau 40.

## Commandes

```powershell
npm.cmd run test:xp-simulation
npm.cmd run test:xp-tier1
npm.cmd run test:item-progression
npm.cmd run test:forge-progression
npm.cmd run test:xp-tier-projection
```

`test:xp-tier1` est la preuve principale du contenu réel T0/T1. La commande
lance 100 campagnes déterministes avec 100 seeds distinctes, réparties en dix
processus de dix seeds, puis fusionne exactement leurs compteurs. Chaque
campagne utilise quatre novices générés par l'autorité serveur, les vraies
vocations T1, l'attrition, la récupération idle, le loot et la commande
autoritaire d'équipement. Après trois échecs sur un boss, le groupe rejoue
l'étage précédent.

Le rapport agrégé trace les deux courbes, les jalons P10/médiane/P90, la part
d'XP de chaque source et les réussites de défis par bande et par type. La
commande échoue si :

- les 100 seeds ne sont pas présentes exactement une fois ;
- le taux global des défis sort de `66,7 % ± 2 points` ;
- une bande de niveaux sort de `66,7 % ± 4 points` ;
- une cellule type × bande sort de `66,7 % ± 7,5 points` ;
- le coût médian par niveau ne ralentit pas strictement entre les phases
  1–10, 10–20, 20–30, 30–35 et 35–40.

Le moteur de campagne réutilisable se trouve dans
`tests/helpers/heroXpTier1Campaign.ts`. Le test Vitest porte les assertions et
la sérialisation machine ; `scripts/run-xp-tier1-shards.mjs` distribue les
seeds, fusionne les compteurs et vérifie les tolérances. Les variables
`XP_SHARD_COUNT` et `XP_SEEDS_PER_SHARD` permettent un passage exploratoire
plus court sans changer le défaut `10 × 10`. `XP_DIAGNOSTICS=1` ajoute les
seuils isotones calculés depuis les distributions score/LUK par étage.

### Progression canonique des objets

`test:item-progression` rejoue les mêmes 100 campagnes avec le catalogue et le
moteur autoritaires réellement utilisés en production. Les combats, événements,
tirages de loot, vocations, restrictions de niveau et de classe, attrition,
récupération et commandes d'équipement restent ceux du moteur autoritaire.

Les 48 bases actives couvrent tous les cinq niveaux jusqu'au niveau 40. Le
moteur applique une courbe de puissance de base
`1 / 1,3 / 1,75 / 2,4 / 3,3 / 4,7 / 6,2 / 8 / 10` aux niveaux
`1 / 5 / 10 / 15 / 20 / 25 / 30 / 35 / 40`, puis les multiplicateurs de
rareté explosifs canoniques. Les modificateurs identiques d'une base sont
fusionnés avant la mise à l'échelle. Les objets de recrutement et de rank-up
restent leurs modèles legacy fixes et sont simulés tels quels.

Le rapport mesure les objets dans les huit tranches exactes `1–5`, `6–10`, …,
`36–40`, séparément des bandes plus larges utilisées pour calibrer les défis :

- les drops, leur niveau requis moyen et leur disponibilité immédiate par
  niveau ;
- la distribution des raretés ;
- les changements acceptés par l'autorité d'inventaire ;
- le gain relatif moyen et maximal de chaque changement, ainsi que le maximum
  porté explicitement par une rareté rare, épique ou légendaire ;
- la contribution de l'équipement à la puissance moyenne du groupe, calculée
  par différence avec les mêmes héros sans équipement. Les niveaux, classes et
  passifs ne peuvent donc pas valider artificiellement cette métrique.

La commande conserve tous les seuils XP et défis du harness canonique. Elle
vérifie aussi une disponibilité minimale de `50 / 50 / 55 / 60 / 65 / 70 /
75 / 80 %`. Le gain d'équipement moyen doit rester entre `140 et 240 %` puis
`75 et 135 %` dans les deux premières tranches, entre `15 et 30 %` en 11–15,
entre `11 et 22 %` de 16 à 35 et entre `9 et 18 %` en 36–40. La contribution
d'équipement du groupe doit croître à chaque tranche ; aucune rareté ne peut
dépasser `50 %` après le niveau 10 et au moins un jackpot supérieur à `100 %`
doit encore exister entre les niveaux 11 et 40. La médiane du niveau 40 reste
limitée à `4 000` explorations.

Le harness reste un outil de calibration intégré : il exerce les restrictions,
profils, loot, attrition, vocations et commandes d'équipement réels. Il ne
remplace pas le contrôle du ressenti dans l'application.

### Harness de progression Forge

`test:forge-progression` exerce les mêmes campagnes niveau 1–40. Par défaut,
il lance 100 seeds distinctes en dix processus de dix. `FORGE_SHARD_COUNT` et
`FORGE_SEEDS_PER_SHARD` permettent une passe plus courte ; `FORGE_ENFORCE=0`
affiche les écarts sans faire échouer la commande.

Le scénario utilise les commandes et règles runtime partagées pour le donjon,
le loot, la production idle, les vocations, les bâtiments, la Forge, les plans,
l'inventaire et les calculs d'objets. Il part d'une ville T1 établie mais paie
réellement Forge 1–8. Seule la stratégie du groupe reste propre au harness :
allocation, choix de recette, acceptation, équipement et recyclage. Aucun
matériau ni plan futur n'est injecté.

Les objectifs bloquants sont : 100 % des campagnes au niveau 40, 100 % avec
Forge 8, au moins 95 % avec un plan évolutif, puis un craft utile dans le
premier tiers de chaque tranche pour 80 % des campagnes en 1–5 et 90 % dans
les autres tranches. L'utilité est le gain projeté au niveau requis ; les
crafts immédiatement équipés sont comptés séparément. Le gestionnaire limite
ses essais à huit par tranche et se replie d'un étage si une composition
atteint la limite de 100 tours.

La validation runtime du 4 septembre 2026 passe les 100 seeds. Les taux de
craft utile précoce par tranche sont
100 / 100 / 96 / 94 / 100 / 99 / 100 / 100 %. Les médianes d'achat Forge 1–8
sont 51 / 140 / 276 / 626 / 1 027 / 1 532 / 2 207 / 2 930 explorations.
Les jalons héros médians 10 / 20 / 30 / 35 / 40 sont
261 / 918 / 1 878 / 2 644 / 3 652 explorations. Les trésors donnent 550 plans
sur 11 642 jets éligibles, soit 4,72 %, et les boss en donnent 29. La médiane
finale est de 12 plans évolutifs connus.

## Résultat final sur 100 seeds

Validation du 4 septembre 2026 avec le catalogue `level-bands-v1`, la rareté
explosive et la difficulté `party-four-two-thirds-v2` :

| Niveau de groupe | P10 | Médiane | P90 |
|---:|---:|---:|---:|
| 10 | 240 | 267 | 296 |
| 20 | 875 | 929 | 1 030 |
| 30 | 1 771 | 1 895 | 2 118 |
| 35 | 2 438 | 2 680 | 3 051 |
| 40 | 3 389 | 3 711 | 4 156 |

Le taux global des défis est `66,65 %`. Par bande de niveaux, il vaut
`67,47 / 66,58 / 65,54 / 65,32 / 68,57 %`. Les 30 cellules type × bande
respectent la tolérance.

Parts d'XP observées : combat régulier `53,21 %`, défis `29,65 %`, premier
clear `7,39 %`, élites `3,86 %`, trésors `3,09 %`, repos `2,04 %` et boss
majeurs `0,76 %`.

La mesure `xpNeeded / xpGained moyen` passe de `11,9` explorations au niveau 1
à `51,0` au niveau 9, `77,5` au niveau 19, `122,3` au niveau 29, `172,7` au
niveau 34 et `199,9` au niveau 39. Les coûts médians par niveau des cinq phases
sont strictement croissants : la progression ralentit sans mur brutal avant 40.

| Niveaux héros | Drops utilisables | Niveau objet moyen | Gain moyen accepté | Gain maximal | Jackpot rare+ | Puissance équipement |
|---:|---:|---:|---:|---:|---:|---:|
| 1–5 | 79,2 % | 2,8 | 233,16 % | 7 646,67 % | 727,35 % | 287,7 |
| 6–10 | 68,2 % | 7,7 | 130,18 % | 4 872,45 % | 1 616,64 % | 1 014,8 |
| 11–15 | 60,6 % | 13,3 | 28,58 % | 1 032,03 % | 1 032,03 % | 2 857,0 |
| 16–20 | 69,8 % | 17,2 | 15,60 % | 412,49 % | 412,49 % | 5 244,4 |
| 21–25 | 74,5 % | 22,1 | 17,92 % | 393,22 % | 393,22 % | 8 733,9 |
| 26–30 | 81,6 % | 27,4 | 17,16 % | 383,63 % | 383,63 % | 14 645,8 |
| 31–35 | 87,1 % | 32,6 | 14,20 % | 516,03 % | 516,03 % | 24 394,4 |
| 36–40 | 92,2 % | 36,9 | 14,53 % | 347,45 % | 347,45 % | 39 712,0 |

Le burst initial correspond aux premiers remplacements des starters. Les deux
cadeaux legacy du rank-up T1 amortissent ensuite la tranche 11–15 : après leur
attribution, moins de drops constituent immédiatement un gros remplacement.
La contribution propre de l'équipement reste strictement croissante et les
jackpots de rareté dépassent encore 100 % après le niveau 10.

## Autres simulations

`test:xp-simulation` compare les modèles historiques sur des campagnes plus
courtes et conserve un mode isolé ainsi qu'un mode avec attrition.
`test:xp-tier-projection` projette les tiers T2/T3 encore absents ; ses
résultats ne sont pas une règle runtime et devront être remplacés par une
simulation autoritaire lorsque leur contenu existera. Avec les ancres finales
L20/L30 et `8,704 s` visibles par exploration, le profil progressif donne
`6 434` explorations et `15,6 h` du niveau 1 au niveau 99.

## Limites

- Le harness modélise un groupe de quatre bien géré, avec tous les bâtiments
  T1 disponibles et une stratégie gloutonne d'équipement. Il ne simule pas les
  coûts de construction ou de recrutement.
- Le temps simulé couvre les événements de transcript et la récupération,
  mais pas la latence réseau, les décisions humaines ni les retours en ville.
- Les chances nulles restent mesurées et visibles. Elles ne signifient pas que
  le groupe échoue toujours : le héros le mieux adapté est choisi sur les six
  types rencontrés et l'objectif porte sur la campagne réelle agrégée.
- Le ressenti final doit encore être confirmé dans l'application ; le harness
  prouve le comportement du moteur, pas le plaisir du joueur.
