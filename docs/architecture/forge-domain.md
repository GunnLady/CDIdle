# Domaine Forge et recyclage

La Forge autoritaire utilise le catalogue partagé, le registre commun des
bâtiments, l'économie partagée `forge-economy.ts` et le RNG canonique. Les
règles ne sont pas recalculées dans React ni dupliquées dans le harness.

## Progression du bâtiment

`FORGE_PROGRESSION_LEVELS` ouvre huit tranches : `1–5`, `6–10`, `11–15`,
`16–20`, `21–25`, `26–30`, `31–35` et `36–40`. Les étages requis pour acheter
Forge 1 à 8 sont `3 / 8 / 11 / 18 / 26 / 36 / 49 / 62`. L’étage autorise
l’amélioration ; seul `building.upgrade` la paie et l’applique.

Forge 1 exige aussi Campement 1 et Mine 1. Un lot multi-niveaux revalide chaque
niveau cible dans la boucle et reste atomique. Maxima, coûts et prérequis sont
exposés par `BUILDING_REGISTRY`.

## Recettes et previews

Les six plans initiaux ciblent les bases évolutives épée, dague, hache,
bouclier, tissu et cuir. Le catalogue complet contient 48 familles. Chacun des
131 identifiants de plan historiques est un alias de migration vers la famille
de son archétype ; les doublons fusionnent avec une sémantique OR sur
`unlocked`. Les instances historiques restent intactes, mais un nouveau craft
utilise uniquement une recette `level-bands-v1` active. Une base connue reste
disponible dans toutes les tranches ouvertes.

`forge.start` valide d’abord bâtiment, plan, tranche et matériaux. Il tire
ensuite la rareté proposée puis le niveau exact, consomme le coût et persiste
`offeredRarity`, `itemLevel` et `powerModelId`. Une commande refusée ne consomme
ni matériau ni RNG.

`forge.finalize` et `forge.cancel` ne tirent aucun RNG. Accepter une qualité
supérieure paie son coût et ajoute le bonus compatible ; la refuser produit la
rareté minimale. L’annulation ne rembourse pas le craft. L’instance finale est
`item:forge:<previewId>`, donc stable au replay.

Le [nommage V1](item-naming.md) intervient après finalisation : l’événement
capture `itemName` depuis l’instance définitive, avec la rareté acceptée/refusée
et ses modificateurs. Le recyclage capture également ce nom avant retrait.
Les recettes et l’offre non finalisée restent au nom de catalogue ; le front
ne devine pas un nom individuel avant la décision. Aucun coût ou tirage changé.

## Rareté et économie

Les probabilités Commune/Inhabituelle/Rare/Épique/Légendaire par Forge sont :

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

La rareté proposée ne descend jamais sous le minimum de la recette. Craft,
acceptation et recyclage utilisent le multiplicateur de tranche
`1 / 1 / 2 / 2 / 2 / 2 / 3 / 3`. Un test exhaustif couvre les 40 couples
Forge × rareté et interdit tout cycle composante par composante profitable.

## Découverte des plans

Chaque modèle porte une politique distincte de sa plage de niveau : `none`,
`initial` ou `random-drop`. Une politique aléatoire déclare sources, bornes
d’étage, poids et éventuellement boss autorisés.

`rollBlueprintReward` est commun aux boss majeurs et aux trésors. Chaque source
a 5 % de chance, exclut les plans connus, tire selon les poids et ne donne ni
compensation ni garantie lorsque le pool est vide. Le jet reste indépendant
des objets et des futures signatures.

## Interface de l’atelier

La présentation est décrite dans [Forge : interface de l’atelier](../development/forge-workshop-ui.md).
Le catalogue en cartes, les filtres et les décisions de résultat ne modifient
ni les commandes autoritaires ni les probabilités, les coûts ou les objets.

## Compatibilité des sauvegardes

L’état canonique v4 remplace `pendingForge.upgradeProc` par
`pendingForge.offeredRarity`. La migration v3→v4 convertit et déduplique les
131 identifiants historiques vers leurs 48 familles, conserve les plans
supplémentaires, transforme les
previews existantes et ne modifie aucun objet possédé. Une preview legacy déjà
payée reste finalisable même si sa recette n’est plus publiable pour un nouveau
craft.

Le backfill SQL additif
`20260904020000_forge_progression_v4.sql` applique la même transformation à
`public.games`. La migration additive
`20260904030000_legacy_blueprint_evolution_catalog.sql` reprend les états déjà
en v4 lorsque le mapping est étendu à tout le catalogue. Le test pgTAP
`027_forge_progression_v4.sql` couvre raretés, plans, previews, inventaire et
idempotence.
