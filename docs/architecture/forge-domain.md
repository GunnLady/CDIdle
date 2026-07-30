# Domaine forge et recyclage

> Mise a jour CDI-059 : la forge novice est maintenant autoritaire. Les six
> plans historiques sont initialises et verifies cote serveur. `forge.start`
> persiste un proc RNG 85/13/2 ; `forge.finalize` produit toujours l objet
> commun quand `acceptUpgrade` est faux, et applique sinon le cout et le
> modificateur de l amelioration. `forge.cancel` reste la seule annulation.
> Le recyclage cible une instance exacte. Le catalogue complet reste dans CDI-060.
> Les objets ameliores persistent aussi leurs effets novice mis a l echelle ;
> le bonus choisi et ces effets alimentent les sous-statistiques Novice et T1.

`supabase/functions/game-api/forge-authority.ts` formalise les coûts et refus
atomiques de la forge. La forge verrouillée, un plan verrouillé ou des
matériaux insuffisants ne modifient jamais le stock source. L ancienne copie
cliente a été supprimée par CDI-066.

`forge.finalize` cree `item:forge:<previewId>` sans tirage RNG supplementaire.
Le loot de donjon derive aussi son `instanceId` de l encounter persiste. Le
replay restitue donc la meme identite sans duplication.

Ce report historique vers CDI-028 et CDI-037 est clos par CDI-059.
