# Audit pré-push CDI-030 — idle serveur et rapport de retour

Date : 2026-07-21

## Contrôles sans écart

- Le calcul serveur est déterministe, accepte des timestamps ISO et avance
  `lastProcessedAt` à l'heure serveur fournie.
- Le temps traité est plafonné à 24 heures ; le surplus est exposé dans
  `discardedSeconds` et n'est jamais rejoué.
- Le rapport couvre production par ressource, nourriture consommée, citoyens
  ajoutés et héros dont les jauges ont réellement progressé.
- Les transitions ne traitent que production de ville, immigration et
  récupération des héros au repos ; aucune mutation de donjon n'est ajoutée.
- Les erreurs d'horloge sont explicites (`INVALID_IDLE_CLOCK` et
  `CLOCK_ROLLBACK`).

## Écart réel corrigé dans CDI-030

- `heroesRecovered` comptait auparavant une comparaison avec l'état déjà
  modifié et retournait donc zéro. Le compteur compare maintenant chaque jauge
  avant/après et un test le prouve.

## Sujet prévu ailleurs

- La preuve d'exécution HTTP Edge/Supabase avec RLS et réseau réel relève du
  smoke CDI-041. Elle est volontairement non exécutée en local conformément
  aux règles du projet ; ce n'est pas une validation implicite.

## Raccordement réalisé

- `bootstrap` et `commands` appellent l'autorité idle puis commitent l'état et
  `last_processed_at` via le RPC atomique `commit_idle_state`.
- La réponse de commande expose `idleReport` lorsque du temps a été traité.
- Un replay idempotent traite également l'idle écoulé sans réexécuter la
  commande métier.
- Une migration additive crée le RPC et limite son exécution à `service_role`.

## Preuves locales non interactives

- `tests/idleAuthority.test.ts` couvre plafond, rapport, capacité/nourriture,
  héros récupérés et rollback d'horloge.
- `tests/supabaseAdapter.test.ts` prouve le commit du retour idle via le RPC
  et la non-réexécution de la commande lors d'un replay.
- La suite complète précédente (95 tests) et la passe ciblée finale (9 tests)
  passent ; le build Vite et la validation Workboard passent ; `git diff
  --check` ne remonte pas d'erreur de whitespace (les avertissements LF/CRLF
  sont des conversions Windows Git, pas des écarts fonctionnels).

## Décision pré-push

- Aucun écart réel restant identifié dans le périmètre CDI-030.
- La preuve HTTP Edge/Supabase/RLS/RPC réelle est un sujet prévu dans CDI-041,
  explicitement différé et non présenté comme vérifié.
- Le ticket peut être proposé au passage `Done`, mais aucun commit/push ne doit
  être lancé sans autorisation explicite.
