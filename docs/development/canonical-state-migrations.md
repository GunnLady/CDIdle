# Migrations de l'état canonique

Le JSON persistant porte `stateVersion`. Cette version décrit uniquement le
format du snapshot de jeu ; elle est distincte de `games.schema_version`, qui
versionne l'enveloppe SQL/API.

## Exécution

`migrateCanonicalState` lit la version, applique successivement chaque étape
`vN -> vN+1`, puis `migrateTownState` exécute les validateurs canoniques et les
contrôles du catalogue. Une version absente désigne le format alpha `v0`. Une
version invalide ou supérieure à la version supportée est refusée avec un code
d'erreur diagnostiquable.

Les migrations doivent être pures : elles clonent leur entrée, ne lisent ni
l'heure ni un service externe et ne consomment aucun tirage RNG. Un snapshot à
la version courante n'est jamais complété silencieusement.

## Ajouter une version

1. Incrémenter `CURRENT_CANONICAL_STATE_VERSION` dans le contrat partagé.
2. Ajouter exactement une transformation `vN -> vN+1` dans
   `CANONICAL_STATE_MIGRATIONS` ; ne jamais sauter une version.
3. Ajouter une paire de fixtures anonymisées avant/après et son test golden.
4. Prouver pureté, déterminisme, idempotence, conservation des identifiants,
   de l'historique et de l'état RNG.
5. Tester le bootstrap, une commande après migration et le rejet des états
   impossibles à interpréter.

Une migration adapte un format, pas l'équilibrage du jeu. Toute valeur perdue
ou ambiguë doit provoquer une erreur explicite.

## Retirer une migration

Une étape ne peut être retirée qu'après preuve qu'aucun snapshot persistant ne
porte encore sa version d'entrée. Cette preuve doit couvrir la production et
les sauvegardes restaurables. Les fixtures historiques restent conservées pour
documenter le format et prévenir les régressions de compatibilité.

## Validation

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run test:db
npm.cmd run board:validate
```

Le test DB et toute validation avec Supabase local sont exécutés depuis le
terminal PowerShell utilisateur conformément aux règles du projet.
