# Calibration du loot et de l'économie — 5 septembre 2026

> Rapport historique. Les critères produit de ce document sont remplacés par
> [idle-rhythm-v4](loot-idle-rhythm-v4.md), qui contient les résultats audités
> et l'implémentation loot retenue. Les mesures ci-dessous restent valides dans
> le contexte et avec le hash de leur campagne.

## Statut et objectif

Diagnostic, pas une règle de production validée. Comparer le renouvellement
des équipements de quatre héros, les matériaux et l'or avec la cible idle :
récompenses fréquentes, rareté toujours explosive, progression perceptible
et forge utile. Aucune sauvegarde, migration SQL ou règle runtime modifiée.

Contexte testé : HEAD `e3f88b0`, avec le travail local de présentation/nommage
déjà présent ; Node `v24.18.0`. Les résultats ne décrivent donc pas un checkout
propre de ce seul commit.

## Exécution et dépendances

Depuis la racine, dans PowerShell, avec les dépendances npm installées :

```powershell
node --check scripts/run-loot-economy-harness.mjs
node scripts/run-loot-economy-harness.mjs --stage=early --seeds=100 --workers=10 --profiles=baseline,steady,generous,balanced
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=100 --workers=10 --profiles=baseline,balanced
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=100 --workers=10 --profiles=lootOnly
```

Le script utilise Node et `esbuild`, disponible dans l'installation du projet
via Vite. Aucun navigateur, Supabase, Docker ou accès réseau requis. C'est une
calibration manuelle coûteuse, pas un test à ajouter à la CI qualité.

`early` s'arrête à l'arrivée à l'étage 8. `full` attend que les quatre héros
aient atteint le **niveau 40**, et non l'étage 40. Certains héros peuvent
dépasser 40 pendant que les autres les rattrapent. Limites de sécurité :
12 000 explorations et 15 000 itérations ; consulter `finished` et `blocked`
avant de conclure. Dix workers traitent chacun dix seeds par profil.

Sorties ignorées par Git :
`test-results/loot-economy/<stage>/<profils-joints-par-tirets>/` contient
`worker-N.json`, `reports.json` et `summary.json`. Relancer une même combinaison
remplace ses sorties ; ne pas lancer deux fois cette combinaison simultanément.

## Ce qui est réel, ce qui est simulé

Le script bundle `tests/helpers/heroXpTier1Campaign.ts` et
`tests/helpers/forgeProgressionCandidate.ts`. Les adaptations et sondes restent
en mémoire. Chaque remplacement exige une ancre unique : un changement du
code source provoque un arrêt explicite plutôt qu'une calibration silencieuse
sur un autre comportement.

Combat, défis, XP/XP nécessaire, récupération, progression des étages, catalogue,
stats et raretés, plans, achats de Forge et commandes de craft/recyclage restent
ceux du domaine autoritaire. Les quatre novices sont générés à partir de chaque
seed ; les vocations et équipements sont gérés par le pilote existant.

Les mêmes 100 seeds (`0x515050` à `0x515050 + 99`) sont réutilisées entre
profils, pas 100 fois la même équipe. Le loot ajouté utilise un flux RNG
déterministe séparé par seed et exploration. Les combats ne sont pas mockés ;
leurs trajectoires peuvent diverger une fois l'équipement changé. Ce n'est pas
une garantie de rencontres identiques entre deux profils.

Gestion commune à **tous** les profils, témoin compris :

- Forger au plus toutes les huit explorations, sans arrêt après le premier
  craft utile ; plafond de 32 crafts par tranche au lieu de 8.
- Utiliser les seules recettes connues et les commandes réelles, avec leurs
  coûts, prérequis et acceptations/refus de rareté.
- Optimiser l'équipement, puis recycler le surplus actuellement utilisable ;
  conserver les objets dont le niveau dépasse celui du héros le moins avancé.

Limites : quatre héros et des bâtiments de classe/production sont préinstallés
gratuitement. Le pilote paie les améliorations de Forge, pas toutes les dépenses
de recrutement, de construction et de gestion de ville. Il recycle activement,
ne réserve pas toutes les alternatives de builds et ne représente pas un joueur
inactif ou débutant. Un surplus sous ce pilote n'est pas une preuve que tous les
styles de jeu ont trop de ressources. Le plafond et la sélection des recettes
limitent aussi la demande de crafts.

