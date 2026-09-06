# Forge idle — pilote budget et recherche de procs, v3

> Rapport historique v3. [Idle-rhythm-v4](loot-idle-rhythm-v4.md) conserve ses
> résultats comme observations et décrit le comportement loot canonique. Les
> variantes de forge et de recyclage restent expérimentales.

Suite du [protocole v2](loot-idle-flow-v2.md), dans le harness uniquement.
Le « go » utilisateur autorise la poursuite de ces expériences ; aucun
changement métier de production, commit, push ou déploiement.

## Problème et hypothèses

Les 300 runs v2 déjà audités montrent davantage d'essais avec le loot
régulier, un ralentissement des niveaux conservé et toujours trop
d'améliorations de forge. Les tentatives par heure baissent en fin de jeu.
Les ressources ordinaires cessent de fournir des scraps après l'étage 24,
et le recyclage épique/légendaire n'en rend pas actuellement.

Le pilote isole le financement des essais de leur probabilité de succès :

| Profil | Différence |
| --- | --- |
| baseline | Témoin historique, loot et coûts actuels |
| budgetControl | flowLoot v2, avec mesure du matériau manquant et du gain relatif d'équipement |
| budgetRecycle | budgetControl + scraps sur recyclage épique/légendaire |
| budgetSearchModerate | budgetRecycle + recherche modérée : chances finales 50/30/15/4/1 % |
| budgetSearchScarce | budgetRecycle + recherche plus rare : chances finales 65/25/8/1,8/0,2 % |

Ordre des chances : commun, inhabituel, rare, épique, légendaire. Départ
72/23/5/0/0 et progression selon le niveau de forge, sans ouvrir de rareté
inaccessible. Les puissances de rareté et les coûts restent identiques.
Pas de préservation supplémentaire ni de plan gratuit dans ce pilote.
Les retours de scraps assurent au moins un tiers du coût initial de base,
soit un supplément actuel de 2/4/6 sur les objets épiques et légendaires.

La forge continue de choisir une recette ayant un gain attendu finançable ;
aucun plafond de succès ni changement du seuil de comptage des équipements.
Le gain relatif est une mesure supplémentaire par rapport à la contribution
de l'équipement du héros, pas une nouvelle définition du succès et pas le
gain total de puissance du groupe. Les projections ne comptent toujours pas
comme équipements réels.

## Validation et exécution

Les cinq pilotes courts passent. Les tests vérifient les probabilités
normalisées et accessibles, 80 cycles consommant strictement des scraps,
le bilan d'une vraie commande de recyclage, l'absence de mutation de sa
source et l'identification exacte du matériau manquant.

Le pilote long prévu contient quatre seeds appariées et quatre workers,
cinq profils, soit vingt campagnes. C'est un filtre de direction ; il ne
remplace pas les 100 seeds de validation d'un candidat retenu.

```powershell
node scripts/test-loot-idle-budget.mjs
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=4 --workers=4 --profiles=baseline,budgetControl,budgetRecycle,budgetSearchModerate,budgetSearchScarce --town=progressive --experiment=idle-budget-pilot-v3
```

Comparer les tentatives par tranche et par heure, les blocages exacts par
matériau, les équipements distincts du groupe de quatre, les refus de procs,
les intervalles de cinq niveaux et les comptes. Vérifier aussi que le
témoin budgetControl reproduit les résultats flowLoot des mêmes seeds.
Le nouveau pilote ne commence qu'après libération des workers du lot v2.

## Limites et clôture

La consommation stricte de scraps exclut un cycle autonome dans les règles
testées ; elle ne couvre pas une éventuelle future conversion inverse des
catalyseurs en scraps. L'acceptation des offres et le classement des recettes
restent ceux du pilote v2, avec ses approximations documentées.

Quatre seeds ne valident ni une moyenne populationnelle ni la cible 1–2.
Retenir une direction seulement si elle améliore les écarts sans rendre
la forge inutile ; ensuite augmenter l'échantillon et régler les paramètres.
L'équilibrage demeure ouvert tant que les objectifs ne sont pas couverts.

