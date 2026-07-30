# API et commandes

## Forge, inventaire et recyclage (CDI-059)

- `inventory.add` et `inventory.remove` ne font plus partie du contrat client.
- `forge.start({ recipeId })` verifie le plan, consomme le cout, tire le proc
  avec le RNG canonique et persiste la preview.
- `forge.finalize({ previewId, acceptUpgrade, chosenModifierStat })` produit
  toujours l objet standard avec un `instanceId` deterministe derive de la
  preview ; `acceptUpgrade` ne concerne que l amelioration.
- `forge.cancel({ previewId })` est la seule annulation sans objet final.
- `hero.equip({ heroId, instanceId })` et
  `inventory.recycle({ instanceId })` ciblent une instance exacte. Le serveur
  resout seul son modele, sa rarete et ses modificateurs.
- Les payloads du perimetre refusent les champs inconnus et les identifiants
  vides avant dispatch.

`src/domain/commands.ts` définit le contrat partagé entre le client et le futur dispatcher serveur.

- `GameCommand` est une union discriminée : chaque mutation possède un `type` stable et des paramètres explicites.
- `CommandEnvelope` impose `commandId`, `idempotencyKey` et `expectedRevision`.
- `CommandResult` distingue une réponse réussie (`revision`, état canonique, `replayed`) d'une erreur structurée.
- `validateCommandEnvelope` est pur et ne fait aucun accès réseau.

Le traitement transactionnel, la déduplication persistée et la limite de débit
sont appliqués par le chemin temporel CDI-061.

## Transition temporelle (CDI-061)

- `load_game_transition` lit dans PostgreSQL l'état, la révision,
  `last_processed_at` et `serverTime`.
- Une commande calcule idle puis métier depuis ce même snapshot et
  `commit_game_transition` persiste état, temps, révision, RNG, événements et
  idempotence dans une transaction unique.
- `claim_game_transition` réserve d'abord `(userId, commandId)`. Une requête
  identique déjà active retourne `COMMAND_IN_PROGRESS`; un replay déjà commité
  recharge l'état sans rappeler l'autorité métier. Une réservation abandonnée
  peut être reprise après 30 secondes.
- Le commit compare ensemble la révision et `last_processed_at`. Un perdant
  concurrent reçoit `REVISION_CONFLICT` et recharge l'état canonique.
- Une commande métier refusée n'appelle aucun RPC d'écriture.
- Bootstrap et replay peuvent utiliser `commit_idle_transition`; ce commit
  incrémente lui aussi la révision.
- La limite glissante de 60 commandes par minute est sérialisée par joueur
  dans PostgreSQL et ne dépend pas de la table d'idempotence, limitée aux 50
  réponses les plus récentes.
- Une réponse autoritaire réussie expose `serverTime`, `lastProcessedAt`,
  `revision` et l'état du commit effectif.
- Le client `cdi-061` publie ce snapshot exact aux autres onglets du même
  compte via un `BroadcastChannel` isolé par `userId`. Les onglets récepteurs
  l'appliquent dans leur file de commandes uniquement s'il est plus récent ;
  ils ne relancent pas `bootstrap` et ne créent donc aucune révision idle
  supplémentaire pour se synchroniser.
- À l'ouverture du canal, chaque onglet publie également son dernier snapshot
  de bootstrap initial. Un bootstrap initial terminé plus tard ne peut donc
  pas laisser le futur onglet maître sur une révision silencieusement périmée.
- Les commandes, heartbeats, synchronisations manuelles et resets propagent
  leur snapshot. Un conflit affiche une réussite de resynchronisation
  uniquement si le rechargement canonique a réellement abouti.
- Un verrou navigateur exclusif, isolé par `userId`, désigne un seul onglet
  maître pour toutes les mutations, les commandes automatiques de donjon et
  le heartbeat temporel. Les autres onglets sont des observateurs sans
  contrôles de mutation et affichent les snapshots sans écrire.
- Un observateur peut demander `Prendre le contrôle`. Le maître termine sa
  commande courante, libère le verrou, puis le demandeur recharge un snapshot
  canonique avant de déverrouiller l'interface. La fermeture du maître
  transfère automatiquement le verrou à un observateur.
- Les RPC historiques `commit_idle_state` et `commit_game_command` restent
  présents pour l'historique de migration mais ne sont plus exécutables par
  `service_role`.

## Commandes donjon autoritaires (CDI-029)

- `dungeon.explore({ floor })` crée un encounter serveur actif pour la salle
  canonique ; le client ne fournit ni monstre, ni dégâts, ni récompenses.
- `dungeon.resolve()` résout l'encounter actif côté serveur, persiste le
  transcript complet, applique le loot et avance la progression en cas de
  victoire.
