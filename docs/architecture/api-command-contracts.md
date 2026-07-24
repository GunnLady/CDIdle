# API et commandes

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

### Ecart bloquant CDI-054

Le transport et l historique sont en place, mais le moteur serveur reste une
resolution simplifiee. Il ne reproduit pas encore la reference `640f89f` :
encounters ponderes, catalogues, competences, critiques, multi-frappes,
esquives, defenses, recompenses et progressions divergent.

CDI-054 porte la parite fonctionnelle et l ordre exact des rolls. CDI-051 reste
en pause jusqu aux golden tests reference/backend.

Audit : `docs/architecture/authoritative-dungeon-parity-audit.md`.
