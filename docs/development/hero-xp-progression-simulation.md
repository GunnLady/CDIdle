# Simulation de progression d'XP des héros

## Objectif

Le harness `tests/heroXpProgressionSimulation.test.ts` compare la courbe
historique et plusieurs variantes en rejouant le résolveur autoritaire complet
des rencontres. La variante harmonisée T0/T1 a ensuite été adoptée par
l'application sous l'identifiant `harmonized-t0-t1-v1`.

Profils comparés :

- historique : croissance `1.50`, multiplicateur de tier 1 `1.25` ;
- modérée : croissance `1.35`, multiplicateur de tier 1 `1.15` ;
- fluide : croissance `1.30`, multiplicateur de tier 1 `1.10` ;
- T0/T1 harmonisée : T0 à `1.30`, puis T1 ancré à `1 061 XP` pour
  le passage 10 → 11 et à `1.20` à l'intérieur du tier.

## Deux modes

- `isolated` remet tous les héros à pleine vie et pleine mana avant chaque
  rencontre. Il isole la vitesse d'XP du temps de récupération et de l'attrition.
- `attrition` conserve les blessures, la mana et les incapacités entre les
  rencontres. Après un wipe complet, le groupe est remis sur pied afin que la
  campagne puisse continuer. Ce mode mesure la progression dans un parcours
  continu, pas le temps réel d'une boucle ville-donjon.

Chaque profil et chaque mode exécutent vingt campagnes déterministes avec quatre
novices, de l'étage 1 à l'étage 30. Le rapport affiche les niveaux finaux, les
étages auxquels tout le groupe atteint les jalons, les défaites, les wipes et
une estimation de la durée visible fondée sur une seconde par rencontre et
400 ms par événement de transcript. Une campagne est déclarée bloquée après 50
rencontres consécutives sans avancer de salle, afin de rendre visible un mur de
combat sans répéter indéfiniment le même affrontement.

## Exécution

```powershell
npm.cmd run test:xp-simulation
npm.cmd run test:xp-tier1
npm.cmd run test:xp-tier-projection
```

La seconde commande exécute une campagne complète avec la candidate harmonisée
jusqu'à ce que les quatre héros atteignent la cible T1 expérimentale au
niveau 35. Elle utilise le second mode,
la simulation complète : elle conserve l'attrition,
`applyIdleAuthority` récupère réellement les héros au repos à 2 % des PV et
PM max par seconde. Le temps simulé inclut les 400 ms de chaque étape du
transcript et la seconde entre deux explorations automatiques. Les héros
complètement remis sont ensuite réactivés comme le ferait le joueur. Après
trois échecs sur la même salle de boss, le groupe rejoue l'étage précédent
avec la même sémantique que
`dungeon.select_floor`. Toutes les explorations, rencontres non-combat, élites,
boss majeurs et primes de premier clear sont comptabilisées. L'historique des
15 dernières rencontres est conservé comme dans la couche de commande.
Chaque exploration et chaque choix de vocation consomment en outre un sous-flux
créé par `forkCanonicalRng` depuis l'état RNG maître sauvegardé, comme les
commandes autoritaires.

Les objets obtenus sont essayés avec la vraie commande autoritaire
`hero.equip`. Le simulateur respecte les niveaux requis, les slots et les
armes à deux mains. Il maximise gloutonnement un score de combat documenté dans
le test (DPS, vie, défenses, vitesse, critique, esquive, mana et résistances),
retente les objets déplacés sur les autres héros et réévalue le stockage lors
des gains de niveau. Ce score est une stratégie automatique de simulation, pas
une règle de gameplay ajoutée à la production.

Tous les bâtiments de vocation T1 sont disponibles dans cette campagne ciblée
sur l'XP. Les affinités réelles décident les transitions automatiques. En cas
de prière, la stratégie choisit uniquement parmi les candidats autorisés et
privilégie un rôle absent du groupe. Les coûts de recrutement et de
construction ne sont pas simulés.

