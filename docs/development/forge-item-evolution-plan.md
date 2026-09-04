# Plan consolidé — refactor Forge et évolution des objets

## Statut et objectif

Ce document conserve le plan d'exécution de la refonte Forge et ses critères.
Les règles ont été raccordées au runtime et le harness final a été validé sur
100 seeds le 4 septembre 2026. Le lot raccorde la Forge au catalogue
d'objets évolutifs 1–40 sans modifier les courbes XP, la difficulté des défis,
les récompenses de recrutement ou les cadeaux de rank-up.

Le moteur de nommage dynamique et le contenu supérieur au niveau 40 restent
hors périmètre. Leur ajout devra utiliser les extensions prévues ici sans
condition spéciale dans l'autorité ou React.

## Décisions produit figées

1. Une Forge de niveau N ouvre une tranche de cinq niveaux d'objet.
2. L'étage atteint autorise une amélioration du bâtiment ; il ne l'applique
   jamais gratuitement. Le joueur paie par la commande commune
   building.upgrade.
3. Le joueur choisit la recette et la tranche ; le niveau exact est tiré
   uniformément dans cette tranche au forge.start.
4. Les six plans initiaux ouvrent les bases évolutives épée, dague, hache,
   bouclier, tissu et cuir. Les 131 plans historiques rejoignent exhaustivement
   l'une des 48 familles évolutives sans transformer les objets déjà possédés.
5. Les autres plans sont des récompenses aléatoires indépendantes sur les boss
   majeurs et les événements coffre, sans garantie ni pity.
6. Un jet de plan dont le pool éligible est vide ne donne rien.
7. Les signatures futures conservent deux jets indépendants : objet et plan.
8. Le proc de qualité dépend du niveau de Forge et peut atteindre épique ou
   légendaire. Une recette ne peut jamais produire sous sa rareté minimale.
9. Une offre supérieure est persistée dans la preview. Le joueur peut la
   refuser ou payer son coût et choisir le bonus compatible.
10. Annuler une preview ne rembourse pas le coût de fabrication, conformément
    au comportement actuel.

## Résultat du harness à reprendre

Commande de référence :

    npm.cmd run test:forge-progression

Validation du 4 septembre 2026 : 100 seeds distinctes, réparties en dix
processus de dix.

| Objectif | Résultat | Seuil |
|---|---:|---:|
| Campagnes atteignant le niveau 40 | 100 % | 100 % |
| Campagnes atteignant Forge 8 | 100 % | 100 % |
| Campagnes possédant un plan évolutif | 100 % | au moins 95 % |
| Craft utile précoce, tranche 1–5 | 100 % | au moins 80 % |
| Craft utile précoce, tranches suivantes | 94 à 100 % | au moins 90 % |

Les médianes des niveaux héros 10, 20, 30, 35 et 40 sont
261 / 918 / 1 878 / 2 644 / 3 652 explorations. Les médianes d'achat Forge
1 à 8 sont 51 / 140 / 276 / 626 / 1 027 / 1 532 / 2 207 / 2 930. Le coffre
produit 550 plans sur 11 642 jets éligibles, soit 4,72 %, et les boss en
produisent 29. La médiane finale est de 12 plans évolutifs connus.

Un craft utile est un objet dont le gain d'équipement est positif au niveau où
il devient équipable. L'équipement immédiat reste une mesure séparée : le
confondre avec l'utilité contredirait le tirage uniforme d'un niveau dans une
tranche de cinq.

La croissance de coût de bâtiment ×1,65 a été rejetée pendant la calibration :
une seed sur 100 terminait niveau 40, étage 68, avec Forge 7. Les coûts exacts
issus du candidat ×1,60 sont désormais persistés dans la source partagée et
passent les 100 seeds sans abaisser les prérequis d'étage.

## Écarts vérifiés avant implémentation

