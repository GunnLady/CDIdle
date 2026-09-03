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

## Résultat canonique sur 100 seeds

Résultat du 3 septembre 2026, revalidé à l'identique le 4 septembre 2026 après
correction de l'extrapolation des budgets ennemis au-delà de l'étage 50 :

| Niveau de groupe | P10 | Médiane | P90 |
|---:|---:|---:|---:|
| 10 | 246 | 275 | 312 |
| 20 | 876 | 930 | 1 041 |
| 30 | 1 764 | 1 866 | 2 089 |
| 35 | 2 423 | 2 621 | 2 962 |
| 40 | 3 403 | 3 718 | 4 052 |

Le taux global des défis est `67,52 %`. Par bande de niveaux : `66,03 %`,
`66,41 %`, `66,86 %`, `66,78 %` et `69,75 %`. Les 30 cellules type × bande
respectent la tolérance annoncée.

Parts d'XP observées : combat régulier `52,09 %`, défis `31,01 %`, premier
clear `7,14 %`, élites `3,70 %`, trésors `3,19 %`, repos `2,13 %` et boss
majeurs `0,74 %`.

La mesure `xpNeeded / xpGained moyen` passe d'environ 11,9 explorations au
niveau 1 à 52,2 au niveau 9, 76,1 au niveau 19, 112,3 au niveau 29, 169,6 au
niveau 34 et 216,0 au niveau 39. Les coûts médians par niveau des cinq phases
sont strictement croissants ; c'est le léger ralentissement recherché. Les
jalons agrégés, et non une seed isolée, constituent la preuve.

## Autres simulations

`test:xp-simulation` compare les modèles historiques sur des campagnes plus
courtes et conserve un mode isolé ainsi qu'un mode avec attrition.
`test:xp-tier-projection` projette les tiers T2/T3 encore absents ; ses
résultats ne sont pas une règle runtime et devront être remplacés par une
simulation autoritaire lorsque leur contenu existera. Avec les ancres finales
L20/L30 et `8,785 s` visibles par exploration, le profil progressif donne
`6 207` explorations et `15,1 h` du niveau 1 au niveau 99.

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
