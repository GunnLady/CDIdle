# Économie d'XP du donjon

## Modèles canoniques

La progression repose sur deux politiques versionnées et indépendantes :

| Politique | Identifiant | Responsabilité |
|---|---|---|
| seuils de niveaux | `harmonized-level-bands-v2` | calcule `xpNeeded` selon le niveau |
| gains du donjon | `level-aligned-v2` | calcule le pool d'XP selon l'étage et la source |

Changer de vocation ne modifie ni le seuil courant ni le gain reçu. Les deux
politiques vivent dans le domaine partagé et sont utilisées directement par le
résolveur autoritaire et les simulations.

## Courbe des seuils

- passages vers les niveaux 2 à 10 : base `100`, croissance composée `1,30` ;
- passage vers le niveau 11 : ancre `1 061` ;
- passages suivants : croissance composée `1,20` ;
- niveau maximal : 99.

Le niveau, et lui seul, sélectionne la bande. Novice et T1 ont donc le même
`xpNeeded` à niveau égal.

## Courbe des gains

Le budget de base reprend l'XP d'un ennemi régulier du même étage jusqu'à 50.
Au-delà, il compose à `4,5 %` par étage depuis l'ancre de l'étage 50. Chaque
source applique ensuite un multiplicateur :

| Source | Multiplicateur |
|---|---:|
| combat régulier | 1,00 |
| repos | 0,50 |
| trésor | 0,75 |
| défi réussi | 1,25 |
| élite | 2,50 |
| boss majeur | 4,00 |
| premier clear | 4,00 |

Chaque héros actif et vivant reçoit la même part selon la table de groupe
historique : `100 %`, `50 %`, `40 %` ou `35 %` du pool pour un groupe de un,
deux, trois ou quatre héros. Le groupe de quatre reçoit donc `140 %` du pool au
total. Le bonus racial Humain de `+15 %` est appliqué à la part du héros. Un
défi réussi récompense tout le groupe éligible ; un échec ne donne aucune XP.
Chaque événement `reward.xp` et `reward.floor_first_clear_xp` porte sa `source`
et son `floor`. Les sept sources restent donc distinguables sans réinférence,
ce qui évite une double attribution et rend l'économie observable.

## Compatibilité et déterminisme

L'activation de cette politique ne nécessite pas de migration de snapshot :
elle ne réécrit pas l'XP déjà acquise. Les replays de commande renvoient le
résultat persisté et ne recalculent pas une récompense avec une politique plus
récente. Le calcul du montant ne consomme aucun RNG ; seuls les level-ups et
transitions déjà prévus peuvent en consommer.

La table d'interpolation des ennemis extrapole attaque, XP et or au-delà de
l'étage 50 depuis leur dernière ancre. Le test de régression couvre notamment
les étages 51, 60 et 99 afin d'empêcher un retour accidentel au budget de
l'étage 1.

## Validation

Les multiplicateurs et les partages sont couverts par
`tests/dungeonXpRewards.test.ts`. Les conséquences autoritaires sont couvertes
par les golden tests du donjon. La relation entre `xpNeeded`, `xpGained` et les
défis est validée par le harness 100 seeds décrit dans
`docs/development/hero-xp-progression-simulation.md`.