| Priorité | Écart initial | Conséquence |
|---|---|---|
| P1 | La Forge est plafonnée à 1 dans shared/data/buildings.ts. | Les tranches 6–40 ne sont pas accessibles normalement. |
| P1 | Les coûts, maxima et prérequis des bâtiments sont répartis entre catalogue, switches et maps. | Un prérequis différent par niveau ne peut pas être exprimé proprement. |
| P1 | building.upgrade vérifie le prérequis une fois avant un lot multi-niveaux. | Un lot pourrait franchir un palier Forge sans valider l'étage de chaque niveau cible. |
| P1 | Les six plans initiaux ciblent encore des objets legacy fixes niveau 1. | La Forge ne dispose pas d'une progression fiable après la première tranche. |
| P1 | Le proc runtime reste 85/13/2 et son contrat est limité à none/uncommon/rare. | Les offres épique et légendaire validées sont impossibles. |
| P1 | Les coûts Forge et le recyclage utilisent actuellement l'indice linéaire de tranche. | Ils ne correspondent pas au candidat économique validé. |
| P1 | Les coffres ne tirent aucun plan. | La seconde source de découverte décidée est absente. |
| P2 | Le catalogue ne porte pas de politique de découverte distincte de levelRange. | Les futurs objets ne peuvent pas définir proprement leur calendrier et leur source. |
| P2 | Le harness Forge simule encore directement les règles runtime absentes. | Il valide les paramètres, pas encore leur intégration autoritaire finale. |
| P2 | La documentation Forge décrit encore les anciennes règles. | Code, contrat et documentation divergent volontairement tant que le lot n'est pas réalisé. |

Les métadonnées itemLevel/powerModelId obligatoires et le snapshot SQL du
catalogue v3 sont déjà traités dans le lot objets précédent.

## Modèle cible partagé

### Registre des bâtiments

Créer une définition typée unique par bâtiment contenant :

- identité, nom, description, catégorie, icône et bonus de présentation ;
- niveau maximal ;
- coût exact de chaque niveau cible ;
- prérequis de construction ;
- prérequis additionnels de chaque niveau cible.

BUILDINGS_LIST, createInitialBuildingLevels, getBuildingMaxLevel,
getBuildingUpgradeCost, checkBuildingUnlocked et la présentation doivent être
dérivés de ce registre. Les valeurs de tous les bâtiments hors Forge restent
strictement identiques.

La commande building.upgrade conserve son contrat et son atomicité. Pour un lot
de plusieurs niveaux, elle valide dans la boucle chaque niveau cible, son
prérequis et son coût avant de retourner le nouvel état. Un échec à n'importe
quel palier annule tout le lot.

### Progression Forge

Créer une source partagée FORGE_PROGRESSION_LEVELS consommée par le registre
des bâtiments, l'autorité Forge, la présentation, les tests et le harness.

| Forge cible | Tranche ouverte | Étage requis pour l'upgrade |
|---:|---:|---:|
| 1 | 1–5 | 3, avec Campement 1 et Mine 1 |
| 2 | 6–10 | 8 |
| 3 | 11–15 | 11 |
| 4 | 16–20 | 18 |
| 5 | 21–25 | 26 |
| 6 | 26–30 | 36 |
| 7 | 31–35 | 49 |
| 8 | 36–40 | 62 |

Forge 1 conserve donc les prérequis de construction actuels. Les étages 8 à 62
ne font qu'autoriser les upgrades suivants.

Les coûts validés sont stockés explicitement, sans recalcul flottant runtime :

| Forge cible | Or | Nourriture | Bois | Pierre | Minerai |
|---:|---:|---:|---:|---:|---:|
| 1 | 600 | 150 | 450 | 300 | 250 |
| 2 | 600 | 150 | 450 | 300 | 250 |
| 3 | 960 | 240 | 720 | 480 | 400 |
| 4 | 1 540 | 385 | 1 155 | 770 | 645 |
| 5 | 2 460 | 615 | 1 845 | 1 230 | 1 025 |
| 6 | 3 935 | 985 | 2 950 | 1 970 | 1 640 |
| 7 | 6 295 | 1 575 | 4 720 | 3 150 | 2 625 |
| 8 | 10 070 | 2 520 | 7 550 | 5 035 | 4 195 |

### Capacité de recette

Une fabrication exige simultanément :

1. une famille évolutive active, forgeable et publiable ;
2. un plan connu ;
3. une tranche ouverte par le bâtiment ;
4. une intersection non vide entre la tranche choisie et levelRange.

Une base `level-bands-v1` connue une fois reste disponible dans toutes les
tranches ouvertes. Les modèles `legacy-fixed-v1` restent autoritaires pour les
instances existantes, les cadeaux explicites et les previews déjà payées ; ils
ne constituent plus une seconde liste de nouvelles recettes. Le niveau du
héros reste uniquement une restriction d'équipement, jamais une restriction de
fabrication.

### Économie des matériaux

