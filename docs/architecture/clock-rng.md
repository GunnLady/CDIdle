# Horloge et RNG injectables

`src/domain/random.ts` fournit les dépendances non déterministes du domaine :

- `Clock` expose uniquement `now()`. Le domaine peut recevoir `fixedClock(...)` dans les tests et `systemClock` à la frontière applicative.
- `Rng` expose `next()` et `nextInt(...)`. `seededRng(seed)` produit la même séquence pour une même graine.

La graine et son état doivent être persistés par le serveur lors de l'exécution autoritaire. Ce ticket définit le contrat et la primitive déterministe ; le remplacement des appels des hooks et la persistance serveur sont traités par les tickets de domaine/backend concernés.
