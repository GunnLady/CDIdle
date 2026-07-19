# Audit détaillé CDI-027

## Contrôles sans écart

- stocks atomiques avec fusion des piles et retrait borné ;
- catalogue serveur : identifiant inconnu refusé ;
- équipement et déséquipement atomiques avec slots, niveau requis et retour au stock ;
- refus d'un slot occupé ou d'un héros introuvable ;
- commandes `inventory.add`, `inventory.remove`, `hero.equip` et `hero.unequip` raccordées au dispatcher Edge ;
- `npm run typecheck` : réussi ;
- `npm run check:determinism` : réussi.
- test manuel rapporté par l'utilisateur : `tests/townAuthority.test.ts`, 5/5.

## Écarts réels

Aucun écart local identifié dans le périmètre CDI-027.

## Sujets prévus dans un autre ticket

- validation HTTP authentifiée Edge/Supabase/RLS/RPC et transaction réelle : CDI-041/staging ;
- couverture complète du catalogue d'objets et recalcul riche des statistiques : tranche de données/combats ultérieure ;
- forge et recyclage : CDI-013 ;
- consommation inventaire dans donjon/combat : CDI-029.

## Décision

CDI-027 est marqué `Done` après le test ciblé et l'audit post-push.

## Audit post-push

- contrôle sans écart : le commit `5633a12` contient le module serveur, les
  commandes, les tests et la documentation attendus ;
- écart prévu : la validation HTTP authentifiée Edge/Supabase/RLS/RPC reste
  différée vers CDI-041/staging ;
- CI distante : le connecteur n'a retourné aucun workflow pour `5633a12`, donc
  le résultat est inconnu et n'est pas déclaré vert.