Le moteur actuel ne possède pas encore de politique de transition T1 vers T2
ou T2 vers T3. La cible produit est un niveau maximal 99, avec T0 aux niveaux
1–10, défi T2 disponible au niveau 30 et plafond T1 envisagé au niveau 35.
Les bornes suivantes restent des projections tant que les quêtes et classes ne
sont pas implémentées : T2 autour de 35–65, puis T3 autour de 65–99.
Les bandes de coffre régulières plafonnent également aux objets de niveau
requis 33 ; ces limites font partie du résultat mesuré.

## Résultat candidat T0/T1

Avec la graine `0x515050`, le groupe atteint le niveau 10 après 209
explorations, le niveau 20 après 843, le niveau 30 après 2 065 vers l'étage 45
et le niveau 35 après 4 622 vers l'étage 95. La campagne complète représente
8,1 heures de temps visible simulé, 2 741 combats, 1 881 rencontres non-combat,
97 wipes, 114 objets obtenus et 62 changements d'équipement.

Le niveau 30 est la cible de progression normale où la future quête T2 devient
disponible. La plage 30–35 mesure une marge de préparation ou de retard du
joueur, pas cinq niveaux ordinaires supplémentaires à parcourir avant la quête.
Cette courbe est désormais le modèle actif de l'application. Les sauvegardes
du modèle historique conservent proportionnellement l'avancement de leur
niveau courant lors de leur premier chargement.

## Projection des économies de gains T2/T3

Le troisième script ne prétend pas résoudre des combats T2/T3 encore absents.
Il part du rythme autoritaire observé entre les niveaux 20 et 30, conserve un
coût de niveau composé à `1.20` et projette deux économies jusqu'au niveau 99.
Les deux modèles donnent un saut de gains `×2` à chaque promotion.

- `tier_steps` ne fait ensuite progresser les gains que linéairement de 6 % du
  gain de départ par niveau local. Il exige 15 145 574 explorations entre les
  niveaux 30 et 99 et atteint 2 256 595 explorations pour le dernier niveau.
  Des paliers seuls ne peuvent donc pas suivre un coût exponentiel.
- `progressive` compose les gains à `1.18` dans chaque tier. Il exige 5 660
  explorations entre les niveaux 30 et 99, avec 60 à 114 explorations par
  niveau, soit 7 725 explorations et environ 13,5 heures visibles depuis le
  niveau 1 dans cette projection.

La forme progressive et sa cible directionnelle d'environ 13,5 heures ont été
retenues pour guider le contenu futur. Elles ne sont pas actives dans le
runtime : les classes, quêtes et récompenses T2/T3 n'existent pas encore. Leur
implémentation devra être validée par une simulation autoritaire complète du
contenu réel, et non par cette projection seule.

## Ancien diagnostic T1 prolongé artificiellement au niveau 50

Avant de fixer les bornes de tiers, une campagne diagnostique avec la courbe
fluide a maintenu artificiellement les quatre héros T1 jusqu'au
niveau 50 après **104 859 explorations** et 143,7 heures de temps visible
simulé. Les jalons de groupe sont atteints aux explorations 209 (niveau 10),
1 206 (niveau 20), 6 375 (niveau 30), 28 265 (niveau 40) et 104 859
(niveau 50). La campagne comprend 62 314 combats, 42 545 rencontres
non-combat, 1 907 rencontres d'élite, 263 rencontres de boss majeur,
2 081 premiers clears, 2 318 objets obtenus et 102 changements d'équipement.

Ce résultat n'est pas une cible produit. Il met en évidence le décalage
entre l'XP nécessaire, encore exponentielle avec un facteur `1.30`, et les
récompenses après l'étage 50, qui ne progressent que linéairement : `+3 %` du
budget de l'étage 50 par étage pour un ennemi régulier et `+7,5 %` de la prime
de l'étage 10 par étage pour un premier clear. Le groupe doit ainsi monter
jusqu'à l'étage 2 082 malgré l'optimisation du loot.

## Limites

- Les vingt graines donnent un comparatif reproductible, pas un intervalle
  statistique définitif.
- Une vocation tier 1 unique est rendue disponible par le repaire pour éviter
  qu'une prière de vocation non résolue ne brouille la comparaison.
- L'estimation UI ignore le réseau, les décisions humaines, les retours en ville
  et toute temporisation non représentée dans le résolveur.
- Le simulateur prouve le comportement du moteur et permet de classer les
  courbes. Le ressenti final doit ensuite être confirmé dans l'application.