Le coût de base d'un craft reste 6 débris métalliques et 1 métal raffiné.
Craft, acceptation d'une qualité et recyclage utilisent tous le même
multiplicateur par tranche :

| Forge | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Multiplicateur | 1 | 1 | 2 | 2 | 2 | 2 | 3 | 3 |

Cette symétrie est obligatoire. Conserver le recyclage linéaire avec les
nouveaux coûts ouvrirait une boucle de matériaux rentable sur les hautes
raretés.

Coûts de base d'acceptation, avant multiplicateur :

| Offre acceptée | Coût |
|---|---|
| Inhabituelle | 2 métaux raffinés |
| Rare | 4 métaux raffinés + 1 fragment enchanté |
| Épique | 4 fragments enchantés + 1 noyau arcanique |
| Légendaire | 4 noyaux arcaniques + 1 essence légendaire |

Les rendements de recyclage existants sont conservés comme bases, puis soumis
au même multiplicateur 1/1/2/2/2/2/3/3. Ajouter un test exhaustif prouvant
qu'aucun cycle craft → acceptation → recyclage ne crée de matériau net.

### Proc de rareté

| Forge | Commune | Inhabituelle | Rare | Épique | Légendaire |
|---:|---:|---:|---:|---:|---:|
| 1 | 72 % | 23 % | 5 % | 0 % | 0 % |
| 2 | 62 % | 29 % | 8 % | 1 % | 0 % |
| 3 | 50 % | 34 % | 13 % | 3 % | 0 % |
| 4 | 38 % | 38 % | 19 % | 5 % | 0 % |
| 5 | 28 % | 38 % | 26 % | 7 % | 1 % |
| 6 | 18 % | 34 % | 35 % | 11 % | 2 % |
| 7 | 10 % | 27 % | 40 % | 19 % | 4 % |
| 8 | 5 % | 20 % | 40 % | 28 % | 7 % |

Les tables doivent sommer exactement à 100 et être testées à chaque frontière
de tirage. La rareté proposée est max(rareté minimale, rareté tirée).

### Preview persistée

Remplacer le champ ambigu upgradeProc par offeredRarity dans
CanonicalPendingForge. Il contient toujours la rareté finale proposée,
y compris lorsqu'elle égale la rareté minimale. La disponibilité d'une
amélioration se déduit de la comparaison des rangs.

forge.start doit, dans cet ordre :

1. valider bâtiment, plan, tranche, recette, absence de preview et matériaux ;
2. tirer et persister offeredRarity ;
3. tirer et persister itemLevel ;
4. consommer le coût de craft ;
5. produire une preview et un événement complets.

Un refus avant les tirages ne consomme ni RNG ni ressource. forge.finalize et
forge.cancel ne consomment aucun RNG supplémentaire. Le replay du même envelope
restitue la même preview ou le même résultat sans duplication.

## Découverte des plans et objets futurs

Ajouter au modèle catalogue une politique typée distincte de levelRange :

- initial ;
- random-drop avec sources boss et/ou treasure ;
- bornes d'étage indépendantes ;
- poids ;
- identifiants de boss optionnels pour une signature.

Les six bases initiales sont :

| Plan historique | Plan évolutif |
|---|---|
| starter_sword | progression_sword |
| quick_dagger | progression_dagger |
| woodcutter_axe | progression_axe |
| wooden_shield | progression_shield |
| traveler_clothes | progression_cloth_armor |
| simple_leather_armor | progression_leather_armor |

Les 42 autres bases génériques sont random-drop, sources boss et treasure,
poids standard, sans garantie. Les signatures futures déclarent leurs boss et
leurs poids propres. Les récompenses de vocation/recrutement restent vocation
et n'obtiennent pas implicitement de recette.

Centraliser un rollBlueprintReward pur qui :

- filtre statut actif, provenance Forge, politique, source, étage et boss ;
- exclut les plans déjà connus ;
- effectue un seul tirage de déclenchement puis un tirage pondéré si le pool
  n'est pas vide ;
- ne produit aucun remplacement lorsque le pool est vide ;
- ajoute au plus une entrée dédupliquée.

Les boss majeurs conservent leur chance actuelle de 5 %. Chaque événement
treasure victorieux effectue un jet indépendant de 5 %, après ses jets d'objet
et de matériau. Ajouter ce tirage à la fin limite les changements d'ordre RNG
au strict nécessaire. Objet et plan d'une signature restent deux jets séparés.

## Migration canonique et backfill SQL