- `dungeon.retreat()` rappelle immédiatement l'escouade au campement, arrête
  l'exploration automatique et clôt l'encounter actif éventuel sans loot ni
  progression.
- `dungeon.auto_explore({ enabled })` modifie le mode d'exploration uniquement
  par commande authentifiée ; aucune mutation de donjon n'est exécutée hors
  ligne.

Les quatre commandes sont idempotentes via l'enveloppe commune et leurs
événements sont commités avec l'état canonique.

## RNG canonique (CDI-050)

- `state.rngState` est restauré avant une mutation stochastique.
- Le nouvel instantané RNG est commité dans `state` par
  `commit_game_transition`, avec le temps, la révision et les événements.
- Replay et conflit sont résolus avant l’appel de l’autorité métier.
- Un conflit PostgreSQL tardif `P0002/STALE_TEMPORAL_STATE` est également traduit en
  `REVISION_CONFLICT`, puis la révision canonique est rechargée.
- Une commande rejetée ne produit aucun état à committer.
- La résolution de donjon refuse de fonctionner sans RNG injecté.

- Un `rngState` absent sur une sauvegarde ancienne est migre. Un etat present
  mais invalide ou incompatible est refuse avec le code public
  `INVALID_GAME_STATE` et un `requestId`; il n est pas reclasse en panne
  `SERVICE_UNAVAILABLE`.
- Une graine structurellement valide doit aussi correspondre au `userId`,
  controle en lecture et par contrainte SQL.
- Le client conserve le transport en ligne mais verrouille les mutations et
  affiche une alerte de sauvegarde incompatible. Le reset et la suppression du
  compte restent accessibles depuis un bouton direct vers l onglet Compte;
  aucune reparation implicite n ecrase la sauvegarde.

Contrat complet : `docs/architecture/authoritative-rng.md`.

## Présentation et historique des combats (CDI-051)

- L'interface chaîne `dungeon.explore` puis `dungeon.resolve` depuis une seule
  action `Explorer la salle`. La résolution reste une commande interne et
  aucune action manuelle `Résoudre` n'est exposée.
- Le résultat canonique contient le transcript ordonné. L'interface le présente
  ligne par ligne toutes les 400 ms sans recalculer le combat.
- `state.encounterHistory` conserve au plus les 15 derniers combats résolus,
  transcript et récompenses inclus. Le serveur tronque la collection dans la
  même mutation atomique que la résolution.
- Un bootstrap restitue l'historique complet. Une rencontre active interrompue
  est résolue automatiquement à la reprise de la session.
- Une nouvelle exploration, manuelle ou automatique, attend la fin de la
  présentation du transcript courant.

### Restauration fonctionnelle CDI-054

Le transport appelle désormais l'unique moteur autoritaire
`src/domain/authoritativeDungeon.ts`. CDI-054 porte les rencontres pondérées,
catalogues, compétences, critiques, multi-frappes, esquives, défenses,
récompenses et progressions caractérisées depuis `640f89f`.

Le moteur lit les statistiques persistées des héros. Seul le domaine héros
recalcule les statistiques lors d'un level-up ou d'une évolution de classe.
Toute erreur du RNG canonique fait échouer atomiquement la commande.

Un équipement ou déséquipement déclenche également le recalcul explicite des
statistiques dérivées. Un gain d XP sans niveau les conserve. Un level-up
restaure une seule fois 20 % PV max et 30 % PM max ; une vocation restaure
ensuite intégralement PV et PM.

Lors d’une évolution T0 vers T1, le domaine héros conserve uniquement le
passif Novice et remplace ses actifs. Une classe ordinaire tire un actif et un
passif de classe. Le Mage tire deux sorts élémentaires distincts et un passif.
L’Acolyte reçoit `minor_heal` sans roll, puis tire un autre actif et un passif.
Ces tirages utilisent le RNG autoritaire de la commande et sont persistés dans
la même révision.

Le chargement valide chaque héros canonique avant mutation. Une identité, un
statut, des PV/PM, des compétences, des cooldowns ou des `calculatedStats`
incomplets produisent `INVALID_GAME_STATE`; le moteur de donjon n'invente
aucune statistique de remplacement.

Les anciennes projections locales `currentMonster`, `currentEncounterType` et
`combatTimer` ont été retirées de `DungeonPanel` et de `useDungeonSystem`.

CDI-051 est `Done`. La matrice automatisée et les parcours navigateur sont
consolidés dans CDI-046/CDI-048 ; le smoke Edge/Supabase distant est validé
dans CDI-047.

Audit : `docs/architecture/authoritative-dungeon-parity-audit.md`.
