# Latence du bootstrap canonique

## Baseline avant CDI-071

L'inventaire du parcours a identifié six déclencheurs légitimes : démarrage ou
F5, reconnexion, heartbeat, prise de contrôle d'un onglet, conflit de révision
et synchronisation manuelle.

Trois coûts évitables existaient :

- le cache confirmé n'était affiché qu'après un échec réseau ;
- la première prise de contrôle relançait `/bootstrap` immédiatement après le
  bootstrap initial ;
- `hero.recruit_confirm` relançait `/bootstrap` alors que la réponse de commande
  contenait déjà le snapshot canonique confirmé.

La file distinguait déjà attente et réseau, mais pas l'application React. Le
serveur ne séparait pas chargement Supabase, calcul idle et commit.

## Parcours après optimisation

- Le cache IndexedDB confirmé est lu en parallèle du réseau et affiché en
  lecture seule. Il n'active jamais les mutations avant la réconciliation.
- Une réponse autoritaire arrivée en premier interdit au cache de la remplacer.
- Toute acquisition du contrôle, initiale, passive ou explicitement demandée,
  resynchronise la révision avant d'autoriser les mutations. L'âge d'un
  snapshot ne constitue pas une preuve suffisante de son autorité.
- Le heartbeat reste abandonné lorsque la file contient une commande.
- La confirmation de recrutement conserve directement le snapshot renvoyé par
  `/commands`.

## Mesures disponibles

Les builds de développement et alpha émettent deux événements sans état de jeu
ni identifiant utilisateur :

- `Canonical operation timing` : raison, attente en file, réseau, application
  et durée totale frontend ;
- `Canonical bootstrap server timing` : chargement DB, calcul idle, commit et
  durée totale de l'adaptateur Supabase.

La différence entre le réseau frontend et le total serveur représente
principalement transport, authentification Edge et transfert JSON.

## Budgets

- cache confirmé utilisable localement en au plus 100 ms ;
- zéro bootstrap de confirmation après une commande réussie ;
- zéro heartbeat ajouté lorsque la file est occupée ;
- une réconciliation obligatoire avant chaque acquisition du contrôle ;
- aucune mutation avant la fin de la réconciliation réseau.

La simulation locale reproductible est :

```powershell
npm.cmd run test:bootstrap-simulation
```

## Mesure alpha avant clôture

Dans la console du navigateur alpha, filtrer sur `Canonical` puis relever les
événements pour un F5, une reconnexion, un heartbeat, une prise de contrôle et
une synchronisation manuelle. Un conflit se vérifie avec le scénario
inter-onglets existant. Comparer `queueWaitMs`, `networkMs`, `applicationMs`,
`operationMs` et les quatre phases serveur.

La mesure distante reste une validation d'environnement : elle ne doit pas
contenir de bearer, de snapshot ou de payload de commande.
