# Domaine inventaire et équipement

> Mise a jour CDI-059 : `inventory.add` et `inventory.remove` sont retires de
> la surface cliente. Seuls loot, forge, equipement et recyclage peuvent muter
> les instances cote serveur. Les structures persistees sont validees. Les effets
> des sept objets novice, leur rarete et leurs modificateurs recalculent les
> sous-statistiques Novice et Tier 1. Le catalogue complet reste dans CDI-060.

`supabase/functions/game-api/inventory-authority.ts` expose les mutations
autoritaires sur les héros et le stock. L ancienne copie cliente, absente du
graphe de production, a été supprimée par CDI-066 :

- `addItemInstance` ajoute une identite unique sans muter l etat source ;
- `removeItemInstance` retire uniquement l identite demandee ;
- `equipStoredItem` vérifie le héros, le stock, les slots et les incompatibilités ;
- `unequipStoredItem` rend l’objet au stock et recalcule les stats.

Chaque equipement possede un `instanceId`, distinct de `itemId` qui reste la
reference du modele catalogue. Les equipements ne sont pas empiles : deux
exemplaires identiques ont deux identites. La meme identite est deplacee entre
coffre et heros, rendue au coffre lors d un renvoi, et doit rester unique dans
l etat canonique. Les materiaux de forge conservent leurs piles et `count`.

La forge et le recyclage autoritaires sont raccordes depuis CDI-028 et durcis
par CDI-059.

CDI-068 ajoute les recompenses de vocation Tier 1. Les objets retenus sont
restreints aux classes presentes dans leurs pools canoniques, avec la meme
decision dans l interface et dans `inventory-authority.ts`. Le coffre ne
possede pas de capacite maximale : les objets remplaces par la vocation y sont
toujours restitues. Les pools, l ordre RNG et les identifiants deterministes
sont decrits dans `docs/architecture/tier1-class-equipment.md`.
