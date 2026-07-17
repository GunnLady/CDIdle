# Audit forge et recyclage

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

- tests détaillés de chaque table de récompense par rareté ;
- validation stricte des modificateurs choisis selon le type d’objet ;
- tests de finalisation preview → objet final lorsque le proc est refusé ou
  lorsque le matériau d’amélioration manque.

Ces points doivent être ajoutés à CDI-028 ou à un ticket P2 dédié avant le
hardening final ; ils ne sont pas déclarés terminés par CDI-013.
