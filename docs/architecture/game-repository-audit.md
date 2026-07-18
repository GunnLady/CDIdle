# Audit repository de partie et initialisation (CDI-020)

## Périmètre vérifié

L'audit couvre la création paresseuse, le chargement idempotent, la validation
de `GameStateV1`, l'enveloppe canonique et la récupération d'une course de
création concurrente. Le repository reste indépendant du client Supabase,
dont l'intégration est prévue par CDI-023.

## Contrôles réalisés

- Une partie absente est créée avec `createInitialGameState()`, `revision = 0`
  et `schemaVersion = 1`.
- Une partie existante est chargée sans nouvelle création.
- Une collision de création est relue afin de retourner la ligne concurrente,
  sans écraser son état.
- L'enveloppe est validée par Zod : version, révision, dates ISO et invariants
  de `GameStateV1`.
- Les trois scénarios sont couverts par des tests Vitest déterministes.

## Écarts réels corrigés

| Écart | Correction |
| --- | --- |
| Le contrat de validation Zod et le scénario de course n'existaient pas. | Repository, schéma Zod et tests dédiés ajoutés. |

## Écarts déjà prévus dans des tickets futurs

| Sujet | Ticket prévu | Statut pour CDI-020 |
| --- | --- | --- |
| Accès Supabase réel et remplacement Firebase côté client | CDI-023 | Hors périmètre |
| Dispatcher transactionnel, commandes, révision et idempotence métier | CDI-021 | Hors périmètre |
| Routes HTTP `game-api`, JWT et CORS | CDI-022 | Hors périmètre |

## Conclusion

Le périmètre CDI-020 est couvert localement. La CI distante sera interrogée
après le push via le connecteur/API ; si aucun run n'est exposé, le résultat
sera déclaré inconnu.
