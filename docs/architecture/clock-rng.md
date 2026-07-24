# Horloge et RNG injectables

`src/domain/random.ts` fournit les dépendances non déterministes du domaine :

- `Clock` expose uniquement `now()`. Le domaine peut recevoir `fixedClock(...)` dans les tests et `systemClock` à la frontière applicative.
- `Rng` expose `next()` et `nextInt(...)`. `seededRng(seed)` produit la même séquence pour une même graine.

La persistance serveur est portée par
`supabase/functions/game-api/authoritative-rng.ts` et
`GameStateV1.rngState`. Le contrat transactionnel, la migration et les
garanties replay/conflit sont détaillés dans
`docs/architecture/authoritative-rng.md`.
