# Bestiaire thématique — expérience harness v1

Statut : expérimentation uniquement. Aucun catalogue, contrat, écran, sauvegarde
ou moteur du jeu n'est modifié par cette expérience. Les modifications du dépôt
antérieures à cette expérience restent présentes et ne font pas partie du lot.

## Objectif et méthode

Comparer l'organisation du bestiaire et des profils de combat avec le comportement
actuel, en conservant les vraies résolutions autoritaires, le recrutement progressif,
les coûts de ville, la récupération, le loot et la politique de forge du harness.
La cible du driver reste quatre héros de niveau 40, pas un étage imposé.
Les horaires sont des temps simulés, pas une mesure du temps réel du joueur.

Les quatre variantes emploient exactement la même politique économique :
- baseline : témoin actuel, avec des sondes sans effet sur les règles ;
- bestiaryRegions : noms, régions et transitions uniquement ;
- bestiaryRoles : régions plus profils statistiques et élémentaires ;
- bestiaryRares : rôles plus rencontres rares, de même puissance et récompense réelle.

Les identifiants de régions et d'espèces sont stables et explicites. Les noms sont
des propositions de travail. Les régions ont dix étages, avec deux ambiances de cinq :
1–10 Dessous de la Cité ; 11–20 Racines Affamées ; 21–30 Forges Ensevelies ;
31–40 Nécropole des Serments ; 41–50 Cœur Primordial.
Au-delà de 50, les régions ordinaires reviennent avec un suffixe d'écho.
Les boss canoniques conservent leur nom, puissance, placement et table de butin.

## Catalogue et rôles

Trente espèces ordinaires : six par région. Quatre rôles sont introduits dans la
première moitié, les six sont présents dans la deuxième. Cinq noms rares complètent
le catalogue. Les tirages rares ont une probabilité nominale de 4 % des combats
ordinaires. Aux étages se terminant par 9, une probabilité de 20 % introduit la
famille suivante. Les boss majeurs ne sont jamais remplacés.

Les rôles multiplient les statistiques déjà calculées par le moteur :
- courant : profil conservé ;
- blindé : PV ×1,05, attaque ×0,85, défense physique ×1,30, magique ×0,75 ;
- frappeur : PV ×0,80, attaque ×1,15, défenses ×0,80 ;
- usure : PV ×1,15, attaque ×0,85, défenses ×0,90 ;
- gardien : attaque ×0,95, défense physique ×0,85, magique ×1,25 ;
- chasseur : PV ×0,90, attaque ×1,10, défense physique ×0,85, magique ×0,90.

Frappeurs et gardiens utilisent l'élément régional, les autres le physique.
Les résistances expérimentales remplacent celles du monstre support : 15 % dans
l'élément régional et faiblesse sacrée de 15 % pour la Nécropole ; pas d'immunité.
Ce profil est une hypothèse à mesurer, pas un équilibre approuvé.
L'usure est ici un profil de PV/attaque, pas un poison ni une régénération.

La variante régions seule conserve la distribution statistique du catalogue
historique pour isoler l'effet de l'organisation et vérifier l'injection.
Les variantes de rôles héritent aussi du budget de l'ennemi support : ce n'est
pas encore un remplacement intégral de la normalisation des monstres.

## Idées testées et portée réelle

| Idée | Expérience disponible | Limite |
| --- | --- | --- |
| Régions et deux ambiances | Catalogue, transitions, mesures par région/cycle | Pas de validation visuelle ni de mesure du plaisir |
| Rôles et affinités | Vrais combats modifiés en mémoire | Ni poison, ni invocation, ni nouveau ciblage |
| Rares sans pic de difficulté | Même puissance et récompense que le rôle support | Fréquence et identité seulement |
| Bestiaire à découvrir | Compteurs : résistances connues après 1 victoire, loot connu après 5 | Seuils exploratoires, aucun bonus permanent ni UI |
| Objets signatures | Occasions de récompense après victoire contre un rare | Aucun objet attribué ; puissance et économie non validées |
| Salles exceptionnelles | Comptage thématique des rencontres non combattues existantes | Aucune nouvelle salle à vagues ni logique de récompense |
| Variantes après 50 | Cycle régional et échos ordinaires | Pas de nouveau boss ni corruption mécanique |

