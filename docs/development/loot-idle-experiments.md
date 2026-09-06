# Expériences loot/forge — reprise du 5 septembre 2026

> Rapport historique v1. [Idle-rhythm-v4](loot-idle-rhythm-v4.md) remplace ses
> critères produit et décrit le comportement loot maintenant canonique.

**Décision du 6 septembre : la cible loot 1–3 est retirée.** Ce document
conserve les résultats historiques du v1. Le [plan v2](loot-idle-flow-v2.md)
décrit les nouveaux profils sans quota et la mesure du ralentissement idle.
Les proportions 1–3 ci-dessous sont descriptives, jamais des critères actifs.

Statut au 6 septembre 2026 : **700/700 campagnes longues terminées et
auditées**, tests déterministes réussis. L'équilibrage reste **non validé** :
forge trop généreuse en améliorations et tentatives décroissantes en fin de
progression. Modifications limitées aux scripts et à la documentation.
Contexte : [handoff](session-2026-09-05-loot-forge-handoff.md).

## Méthode

Le [harness](../../scripts/run-loot-economy-harness.mjs) bundle le domaine réel
avec esbuild, vérifie ses ancres et applique les expériences en mémoire.
Le [pilote](../../scripts/helpers/loot-idle-experiments.mjs) utilise les vrais
démarrages, finalisations, recyclages et équipements. Aucune sauvegarde,
aucun service, navigateur ou déploiement.

Chaque profil reçoit les mêmes seeds initiales, `0x515050 + index`. La ville
progressive commence avec deux héros ; bâtiments et recrutement sont payés
selon la politique du [rapport initial](loot-economy-harness.md). Ce n'est pas
une simulation exhaustive de toutes les dépenses possibles. Les trajectoires
divergent avec les objets et les combats. RNG déterministes, sans promesse
de combats identiques après divergence.

Le témoin `baseline` conserve les règles loot et les coûts actuels, avec le
même nouveau pilote de forge que les variantes. Ses résultats diffèrent donc
des anciens rapports utilisant le pilote limité au rare.

## Variantes expérimentales

Toutes les variantes `idle*` remplacent les objets lootés par une hypothèse
visant environ deux objets par passage complet : un à la dernière salle
victorieuse et une chance `1/(nombre de salles - 1)` dans chaque autre salle
victorieuse. Les salles neutres ou perdues abaissent l'espérance. Matériaux,
plans et or restent ceux du domaine, sauf le levier explicite des plans.
Le pool est celui des coffres ou des boss selon la source. Aucun plafond
strict à trois objets. Recrutement, rank-up et craft sont exclus du loot.

| Profil | Levier ajouté au loot commun |
| --- | --- |
| idleControl | Aucun : témoin des autres leviers |
| idleEfficient | Remboursement de 10 à 30 % des scraps payés selon la tranche héros, arrondi inférieur ; catalyseurs intégralement payés |
| idleQuality | Probabilités multipliées par `1 + 0,35 × rang de rareté`, puis normalisées ; aucun proc impossible ajouté |
| idleTargeted | Recraft de la même famille tant que son score vaut au moins 80 % du meilleur choix connu |
| idlePlans | Une famille active manquante et utile par étage de boss/élite vaincu, dans sa plage de découverte ; sans nouvelle attribution pour répéter le même étage |
| idleCombined | Les quatre leviers ensemble |

Ces paramètres sont des hypothèses de calibration, pas des taux repris des
jeux cités dans le handoff. Aucun système de maîtrise n'est ajouté.

## Pilotage et dénominateurs

La sélection filtre exactement les 48 familles actives craftables. Elle paie
virtuellement le coût initial puis évalue les raretés possibles et finançables.
Son score pondère deux niveaux d'objet, milieu et haut de tranche :
approximation du potentiel, pas espérance exacte sur les cinq niveaux ni
garantie de gain. Les aperçus ne consomment pas le RNG et ne sont jamais
injectés dans la campagne. Les objets réels viennent des commandes
autoritaires. Les plans utilisent un budget riche uniquement pour classer
leur utilité, jamais pour financer la campagne.

Le délai entre tentatives décroît de huit à une exploration entre les bandes
héros 1–5 et 36–40. Le plafond arbitraire de crafts est retiré. Il reste au plus
une tentative par exploration, les coûts réels et les vérifications d'utilité.
Les compteurs distinguent délai, absence de budget initial, absence de
potentiel finançable et refus de proc faute de catalyseurs. Un délai bloqué
ne prouve pas seul qu'un craft utile aurait été finançable à cet instant.

