---
id: CDI-066
title: Verifier et aligner Supabase pour l alpha
status: Doing
area: backend
priority: P1
size: L
risk: high
source: Audit de preparation alpha du 2026-07-30
depends_on: ["CDI-063", "CDI-064", "CDI-065"]
blocks: ["CDI-062"]
github_issue: null
related_docs: ["supabase", "workboard/data/Done/CDI-047/ticket.md", "docs/deployment/cdi-035-runbook.md", "docs/deployment/cdi-066-supabase-alpha-audit.md", "supabase/functions/game-api/index.ts", ".github/workflows/deploy.yml"]
---

# CDI-066 — Verifier et aligner Supabase pour l alpha

## Objectif

Vérifier que le projet Supabase distant, son schéma, son authentification, ses
secrets runtime et `game-api` correspondent exactement au backend attendu par
l alpha, puis corriger uniquement les écarts réels de manière contrôlée.

## Resultat utilisateur

Le frontend alpha se connecte à un backend identifié, à jour et protégé, dont
les parcours essentiels fonctionnent avec les mêmes contrats que ceux validés
localement.

## Contexte

CDI-047 a prouvé un smoke authentifié distant à un instant donné. Depuis, le
client, l autorité temporelle, la forge, les versions et la future collecte
d erreurs ont évolué. Le projet local reste lié au projet Supabase distant :
une vérification explicite est nécessaire avant d ouvrir le frontend hébergé.

## Perimetre autorise

- Identifier explicitement le projet Supabase utilisé comme environnement
  alpha et empêcher toute confusion avec une production future.
- Comparer la liste des migrations locales et distantes et rechercher une
  dérive de schéma, fonctions, RLS, privilèges ou grants.
- Vérifier que l Edge Function `game-api` déployée provient du code validé.
- Vérifier la présence, sans afficher leur valeur, des secrets et paramètres
  runtime requis.
- Vérifier JWT, issuer, usage serveur de `service_role` et cheats désactivés.
- Configurer exactement l origine Cloudflare alpha dans
  `GAME_API_ALLOWED_ORIGINS` dès que CDI-062 a créé cette origine ; CDI-066
  valide auparavant la liste locale exacte et prépare ce passage de relais.
- Vérifier Google uniquement et l allowlist après CDI-063.
- Vérifier l identité de version après CDI-064.
- Déployer puis vérifier la migration et la route de rapports d erreur après
  CDI-065.
- Rejouer les smokes backend essentiels avec des comptes et données contrôlés.
- Supprimer les anciens chemins client, adaptateurs, tests et dépendances dont
  l absence du graphe de production et le remplacement serveur sont prouvés.
- Corriger un écart réel uniquement par migration additive, secret runtime ou
  redéploiement explicite depuis le commit validé.

## Hors perimetre

- Ajouter monitoring, alertes, dashboard ou analytics.
- Réaliser des tests de charge ou une campagne de performance distante.
- Construire une politique industrielle de sauvegarde ou restauration.
- Auditer les quotas, coûts ou offres commerciales.
- Créer un second projet Supabase de production.
- Modifier le gameplay, le catalogue d objets ou le périmètre CDI-060.
- Supprimer les tables de données ou contrats explicitement conservés pour un
  ticket futur, notamment les tables de loot de boss de CDI-060.
- Effectuer une migration destructive ou une correction distante non présentée.

## Contrat d'implementation

- Les faits distants sont vérifiés en lecture seule avant toute écriture.
- Toute dérive trouvée est présentée avec sa cause, sa correction et son impact
  avant application distante.
- Les migrations existantes ne sont jamais modifiées ; toute correction SQL est
  additive.
- Aucun secret, JWT, email, payload ou état de partie n est affiché, copié dans
  le dépôt ou conservé dans les preuves.
- `service_role` reste exclusivement dans l Edge Runtime et les outils
  administratifs contrôlés.
- CORS utilise une liste d origines exactes sans joker.
- Les tests destructifs utilisent uniquement un compte alpha dédié et leur
  portée est annoncée avant exécution.
