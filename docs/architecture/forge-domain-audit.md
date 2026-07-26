# Audit forge et recyclage

> Reevaluation du 26 juillet 2026 : CDI-059 corrige la finalisation standard,
> retire `inventory.add/remove` du contrat client, restaure le proc RNG
> persiste 85/13/2, les couts d amelioration, les plans autoritaires, les cinq
> tables de recyclage et la validation des modificateurs. Le catalogue complet
> et le loot de boss sont isoles dans CDI-060. Les sections CDI-013 ci-dessous
> sont conservees comme historique.

## Couvert dans CDI-013

- verrouillage de la forge et des plans ;
- coûts de craft et d’amélioration ;
- refus atomique si les matériaux sont insuffisants ;
- recyclage d’un objet et attribution de ses matériaux ;
- conservation de l’état source lors d’un refus.

## Déjà suivi ailleurs

| Écart | Ticket |
| --- | --- |
| RNG de qualité et probabilités de proc | CDI-037 |
| Preview/confirmation persistées et anti-reroll | CDI-028 |
| Intégration serveur atomique | CDI-028 |
| Recyclage et équipement côté vertical | CDI-027 / CDI-028 |

## Écarts non encore couverts

Les trois ecarts historiques ci-dessous sont couverts par CDI-059 :

- tests detailles de chaque table de recompense par rarete ;
- validation stricte des modificateurs choisis selon le type d objet ;
- tests de finalisation preview vers objet final lorsque le proc est refuse,
  ainsi que du refus atomique lorsque le materiau d amelioration manque.
