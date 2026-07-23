# Handoff CDI-051 — 24 juillet 2026

## État

- Ticket `CDI-051` en `Doing`.
- Worktree volontairement non commité.
- Corrections de la revue Luna appliquées.
- Validations automatisées vertes.
- Validation navigateur authentifiée commencée, non terminée.

## Corrections réalisées

- Exécuteur `/commands` typé, sérialisé et basé sur la révision canonique.
- Réponse serveur appliquée à l’interface puis au cache IndexedDB.
- Conflit `409` suivi d’un rechargement `/bootstrap` immédiat avant la
  prochaine commande.
- Erreurs métier `400` distinguées d’une indisponibilité serveur.
- Ville, héros, inventaire, forge, donjon, recrutement, onboarding et cheats
  raccordés aux commandes autoritaires.
- Forge locale inaccessible supprimée des handlers actifs.
- Timers locaux de ressources, immigration, récupération et combat neutralisés.
- Auto-donjon : le client déclenche les commandes, le serveur produit seul les
  mutations canoniques.
- Sauvegarde manuelle reformulée en actualisation canonique `/bootstrap`.
- Reset local effectué uniquement après le succès serveur.
- Registre de commandes dédupliqué et protégé par un test.
- Cheats protégés par `GAME_API_ENABLE_CHEATS=true`, désactivés par défaut.
- Exemple d’environnement ajouté :
  `supabase/functions/.env.example`.

## Preuves obtenues

Preuves utilisateur :

- Tests ciblés : 6 fichiers, 35 tests, tous réussis.
- Suite complète : 18 fichiers, 119 tests, tous réussis.
- Build Vite production : réussi.

Preuves Codex :

- `npm.cmd run typecheck` : réussi.
- `npm.cmd run check:determinism` : réussi.
- `npm.cmd run board:validate` : 52 tickets, 0 erreur.
- `git diff --check` : aucune erreur, uniquement avertissements CRLF.
- ESLint : 0 erreur ; avertissements historiques encore présents.
- Audit statique : les handlers UI actifs passent par
  `dispatchAuthoritativeCommand`; les setters canoniques actifs servent à
  appliquer une réponse serveur ou le cache hors ligne.

Le warning Vitest sur plusieurs `GoTrueClient` reste un warning connu du test,
pas un échec.

## Reprise demain

La session Google est connectée dans le navigateur utilisateur.

Reprendre au test **Ville** :

1. vérifier l’absence de la bannière hors ligne ;
2. améliorer un bâtiment ;
3. relever dans Network le statut de `/game-api/commands` et les révisions
   avant/après ;
4. faire `F5` ;
5. confirmer que le niveau et les ressources persistent.

Continuer ensuite avec une mutation par domaine :

- héros : activité, équipement ou recrutement ;
- inventaire : équipement ou recyclage ;
- forge : démarrage puis finalisation/annulation ;
- donjon : sélection d’étage, exploration, résolution et auto-donjon ;
- conflit `409` : vérifier le rechargement canonique ;
- offline/online : aucune mutation hors ligne, cache visible, reprise après
  reconnexion ;
- reset : vérifier qu’un échec serveur ne réinitialise rien localement.

Après ces preuves :

1. faire l’audit pré-push final ;
2. mettre à jour la matrice UI → commande et le ticket `CDI-051` ;
3. décider si les critères permettent le passage à `Done` ;
4. fournir les commandes Git à l’utilisateur, sans commit/push par Codex.

## Points encore non prouvés

- Persistance navigateur réelle de chaque domaine après `F5`.
- Comportement navigateur du conflit `409`.
- Parcours offline/online complet.
- Préservation visuelle du parcours onboarding et du transcript de donjon.
- Aucun commit ni push n’a été effectué.