Le pilote accepte toute offre de rareté finançable, puis évalue l'objet obtenu.
Il ne résout pas globalement l'allocation optimale des catalyseurs entre
offres présentes et futures. Cette politique de gestion explicite constitue
une limite de l'étude, comme la politique de dépenses de ville.

Les bandes sont définies par le **niveau minimum du groupe**, jamais par
l'étage. Elles enregistrent séparément la présence de quatre héros. La cible
1–2 concerne `fourHeroEquipped` : objets forgés distincts réellement équipés
avec gain positif, y compris plus tard. Un transfert ne compte pas deux fois.
Les périodes précédant le quatrième héros ne valent pas preuve pour quatre.
Le recrutement peut ramener le minimum du groupe dans une bande antérieure.

`usefulCrafts` reste une projection ; `equippedCrafts` mesure l'immédiat,
`uniqueEquippedCrafts` inclut le différé. Le gain est celui de l'optimiseur
avec protection du DPS, pas un jugement exhaustif des stratégies possibles.

Un passage commence à l'entrée d'un étage ou au retour à une salle antérieure.
Une nouvelle tentative dans la même salle après défaite reste dans le même
passage. Passages partiels et répétitions sont conservés. Le taux principal
concerne les passages commencés salle 1 et achevés à la dernière salle.
Le rapport complémentaire mesure aussi le cumul par étage avec répétitions.
Le temps sec inclut combat et récupération, jusqu'au drop suivant.

La durée totale dépend de la convention du moteur utilisant la longueur des
transcriptions. Elle ne constitue pas un chronométrage du client réel.

## Validation et sorties

```powershell
node scripts/test-loot-town-policy.mjs
node scripts/test-loot-idle-experiments.mjs
node --check scripts/run-loot-economy-harness.mjs
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=100 --workers=10 --profiles=baseline,idleControl,idleEfficient,idleQuality,idleTargeted,idlePlans,idleCombined --town=progressive --experiment=idle-study-v1
node scripts/audit-loot-idle-results.mjs
```

Le test dédié vérifie procs accessibles, budget exactement consommé,
reproductibilité, conservation des matériaux, équipement différé et
déduplication. Sur huit tranches et cinq raretés, chaque cycle craft +
acceptation éventuelle + recyclage réduit strictement le total des unités de
matériaux, même avec remboursement : aucun cycle gratuit. Cette preuve
dépend des coûts, récompenses et du minimum commun des 48 familles ;
le test échoue si ces hypothèses changent.

Les sorties sont ignorées par Git, sous
`test-results/loot-economy/<stage>/<experiment>/<profils>-city/`.
Un dossier existant est refusé pour préserver les résultats précédents.
Une étude valide exige tous les workers terminés, exactement 100 seeds
distinctes par profil, comptes conservés et quatre héros ≥ 40 pour chaque
arrivée longue. Les empreintes du bundle et du pilote sont enregistrées ;
le résumé refuse les mélanges de versions entre workers.

L'[auditeur](../../scripts/audit-loot-idle-results.mjs) réconcilie passages,
objets, explorations et équipements uniques, compare les durées appariées,
détaille coûts/raretés et écrit `analysis.json`. Il a passé un essai sur six
campagnes courtes (`early/idle-auditor-smoke-v1/`), correctement classées
incomplètes pour le niveau 40.

## Pilotes vérifiés et écarts

Sortie : `test-results/loot-economy/full/idle-full-pilot-v1/`, deux seeds par
profil et deux workers. Les 14 campagnes atteignent quatre héros ≥ 40, sans
écart d'or ou de matériaux. Il faut l'étude complète pour conclure
statistiquement.

| Profil | Heures moyennes | Crafts moyens | Améliorations moyennes par bande, groupe de quatre |
| --- | ---: | ---: | --- |
| baseline | 10,629 | 146 | 3 ; 8,5 ; 9 ; 11 ; 3,5 ; 3,5 ; 6 ; 5 |
| idleControl | 9,710 | 199 | 3,5 ; 4 ; 6 ; 11 ; 5 ; 8 ; 4 ; 6 |
| idleEfficient | 8,580 | 266 | 3,5 ; 4 ; 6 ; 11 ; 10 ; 4 ; 8 ; 6,5 |
| idleQuality | 9,477 | 202 | 4 ; 6 ; 9 ; 8,5 ; 9 ; 4,5 ; 6 ; 6,5 |
| idleTargeted | 8,697 | 195 | 3 ; 4 ; 8 ; 9 ; 9,5 ; 5 ; 4,5 ; 5 |
| idlePlans | 6,925 | 213 | 3 ; 3,5 ; 12 ; 11,5 ; 4,5 ; 7,5 ; 6,5 ; 5 |
| idleCombined | 8,318 | 252 | 3 ; 4,5 ; 9 ; 14 ; 12 ; 11,5 ; 7 ; 7 |