La modification de pendingForge et des plans initiaux impose un état canonique
v4. Ne pas réécrire la migration v3 historique.

Ajouter une migration TypeScript v3 → v4 qui :

1. passe stateVersion à 4 ;
2. remplace chacun des 131 identifiants de plans historiques par sa famille
   parmi les 48 équivalents évolutifs ;
3. fusionne les doublons en conservant unlocked=true si une occurrence l'est ;
4. initialise les six plans évolutifs si la liste est absente ou vide ;
5. convertit une preview existante :
   none devient la rareté minimale de sa recette, uncommon/rare sont conservés
   dans offeredRarity ;
6. laisse intacts les objets déjà créés, équipés ou stockés ;
7. laisse une preview legacy déjà payée finalisable avec sa recette originale.

Ajouter une nouvelle migration SQL additive pour public.games, déjà autorisée
par l'utilisateur, avec la même transformation JSON. Elle doit être idempotente
et ne toucher ni révision, ni RNG, ni inventaire hors des champs décrits.

Les tests DB doivent couvrir état v3 complet, liste vide, doublons, les 131 plans
historiques, plans supplémentaires, preview none/uncommon/rare, second passage
identique et lignes déjà v4.

## Lots d'implémentation et portes de validation

### Lot A — registre partagé des bâtiments

Fichiers principaux : shared/data/buildings.ts,
supabase/functions/game-api/town-command-handlers.ts, présentation ville et
tests de parité.

- Introduire le registre typé et convertir mécaniquement toutes les valeurs.
- Ajouter les prérequis par niveau cible.
- Conserver les exports publics nécessaires pendant la transition.
- Supprimer switches et maps devenus morts après vérification par rg.

Porte A : snapshots maxima/coûts/prérequis identiques pour tous les bâtiments
hors Forge ; upgrades simples et groupés atomiques ; typecheck et tests ville
verts.

### Lot B — source Forge partagée et capacité 1–8

- Ajouter FORGE_PROGRESSION_LEVELS et les coûts exacts.
- Porter la Forge à 8.
- Faire appliquer chaque prérequis d'étage par building.upgrade.
- Remplacer les constantes copiées dans présentation et tests.

Porte B : table de vérité 0→8, refus avant étage, réussite après étage, paiement
exact, maximum 8, refus niveau 9 et lots traversant plusieurs prérequis.

### Lot C — état v4 et reprise des plans initiaux

- Étendre contrats et validateurs avec offeredRarity.
- Ajouter migration TypeScript v3→v4.
- Ajouter backfill SQL public.games et pgTAP.
- Mettre à jour initialTownState et la source des plans par défaut.

Porte C : migration TS/SQL paritaire, idempotente, previews historiques
finalisables, inventaire et cadeaux recrutement/rank-up inchangés.

### Lot D — autorité Forge et économie

- Centraliser tables de rareté, coûts et multiplicateurs dans le domaine
  partagé.
- Appliquer la capacité `level-bands-v1` et refuser un nouveau craft fixe
  legacy tout en préservant la finalisation d'une preview historique.
- Étendre acceptation à épique/légendaire.
- Préserver atomicité, anti-reroll, identité déterministe et ordre RNG.
- Aligner le recyclage et fermer toute boucle économique positive.

Porte D : tests de frontières RNG, minimum de recette, tranche verrouillée,
niveau exact, coûts/refus, cancel, finalize, replay et arbitrage exhaustif.

### Lot E — politiques de découverte et récompenses

- Ajouter la politique typée au catalogue et son validateur.
- Extraire rollBlueprintReward.
- Brancher boss puis treasure sans dupliquer la logique.
- Préserver les jets indépendants des signatures.

Porte E : initial/random, boss/coffre, pool borné, doublon, pool vide, contenu
inactif, boss incorrect, replay et ordre RNG couverts.

### Lot F — présentation

- Afficher Forge 1–8, tranche ouverte, prochaine tranche, étage et coût.
- Distinguer plan inconnu, Forge insuffisante et matériaux insuffisants ; le
  niveau du héros reste une information d'équipement, pas un verrou de craft.
- Afficher niveau exact et qualité offerte depuis la preview canonique.
- Permettre accepter/refuser jusqu'à légendaire et filtrer les bonus compatibles.
- Garder tous les modèles de présentation hors des composants React.

Porte F : tests de présentation et composants, responsive structurel, aucune
formule métier dans React. Le contrôle visuel reste à effectuer par
l'utilisateur.

