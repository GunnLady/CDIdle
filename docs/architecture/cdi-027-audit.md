# Audit détaillé CDI-027

> Reevaluation CDI-059 : le raccord historique de `inventory.add` et
> `inventory.remove` etait trop large et permettait la creation libre d objets.
> Ces commandes sont retirees du contrat public. Les mutations internes restent
> portees par loot, forge, equipement et recyclage. Le catalogue complet est
> suivi par CDI-060.

## Contrôles sans écart

- instances d equipement atomiques, sans fusion ni identite partagee ;
- catalogue serveur : identifiant inconnu refusé ;
- équipement et déséquipement atomiques avec slots, niveau requis et retour au stock ;
- refus d'un slot occupé ou d'un héros introuvable ;
- commandes `hero.equip` et `hero.unequip` raccordees au dispatcher Edge par
  `instanceId` exact ; les anciennes commandes publiques `inventory.add` et
  `inventory.remove` sont retirees par CDI-059 ;
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
