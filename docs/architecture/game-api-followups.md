# Suivis différés de `game-api`

Ces sujets sont volontairement sortis de CDI-022 après validation du contrat
HTTP. Ils doivent être repris avant une mise en production réelle et bloquent
explicitement la reprise de CDI-025 tant que les critères ci-dessous ne sont
pas satisfaits.

## 1. Adaptateur Supabase de production

Référence de blocage : CDI-025 (`Ville autoritaire de bout en bout`). La tâche
est suivie ici, puis validée dans CDI-035 (staging/production) ; CDI-023 reste
terminé et n'est pas rouvert.

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

Référence de blocage : CDI-025. Le hardening sécurité relève de CDI-034 et la
validation opérationnelle finale de CDI-035 ; CDI-023 reste terminé.

À réaliser :

- vérifier le Bearer token avec Supabase Auth, sans simple présence d'en-tête ;
- contrôler `sub`, expiration, issuer, audience et utilisateur supprimé ;
- vérifier l'allowlist active au bootstrap et sur les routes mutatrices ;
- refuser un compte révoqué sans exposer la service-role key ;
- couvrir les JWT absents, expirés, mal signés et les changements d'allowlist ;
- vérifier que les logs ne contiennent ni JWT, ni email sensible, ni secret.

## 3. Attendus fonctionnels de CDI-025 — Ville autoritaire

Le déblocage de CDI-025 ne signifie pas seulement que l'adaptateur HTTP répond.
Les mutations de ville doivent être exécutées côté serveur et ne jamais être
validées par une écriture optimiste du navigateur.

### Commandes à couvrir

- amélioration d'un bâtiment, avec coût, prérequis, niveau maximal et
  déduction atomique des ressources ;
- allocation et retrait d'un citoyen, avec capacité disponible, bâtiment
  requis et conservation de la somme des affectations ;
- déblocage d'un district, avec coût, prérequis, unicité et activation des
  multiplicateurs correspondants.

### Contrat client/serveur

- chaque mutation envoie `commandId`, `expectedRevision`, `clientVersion` et
  une commande typée à `/game-api/commands` ;
- le serveur vérifie l'utilisateur, l'allowlist, les préconditions et la
  révision avant toute écriture ;
- la réponse retourne l'état canonique, la nouvelle révision et les événements
  d'interface ; le client remplace son état local par cette réponse ;
- une révision périmée retourne HTTP `409` avec le snapshot canonique ; une
  indisponibilité retourne `503` sans mutation locale présentée comme validée ;
- les commandes rejouées sont idempotentes et une collision de `commandId` est
  rejetée.

### Preuves de clôture de CDI-025

- tests déterministes des trois familles de commandes, des préconditions, des
  coûts, des limites, des refus et des révisions concurrentes ;
- tests d'intégration Supabase local avec RLS, RPC et transaction atomique ;
- parcours UI vérifiant qu'aucune mutation ville ne contourne `game-api` ;
- audit post-push listant séparément contrôles sans écart, écarts réels et
  sujets prévus dans CDI-026 à CDI-031.

## Conditions de reprise

Le suivi sera considéré terminé uniquement avec : adaptateur réel branché,
vérification JWT cryptographique, tests locaux/staging reproductibles, smoke
tests Edge et audit de sécurité mis à jour. À ce moment seulement, le blocage
de CDI-025 pourra être levé et son implémentation pourra reprendre.