## Variantes

Les probabilités ci-dessous concernent les victoires. Le témoin conserve les
règles actuelles : pas d'objet sur combat ordinaire/élite, coffre donnant or
OU objet à 50/50, tables de boss existantes.

| Profil | Objet combat ordinaire | Scraps ajoutés | Coût initial de craft | Or répétable |
|---|---:|---|---|---|
| `baseline` | 0 % | Aucun | 6 scraps + 1 raffiné | Inchangé |
| `steady` | 20 % | 1 par combat gagné | 6 scraps | Inchangé hors coffre |
| `generous` | 35 % | 2 par combat gagné | 6 scraps | +25 %, hors premier clear |
| `balanced` | 20 % | 3 par élite/boss gagné | 6 scraps | Inchangé hors coffre |
| `lootOnly` | 20 % | Aucun | 6 scraps + 1 raffiné | Inchangé hors coffre |

Dans les quatre candidats, élite/boss gagné donne au moins un objet ; un coffre
donne un objet **et** de l'or. Les récompenses de boss déjà présentes sont
conservées. Les matériaux et plans existants ne sont pas retirés. Les coûts et
scraps ajoutés sont multipliés par la tranche comme dans le domaine ; les
surcoûts d'acceptation de rareté restent inchangés.

Les objets ajoutés réutilisent les tranches, pools et poids de rareté des
coffres. C'est une hypothèse expérimentale : leur provenance est `chest` dans
la résolution du catalogue. Une implémentation devra définir explicitement
les sources combat/élite, intégrer leur RNG autoritaire et leurs événements.

## Résultats des premiers profils

400 campagnes courtes (100 par profil), puis 200 campagnes complètes
(`baseline` et `balanced`, 100 chacune). Toutes ont atteint leur cible.
Valeurs médianes, sauf mention contraire ; les colonnes ne décrivent pas
nécessairement la même seed.

À l'arrivée à l'étage 6, après environ 75–76 explorations :

| Mesure | Actuel | Steady | Generous | Balanced |
|---|---:|---:|---:|---:|
| Objets lootés, hors cadeaux/crafts | 1 | 16 | 20 | 16 |
| Scraps lootés bruts | 40 | 84 | 129 | 54 |
| Scraps en stock après gestion | 29 | 102 | 158 | 72 |
| Métal raffiné en stock | 8 | 14 | 16 | 14 |
| Or gagné brut | 898 | 912 | 984 | 912 |
| Or restant | 358 | 372 | 443 | 372 |
| Crafts réalisés | 4 | 3 | 3 | 3 |
| Crafts immédiatement équipés | 3 | 1 | 1 | 1 |
| Groupes dont les 4 héros ont amélioré leur équipement | 82/100 | 100/100 | 100/100 | 100/100 |
| Groupes sans budget matériel pour un craft de base | 11/100 | 0/100 | 0/100 | 0/100 |

Le stock peut dépasser le loot brut grâce au recyclage. Un « budget de craft »
ne garantit pas une recette utile, un bâtiment débloqué ou le paiement d'une
rareté supérieure. Une amélioration de héros peut être un transfert d'objet ;
les cadeaux de passage T1 ne comptent pas dans ce compteur.

À l'arrivée à l'étage 8 : médiane 3 objets actuellement, 33 en `balanced`.
Le p90 du plus long intervalle sans objet de chaque campagne passe de 120 à
24 explorations. Il s'agit du percentile des **maxima par campagne**, pas du
p90 de tous les intervalles individuels.

Campagnes jusqu'au niveau 40 des quatre héros :

| Mesure | Actuel | Balanced |
|---|---:|---:|
| Explorations | 3 377 | 3 260 |
| Heures simulées | 7,14 | 6,08 |
| Objets lootés | 76 | 576 |
| Scraps en stock | 91 | 3 551 |
| Métal raffiné en stock | 943 | 3 883 |
| Or restant | 449 475 | 434 903 |
| Or consacré aux huit niveaux de Forge | 26 460 | 26 460 |
| Crafts / immédiatement équipés | 137 / 34 | 138 / 23 |

Les deux profils complets totalisent 674 766 explorations. Le compte de l'or
est exact sur les 200 runs : stock initial + gains - pertes - achats de Forge
= stock final. Les 600 checkpoints étage 3/6/8 communs aux campagnes courtes
et longues sont identiques seed par seed, validés par `assert.deepEqual`.

