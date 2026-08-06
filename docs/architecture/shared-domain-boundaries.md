# Frontieres du domaine partage

## Direction des dependances

```text
frontend (src) -> shared <- backend (supabase/functions)
```

Le backend ne doit jamais importer un module sous `src`. Le repertoire
`shared` ne doit importer ni `src`, ni React, ni le DOM, ni une configuration
ou un secret propre a un runtime.

## Responsabilites

- `shared/contracts` possede les contrats reseau, persistants et les modeles
  TypeScript neutres utilises par les regles communes.
- `shared/data` possede les catalogues statiques de gameplay : classes,
  competences, monstres, batiments et recompenses de vocation.
- `shared/domain` possede les regles pures et deterministes. Toute heure ou
  source aleatoire y est injectee.
- `src` possede React, la navigation et les adaptateurs navigateur. Les
  facades de compatibilite sous `src/domain`, `src/data` et `src/utils`
  conservent les imports frontend historiques sans dupliquer la logique.
- `supabase/functions/game-api` possede les entrees/sorties, l authentification,
  les transactions et l orchestration backend.

Le catalogue d objets reste sous `shared/domain/items`, source autoritaire
unique et deja partagee. CDI-079 ne change ni ses identifiants ni ses valeurs.

## Regles d import

- Les imports atteignables depuis une Edge Function portent une extension
  explicite compatible Deno.
- Un module partage ne lit pas `window`, `document`, `localStorage`,
  `Deno.env`, `process.env` ou `Math.random`.
- Les regles qui tirent de l aleatoire acceptent un `Rng` injecte.
- Les nouveaux calculs communs sont ajoutes dans `shared`, pas dans une facade
  `src`.
- Une facade ne contient que l adaptation propre au navigateur, par exemple
  la valeur RNG locale par defaut ; la formule reste dans `shared`.

## Garde automatisee

`tests/supabase-shared-import.test.ts` parcourt transitivement tous les imports
relatifs des Edge Functions. Le test echoue si un chemin atteint `src` ou si
une extension TypeScript explicite manque.

Les commandes de verification sont :

```powershell
npm.cmd run typecheck
npm.cmd run check:determinism
npm.cmd test -- --run
npm.cmd run build
```
