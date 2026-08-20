# Horloge et RNG injectables

`src/domain/random.ts` fournit les dépendances non déterministes du domaine :

- `Clock` expose uniquement `now()`. Le domaine peut recevoir `fixedClock(...)` dans les tests et `systemClock` à la frontière applicative.
- `Rng` expose `next()` et `nextInt(...)`. `seededRng(seed)` produit la même séquence pour une même graine.

La persistance serveur est portée par
`supabase/functions/game-api/authoritative-rng.ts` et
`GameStateV1.rngState`. Le contrat transactionnel, la migration et les
garanties replay/conflit sont détaillés dans
`docs/architecture/authoritative-rng.md`.

L'horloge `systemClock` reste une dépendance de domaine locale. Elle n'est pas
l'horloge canonique de la partie. Depuis CDI-061, le backend charge
`clock_timestamp()` avec le snapshot PostgreSQL et utilise uniquement cette
valeur pour idle. Les projections React sont ancrées sur `serverTime` et
`lastProcessedAt`, puis animées avec `performance.now()` : changer l'heure
Windows ne crée donc ni gain ni rollback autoritaire.

Dans un même navigateur, chaque réconciliation temporelle ou mutation transmet aux autres
onglets le snapshot `game-api` déjà reçu (`revision`, état, `serverTime`,
`lastProcessedAt`). Cette réplication UI n'exécute aucun calcul temporel et ne
produit aucun commit. Toute mutation suivante reste validée par PostgreSQL.
Un seul onglet maître exécute les échéances de récupération et les reprises
visibles ; les observateurs ne créent donc aucune révision temporelle
concurrente. Un transfert de contrôle
est précédé d'un bootstrap canonique avant toute nouvelle mutation.
