# Dessous de la Cité — architecture produit

## Références

- Décisions fonctionnelles : [prompt de progression](../development/undercity-progression-prompt.md).
- Signatures et craft : [série du Roi des Rats](../development/rat-king-signature-items.md).
- Preuves d'équilibrage : [harness UnderCity](../development/undercity-harness.md).
- Domaine de forge : [architecture de la forge](forge-domain.md).
- Reprise du calibrage : [handoff forge idle](../development/forge-idle-calibration-handoff.md).

## Responsabilités

- `shared/domain/undercity.ts` décrit les cinq zones, les rencontres, les rôles ennemis et les pools de statistiques thématiques.
- `shared/domain/undercity-combat.ts` gère les groupes ciblables, les intentions, les protections, le soutien et la phase du Roi.
- `shared/domain/undercity-progression.ts` gère la progression par héros, les reçus fixes, le jalon commun, l'arrêt, la reprise et l'éligibilité au farm.
- `shared/domain/items/items_rat_king.ts` porte le catalogue et les paramètres configurables des trois signatures.
- `FORGE_MATERIALS` décrit aussi les composants de boss avec leur donjon, leur rencontre source et leur nom ; `src/domain/forgeMaterialPresentation.ts` les regroupe pour le Coffre et la Forge.
- `shared/domain/authoritative-dungeon.ts` orchestre une rencontre avec le RNG canonique et produit état, transcript et récompenses.
- `supabase/functions/game-api/dungeon-authority.ts` valide les commandes, la position de l'expédition et les transitions entre rencontres.
- `supabase/functions/game-api/forge-authority.ts` consomme les recettes et finalise les signatures.
- `src/domain/dungeonPresentation.ts` prépare les vues ; les composants React assurent uniquement le rendu et les callbacks.

## Persistance et compatibilité

L'état canonique v5 ajoute `dungeonProgress`. La migration v4 vers v5 attribue aux héros existants la progression acquise par le compte et marque les premières victoires fixes correspondantes comme déjà reçues. Les rencontres, objets et commandes peuvent porter `dungeonId`; les objets thématiques conservent aussi `sourceZoneId`.

L'expédition reste unique. Un wipe ou un repli l'arrête au jalon commun et désactive l'exploration automatique. La reprise exige la commande explicite `dungeon.resume`. Après la première victoire commune à l'étage 50, la progression s'arrête sans reboucler : le joueur doit choisir une zone, ce qui démarre son farm automatique. Le farm exige que chaque membre actif possède la victoire personnelle sur le Roi et ne réattribue aucune prime de première victoire.

Chaque groupe fixe de boss ou d'élite désigne un seul membre principal. Le groupe conserve son statut de rencontre de boss, mais seul ce membre reçoit le rang de boss utilisé par les règles de ciblage et de bonus ; les escortes gardent leur rôle propre.

## Paramètres configurables

Les coefficients de comportement des groupes, bonus thématiques, primes personnelles, taux de signatures, taux de plans, Marques gagnées et coûts de recette restent centralisés dans le domaine partagé. Leur valeur actuelle reprend le profil éprouvé par le harness ; elle reste calibrable sans changer les contrats.

## Validation

Les tests unitaires couvrent catalogues, groupes, phase du Roi, thèmes compatibles, progression personnelle, reçus, jalons, farm, forge et loot du boss. Les tests d'autorité couvrent les commandes et la migration v5. Le harness conserve son rôle d'analyse statistique et ne définit aucune règle produit supplémentaire.

La campagne locale `npm.cmd run test:undercity-product` exécute dix processus isolés sur le moteur produit. Elle vérifie les groupes de un à trois ennemis, les attaques de zone, le wipe, le plafond de l'étage 50 et une boucle complète de farm des Égouts. Cette campagne coûteuse reste volontairement hors de la commande `check` et de la CI qualité ; elle doit être relancée lorsque les règles du donjon, du combat de groupe ou de sa progression changent.

## Sujets différés

Le pity, les effets de combat avancés des signatures, une table de loot visible, plusieurs expéditions simultanées et les formations enregistrées exigent une décision produit séparée.

La reconstruction visuelle des PV, intentions et effets de chaque ennemi pendant le playback est reportée à la refonte du combat. Cette reprise dépendra du futur format des événements de combat et sera close lorsque les cartes ennemies refléteront le tour effectivement affiché, sans modifier la résolution autoritaire.