Les signatures ne doivent jamais être présentées comme des objets réellement
gagnés. Les compteurs sont séparés du ledger des récompenses autoritaires.

## Exécution

Depuis la racine du dépôt, PowerShell :

~~~powershell
node scripts/test-bestiary-harness.mjs
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=10 --workers=10 --profiles=baseline,bestiaryRegions,bestiaryRoles,bestiaryRares --town=progressive --experiment=bestiary-study-v1
node scripts/analyze-bestiary-harness.mjs test-results/loot-economy/full/bestiary-study-v1/baseline-bestiaryRegions-bestiaryRoles-bestiaryRares-city
~~~

Le pilote utilise 2 seeds et 2 workers sous bestiary-pilot-v1.
Chaque seed est exécutée pour chaque variante. Les compositions résultent des
héros et choix de progression du driver existant, elles sont enregistrées.
Ce n'est pas une matrice exhaustive de compositions physiques/magiques imposées.

Les profils sont compilés par esbuild avec une substitution vérifiée d'une ancre
unique dans scaleMonster. Un changement d'ancre fait échouer la compilation.
Les données sont injectées après le scaling et avant le combat ; aucun fichier
de shared/, src/ ou supabase/ n'est réécrit. La transformation utilise une
sous-séquence dérivée de l'entropie existante et ne consomme aucun tirage gameplay.

Les sorties sont dans test-results/loot-economy/full/<experiment>/<profiles>-city :
manifest, hashes, checkpoints par run, rapports, summary, audit économique,
cadence et bestiary-analysis.json. Un répertoire existant n'est pas écrasé.
Les échecs/limites de progression sont conservés dans les résultats.
L'analyse bestiaire doit réussir en plus de l'audit économique général.

## Critères techniques et lecture des résultats

- Reproductibilité et absence de mutation des entrées.
- Accessibilité des trente espèces sur les étages 1 à 100.
- Boss inchangés et amplitudes des rôles bornées.
- Parité exacte régions seules / témoin pour progression et économie.
- Parité exacte rares / rôles pour durée, défaites et récompenses.
- Conservation de l'or, des matériaux, des rencontres et du temps.
- Comparaison appariée des durées, défaites, repos, régions et compositions.
- Aucun objectif arbitraire de durée, de rendement ou de passages 1–3.

Une hausse de durée accompagnée de nombreuses défaites peut signifier de la
friction, même si toutes les campagnes atteignent leur cible. Le harness ne
permet pas de conclure seul que le rendu est plus intéressant.

## Suites à décider après les résultats

Les extensions ci-dessous restent hors de la preuve de cette première expérience.
Leur clôture exige un nouvel essai comparatif ; elles ne sont pas implicitement
validées par le passage de v1 :
- Signatures réelles : définir bases, affixes, chances et provenance ; vérifier
  le rendement, les améliorations utiles et la conservation du loot.
- Salles spéciales : définir résolution automatique et budgets ; mesurer
  attrition et temps sans interaction manuelle.
- Nouveaux comportements : moteur de statuts ou de ciblage requis ; couvrir
  soft counters, combats interminables et équipes généralistes.
- Bestiaire persistant : contrat de sauvegarde, migration, projection UI ;
  vérifier qu'un replay ne double pas les découvertes.
- Promotion dans le jeu : validation des résultats et du périmètre, mapping de
  régions explicite dans le domaine partagé, compatibilité/replay et contrôle UI.

## Résultats observés — 6 septembre 2026