## Interprétation et suites nécessaires

1. Le problème de rareté des objets au début est confirmé. Des drops réguliers
   et des élites/coffres gratifiants sont une piste solide. Ne pas diminuer
   les multiplicateurs explosifs de rareté pour compenser le volume.
2. `steady` et `generous` suralimentent les scraps dès le début. `balanced`
   garde encore un surplus tardif important : ne pas valider ce pack tel quel.
3. Plus de loot diminue les temps de combat/récupération : environ -15 % de
   durée médiane en `balanced`, malgré seulement -3,5 % d'explorations. Les
   formules XP ne changent pas, mais le rythme réel doit être revalidé.
4. L'or ne justifie pas une hausse globale dans le périmètre simulé. Ne pas
   conclure à une inflation générale de ville : les autres dépenses manquent.
5. Le rendement utile de la forge recule. Tester sa complémentarité avec le
   loot : ciblage des slots/classes via les recettes existantes, couverture
   des plans et dépenses d'amélioration cohérentes avant d'ajouter des coûts.

## Contrôle final : augmenter seulement le loot d'objets

100 campagnes `lootOnly` supplémentaires ont toutes atteint le niveau 40 des
quatre héros. Bilan principal : 700 campagnes (400 courtes + 300 longues),
100 seeds distinctes réutilisées entre configurations ; les pilotes techniques
et premiers essais ne sont pas ajoutés à ce total. Les campagnes longues
totalisent 1 003 941 explorations, sans erreur de conservation de l'or.

| Mesure médiane | Actuel | LootOnly |
|---|---:|---:|
| Objets à l'arrivée étage 6 | 1 | 16 |
| Scraps en stock à l'arrivée étage 6 | 29 | 58 |
| Métal raffiné en stock à l'arrivée étage 6 | 8 | 11 |
| Or restant à l'arrivée étage 6 | 358 | 372 |
| Groupes avec budget pour un craft supplémentaire étage 6 | 89/100 | 99/100 |
| Objets au niveau 40 des quatre héros | 76 | 572 |
| Scraps en stock au niveau 40 | 91 | 3 096 |
| Métal raffiné en stock au niveau 40 | 943 | 3 612 |
| Or restant au niveau 40 | 449 475 | 440 371 |
| Crafts / immédiatement équipés au niveau 40 | 137 / 34 | 137 / 23 |
| Heures simulées jusqu'au niveau 40 | 7,14 | 6,12 |

À l'étage 6, 100/100 groupes `lootOnly` ont amélioré l'équipement des quatre
héros. Le loot brut médian est de 39 scraps et 13 raffinés : les stocks de 58
et 11 incluent recyclage et dépenses, pas une hausse des drops de matériaux.
99/100 budgets restants ne garantissent pas une absence universelle de blocage
ni l'accès immédiat au premier craft. À l'arrivée à l'étage 3, 65/100 de ces
groupes n'ont pas encore le budget matériel et la Forge n'est pas encore payée.

Conclusion : il n'est pas nécessaire de supprimer d'emblée le raffiné du craft
ni de garantir des scraps à chaque combat. Le renouvellement des objets et le
recyclage améliorent déjà fortement l'approvisionnement. Mais le surplus tardif
et la baisse des crafts immédiatement utiles restent présents : `lootOnly`
est une meilleure base d'itération, pas un équilibrage global validé.

Autres sources contrôlées, médianes par campagne complète :

| Loot brut / plans | Actuel | LootOnly |
|---|---:|---:|
| Scraps | 545 | 545 |
| Métal raffiné | 829 | 857 |
| Fragments enchantés | 747 | 721 |
| Cœurs arcaniques | 214 | 192 |
| Essences légendaires | 16 | 14 |
| Plans connus, sur 48 familles | 12 | 12 |
| Plans obtenus des coffres | 5 | 5 |
| Offres de rareté refusées faute de matériaux | 19 | 4 |

Les quantités brutes ci-dessus excluent le recyclage. Les différences reflètent
aussi des trajectoires/durées différentes, pas un changement des tables de
matériaux. Les plans restent tirés selon les règles actuelles : leur couverture
limitée mérite un test de recettes utiles par classe/slot. Un compteur
`recipeBlockedChecks` signifie que le pilote ne trouve pas de recette connue
jugée améliorable, pas nécessairement une absence absolue de plan.

