# CI qualité et simulations

La CI qualité protège les changements sur PR et push vers main/staging.
Elle peut également être lancée manuellement. Les calibrations statistiques
et campagnes complètes sont des outils d'équilibrage séparés.

## Régressions à chaque changement

`vitest.config.ts` sélectionne tous les tests sauf les cinq suites explicites
de `scripts/simulation-tests.ts`. Les petits tests nommés Simulation
(compatibilité des sauvegardes, équipements, immigration, bootstrap) restent
dans la qualité. Les tests fonctionnels des affinités restent eux aussi actifs.
Toute nouvelle campagne coûteuse doit être ajoutée à cette liste ; un nom
contenant Simulation ne suffit pas à décider de son exclusion.

Le workflow `CDIdle quality` exécute les audits, le typage, le lint, puis les
tests avec couverture une seule fois. Les seuils existants dans
`scripts/check-coverage-thresholds.mjs` et les sources mesurées sont conservés.
Le build et son budget précèdent le démarrage de Supabase, puis les tests DB,
le smoke navigateur et l'audit des dépendances de production.

Une erreur fait échouer le job ; aucun contrôle n'est rendu facultatif.
Le job est limité à 20 minutes, les tests instrumentés à 5 minutes,
le démarrage Supabase à 5 minutes et son nettoyage à 2 minutes.
Un nouveau run remplace l'ancien sur la même référence Git.
Les artefacts de couverture et les diagnostics navigateur restent disponibles.

Commandes PowerShell :

```powershell
npm.cmd test -- --run
npm.cmd run test:coverage
npm.cmd run check:coverage
```

La deuxième commande exécute déjà les tests : la CI et `npm.cmd run check`
ne la précèdent donc plus d'une exécution identique sans couverture.

## Équilibrage à la demande

`vitest.simulation.config.ts` sélectionne uniquement :

- la distribution complète des 10 000 Novices ;
- la comparaison des courbes XP historiques ;
- la campagne canonique jusqu'au niveau héros 40 ;
- les matrices tactiques de combat ;
- les distributions des défis.

Les assertions et tailles d'échantillon sont conservées. Ces suites tournent
sans instrumentation de couverture, avec deux workers au maximum.
La calibration des Novices dispose de 60 secondes ; les campagnes conservent
leurs limites propres. Aucun changement de règles métier n'est requis.

```powershell
npm.cmd run test:simulations
npm.cmd run test:class-calibration
npm.cmd run test:combat-simulation
npm.cmd run test:item-progression
npm.cmd run test:forge-progression
```

Le workflow manuel `CDIdle simulations` propose trois choix : `simulations`
(les cinq suites), `item-progression` ou `forge-progression`.
Il est limité à 30 minutes, sans service Supabase ni navigateur.
Les deux harnesses complets gardent 100 seeds distinctes, réparties en deux
processus de 50 sur GitHub ; leur répartition locale par défaut reste 10 × 10.
Le log est archivé 14 jours même en cas d'échec et le code de sortie npm
reste bloquant malgré l'archivage par tee.

Ce workflow ne se déclenche ni sur chaque push ni sur un calendrier.
Le lancer pour valider une modification d'équilibrage avant publication,
en suivant les objectifs décrits dans les
[harnesses XP/objets/Forge](hero-xp-progression-simulation.md).
Il ne remplace pas les régressions de commandes ni les tests DB.

## Incident ayant motivé la séparation

Le run qualité 33916635632 du commit 146e559 a échoué sous couverture :
la calibration des 10 000 Novices a duré 15,237 s pour une limite de 15 s.
Le job avait déjà passé environ 3 min 13 s sur une première exécution de la
suite, puis environ 3 min 57 s sur la même suite instrumentée.
La séparation retire ce travail de calibration du chemin de validation courant.

Validation locale du 5 septembre 2026 : 841 tests dans 113 fichiers qualité
passent avec couverture (environ 26 secondes jusqu'à la fin des tests).
Les 14 tests des cinq suites de simulation passent séparément (108 secondes).
Les 855 tests antérieurs sont donc conservés. Couverture des lignes :
domaine 95,00 %, game-api 92,89 %, avec tous les seuils existants respectés.
Le typage, le lint, la syntaxe YAML et la sélection disjointe des suites passent.
Ces durées locales ne constituent pas une mesure du runner GitHub.

Références : [sélection des tests Vitest](https://vitest.dev/config/exclude),
[déclenchement manuel GitHub Actions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).
