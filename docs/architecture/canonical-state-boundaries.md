# Frontières de l'état canonique

`CanonicalGameState` est l'unique forme complète de l'état persistant après
migration. Les moteurs de ville, donjon, inventaire, forge et temps hors ligne
reçoivent et retournent ce type. Un moteur ne doit pas déclarer un second état
partiel portant les mêmes champs.

## Frontières non fiables

Les `Record<string, unknown>` restent autorisés uniquement avant validation :

- ligne JSON brute lue depuis Supabase ;
- payload de commande HTTP ;
- snapshot historique fourni à `migrateTownState` ;
- événement métier extensible.

Le transport Supabase conserve donc une représentation JSON générique. Dès que
`migrateTownState` termine, les autorités travaillent avec
`CanonicalGameState`. Ce `Record` de transport n'est pas un modèle métier
concurrent.

## Frontend et cache

`CanonicalReactState` est une projection explicite des champs possédant un
setter React. `districts` et `rngState` restent classés comme champs cache-only.
Les états React de rencontre et de forge réutilisent directement leurs
sous-types canoniques.

IndexedDB accepte les anciennes entrées à la lecture, mais une écriture exige
un `CanonicalGameState` complet accompagné de `revision`. Une entrée relue est
validée avant d'être appliquée au frontend.

## Compatibilité

Les champs de cycle temporaire (`pendingForge`, `pendingRecruit`,
`onboardingCandidates`, `pendingOnboardingCityName`) sont optionnels afin de
préserver les snapshots antérieurs à leur introduction. Les champs structuraux
du jeu restent obligatoires et sont vérifiés par le validateur partagé.

La commande de référence est :

```powershell
npm.cmd run test:state-simulation
```