Campagne bestiary-study-v1 : 10 seeds appariées, 10 processus, 4 variantes,
40/40 campagnes atteignant quatre héros de niveau 40. Le pilote de 8 campagnes
réutilise les deux premières seeds : il ne porte pas l'échantillon à 12 seeds.

| Variante | Durée moyenne simulée | Repos moyen | Défaites de combat moyennes | Objets moyens |
| --- | ---: | ---: | ---: | ---: |
| Témoin | 6,657 h | 0,642 h | 59,6 | 383,5 |
| Régions seules | 6,657 h | 0,642 h | 59,6 | 383,5 |
| Régions + rôles/éléments | 7,304 h | 1,026 h | 92,7 | 394,4 |
| Rôles + rares | 7,304 h | 1,026 h | 92,7 | 394,4 |

La moyenne des variations appariées de durée est +9,827 % ; son étendue va
de -11,335 % à +26,563 %. Les défaites de combat moyennes augmentent de 55,5 %
et le repos moyen de 59,7 %. Ce ne sont pas des seuils d'acceptation.
Le total de défaites du driver comprend aussi les échecs de défis : il est
distinct des défaites de combat présentées ici.

Les runs finissent entre les étages 67 et 76 selon la variante : les cinq régions
et un retour dans les profondeurs sont donc effectivement parcourus.
On observe 7 compositions finales distinctes chez le témoin et 6 avec les rôles.
Les changements de composition font partie du résultat de la politique de
progression ; ils empêchent d'attribuer tous les écarts à un seul élément.

Les rares génèrent 56 à 85 occasions de signature par campagne (moyenne 73,1),
sans aucun objet supplémentaire distribué. Les contrôles prouvent la parité
régions/témoin et rares/rôles sur les données fonctionnelles auditées.
Conservation de l'or, matériaux, rencontres et temps : audits réussis.
Tests de catalogue : 20 000 cas étage/tirage sur les étages 1 à 100.

Conclusion de travail : garder les régions comme base de contenu ; retravailler
les rôles avant toute promotion. Le supplément de durée vient en partie du repos
et des défaites, donc il ne constitue pas en lui-même une amélioration idle.
Prochaine expérience recommandée : séparer profils statistiques et affinités
élémentaires, puis comparer la préparation généraliste aux équipes spécialisées.
La qualité visuelle, le plaisir et la puissance des signatures restent non mesurés.

Rapports :
- [Analyse comparative](../../test-results/loot-economy/full/bestiary-study-v1/baseline-bestiaryRegions-bestiaryRoles-bestiaryRares-city/bestiary-analysis.json)
- [Manifest et hashes de la campagne](../../test-results/loot-economy/full/bestiary-study-v1/baseline-bestiaryRegions-bestiaryRoles-bestiaryRares-city/manifest.json)
- [Rapports par run](../../test-results/loot-economy/full/bestiary-study-v1/baseline-bestiaryRegions-bestiaryRoles-bestiaryRares-city/reports.json)

Après la campagne, un garde-fou sans changement sur ces quatre variantes a été
ajouté : les autres profils de loot restent des témoins si on les mélange à une
expérience de bestiaire. Le test ciblé passe ; les hashes du manifest décrivent
fidèlement la version utilisée pour les 40 campagnes. Une reprise avec le code
modifié exige un nouvel identifiant d'expérience.

## Isolation des facteurs ? campagne v2

Commande PowerShell depuis la racine, autonome et sans service :

~~~powershell
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=10 --workers=10 --profiles=baseline,bestiaryStats,bestiaryElements,bestiaryRoles --town=progressive --experiment=bestiary-factors-v2
~~~

Plan factoriel sur les m?mes 10 seeds, quatre variantes : t?moin ; statistiques seules (PV, attaque, d?fenses) ; ?l?ments seuls (type de d?g?ts et remplacement des r?sistances) ; combinaison v1. Les statistiques seules pr?servent exactement les ?l?ments canoniques, et inversement. Boss et r?compenses inchang?s. Tests cibl?s : 20 000 cas avec r?sistances canoniques non vides, isolation des facteurs et recomposition.