Dans les sorties, `bySource.materials` compte les stacks attribués, pas leurs
unités. `materialsGross` compte les unités lootées. `materialsRecycled` mesure
le recyclage du surplus par la sonde ; les crafts inutiles recyclés directement
par le pilote sont comptés séparément dans `forge.recycledCrafts`. Les stocks
finaux, eux, proviennent de l'état réel après toutes les commandes.

## Conditions avant implémentation

### Objectifs actualisés après les premiers essais

La reprise et les nouvelles expériences sont suivies dans
[loot-idle-experiments.md](loot-idle-experiments.md). Ce rapport prime sur le
statut historique des variantes ci-dessous. L'équilibrage reste non validé.

Les conclusions historiques ci-dessus ne constituent pas une validation du
nouvel équilibrage. La cible retenue ensuite est de **1 à 3 objets équipables
lootés par étage**, toutes sources de loot réunies, et **1 à 2 améliorations
réellement équipées issues du craft pour le groupe de quatre par tranche de
cinq niveaux de héros**. Les crafts, plans, matériaux, recrutement et cadeaux
de rank-up ne comptent pas dans les objets lootés. La plage par étage n'est
pas, à ce stade, une décision de plafonnement strict.

Les tentatives de craft doivent augmenter avec la progression pour rechercher
les procs de rareté ; conserver leur puissance explosive. Un stock de matériaux
ne prouve donc pas à lui seul une suralimentation : mesurer les tentatives et
les coûts d'acceptation des raretés, sans garantir une amélioration à chaque craft.

Les variantes inspirées des recherches restent **à implémenter et à mesurer** :
efficacité des ressources (Melvor), recherche de qualité (Shop Titans),
recraft ciblé d'une base connue (Tap Titans 2), accès aux plans utiles
(IdleMMO). Elles ne sont pas couvertes par les résultats historiques.
Le pilote actuel évaluant les recettes au rare doit également être adapté
pour ne pas arrêter les crafts lorsqu'un proc supérieur accessible reste utile.
Les nouvelles mesures doivent distinguer l'équipement réel des gains projetés,
inclure les objets forgés équipés plus tard et comparer des seeds appariées.

### Reprise technique du 5 septembre 2026

Le [blocage d'exécution Windows](codex-elevation.md#incident-du-sandbox-windows--exécution-du-harness)
a été contourné avec une élévation ciblée. Le test des commandes autoritaires
accepte les 48 recettes actives et rejette une recette legacy même explicitement
déverrouillée, avec le code réel `BLUEPRINT_LOCKED` (l'ancienne assertion
attendait à tort le mot `recipe`). Le bilan des campagnes longues exige
désormais quatre héros niveau 40 ; un arrêt avant objectif reçoit une raison
explicite, même si le moteur n'en fournit pas.

Validation technique : `node scripts/test-loot-town-policy.mjs`,
`node --check scripts/run-loot-economy-harness.mjs`, puis deux seeds par profil
`baseline,loot15`, ville progressive, étape courte, deux workers. Les quatre
campagnes atteignent l'étage 8 (142 à 151 explorations), sans écart d'or.
Sortie : `test-results/loot-economy/early/baseline-loot15-city/summary.json`.
L'effectif y est encore de deux ou trois héros : ce pilote vérifie seulement
l'exécution, pas les objectifs d'un groupe de quatre ni l'équilibrage statistique.
Aucune nouvelle campagne de 100 seeds inspirée des recherches n'est validée
par ce contrôle ; les règles de production restent inchangées.

### Critères de clôture

Pour clôturer une future adaptation : objectifs de fréquence/temps sans loot,
équipement des quatre héros, accès au premier craft et intérêt des crafts par
tranche ; simulation de toutes les dépenses de ville pour l'or ; contrôle des
boucles craft/recyclage et des matériaux rares ; tests autoritaires RNG/replay,
catalogue/provenance, logs/UI et régressions XP ; documentation métier mise à
jour après validation. Ces points ne sont pas réputés validés par ce diagnostic.

Références : [domaine Forge](../architecture/forge-domain.md),
[catalogue](../architecture/item-catalog.md),
[plan Forge](forge-item-evolution-plan.md),
[script](../../scripts/run-loot-economy-harness.mjs).
