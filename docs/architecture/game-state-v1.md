# GameStateV1

Le contrat partagé de l’état autoritaire est défini dans
`shared/contracts/authoritative.ts`. `src/domain/gameState.ts` conserve le
modèle historique du domaine client tant que son raccordement n’est pas
terminé.

- `createInitialGameState()` produit un état initial neuf et isolé.
- `resetGameState()` fournit le même reset pur, sans effet de bord.
- `validateGameState()` retourne des erreurs déterministes avec le chemin du champ invalide.
- `splitGameState()` sépare les données persistantes des données de session (`combatTimer`, `battleLogs`, `currentMonster`, `autoExplore`).

`CanonicalGameState.rngState` contient `algorithm`, `version`, `seed`, `state`
et `draws`. Il est migré, validé et persisté avec chaque mutation stochastique
autoritaire. Voir `docs/architecture/authoritative-rng.md`.

Les hooks React ne sont pas une source canonique. Leur raccordement aux
commandes autoritaires relève de CDI-051.
