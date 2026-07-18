# Suivis différés de `game-api`

Ces sujets sont volontairement sortis de CDI-022 après validation du contrat
HTTP. Ils doivent être repris avant une mise en production réelle.

## 1. Adaptateur Supabase de production

Ticket de reprise recommandé : CDI-023 (intégration Supabase), avec validation
finale dans CDI-035 (staging/production).

À réaliser :

- connecter `bootstrap`, `commands`, `reset` et `account` aux RPC/tables
  Supabase réels ;
- utiliser le repository CDI-020 et le dispatcher CDI-021 sans contourner leurs
  invariants ;
- définir les RPC manquants pour bootstrap, reset et suppression complète ;
- garantir les transactions, cascades, révisions et idempotence côté SQL ;
- configurer les variables staging/production sans secret dans le dépôt ;
- tester les erreurs réseau, les réponses 409/503 et les migrations additives ;
- ajouter un smoke test Edge contre Supabase local puis staging.

## 2. Vérification JWT réelle et allowlist

Ticket de reprise recommandé : CDI-023, avec hardening CDI-034.

À réaliser :

- vérifier le Bearer token avec Supabase Auth, sans simple présence d'en-tête ;
- contrôler `sub`, expiration, issuer, audience et utilisateur supprimé ;
- vérifier l'allowlist active au bootstrap et sur les routes mutatrices ;
- refuser un compte révoqué sans exposer la service-role key ;
- couvrir les JWT absents, expirés, mal signés et les changements d'allowlist ;
- vérifier que les logs ne contiennent ni JWT, ni email sensible, ni secret.

## Conditions de reprise

Le suivi sera considéré terminé uniquement avec : adaptateur réel branché,
vérification JWT cryptographique, tests locaux/staging reproductibles, smoke
tests Edge et audit de sécurité mis à jour.