Mesures : dur?e, repos, d?faites de combat, progression, p?riodes sans objet et crafts utiles. Une dur?e sup?rieure ne vaut pas validation idle. L?interaction est calcul?e par seed : combinaison - statistiques - ?l?ments + t?moin. Les recrutements et ?quipements peuvent diverger : cette exp?rience mesure la politique compl?te, sans pr?tendre isoler un effet ? ?quipe fixe. La comparaison g?n?ralistes/sp?cialistes reste diff?r?e ; elle exige des compositions impos?es et une pr?paration ?quivalente, puis la mesure des blocages par r?gion.

### R?sultats v2

40/40 campagnes termin?es, audits du harness et analyse r?ussis. Les 20 runs t?moin/combinaison reproduisent exactement v1 pour dur?e, repos, d?faites, ?tage, objets et ?conomie finale. Le nouveau d?coupage conserve donc le traitement combin? pr?c?dent.

| Variante | Dur?e moyenne | Repos moyen | D?faites combat moyennes | Crafts utiles moyens | Crafts uniques ?quip?s moyens |
| --- | ---: | ---: | ---: | ---: | ---: |
| T?moin | 6,657 h | 0,642 h | 59,6 | 78,3 | 70,4 |
| Statistiques seules | 7,415 h | 1,083 h | 98,2 | 75,6 | 66,7 |
| ?l?ments seuls | 6,940 h | 0,824 h | 75,1 | 73,5 | 65,6 |
| Combinaison | 7,304 h | 1,026 h | 92,7 | 75,4 | 67,3 |

Variations de dur?e appari?es moyennes : statistiques +11,48 %, ?l?ments +4,43 %, combinaison +9,83 %. Les statistiques ajoutent 26,45 minutes de repos sur 45,46 minutes suppl?mentaires moyennes ; les ?l?ments ajoutent 10,91 minutes de repos sur 16,97 minutes suppl?mentaires. Les d?faites de combat augmentent respectivement de 64,8 % et 26,0 %.

Les ?l?ments seuls varient de -16,94 % ? +26,63 % de dur?e selon la seed. L?interaction moyenne est -23,63 minutes : les effets ne sont pas additifs et se compensent partiellement en moyenne, sans garantie individuelle. Les compositions finales divergent ; aucune causalit? par classe ou r?sistance pr?cise ne peut ?tre affirm?e ici.

La moyenne du plus long intervalle sans objet par run reste proche : 5,75 / 5,83 / 5,68 / 5,91 minutes dans l?ordre du tableau. Le maximum observ? atteint toutefois 9,00 minutes avec les ?l?ments, contre 6,42 chez le t?moin. Les crafts utiles et r?ellement ?quip?s diminuent en moyenne. Aucun b?n?fice de rythme idle ne justifie actuellement le co?t suppl?mentaire en repos ; ces dix seeds ne mesurent pas le plaisir ni toutes les ?quipes.

D?cision propos?e : conserver les r?gions ; revoir en premier les budgets statistiques des r?les, puis tester les affinit?s sur des ?quipes g?n?ralistes et sp?cialis?es ? pr?paration ?quivalente. S?parer ensuite changement du type de d?g?ts et remplacement des r?sistances si une attribution ?l?mentaire pr?cise est n?cessaire. Toutes ces suites restent uniquement exp?rimentales tant qu?une promotion dans le jeu n?est pas demand?e.

[Analyse v2](../../test-results/loot-economy/full/bestiary-factors-v2/baseline-bestiaryStats-bestiaryElements-bestiaryRoles-city/bestiary-analysis.json) ? [Manifest v2](../../test-results/loot-economy/full/bestiary-factors-v2/baseline-bestiaryStats-bestiaryElements-bestiaryRoles-city/manifest.json)