### Lot G — remplacement du candidat de harness

- Remplacer dans forgeProgressionCandidate.ts les mutations simulées par
  applyTownCommand et les sources partagées réelles.
- Conserver seulement la stratégie du groupe : allocation, choix de recette,
  plafond de huit essais, acceptation rentable, recyclage et équipement.
- Vérifier que chaque état mesuré est produit par une commande autoritaire.
- Supprimer les constantes expérimentales dupliquées.

Porte G : les mêmes 100 seeds respectent les seuils validés ; le harness
XP/objets canonique reste vert et ses courbes ne sont pas relâchées.

### Lot H — documentation et audit pré-publication

Mettre à jour :

- docs/architecture/forge-domain.md ;
- docs/architecture/api-command-contracts.md ;
- docs/architecture/item-catalog.md et sa matrice générée ;
- docs/development/canonical-state-migrations.md ;
- docs/development/hero-xp-progression-simulation.md.

Refaire ensuite l'audit Forge ↔ bâtiments ↔ objets ↔ XP : critères, oublis,
compatibilité front, code mort, absence de refactor collatéral et parité
TypeScript/SQL.

## Matrice minimale de tests

| Risque | Preuve obligatoire |
|---|---|
| Régression bâtiments | Snapshot de tous les coûts, maxima et prérequis hors Forge |
| Contournement d'étage | Upgrade simple et multi-niveaux avant/après chaque seuil |
| Tranche interdite | Forge N accepte sa tranche et refuse N+1 |
| Legacy haut niveau | Forge ceil(requiredLevel/5) exigée |
| Anti-reroll | Même commande/replay, même preview, aucun RNG au finalize |
| Atomicité | État, ressources et RNG inchangés après chaque refus |
| Qualité | Frontières des huit tables, rareté minimale, épique/légendaire |
| Économie | Aucun cycle craft/acceptation/recyclage positif |
| Plans | Initial, boss, coffre, doublon, pool vide, signature indépendante |
| Migration | v3→v4 TS, SQL, idempotence, previews en attente |
| Compatibilité | Recrutement et rank-up inchangés |
| Présentation | États verrouillés et preview complète |
| Statistique | Harness 100 seeds, dix processus de dix |

Commandes finales prévues :

    npm.cmd test
    npm.cmd run typecheck
    npm.cmd run lint
    npm.cmd run build
    npm.cmd run test:state-simulation
    npm.cmd run test:item-progression
    npm.cmd run test:forge-progression

Ajouter le contrôle des migrations et pgTAP selon les commandes déjà
documentées dans le dépôt.

## Validation réalisée

Validation locale finale du 4 septembre 2026 :

- suite Vitest : 117 fichiers, 855 tests réussis ;
- typecheck, lint, build, catalogue généré, déterminisme, secrets, budget de
  bundle et sécurité des migrations : réussis ;
- pgTAP : 10 fichiers, 184 tests réussis ;
- migrations TypeScript et SQL : mapping exhaustif des 131 plans vers 48
  familles, parité et idempotence réussies ;
- harness Forge : 100 seeds en 10 processus de 10, tous les objectifs réussis ;
- harness objets/XP : 100 seeds en 10 processus de 10, médiane niveau 40 à
  3 711 explorations et réussite globale des défis à 66,65 %.

Le contrôle visuel reste à effectuer par l'utilisateur conformément aux règles
du projet ; aucun navigateur n'a été ouvert pendant cette validation.

## Critères de clôture

- Les huit niveaux de Forge sont atteignables uniquement par
  building.upgrade et leurs coûts/prérequis partagés.
- Aucun objet ne peut être découvert, forgé ou équipé hors de sa politique,
  de son plan, de sa tranche ou de son niveau.
- Les previews v3 restent migrables et finalisables sans reroll.
- Les 131 plans historiques rejoignent exhaustivement les 48 familles
  évolutives sans transformer les objets historiques possédés.
- Boss et coffres utilisent le même moteur de plans, sans doublon, garantie ou
  compensation de pool vide.
- Épique et légendaire sont produits, acceptés, refusés et recyclés sans
  arbitrage positif.
- Le harness final n'embarque plus de copie des règles Forge.
- Les 100 seeds passent les seuils validés et la médiane niveau 40 reste sous
  4 000 explorations.
- Suite complète, typecheck, lint, build, migrations, pgTAP et documentation
  sont verts et cohérents.
