# API et commandes

`src/domain/commands.ts` définit le contrat partagé entre le client et le futur dispatcher serveur.

- `GameCommand` est une union discriminée : chaque mutation possède un `type` stable et des paramètres explicites.
- `CommandEnvelope` impose `commandId`, `idempotencyKey` et `expectedRevision`.
- `CommandResult` distingue une réponse réussie (`revision`, état canonique, `replayed`) d'une erreur structurée.
- `validateCommandEnvelope` est pur et ne fait aucun accès réseau.

Le traitement transactionnel, la déduplication persistée et la limite de débit restent du ressort de CDI-021.