Les valeurs suivent les bandes héros 1–5 à 36–40. **Écart prioritaire :
surproduction d'améliorations de forge**, y compris avec le témoin géré par
le nouveau pilote. Efficacité et qualité peuvent aggraver l'écart. Cela ne
prouve pas qu'il faille plafonner les crafts : davantage de tentatives de
recherche reste un objectif distinct.

Les statistiques de passages du premier pilote long sont obsolètes :
une nouvelle tentative dans la même salle y était séparée à tort. Son temps
sec omettait la durée de l'exploration donnant le drop suivant. Ces mesures
ont été corrigées avant `idle-study-v1`, avec quatre pilotes courts réussis
dans `early/idle-final-smoke-v1/`. Le nettoyage de `reward.item.none` a aussi
été corrigé avant l'étude ; il peut modifier légèrement le temps et ensuite
la trajectoire. Le tableau identifie donc le pilote, pas l'étude finale.

## Étude et critères de fermeture

`idle-study-v1` a terminé avec un code de sortie 0, dix workers et exactement
100 seeds distinctes appariées par profil. L'auditeur est également sorti
avec le code 0 : 700/700 groupes de quatre héros ≥ 40, aucun écart d'or ou de
matériaux, aucun doublon de craft équipé, cohérence des tranches, des passages
et des totaux d'explorations. Aucun arrêt incomplet. Les empreintes des
bundles sont identiques entre workers d'un même profil, ainsi que celle du
pilote commun. Les processus de ce lot sont terminés.

Sources locales : `test-results/loot-economy/full/idle-study-v1/`, sous-dossier
`baseline-idleControl-idleEfficient-idleQuality-idleTargeted-idlePlans-idleCombined-city` :
`worker-0.json` à `worker-9.json`, `reports.json`, `summary.json`, `analysis.json`.

### Résultats complets

Toutes les valeurs du tableau sont des moyennes. Le delta de durée est la
moyenne des différences relatives **appariées par seed** avec le témoin ; il
diffère donc du ratio des deux durées moyennes. Les heures sont simulées.

| Profil | Heures vers quatre héros ≥ 40 | Delta apparié | Objets / passage complet | Passages dans 1–3 | Crafts / campagne |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline | 9,15 | référence | 1,084 | 61,20 % | 155,78 |
| idleControl | 8,72 | −3,46 % | 1,930 | 89,27 % | 209,23 |
| idleEfficient | 8,16 | −9,66 % | 1,930 | 89,44 % | 277,63 |
| idleQuality | 8,71 | −3,52 % | 1,927 | 89,49 % | 209,38 |
| idleTargeted | 8,77 | −2,80 % | 1,927 | 89,63 % | 209,41 |
| idlePlans | 8,07 | −10,40 % | 1,934 | 89,04 % | 207,69 |
| idleCombined | 7,68 | −14,61 % | 1,926 | 89,78 % | 271,60 |

Le loot est centré près de deux, mais **10–11 % des passages dépassent trois**.
Aucun passage complet `idle*` à zéro objet ; maximum observé six ou sept.
Il ne s'agit donc pas d'une garantie 1–3. Avec répétitions et passages partiels,
le cumul par étage a une moyenne de 1,91–1,93, mais peut aller jusqu'à douze
objets selon le profil. Ne pas transformer ces chiffres en plafond universel.

Le maximum de temps sans objet, pris par campagne puis moyenné, passe de
37,50 minutes dans le témoin à 12,22 pour `idleControl` et 9,97 pour la
combinaison. Des épisodes plus longs subsistent : maximum observé 28,41
minutes pour `idleControl`, 21,38 pour la combinaison.

Améliorations réellement équipées par le **groupe de quatre**, moyennes par
bande héros ; les équipements avant le quatrième recrutement sont exclus :

