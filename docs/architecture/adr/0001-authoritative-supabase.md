# ADR 0001 — Supabase et autorité serveur

- **Statut :** accepté
- **Date :** 2026-07-15
- **Remplace :** le prototype Firebase piloté par le client

## Décision

CDIdle utilise Supabase comme backend cible. Le jeu est serveur-autoritaire :
le serveur valide les commandes, applique les règles, avance l'aléatoire,
calcule les récompenses et persiste l'état canonique.

Le client appelle uniquement les routes publiques suivantes :

- `POST /game-api/bootstrap`
- `POST /game-api/commands`
- `POST /game-api/reset`
- `DELETE /game-api/account`

Les contrats sont `GameStateV1`, `GameCommandRequest` et `GameEnvelope`. Les
commandes portent une révision attendue et une clé d'idempotence ; une révision
dépassée renvoie `409` sans écraser l'état concurrent.

## Authentification et données

Google OAuth est le seul fournisseur. Un hook Supabase `Before User Created`
refuse tout email absent de `alpha_allowlist`. Les tables de jeu sont protégées
par RLS ; les écritures de gameplay passent par l'API autoritaire.

Le client ne conserve qu'un cache de lecture IndexedDB. Les anciennes
sauvegardes Firebase et localStorage ne sont pas importées : une nouvelle partie
est créée après la bascule.

## Hors connexion

Au retour, seules les ressources de ville, citoyens, PV et mana peuvent être
recalculées, avec un plafond de 24 heures. Donjon, butin, forge, recrutement et
autres mutations ne progressent jamais hors connexion.

## Conséquences

Firebase reste uniquement une dépendance historique du prototype jusqu'au
ticket `CDI-023`. Aucun nouveau ticket ne doit étendre cette dépendance.
