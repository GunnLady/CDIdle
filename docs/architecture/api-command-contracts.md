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

Le traitement transactionnel, la déduplication persistée et la limite de débit restent du ressort de CDI-021.

## Commandes donjon autoritaires (CDI-029)

- `dungeon.explore({ floor })` crée un encounter serveur actif pour la salle
  canonique ; le client ne fournit ni monstre, ni dégâts, ni récompenses.
- `dungeon.resolve()` résout l'encounter actif côté serveur, persiste le
  transcript complet, applique le loot et avance la progression en cas de
  victoire.
- `dungeon.retreat()` clôt un encounter actif sans loot ni progression.
- `dungeon.auto_explore({ enabled })` modifie le mode d'exploration uniquement
  par commande authentifiée ; aucune mutation de donjon n'est exécutée hors
  ligne.

Les quatre commandes sont idempotentes via l'enveloppe commune et leurs
événements sont commités avec l'état canonique.

## RNG canonique (CDI-050)

- `state.rngState` est restauré avant une mutation stochastique.
- Le nouvel instantané RNG est commité dans `state` par
  `commit_game_command`, avec la révision et les événements.
- Replay et conflit sont résolus avant l’appel de l’autorité métier.
- Un conflit PostgreSQL tardif `P0002/STALE_REVISION` est également traduit en
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

CDI-051 reste en pause jusqu'à la matrice automatisée finale, la validation
Edge réelle et le parcours navigateur après `F5`.

Audit : `docs/architecture/authoritative-dungeon-parity-audit.md`.
