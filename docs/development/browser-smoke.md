# Smoke navigateur local

Le smoke CDI-084 complète les tests Vitest en traversant un vrai Chromium, le
frontend Vite, Supabase local, l'Edge Function `game-api` et la persistance.
Il ne remplace pas les tests unitaires, DB, d'intégration ou le pipeline E2E
injecté.

## Prérequis et exécution

Depuis PowerShell, à la racine du dépôt :

```powershell
npm.cmd exec --offline -- supabase start
npm.cmd run test:browser
```

Le test lit exclusivement les clés jetables retournées par `supabase status`,
refuse toute URL Supabase non locale et génère en mémoire un JWT de dix minutes.
Il crée une identité Google technique éphémère pour la fixture allowlistée
`local@example.test` avec la clé `service_role` locale, conservée côté Node et
jamais transmise au navigateur. L'allowlist reste non modifiable par le test.
Aucun bearer personnel, compte Google réel, fichier de session ou secret
distant n'est nécessaire.

## Parcours couvert

Le scénario initialise le jeu de l'identité éphémère via `/bootstrap`, le
remet à zéro, réalise l'onboarding, construit la ferme via le vrai endpoint
`/commands`, recharge la page et vérifie que le niveau persisté est restauré. Il injecte ensuite une
réponse HTTP 503 sur la prochaine commande au niveau du navigateur afin de
valider le message visible et le rollback optimiste, sans rendre le chemin de
succès dépendant d'une panne réelle. L'identité Auth, ses données de jeu et ses
événements de limitation sont ensuite supprimés par cascade, y compris après
échec. La fixture d'allowlist seedée est préservée.

Les erreurs console, échecs réseau et réponses HTTP inattendues font échouer le
test. Playwright capture une image à l'échec et produit un diagnostic nettoyé
contenant uniquement méthodes, statuts et chemins. Les traces sont désactivées
pour éviter de conserver un en-tête d'autorisation. La CI n'archive ces
diagnostics qu'en cas d'échec.

## CI

La CI démarre déjà Supabase local. Elle installe uniquement Chromium, lance
`npm run test:browser`, puis publie `test-results/browser` si le smoke échoue.
Le test reste séquentiel et utilise une identité propre à son exécution afin de
ne pas consommer le quota du moteur de test temporel.

En cas d'indisponibilité locale de l'Edge Function, le test échoue tôt sur le
reset avec le statut et le corps JSON non secret. Il faut alors diagnostiquer
Supabase local ; le smoke ne doit pas être contourné avec un token distant.
