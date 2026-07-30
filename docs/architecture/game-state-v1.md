# GameStateV1

Le contrat partagé de l’état autoritaire est défini uniquement dans
`shared/contracts/authoritative.ts`. L ancien modèle client `gameState.ts`,
inaccessible depuis les entrées de production, a été supprimé par CDI-066.
L initialisation, la migration et la validation effectives sont assurées par
`supabase/functions/game-api/town-authority.ts` et les validateurs partagés.

`CanonicalGameState.rngState` contient `algorithm`, `version`, `seed`, `state`
et `draws`. Il est migré, validé et persisté avec chaque mutation stochastique
autoritaire. Voir `docs/architecture/authoritative-rng.md`.

Les hooks React ne sont pas une source canonique ; ils projettent l état reçu
de `game-api`.
