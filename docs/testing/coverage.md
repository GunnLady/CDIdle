# Baseline de couverture CDI-036

## Rapport de référence

La baseline a ete produite le 23 juillet 2026 sur le commit de reprise de
CDI-036 avec :

```powershell
npm.cmd run test:coverage -- --run --coverage.reporter=text --coverage.reporter=json-summary
```

Résultat : 17 fichiers de test, 108 tests réussis.

| Périmètre | Statements | Branches | Fonctions | Lignes |
| --- | ---: | ---: | ---: | ---: |
| Fichiers instrumentés par les tests | 62,72 % | 50,77 % | 68,70 % | 66,10 % |
| Domaine, dispatch, repository | 85,69 % | 76,50 % | 94,16 % | 94,40 % |
| Edge `game-api` | 77,32 % | 60,40 % | 83,33 % | 85,94 % |

## Seuils CI

Le script `scripts/check-coverage-thresholds.mjs` agrège les zones critiques
et refuse une baisse sous les seuils suivants :

| Zone | Statements | Branches | Fonctions | Lignes |
| --- | ---: | ---: | ---: | ---: |
| Domaine, dispatch, repository | 78 % | 70 % | 85 % | 88 % |
| Edge `game-api` | 75 % | 58 % | 80 % | 83 % |

Ces seuils sont des planchers de régression, pas un objectif de couverture
artificiel. Ils disposent d une marge faible par rapport a la baseline afin de
detecter une baisse utile sans bloquer les zones deja connues.

## Exclusions justifiées

- `src/assets/**` : fichiers binaires et ressources graphiques.
- `src/main.tsx` : bootstrap Vite minimal, couvert indirectement par le build.
- fichiers `.d.ts` et `src/vite-env.d.ts` : déclarations de types.
- `tests/**` : code de test, jamais code de production.

Les composants, hooks, données et utilitaires chargés par les tests restent
dans le rapport. Les fichiers non chargés ne sont pas artificiellement ajoutés
au dénominateur ; leurs lacunes sont suivies par CDI-045 et CDI-051, notamment
pour le raccordement autoritaire de l UI.

## Utilisation

```powershell
npm.cmd run test:coverage
npm.cmd run check:coverage
```

La CI publie le dossier `coverage` comme artefact. Une baisse sous un seuil
critique échoue explicitement le contrôle.
