# Audit fonctionnel pré-push — CDI-029

> Instantané historique : cet audit conserve les constats de son exécution.
> Le Workboard indique seul les statuts et écarts encore ouverts aujourd'hui.

Date : 2026-07-20

## Périmètre vérifié

Donjon/combat autoritaires, progression canonique, retraite, récompenses,
transcript, idempotence et verrouillage hors ligne.

## Contrôles

| Constat | Classe | Preuve / décision |
| --- | --- | --- |
| `dungeon.explore` crée un encounter serveur persistant | Couvert | `dungeon-authority.ts`, test dédié |
| `dungeon.resolve` résout côté serveur et produit un transcript ordonné | Couvert | `resolveFight`, 4 tests dédiés |
| `dungeon.retreat` annule sans progression ni récompense | Couvert | test dédié |
| progression salle/étage bornée | Couvert | `advance` et validation d'état |
| double traitement de commande | Couvert par socle | `commandId`/`requestHash`/RPC existants ; test adapter déjà vert |
| boss loot non raccordé | Corrigé dans CDI-029 | le boss de salle 50 attribue un matériau serveur et l'événement le trace ; les tables complètes restent à harmoniser avec CDI-037 |
| auto-exploration serveur et verrouillage hors ligne | Corrigé dans CDI-029 | commande authentifiée `dungeon.auto_explore`, refus sans héros actif ; aucune mutation hors ligne n'atteint l'API |
| intégration directe de `dungeonProgression` | Contrôle couvert | les invariants canoniques (50 salles, record monotone, progression bornée) sont repris par l'autorité et couverts par tests ; une extraction de module partagé reste une amélioration technique |
| intégration UI/API des commandes donjon | Sujet prévu CDI-031 | le serveur expose les commandes ; le raccordement UX, reprise et verrouillage hors ligne relève du ticket dépendant CDI-031 |
| diversité des encounters et transcript de combat complet | Sujet dépendant | les règles détaillées et le transcript de base relèvent de CDI-015 ; ne pas réinventer ici |
| tirages injectés via `Rng` | Sujet prévu | CDI-037 ; le hash déterministe provisoire ne remplace pas ce ticket |
| accès PostgREST `service_role` aux tables serveur | Corrigé par migration additive | `20260720100000_game_api_service_role_grants.sql` accorde les lectures et l'insertion de bootstrap nécessaires ; application locale à confirmer manuellement |
| validation HTTP Edge/Supabase/RLS/RPC réelle | Sujet prévu CDI-041/staging | Comme pour CDI-026/027/028, aucune smoke test locale n'est requis pour clôturer le périmètre d'implémentation |

## Décision

CDI-029 peut passer à `Done` pour son périmètre local lorsqu'aucun écart réel ne reste. Les sujets CDI-015,
CDI-031 et CDI-037 restent tracés et
ne sont pas présentés comme résolus par ce ticket.

## Dette d’architecture — module canonique de progression

Source normative actuelle :
`supabase/functions/game-api/dungeon-authority.ts`. Elle définit les règles
officielles des 50 salles par étage, du passage salle 50 → étage suivant/salle
1, du record monotone et de la navigation bornée.

Mise à jour CDI-066 : la copie cliente non exécutée a été supprimée. Il ne
reste qu une implémentation de production, couverte par les tests serveur.

Cette dette de double implémentation est close.

## Preuves locales

- Tests ciblés CDI-029 : 5/5.
- Suite complète : 12 fichiers, 90 tests passés.
- Build : réussi.
- Lint : 0 erreur, avertissements préexistants.
- Workboard : valide, 0 erreur.
