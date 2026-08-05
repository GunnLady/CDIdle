# Simulation de compatibilité de l'état canonique

## Objectif

Cette simulation remplace le contrôle manuel des anciennes sauvegardes lors
d'une modification de `CanonicalGameState`.

```powershell
Set-Location D:\codex\CDIdle
npm.cmd run test:state-simulation
```

Elle ne démarre ni Vite, ni Supabase, ni navigateur.

## Moteur utilisé

Vitest exécute les vraies frontières de l'application :

- `migrateTownState` remet un snapshot historique au format courant ;
- `validateCanonicalGameState` vérifie le contrat runtime partagé ;
- `projectCanonicalState` vérifie la projection React ;
- `applyTownCommand` prouve qu'un état migré reste exploitable par l'autorité.

La simulation ne duplique pas les formules de migration ou de validation.

## Scénarios

Le premier scénario retire `rngState` et `estimatedDps` d'un snapshot afin de
représenter deux anciennes générations de sauvegardes. Il vérifie leur
reconstruction, la présence de tous les champs requis et la validité finale.

Le second effectue un aller-retour JSON, projette l'état pour le frontend puis
applique une commande autoritaire. Il vérifie également que les anciens champs
UI `combatTimer`, `currentMonster`, `battleLogs` et `soundEnabled` ne sont pas
réintroduits dans l'état persistant.

Le troisième construit un snapshot complet avec forge et recrutement en
attente, candidats d'onboarding, rencontre active, transcript et trois types de
butin. Il traverse IndexedDB, la projection React et la synchronisation
inter-onglets avant d'être revalidé.

## Résultat attendu

La commande doit terminer avec trois tests réussis et un code nul. Une rupture
de migration, de validation, de projection ou de commande fait échouer la
simulation avec le champ concerné.

## Limites

Cette simulation couvre la forme et la traversée du snapshot, pas la migration
SQL d'une ligne `public.games`, la concurrence réseau ou le rendu visuel. Ces
aspects restent couverts respectivement par les tests de base de données, les
tests du pipeline autoritaire et les tests de composants.