État : **20/20 campagnes longues terminées et auditées** le 6 septembre
2026 à 10:42:35 (Europe/Paris), après lancement à 10:38:19 dans les quatre
places libérées par les workers v2. Aucun incident de compilation ou de
simulation. Les deux lots n'ont jamais dépassé dix workers de simulation
simultanés pendant ce lancement. Tous leurs processus sont maintenant finis.

## Résultats du pilote

Les quatre campagnes baseline et les quatre budgetControl reproduisent
exactement leurs témoins v2 : durée, niveaux, étages, défaites, bilans,
passages et rapports de forge. La nouvelle instrumentation ne change donc
pas ces huit trajectoires. Le lot entier passe l'audit de conservation des
comptes, de chronométrie, de matériaux bloquants et d'équipements uniques.

Moyennes sur **quatre seeds seulement** :

| Profil | Heures | Crafts totaux | Crafts 36–40 | Crafts/h en 36–40 | Améliorations 36–40 |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline | 9,34 | 153 | 6,5 | 3,34 | 4,25 |
| budgetControl | 7,51 | 391,5 | 35,75 | 27,47 | 7 |
| budgetRecycle | 7,40 | 443,75 | 57,75 | 45,76 | 10,75 |
| budgetSearchModerate | 8,33 | 419,25 | 61 | 38,37 | 2,5 |
| budgetSearchScarce | 8,91 | 417,5 | 66 | 37,39 | 1,75 |

Le compteur au moment des refus confirme le manque de scraps : sur les
quatre témoins budgetControl, 4 302 vérifications bloquées par les scraps,
17 par les raffinés. Un même refus peut citer plusieurs matériaux : ces
nombres ne sont pas des catégories mutuellement exclusives. Le retour de
scraps augmente bien les occasions tardives, mais accroît seul l'excès de
gains équipés.

La variante la plus rare sépare mieux essais et améliorations tardives.
**Sa moyenne de 1,75 ne valide pas la cible** : les quatre seeds donnent
respectivement **0, 2, 3 et 2** améliorations en 36–40. Les bandes 11–15 et
16–20 donnent encore 7,75 et 7,25 améliorations en moyenne. La plage 1–2
n'est atteinte que dans 7/32 observations campagne × bande.

Les refus de rareté sont respectivement 73, 76, 28 et 18 sur les quatre
profils budget ; aucune offre légendaire refusée dans le dernier pilote,
mais un échantillon et un nombre d'offres faibles ne prouvent pas un
financement universel. Dans chacun des cinq profils, les quatre seeds ont
un intervalle 35→40 plus long que 5→10.

## Décision et prochain réglage

Conserver comme direction expérimentale le financement des essais par le
recyclage et des procs puissants moins fréquents. Ne pas retenir le recyclage
seul comme équilibrage complet. Ne pas abaisser la puissance des raretés
pour corriger un problème de fréquence, ni masquer les petits gains en les
retirant du décompte existant.

Prochain réglage : étudier les améliorations des bandes 6–25 par rareté et
par niveau d'objet, ajuster la courbe de probabilité dès ces bandes, puis
tester le candidat retenu sur 100 seeds appariées avec dix workers. Mesurer
aussi les tranches sans amélioration et la dispersion : une moyenne seule
ne ferme pas le sujet. La marge de durée demeure une décision produit à
fixer ; aucune valeur chiffrée n'est supposée validée.

Preuves : `test-results/loot-economy/full/idle-budget-pilot-v3/baseline-budgetControl-budgetRecycle-budgetSearchModerate-budgetSearchScarce-city/`,
fichiers `completed.json`, `analysis.json`, `cadence-analysis.json` et
`reports.json`. Les scripts et la documentation sont les seuls changements
de ce sous-lot. L'équilibrage de production reste **non validé**.