| Profil | 1–5 | 6–10 | 11–15 | 16–20 | 21–25 | 26–30 | 31–35 | 36–40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 2,98 | 5,24 | 8,98 | 9,19 | 4,20 | 5,44 | 5,20 | 4,75 |
| idleControl | 2,78 | 4,54 | 9,46 | 9,68 | 5,19 | 5,81 | 4,39 | 4,20 |
| idleEfficient | 2,78 | 4,54 | 9,52 | 11,79 | 9,18 | 7,27 | 6,48 | 6,03 |
| idleQuality | 2,89 | 5,23 | 9,82 | 11,05 | 5,69 | 6,18 | 5,15 | 4,27 |
| idleTargeted | 2,81 | 5,01 | 9,18 | 9,60 | 4,81 | 5,83 | 4,70 | 3,73 |
| idlePlans | 3,09 | 5,62 | 12,22 | 11,28 | 5,75 | 6,33 | 4,92 | 4,31 |
| idleCombined | 2,88 | 5,89 | 13,24 | 14,25 | 11,29 | 7,23 | 7,26 | 6,28 |

La combinaison atteint la plage 1–2 dans seulement 60/800 observations
campagne × bande ; `idleControl`, 110/800. Le suivi différé compte en moyenne
8,77 objets supplémentaires par campagne pour `idleControl`, 12,72 pour la
combinaison, sur toute la campagne y compris avant le quatrième recrutement.
Les anciens compteurs immédiats sous-estimaient donc l'effet.

Les tentatives ne croissent pas continûment avec les niveaux : pour
`idleControl`, 42,91 crafts en 16–20 puis 15,74 en 36–40 ; pour la combinaison,
53,37 puis 22,51. En 36–40, le délai vaut une exploration, aucun plafond de
craft n'existe et le budget initial bloque encore 72 543 vérifications sur
les 100 seeds `idleControl` (66 883 pour la combinaison). Le délai et l'ancien
plafond ne sont donc pas l'explication du manque de tentatives tardives.

Les coûts d'acceptation sont effectivement débités. Sur les 100 campagnes
combinées : 86 936 raffinés, 33 745 fragments, 8 565 cœurs et 897 essences
dépensés en acceptations, en plus des coûts initiaux. 2 588 offres refusées
faute de matériaux, dont 1 197 rares, 891 épiques et 238 légendaires.
`idleControl` refuse 1 280 offres. Les remboursements de scraps financent
davantage d'essais, mais ne règlent pas seuls l'acceptation des procs.

La combinaison attribue en moyenne 30,06 plans utiles supplémentaires.
Son accélération moyenne appariée de 14,61 % demande une validation produit
du ralentissement idle souhaité. Les durées individuelles restent variables :
une seed combinée peut être plus lente que son témoin ; aucune accélération
universelle n'est affirmée.

### Écarts ouverts et prochain ajustement

| Priorité / rentabilité | Écart | Implications et prochaine expérience | Critère de fermeture |
| --- | --- | --- | --- |
| P1 / forte | Trop d'améliorations de forge | Tester l'écart de puissance craft/loot et la fréquence des gains ordinaires ; préserver la puissance des procs élevés. Le recraft ciblé actuel ne suffit pas. Ne pas masquer l'écart en ignorant des équipements réels ou en bloquant après deux succès. | Refaire les bandes avec 100 seeds appariées ; cible 1–2 améliorations pour quatre héros, sans compter les projections ni plafonner artificiellement les essais. |
| P1 / forte | Tentatives tardives en baisse et procs encore refusés | Isoler le budget initial de celui des catalyseurs ; tester leur allocation et leur approvisionnement avec les coûts de recyclage. La seule préservation des scraps est insuffisante. | Essais croissants selon la progression, offres utiles finançables, comptes exacts et absence de cycle gratuit. |
| Retiré le 6 septembre | Ancienne plage loot 1–3 | Décision utilisateur : abandonner ce quota et toute probabilité dépendant des objets déjà reçus. Voir le plan v2. | Aucun critère 1–3 actif ; mesurer la boucle de récompenses idle. |
| P2 / forte | Accélération de la progression | Comparer toute nouvelle variante au témoin apparié, avec ville payée et quatre héros ≥ 40. | Définir puis vérifier la tolérance de durée compatible avec le ralentissement idle souhaité. |

Ces ajustements restent à implémenter et à mesurer. **Aucune variante testée
ne valide l'ensemble des objectifs.** L'étude est complète ; la calibration
loot/forge reste ouverte avec les dépendances et critères ci-dessus.

Comparer fréquences par source et par passage à titre descriptif, temps sans loot,
crafts/équipements par bande, budgets initiaux et d'acceptation, plans, délais
et durée jusqu'à quatre héros ≥ 40. Ajuster les variantes qui manquent la
cible et tracer les écarts réels ; un stock élevé ne prouve pas à lui seul un
déséquilibre.

Une évolution du jeu demanderait ensuite validation métier, régressions
autoritaires/RNG/replay et présentation utilisateur. Ces expériences ne
remplacent pas ces preuves et n'autorisent aucune publication.