- Le commit du backend déployé et la version client attendue sont consignés.
- Un module n est supprimé comme mort que si son remplacement est identifié,
  qu il est absent des deux entrées de production et que les documents actifs
  ne le désignent plus comme source normative.

## Dependances

- CDI-063 — Google OAuth uniquement et allowlist validée.
- CDI-064 — identité traçable des builds et commandes.
- CDI-065 — stockage et route de rapports d erreur.

## Criteres d'acceptation

- [ ] Le projet Supabase alpha est identifié sans ambiguïté.
- [ ] Toutes les migrations locales attendues sont appliquées à distance et
  aucune dérive de schéma, RLS, fonctions ou privilèges ne reste inexpliquée.
- [ ] `game-api` correspond au commit validé et démarre avec ses paramètres
  runtime attendus.
- [ ] Google est le seul fournisseur alpha et l allowlist est active.
- [ ] Cheats distants désactivés, `service_role` absent du client et JWT/issuer
  cohérents.
- [ ] Avant CDI-062, les seules origines locales décidées sont acceptées et une
  origine inconnue reçoit `CORS_FORBIDDEN` ; l ajout et le smoke de l origine
  Cloudflare exacte sont explicitement transmis à CDI-062.
- [ ] Sans JWT, `bootstrap` reçoit 401 ; avec le compte dédié, il reçoit 200.
- [ ] Une mutation contrôlée persiste après un nouveau bootstrap.
- [ ] Idempotence, conflit concurrent et limite de commandes restent actifs.
- [ ] Reset et suppression fonctionnent sur un compte dédié sans toucher les
  autres testeurs.
- [ ] Un rapport d erreur versionné est accepté, nettoyé et analysable, tandis
  qu un rapport interdit ou trop volumineux est refusé.
- [ ] Les chemins client remplacés par l autorité serveur, leurs tests devenus
  trompeurs, leurs dépendances et assets orphelins sont retirés sans supprimer
  les données réservées à CDI-060.
- [ ] Aucun écart backend réel ne reste non corrigé ou non tracé avant CDI-062.

## Tests

- `npx.cmd supabase migration list`
- Inspection read-only du schéma, des fonctions, RLS et grants distants.
- Liste des fonctions et secrets par leur nom uniquement.
- Smoke sans JWT et smoke authentifié.
- Mutation contrôlée suivie d un bootstrap.
- `npm.cmd run test:integration`
- Tests contrôlés idempotence, concurrence et rate limit.
- Smoke CORS local positif et origine inconnue négative ; smoke Cloudflare
  différé à CDI-062 après création de l URL.
- Smoke du rapport d erreur CDI-065.
- `npm.cmd run test:db`
- `npm.cmd run check:secrets`
- `npm.cmd run check:logs`
- `npm.cmd run board:validate`

## Validation manuelle

Avec le compte alpha dédié et sans frontend local, vérifier successivement le
401 sans JWT, le bootstrap 200, une mutation persistée, le conflit concurrent,
le CORS Cloudflare, un rapport d erreur versionné puis le reset et la suppression
du compte dédié. Contrôler que les autres comptes et parties sont inchangés.

## Preservation

- Préserver les données des testeurs existants et le projet distant actuel.
- Préserver migrations additives, RLS hostile, atomicité, idempotence, autorité
  temporelle et RNG canonique.
- Préserver les logs sans PII et les secrets hors dépôt.
- Ne jamais transformer un diagnostic en mutation distante implicite.

## Risques

- Le lien Supabase local cible déjà le projet distant et une commande mal
  choisie peut modifier l alpha.
- Une dérive manuelle peut ne pas apparaître dans la seule liste de migrations.
- Un secret CORS, JWT ou issuer incorrect peut rendre tout le frontend
  indisponible.
- Les tests reset/suppression sont destructifs pour le compte dédié.
- Un redéploiement depuis un mauvais commit peut désaligner client et backend.

## Handoff

Fournir la référence du projet alpha, le commit backend et la version client,
la matrice migrations/schéma/RLS/secrets par nom, les écarts trouvés et leurs
corrections, les statuts des smokes, les `requestId` non sensibles utiles et la
preuve que les comptes hors test sont restés inchangés.
