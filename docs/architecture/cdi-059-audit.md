# Audit CDI-059 - Forge, plans, recyclage et securite economique

## Reference

- comportement historique : commit `640f89f` ;
- autorite inventaire initiale : `5633a12` ;
- autorite forge initiale : `6cdc8ec`, completee par `1a61361` ;
- raccord UI autoritaire : `f47993e` ;
- audit fonctionnel : 26 juillet 2026.

## Ecarts prouves

1. Une forge standard envoyait `accepted: false`. Le serveur supprimait la
   preview apres le cout de base sans produire d objet.
2. `inventory.add` permettait de creer gratuitement un objet connu avec
   rarete, quantite et modificateurs choisis, puis de le recycler.
3. Le serveur persistait toujours `upgradeProc: none`; les bandes 85/13/2 et
   les couts d amelioration n etaient pas portes.
4. Les nouvelles parties avaient zero plan et le serveur ne les verifiait pas.
5. `critChance` divergeait de `criticalChance`; les resistances affichees n
   avaient pas toutes de valeur serveur.
6. Les structures objets, materiaux, plans et preview etaient peu validees.

## Corrections locales

- suppression des commandes publiques `inventory.add` et `inventory.remove` ;
- schemas stricts pour equipement, recyclage et forge ;
- validation des piles, materiaux, plans, modificateurs et preview ;
- contrat `acceptUpgrade` sans ambiguite avec l annulation ;
- finalisation standard vers exactement un objet commun ;
- proc 85/13/2 tire une fois a `forge.start`, persiste avec le RNG canonique ;
- couts inhabituel et rare appliques atomiquement ;
- six plans historiques initialises et listes vides migrees ;
- verification du plan avant materiaux et RNG ;
- `criticalChance`, resistances et cle React des piles alignes ;
- effets de base des sept objets novice et effets de rarete alignes ;
- modificateur forge persiste avec les effets de base mis a l echelle ;
- sous-statistiques Novice et Tier 1 recalculees a l equipement et au
  desequipement ;
- transcript explicite et raretes francisees pour preview, finalisation,
  annulation et recyclage ;
- cinq tables de recyclage testees, dont deux instances du meme objet et de la
  meme rarete avec modificateurs differents ;
- instances distinctes et annulation prouvees dans l UI ;
- recalcul equipement/desequipement prouve pour les neuf classes Tier 1 ;
- replay forge prouve jusque dans l adaptateur Supabase, sans seconde
  application, consommation ou avancee RNG.
- `instanceId` unique ajoute aux equipements du coffre et des heros ;
- forge et loot de donjon produisent des identites deterministes sans tirage
  RNG supplementaire ;
- equipement, desequipement, renvoi d un heros et recyclage deplacent ou
  suppriment l instance exacte ;
- unicite globale validee entre coffre, heros et offres temporaires ; aucune
  migration d ancienne sauvegarde n est requise selon la decision produit.

## Sujet autonome

CDI-060 definit le catalogue des 131 objets, leurs effets pour toutes les
classes, les migrations et les tables de butin. CDI-059 ne rend pas les 124
objets hors catalogue novice equipables. CDI-060 porte aussi le remplacement
de la rarete `rare` forcee des coffres ordinaires par des courbes evolutives
selon l etage et le filtrage des objets devenus trop faibles ou encore trop
puissants.

## Validation finale

- typecheck : PASS ;
- tests cibles forge et ecarts mineurs : 75/75 PASS ;
- suite complete : 33 fichiers, 270 tests PASS ;
- determinisme : PASS ;
- ESLint `--quiet` : PASS ;
- validation Workboard : 60 tickets, 0 erreur ;
- `git diff --check` : PASS, avertissements LF/CRLF uniquement.

Le build apres ajout d `instanceId` a ete rapporte PASS par l utilisateur.
Les tests Docker/navigateur ont ete rapportes PASS apres reset : deux objets du
meme modele restent distincts, equipement, desequipement et recyclage ciblent
l instance exacte, le loot de donjon persiste apres F5 et aucun identifiant
technique n est affiche. Le replay de `dungeon.resolve` a conserve
`revision: 181`, trois objets stockes, `uniqueInstances: true` et le meme etat
RNG (`draws: 8`, `state: 16222175`) sans duplication.

L audit fonctionnel final pre-push ne releve aucun ecart restant dans le
perimetre CDI-059. Le catalogue complet, les pools de loot et leur progression
par etage sont explicitement suivis par CDI-060.
