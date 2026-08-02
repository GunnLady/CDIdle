# Domaine forge et recyclage

> Mise a jour CDI-060 : la forge autoritaire derive ses recettes des 131 modeles
> forgeables du catalogue partage. Les six plans historiques restent debloques
> au depart ; les autres sont obtenus comme recompenses de boss. `forge.start`
> persiste un proc RNG 85/13/2 et respecte la rarete minimale du modele.
> `forge.finalize` conserve cette rarete minimale, puis applique le cout et le
> modificateur d une amelioration acceptee. `forge.cancel` reste la seule
> annulation. Le recyclage cible une instance exacte.

`supabase/functions/game-api/forge-authority.ts` formalise les coûts et refus
atomiques de la forge. La forge verrouillée, un plan verrouillé ou des
matériaux insuffisants ne modifient jamais le stock source. L ancienne copie
cliente a été supprimée par CDI-066.

Les recettes partagent actuellement le cout historique de la forge novice. Le
catalogue, les raretes minimales et les disponibilites comme plan sont
autoritaires ; un futur chantier d equilibrage pourra faire varier les couts
sans recreer une seconde liste de modeles.

`forge.finalize` cree `item:forge:<previewId>` sans tirage RNG supplementaire.
Le loot de donjon derive aussi son `instanceId` de l encounter persiste. Le
replay restitue donc la meme identite sans duplication.

Ce report historique vers CDI-028 et CDI-037 est clos par CDI-059.
