# Loot et forge idle — protocole v2, 6 septembre 2026

> Rapport historique v2. [Idle-rhythm-v4](loot-idle-rhythm-v4.md) remplace ses
> critères produit et décrit le comportement loot maintenant canonique.

## Décision et état

L'utilisateur retire explicitement la plage loot 1–3. L'objectif est une
boucle de récompenses idle : drops réguliers, surplus recyclables, davantage
d'essais accessibles avec la progression, recherche de procs puissants.
La cible forge reste 1–2 améliorations réellement équipées par groupe de
quatre et par tranche de cinq niveaux de héros. Aucune durée cible ni
tolérance d'accélération n'est encore décidée.

Les 700 campagnes v1 sont terminées et auditées. Elles prouvent la cohérence
des comptes et révèlent deux écarts : trop d'améliorations forgées et moins
de tentatives tardives. Elles ne valident pas l'équilibrage. Leur base loot
visant deux objets par passage est désormais historique.

V2 : huit pilotes courts et quatre pilotes longs passent, avec audit des
comptes et des horloges. Les quatre pilotes longs atteignent quatre héros
au moins niveau 40. **Le lot principal est terminé et audité : 400/400**,
le 6 septembre à 10:39:55 (Europe/Paris). Aucun changement aux règles de
production. La [suite v3](loot-idle-budget-v3.md) isole budget et fréquence
des procs dans un petit pilote.

## Recherche et traduction expérimentale

