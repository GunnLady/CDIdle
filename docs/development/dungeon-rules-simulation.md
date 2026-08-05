# Simulation des règles de donjon

## Objectif

Cette simulation vérifie les règles de frappes ennemies et d’enchaînement des
rencontres à travers les véritables commandes autoritaires du donjon.

```powershell
Set-Location D:\codex\CDIdle
npm.cmd run test:dungeon-simulation
```

Elle ne démarre ni Vite ni Supabase et ne réimplémente aucune règle métier.

## Moteur utilisé

Vitest exécute directement :

- `applyDungeonCommand` pour démarrer et résoudre les rencontres ;
- `resolveAuthoritativeDungeonEncounter` pour le combat et les événements ;
- `monster-combat.ts` pour les profils normal, élite et boss ;
- une source RNG déterministe injectée par le test.

La commande lance le parcours d’intégration et les tests de bornes associés.

## Parcours simulé

Le même état canonique enchaîne trois commandes complètes :

1. une rencontre `trap` ;
2. un `fight`, car un second `trap` immédiat est interdit ;
3. un nouveau `trap`, redevenu autorisé après le combat.

Les tests associés contrôlent également les seuils de 35 % pour les élites,
50 % pour les boss, le plafond de deux frappes, la parité avec l’IA tactique et
le combat forcé de la salle finale.

## Résultat attendu

La commande doit terminer avec un code nul. Tout changement de sélection,
profil, consommation RNG ou contrat autoritaire provoque un échec explicite.

## Limites

La simulation valide le domaine et l’autorité, pas la mise en page visuelle du
donjon. La compatibilité du rendu reste couverte par les tests de
`DungeonPanel` et par le build de production.
