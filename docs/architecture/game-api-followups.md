# Suivis différés de `game-api`

Ces sujets sont volontairement sortis de CDI-022 après validation du contrat
HTTP. Ils doivent être repris avant une mise en production réelle et bloquent
explicitement la reprise de CDI-025 tant que les critères ci-dessous ne sont
pas satisfaits.

## 1. Adaptateur Supabase de production — CDI-040

Ticket d'implémentation : CDI-040. Il dépend de l'authentification runtime
CDI-039 et bloque le smoke gate CDI-041. CDI-023 reste terminé et n'est pas
rouvert.

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

## 2. Vérification JWT réelle et allowlist — CDI-039

Ticket d'implémentation : CDI-039. Son intégration réelle est validée par
CDI-041 ; le hardening approfondi relève de CDI-034 et la validation
opérationnelle finale de CDI-035.

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

## 4. Smoke gate Edge/Supabase local — CDI-041

CDI-041 valide ensemble CDI-039 et CDI-040 dans le runtime Edge et Supabase
local réels. Il couvre les routes principales, les erreurs 401/403/409/503,
l'idempotence, CORS, les identifiants de requête et l'absence de secrets.

Il bloque directement CDI-032. CDI-025 et CDI-026 peuvent avancer sur leur
implementation locale ; leur validation Edge/Supabase reste différée vers ce
smoke gate. Les tickets CDI-027 à
CDI-031 et CDI-033 à CDI-035 restent bloqués transitivement par leurs
dépendances existantes.

État au 2026-07-19 : le runtime Edge local démarre, l'authentification ES256
GoTrue est supportée et le refus `401` sans JWT est observé. La validation
authentifiée reste en pause car les appels REST/RPC depuis le worker Edge local
retournent `503` selon l'adresse réseau utilisée. La reprise nécessite une URL
Supabase joignable depuis ce worker et un issuer explicitement aligné.

### Verification distante a reprendre

Le smoke local a valide le refus `401` sans JWT et l'acceptation du JWT
authentifie, mais `POST /bootstrap` retourne encore `503` apres les essais
`127.0.0.1`, `host.docker.internal`, `kong`, passerelle Docker et reseau
`supabase_network_cdidle-local` avec les variables `GAME_API_*`. Le symptome
est trace comme un blocage possible de connectivite locale Edge vers
Kong/PostgREST, pas comme une regression metier demontree.

A la reprise, executer le meme smoke contre Supabase staging/production avec
`https://<project>.supabase.co`, secrets hors depot, issuer JWT aligne,
allowlist active et CORS verifie. Couvrir `/bootstrap`, `/commands`, `/reset`
et `/account`, puis `401/403/409/503`, replay/collision et `x-request-id`.
Classer explicitement le resultat : ecart local uniquement ou ecart
reproductible distant. Le `401` seul ne permet pas de declarer CDI-041 Done.

### Mise a jour du deblocage CDI-025

CDI-025 peut avancer sur son implementation metier independamment du smoke
local CDI-041. La validation d'integration Edge/Supabase reste toutefois un
gate de cloture dependant de CDI-041 ; les dependances du frontmatter ont ete
alignees en consequence.

La validation distante de CDI-025 est maintenant explicitement differee : les
tests locaux deterministes et le contrat serveur peuvent clore l'implementation
du ticket, tandis que la preuve HTTP Edge avec RLS/RPC/transaction atomique
sera realisee dans le smoke CDI-041 en staging ou production. Ce report est un
ecart planifie, pas une validation implicite.

## Conditions de reprise

Le suivi sera considéré suffisamment avancé pour reprendre les tranches
verticales uniquement lorsque CDI-039, CDI-040 et CDI-041 seront `Done`.
La validation staging/production et le hardening final restent respectivement
portés par CDI-035 et CDI-034.