- [Tap Titans 2, annonce officielle](https://gamehive.com/blog/devupdate-113-remake-the-unrepeatable/) : recrafter une base déjà découverte pour rechercher de meilleurs bonus secondaires. Source relue le 6 septembre ; aucune importation de ses coûts.
- [IdleMMO, wiki officiel](https://wiki.idle-mmo.com/items/equipment) : recettes obtenues en donjon et matériaux nécessaires au craft ; les améliorations prennent plus de temps aux tiers élevés. Source relue le 6 septembre.
- [Melvor, préservation](https://wiki.melvoridle.com/w/Preservation_Chance) : mécanisme de préservation déjà identifié. La relecture directe renvoie HTTP 403 ; aucun plafond ou taux actuel n'est affirmé sur cette base.

Ces exemples motivent des mécanismes distincts, pas un standard universel
de loot. La chance de drop ci-dessous est une hypothèse CDIdle. La
préservation de scraps est un levier expérimental déjà testé, sans système
de maîtrise ajouté. Le recraft et la qualité du v1 sont conservés dans les
scripts ; leur effet isolé était modeste et ils ne sont pas prioritaires
dans ce premier lot v2.

## Comparaison : quatre profils, 400 campagnes longues

| Profil | Règle |
| --- | --- |
| baseline | Loot et coûts du domaine actuel, même gestion de ville et forge que les autres profils |
| flowLoot | Loot natif conservé ; un objet si coffre/boss/élite victorieux sans objet ; chance supplémentaire sur combat ordinaire victorieux de 5 % en niveaux 1–5 à 12 % en 36–40, +1 point par tranche |
| flowEfficient | flowLoot + restitution progressive de 10–30 % des scraps effectivement payés, arrondie à l'inférieur ; catalyseurs payés intégralement |
| flowPlans | flowLoot + une recette active manquante et utile par étage de boss/élite vaincu, dans sa plage de découverte ; aucun nouveau plan pour répéter le même étage |

La probabilité ne dépend ni du nombre de salles ni du nombre d'objets déjà
lootés. Aucun plafond par passage. Les objets ajoutés suivent les pools et
niveaux du domaine, pool boss pour un boss, coffre ailleurs. Or et matériaux
directement lootés ne sont pas majorés ; les objets en surplus fournissent
des matériaux via le recyclage réel.

Même courbe d'XP, coûts de ville et règles de récupération pour tous.
100 seeds distinctes appariées par profil, `0x515050 + index`.
**Dix workers simultanés**, chacun traite dix seeds pour chacun des quatre
profils (40 campagnes par processus au total). Pas quarante workers.

Le pilote de forge est commun : 48 familles actives, vrais coûts et RNG,
pas de plafond artificiel de succès, contrôle des équipements différés.
Il accepte encore chaque offre de rareté finançable ; il ne prouve pas une
allocation optimale des catalyseurs entre offres. Cette limite reste ouverte.
Les recettes sont évaluées au milieu et au sommet de tranche, approximation
qui reste identique entre profils. Les sources du jeu ne sont pas modifiées.

## Mesurer le ralentissement idle

Le témoin v1 arrive à quatre héros niveau 40 en **9,15 heures simulées**
en moyenne ; la combinaison v1 en **7,68 heures**, avec une variation
appariée moyenne de **−14,61 %**. Le rapport des deux moyennes n'est pas la
moyenne des variations seed par seed. Ce résultat indique une accélération
globale, sans prouver que les derniers niveaux perdent leur ralentissement.

L'horloge du harness cumule récupération et durée d'encounter. Cette dernière
est estimée par `(nombre d'événements de transcription + 1) × 400 ms + 1 s`.
Les événements de loot participent donc à cette convention. Ce n'est ni une
mesure du client réel, ni une durée de sessions humaines, ni un calendrier
de jeu hors ligne. Les crafts eux-mêmes n'ont pas un délai humain simulé.

V2 ajoute et réconcilie :

1. Durée totale jusqu'aux quatre héros niveau 40, distribution entre seeds
   et variation appariée.
2. Premiers passages du groupe complet aux niveaux 5, 10, 15…40.
3. Temps par tranche de niveau minimum du groupe, séparant encounters et
   récupération ; les retours de tranche dus au recrutement sont conservés.
4. Répartition des tentatives, gains réellement équipés, blocages de budget
   et refus de procs par tranche, à lire avec sa durée et son exposition.

Le temps d'un encounter et de sa récupération préalable est attribué à la
tranche constatée au précédent point de mesure. Les temps cumulés des
jalons du groupe complet permettent aussi de comparer les intervalles
5→10, 10→15, etc. Le début de campagne inclut le recrutement progressif.

Un ralentissement souhaitable peut associer **niveaux plus espacés** et
**récompenses/crafts toujours fréquents**. Un long intervalle sans objet ou
un proc impossible à financer n'est pas, à lui seul, une preuve de bon rythme.

Trois décisions produit sont possibles après lecture de la courbe :

| Orientation | Conséquence et prochaine validation |
| --- | --- |
| Priorité à la forme de progression — recommandation | Tolérer une baisse de durée totale si le démarrage reste rapide et les intervalles tardifs s'allongent progressivement, avec une boucle de récompenses active. La marge chiffrée reste à décider. |
| Conserver aussi une durée proche du témoin | Définir une marge autour des 9,15 h simulées ; après calibration loot/forge, tester un ajustement tardif de progression. Ne pas retirer des récompenses uniquement pour faire remonter le chronomètre. |
| Viser une expérience sur plusieurs jours | Définir sessions, absence et progression hors ligne ; compléter le harness avant de convertir sa durée en jours de jeu. |

Le « go » utilisateur du 6 septembre est pris comme feu vert pour poursuivre
selon cette priorité de forme de progression. Il ne fixe aucune marge
chiffrée et n'autorise aucune publication. Aucun ajustement d'XP ou de
temporisation n'est appliqué dans ce lot.

## Plan et critères de passage

| Étape | Travail | Preuve attendue |
| --- | --- | --- |
| 1 — campagne v2 | Mesurer les quatre profils sans quota et isoler préservation/plans | 100 seeds par profil, arrivée des quatre héros à 40, comptes et chronométrie réconciliés, empreintes homogènes |
| 2 — économie tardive | À partir des blocages, tester séparément budget initial, catalyseurs et gestion des offres utiles | Plus d'occasions finançables tardives ; baisse des refus utiles ; aucun cycle craft/recyclage gratuit |
| 3 — rareté des vraies améliorations | Comparer puissance loot/craft et gains des rolls ordinaires, conserver les procs explosifs | Se rapprocher de 1–2 objets distincts meilleurs réellement équipés par groupe et tranche, sans plafond de succès ni décompte masqué |
| 4 — décision sur le rythme | Présenter intervalles entre jalons, récupération et dispersion, puis choisir orientation et marge | Critère temporel explicite accepté par l'utilisateur avant calibration de la durée |
| 5 — combinaison et régression | Combiner uniquement les leviers retenus, refaire 100 seeds appariées puis préparer le changement métier | Tous les objectifs couverts ; toute intégration produit exige ses tests autoritaires/RNG/replay et sa validation visuelle adaptée |

Les seuils de fréquence loot, le sens précis de « plus de tentatives »
(par tranche, par heure simulée, ou les deux) et la marge de durée restent
à décider avec les distributions. Conserver les trois mesures évite de
faire passer une tranche simplement plus longue pour une forge plus accessible.

## Exécution et suivi

Terminal Codex PowerShell, sans service externe :

```powershell
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=100 --workers=10 --profiles=baseline,flowLoot,flowEfficient,flowPlans --town=progressive --experiment=idle-flow-v2
```

Sorties : `test-results/loot-economy/full/idle-flow-v2/baseline-flowLoot-flowEfficient-flowPlans-city/`.
Le dossier existant est refusé. `manifest.json` contient PID, workers et
répartition des seeds. Chaque `run-<profil>-<index>.json` est publié après
fin du run par renommage d'un fichier temporaire. L'agrégation et l'audit
s'exécutent automatiquement après les workers ; `completed.json` atteste
leur fin et distingue audit réussi et nombre d'arrivées réussies.

En cas d'interruption, les checkpoints sont conservés ; ajouter désormais
`--resume=true` à la commande pour ne recalculer que les seeds manquantes.
Le manifest, les seeds, la politique et le bundle compilé doivent être
compatibles. Une reprise refuse des processus précédents encore actifs.
Les anciens manifests sont archivés. Ne pas annoncer
de résultats complets avant agrégation et audit final. Consulter aussi le
journal d'erreur et les PID : une absence de completed.json seule ne prouve
pas que le lot tourne encore.

Les échecs du sandbox normal persistent dans la session ; l'élévation
ciblée fonctionne. Aucun changement d'ACL ou de protection du dépôt.

## État vérifié après lancement

Lancement le 6 septembre 2026 à **09:28:09, Europe/Paris**
(`2026-09-06T07:28:09.761Z`). Parent Node : **21528**.
Les dix workers sont actifs et consomment du CPU ; chacun possède dix
indices de seeds dans le manifest :
`26544, 31468, 33628, 18640, 22264, 23804, 30160, 28800, 32828, 30596`.
Au premier contrôle de progression, six campagnes étaient sauvegardées,
et `stderr.log` était vide. Ce constat est ponctuel, pas un statut terminal.
Le lot continue en arrière-plan, fenêtre cachée, avec agrégation et audit
automatiques. Vérifier les fichiers et les processus pour le statut actuel.

Journaux : `test-results/loot-economy/full/idle-flow-v2/stdout.log` et
`stderr.log`. Le manifest est dans le sous-dossier des quatre profils.

Le pilote long utilise **une seule seed**, commune aux quatre profils :

| Profil | Total simulé | Récupération | Intervalle 5→10 | Intervalle 35→40 | Crafts |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline | 8,88 h | 1,32 h | 15,7 min | 124,3 min | 152 |
| flowLoot | 7,41 h | 0,95 h | 18,4 min | 92,4 min | 420 |
| flowEfficient | 6,95 h | 0,69 h | 18,4 min | 88,2 min | 594 |
| flowPlans | 7,70 h | 1,48 h | 13,8 min | 75,3 min | 420 |

Ce pilote illustre pourquoi une accélération globale peut coexister avec
des derniers niveaux sensiblement plus longs. Il ne prouve ni une courbe
monotone, ni un résultat généralisable. Les améliorations forgées dépassent
encore la cible 1–2 dans de nombreuses tranches : davantage de crafts ne
résout pas seul la question de leur puissance relative au loot.

Preuves pilotes :
`test-results/loot-economy/full/idle-flow-full-pilot-v2/baseline-flowLoot-flowEfficient-flowPlans-city/analysis.json`
et `completed.json`. Les tests des deux politiques et les vérifications de
syntaxe passent. Aucun résultat définitif des 400 runs n'est encore annoncé.

## Incident et reprise, 6 septembre

Au contrôle de 09:55, aucun worker initial n'était actif. 195 checkpoints
subsistaient. esbuild avait renvoyé `Cannot read file ...forge-command-handlers.ts:
The parameter is incorrect` lors d'une compilation de profil. Le fichier
est ensuite lu normalement ; **la cause exacte Windows reste inconnue**.
Il ne s'agit pas d'un échec d'assertion métier. L'ancien parent quittait à
la première erreur de worker, ce qui empêchait le lot d'aller à son terme.

Correction du lanceur uniquement, sans changement aux politiques simulées :
reprise explicite des checkpoints compatibles ; attente de tous les workers
même si l'un échoue ; fichier `failed.json` si nécessaire ; une seule
nouvelle tentative de compilation pour ce message précis de lecture Windows.
Les autres erreurs ne sont pas réessayées automatiquement.

Validation : huit checkpoints du pilote court réutilisés sans recalcul,
empreintes identiques, audit réussi. Reprise principale lancée à **09:57:20**,
parent **31860**, dix workers, 205 campagnes manquantes au départ.
Journaux distincts : `resume-1-stdout.log` et `resume-1-stderr.log` dans le
dossier `idle-flow-v2`. Les premiers nouveaux runs sont sauvegardés ; le
journal de reprise ne contient alors aucune erreur. Consulter manifest et
completed.json pour le statut terminal, pas les anciens PID.

### Diagnostic à confirmer pour l'ajustement suivant

Le domaine `rollEncounterForgeMaterial` ne fournit plus de scraps ordinaires
à partir de l'étage 25. Le recyclage épique/légendaire n'en restitue pas non
plus, alors que chaque craft en consomme encore 6, 12 puis 18. Ce mécanisme
est vérifié dans le code. L'hypothèse est qu'il contribue au manque tardif de
budget malgré l'accumulation de catalyseurs.

La prochaine sonde doit compter les blocages **par matériau au moment du
refus**, puis tester séparément un retour de scraps sur les recyclages de
haute rareté et une gestion des offres selon leur utilité. Ne pas déduire
le matériau bloquant d'un seul stock final. Tout retour supplémentaire exige
de reprouver l'absence de cycle gratuit, avec et sans préservation.

## Trois profils complets : résultats audités pendant la fin du lot

Le sous-ensemble `complete-three-profiles/` contient exactement 100 seeds
pour baseline, flowLoot et flowEfficient. Ses 300 campagnes atteignent
quatre héros ≥ 40 et passent l'auditeur. Ce sous-ensemble n'atteste pas la
fin du profil flowPlans ni celle du lot parent de 400 campagnes.

| Profil | Heures moyennes | Variation appariée / baseline | Crafts moyens | Maximum de temps sans objet par campagne, moyenné |
| --- | ---: | ---: | ---: | ---: |
| baseline | 9,15 | 0 % | 155,78 | 37,50 min |
| flowLoot | 6,90 | −23,33 % | 398,69 | 6,08 min |
| flowEfficient | 6,72 | −25,37 % | 569,95 | 6,00 min |

Temps moyen entre les jalons du groupe complet, en minutes :

| Profil | 5→10 | 10→15 | 15→20 | 20→25 | 25→30 | 30→35 | 35→40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 13,6 | 30,1 | 45,6 | 64,6 | 89,8 | 125,6 | 139,1 |
| flowLoot | 13,1 | 27,4 | 39,2 | 50,2 | 63,5 | 87,5 | 96,8 |
| flowEfficient | 13,1 | 27,4 | 39,2 | 49,8 | 61,3 | 83,6 | 92,5 |

Dans chacun des trois profils, 35→40 prend plus longtemps que 5→10 pour
**100/100 seeds**. Les moyennes des intervalles s'allongent progressivement.
Ce constat n'affirme pas une courbe monotone pour chaque seed, ni une durée
validée du client. L'accélération totale n'a donc pas effacé cette forme de
ralentissement, mais sa marge acceptable reste ouverte.

Les améliorations de forge dépassent encore largement l'objectif : plage
1–2 dans 71/800 observations de bande pour flowLoot, 63/800 pour
flowEfficient. La préservation fait passer les tentatives 36–40 de 40,2 à
72,5 en moyenne, mais la cadence reste inférieure à celle du milieu de
progression : 58,7 crafts/heure simulée en 36–40 contre 126,9 en 21–25.
Ces cadences sont des moyennes par campagne et incluent le recrutement
partiel dans les bandes initiales ; les gains équipés sont toujours comptés
séparément pour le groupe complet.

Les refus d'offres de rareté passent de 971 à 1 273 avec la préservation,
dont 407 légendaires contre 182. Augmenter le nombre de tentatives ne règle
donc pas automatiquement leur acceptation au bon moment.

L'[analyse de cadence](../../scripts/analyze-loot-idle-cadence.mjs) conserve
les moyennes, médianes, p10/p90 et variations appariées. Elle exige un jeu
de rapports complet et audité et écrit `cadence-analysis.json`.

## Sondes préparées pour le lot suivant

Le [module de budget](../../scripts/helpers/loot-idle-budget.mjs), indépendant
du lot actif, prépare :

- les blocages de démarrage comptés par matériau au moment du refus ;
- un retour minimal de scraps égal au tiers du coût initial de base au
  recyclage ; avec les règles actuelles, seuls épique et légendaire gagnent
  2, 4 ou 6 scraps selon la tranche, les autres retours restent identiques ;
- deux distributions de recherche conservant la puissance des raretés.
  En forge niveau 8 : modérée = 50/30/15/4/1 %, plus rare =
  65/25/8/1,8/0,2 %, dans l'ordre commun à légendaire. Progression depuis
  les chances initiales 72/23/5/0/0, sans introduire une rareté encore
  inaccessible. Ces valeurs sont des hypothèses, pas des objectifs validés.

Le [test dédié](../../scripts/test-loot-idle-budget.mjs) passe : 80 couples
tranche × rareté × préservation consomment strictement des scraps par cycle
craft/recyclage, avec un minimum d'une unité. Cette preuve utilise la
consommation de scraps, pas le total d'unités de matériaux (le recyclage
peut convertir des scraps en plusieurs catalyseurs). Elle ne couvre aucune
conversion future de catalyseurs vers des scraps, absente du domaine actuel.
Le supplément est réconcilié une seule fois dans le bilan de vraies commandes
de recyclage ; l'état source est conservé et le test identifie exactement
un manque de scraps malgré un stock de raffinés disponible.

Ces sondes ont désormais été testées dans les vingt campagnes du
[pilote v3](loot-idle-budget-v3.md). Elles ne prouvent pas encore l'atteinte
de la cible forge : le milieu de progression reste trop généreux et les
résultats tardifs restent dispersés.

## Clôture du lot v2 : 400 campagnes auditées

`completed.json` atteste la fin à `2026-09-06T08:39:55.619Z`, avec
100 arrivées de quatre héros ≥ 40 pour chacun des quatre profils et audit
réussi. Le journal de reprise est resté sans erreur. Les 195 checkpoints
initiaux ont été réutilisés ; 205 runs ont complété le lot. L'incident initial
reste tracé ci-dessus et sa cause Windows précise reste inconnue.

Résultats définitifs, moyennes sur les mêmes 100 seeds :

| Profil | Heures | Variation appariée / baseline | Crafts | Offres refusées, total | Observations dans la cible forge 1–2 / 800 |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline | 9,15 | 0 % | 155,78 | 1 441 | 90 |
| flowLoot | 6,90 | −23,33 % | 398,69 | 971 | 71 |
| flowEfficient | 6,72 | −25,37 % | 569,95 | 1 273 | 63 |
| flowPlans | 6,72 | −25,05 % | 397,72 | 875 | 49 |

Pour flowPlans, 30,88 plans supplémentaires en moyenne, mais seulement
−1,75 % de durée appariée par rapport à flowLoot. L'effet sur les gains
forgés aggrave leur excès. Ce levier n'est donc pas prioritaire pour régler
les écarts actuels. Les refus sont des nombres bruts : leur comparaison
doit aussi tenir compte du nombre d'offres et de leur rareté.

Pour chacun des quatre profils, 35→40 est plus long que 5→10 sur 100/100
seeds. Les moyennes d'intervalles restent progressives. Pour flowPlans :
12,6 ; 26,6 ; 37,3 ; 48,2 ; 62,4 ; 87,7 ; 92,3 minutes, de 5→10 à 35→40.
Les trois autres courbes figurent dans le tableau précédent et sont
confirmées par l'analyse du lot complet.

Conclusion de l'expérience : la boucle loot devient plus régulière, avec
un maximum de période sans objet moyen proche de six minutes, et le
ralentissement des niveaux subsiste. **L'équilibrage forge reste non validé** :
trop d'améliorations et cadence tardive en baisse. Les essais v3 recherchent
des tentatives mieux financées avec des succès puissants moins fréquents.
