# Audit horloge/RNG — CDI-037

## Inventaire au 2026-07-19

| Zone | Accès direct | Classement | Décision |
| --- | --- | --- | --- |
| `src/domain/random.ts` | `Date.now` dans `systemClock` | frontière autorisée | conserver comme implémentation système |
| `src/domain/hero.ts`, `src/domain/combat.ts` | aucun accès global | sans écart | `Rng` injecté |
| `src/repositories/gameRepository.ts` | `new Date` par défaut du constructeur | frontière/adaptateur | horloge injectable déjà disponible |
| `src/utils/gameCalculations.ts` | anciennement plusieurs `Math.random` gameplay | migré | fonctions de génération/dégâts/proc acceptent `Rng`, avec adaptateur système par défaut |
| `src/utils/dungeonHelpers.ts` | anciennement `Math.random` loot | migré | tirages d’encounter/matériaux acceptent `Rng` |
| `src/hooks/useDungeonSystem.ts` | tirages combat/loot et `Math.random` | prévu dans la migration gameplay | ne pas considérer comme preuve serveur |
| `src/hooks/useGameLog.ts` | date/identifiant d’affichage | frontière UI | conserver local, hors mutation métier |
| `supabase/functions/game-api/*` | horloge/UUID de requête | frontière runtime | conserver ; ne pas importer dans le domaine |

## Contrôle ajouté

`npm run check:determinism` échoue si `Math.random`, `Date.now` ou `new Date`
réapparaît dans `src/domain`, à l’exception documentée de `random.ts`.

## État

Le contrat domaine et les helpers gameplay sont maintenant contrôlés. Les
hooks UI gardent des tirages locaux et devront être raccordés à l’autorité
serveur dans les tickets de domaine correspondants.
