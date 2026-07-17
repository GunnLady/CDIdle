# Audit CDI-011 — incohérences et sujets à traiter

Ce document sert de base de travail pour les tickets héros suivants. Il distingue
les règles maintenant couvertes par `src/domain/hero.ts` des règles encore
portées par les hooks React.

## Couvert dans CDI-011

- coût `100 + 150 × nombre de héros` ;
- guilde obligatoire niveau 1 et capacité `niveau de guilde + 2` ;
- refus de recrutement si l’or est insuffisant ou la capacité atteinte ;
- renvoi pur d’un héros ;
- groupe actif limité à 4 et héros à PV strictement positif ;
- XP, montée multi-niveaux, croissance des stats, récupération de PV et évolution automatique.

## Incohérences encore présentes

| Sujet | État actuel | Ticket de suivi recommandé |
| --- | --- | --- |
| Génération de candidat | `Math.random` dans `gameCalculations`, races débloquées parfois ignorées lors du recrutement | CDI-026, avec `Rng` injecté |
| Déduction d’or et ajout du héros | Mutation répartie dans `useDungeonSystem`/`App` | CDI-026, commande atomique |
| Renvoi et activation | Règles purifiées, mais orchestration/logs encore dans React | CDI-026 |
| Repos et récupération hors combat | Effet temporel dans `App.tsx` | CDI-016/024 |
| Décision tardive du Novice | Seuils fixes ; pas de poids de convergence | CDI-038 |
| Elite et équipement initial | Génération aléatoire non injectée | CDI-026 |

## Points de vigilance

- Ne pas marquer un ticket `Done` avec des cases d’acceptation décochées.
- Ne pas confondre contrat domaine pur et intégration UI/backend.
- Toute nouvelle règle de progression doit avoir un test de non-régression et
  un exemple de décision documenté.
