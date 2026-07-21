# CDIdle — Plan de transformation fullstack autoritaire

**Statut :** approuvé le 15 juillet 2026

**Pilotage :** protocole Eclipse, Workboard `CDI-###`

**État :** Workboard matérialisé ; implémentation du gameplay non commencée

Ce document est la source canonique du plan approuvé pour transformer le
prototype CDIdle en alpha privée Friends & Family. Les tickets détaillés du
Workboard traduisent ce plan en tranches d'exécution ; ils ne doivent pas en
modifier les décisions sans validation explicite du produit.

## 1. Décisions verrouillées

- Conserver l'interface et le gameplay actuels avant toute évolution
  fonctionnelle.
- Remplacer Firebase par deux projets **Supabase Free**, un pour staging et un
  pour production. L'offre gratuite ne facture pas les dépassements mais peut
  restreindre ou mettre en pause le service.
- Utiliser **Google OAuth uniquement** et une allowlist exacte d'adresses email.
  Un hook Supabase `Before User Created` refuse les inscriptions non autorisées.
- Héberger les clients statiques staging et production sur **Cloudflare Pages
  Free**, sans Pages Functions.
- Rendre le serveur autoritaire pour toute mutation, tout tirage aléatoire,
  toute récompense et tout combat.
- Limiter le client à l'affichage, aux préférences et à un cache IndexedDB en
  lecture seule.
- Abandonner les sauvegardes Firebase et localStorage du prototype : nouvelle
  partie obligatoire, sans import ni migration.
- Plafonner l'accumulation hors-ligne à 24 heures. Elle couvre uniquement les
  ressources urbaines, l'immigration/croissance des citoyens et la récupération
  HP/mana des héros.
- Interdire hors connexion la progression du donjon, le loot, la forge, le
  recrutement et toute autre mutation.
- Réserver les cheats au développement local et au staging ; ils ne doivent
  jamais être présents dans le bundle de production.

Références externes :

- [Contrôle des coûts Supabase](https://supabase.com/docs/guides/platform/cost-control)
- [Auth Hooks Supabase](https://supabase.com/docs/guides/auth/auth-hooks)
- [Limites des Edge Functions](https://supabase.com/docs/guides/functions/limits)
- [Tarification Cloudflare Pages](https://developers.cloudflare.com/pages/functions/pricing/)

## 2. Architecture cible

### 2.1 Organisation du dépôt

L'application Vite reste sous `src/` afin de limiter les déplacements. Les
surfaces suivantes sont ajoutées progressivement :

- `shared/contracts/` : schémas Zod, types API et types de sauvegarde.
- `shared/domain/` : logique de jeu pure, déterministe et indépendante de React.
- `supabase/` : configuration locale, migrations SQL, tests RLS et Edge
  Function `game-api`.
- `workboard/` : tableau local et tickets Markdown versionnés.
- `.github/workflows/` : validation, staging et promotion production.

Le code partagé doit être importable par Vite, Vitest et l'Edge Runtime. Cette
compatibilité sera prouvée avant le déplacement de la logique de gameplay.

### 2.2 Stockage Supabase

#### `alpha_allowlist`

- Email normalisé, état actif, note et date d'ajout.
- Aucune lecture publique.
- Suppression de l'entrée lors de la suppression définitive du compte.

#### `profiles`

- Identifiant utilisateur, nom affiché et dates techniques.
- Lecture limitée au propriétaire.

#### `games`

- Une ligne par utilisateur.
- Champs principaux : `schema_version`, `revision`, `state JSONB`,
  `last_processed_at`, `created_at`, `updated_at`.
- Lecture du propriétaire autorisée par RLS.
- Aucune mutation directe depuis le navigateur.

#### `game_commands`

- Identifiant de commande, empreinte de requête, révisions et événements de
  réponse.
- Conservation pendant 24 heures avec un maximum de 50 réponses par utilisateur.
- Événements limités à 128 Ko ; le snapshot complet n'est pas dupliqué dans
  l'historique.

Les écritures passent exclusivement par l'Edge Function. Une fonction SQL
atomique vérifie l'idempotence et la révision au moment du commit.

### 2.3 API publique

#### `POST /game-api/bootstrap`

- Vérifie le JWT et l'allowlist.
- Crée la partie si nécessaire.
- Applique l'accumulation autorisée depuis `last_processed_at`.
- Retourne le snapshot canonique.

#### `POST /game-api/commands`

- Reçoit `commandId`, `expectedRevision`, `clientVersion` et une commande typée.
- Retourne le nouveau snapshot, les événements, le rapport idle et le transcript
  de combat éventuel.
- Refuse une révision périmée par HTTP `409` avec le snapshot canonique.

#### `POST /game-api/reset`

- Réinitialise uniquement la partie.
- Conserve le compte et l'allowlist.
- Incrémente la révision.

#### `DELETE /game-api/account`

- Supprime la partie, le profil, l'allowlist et l'utilisateur Auth côté serveur.
- Termine la session et purge le cache local.

Types publics principaux :

```ts
type GameCommandRequest = {
  commandId: string;
  expectedRevision: number;
  clientVersion: string;
  command: GameCommand;
};

type GameEnvelope = {
  schemaVersion: 1;
  revision: number;
  serverTime: string;
  lastProcessedAt: string;
  state: GameStateV1;
  idleReport?: IdleReport;
};

type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "NOT_ALLOWED"
  | "VALIDATION_FAILED"
  | "REVISION_CONFLICT"
  | "IDEMPOTENCY_KEY_REUSED"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";
```

Le premier appareil qui valide une commande gagne. Un appareil utilisant une
révision périmée recharge l'état canonique avec une explication ; aucune fusion
implicite n'est réalisée.

### 2.4 Gameplay autoritaire

- La graine pseudo-aléatoire est conservée dans `GameStateV1` et avancée
  uniquement par le serveur.
- Toutes les mutations deviennent des commandes typées : onboarding,
  bâtiments, citoyens, districts, recrutement, activité des héros, équipement,
  recyclage, forge, choix d'étage, retraite et exploration.
- Les étapes intermédiaires de recrutement et de forge sont persistées pour
  éviter les divergences entre appareils et les rerolls abusifs.
- Une exploration résout un encounter complet côté serveur.
- Le transcript conserve chaque tour, cible, jet, effet, coût, dégât, soin,
  récompense et changement d'état ; le client ne fait que le rejouer.
- Un encounter est limité à 500 actions atomiques. Au-delà, il se termine en
  retraite sans récompense.
- `last_processed_at` est avancé à l'heure serveur après traitement ; le temps
  supérieur aux 24 heures autorisées est définitivement écarté.
- Le son, l'onglet actif, les filtres et préférences restent locaux.
- Le cache est indexé par utilisateur et supprimé à la déconnexion, à la
  révocation ou à la suppression du compte.
- Hors connexion, tous les contrôles mutateurs sont désactivés et aucun journal
  de commandes différées n'est créé.

## 3. Workboard et protocole Eclipse

### 3.1 Format

```text
workboard/data/{ToDo,Doing,Later,Paused,Done}/CDI-###/ticket.md
```

Les sources, tickets et serveur local sont suivis par Git. Le serveur écoute
uniquement sur `127.0.0.1:4173` et permet d'afficher, rechercher, créer, éditer,
déplacer et supprimer les tickets.

Le frontmatter obligatoire est :

```yaml
id:
title:
status:
area:
priority:
size:
risk:
source:
depends_on:
blocks:
github_issue:
related_docs:
```

Le validateur bloque les doublons, incohérences chemin/statut, dépendances
inconnues, cycles, tickets incomplets et plus de trois tickets en `Doing`.

Chaque ticket contient au minimum : objectif, résultat utilisateur, contexte,
périmètre autorisé, hors périmètre, contrat d'implémentation, dépendances,
critères d'acceptation, tests, validation manuelle, préservation, risques et
handoff.

### 3.2 Synchronisation GitHub

- Le ticket Markdown est la source de vérité.
- Chaque ticket est reflété par une Issue `[CDI-###] Titre`.
- La synchronisation est à sens unique pour le titre, le corps et les labels
  `area:*`, `priority:*`, `size:*` et `status:*`.
- L'Issue reste ouverte en `Later`, `ToDo`, `Doing` ou `Paused`, puis se ferme
  en `Done`.
- Les commentaires GitHub sont un journal distant et ne réécrivent pas le ticket.
- Le jeton GitHub reste exclusivement dans l'environnement du processus local.

### 3.3 Pilotage Eclipse

- Sol seul modifie les statuts, délègue, révise, synchronise les Issues et
  intègre.
- Luna implémente. Un autre modèle n'est autorisé que si l'utilisateur le
  désigne explicitement au début de la session.
- Trois tickets maximum peuvent être parallélisés, uniquement avec dépendances
  satisfaites et surfaces d'écriture distinctes.
- Un ticket passe en `Done` après intégration dans `staging`, contrôles verts et
  preuves consignées.

## 4. Catalogue des tickets

### Fondation

1. **CDI-001 — ADR et contrat du dépôt** : architecture, invariants,
   environnements, politique zéro facturation et guide Eclipse.
2. **CDI-002 — Harnais de caractérisation** : Vitest, React Testing Library,
   fixtures et tests du comportement actuel. Dépend de CDI-001.
3. **CDI-003 — CI et commandes standardisées** : typecheck, ESLint, tests,
   build, audit et validation Workboard. Dépend de CDI-002.
4. **CDI-004 — Hygiène dépendances/configuration** : retirer uniquement les
   dépendances prouvées inutiles et externaliser les configurations. Dépend de
   CDI-003.
5. **CDI-005 — Correction du niveau maximal de guilde** : test rouge puis
   suppression du `case "guilde"` dupliqué. Dépend de CDI-002.
6. **CDI-006 — Correction des statistiques du Donjon** : faire dériver
   l'affichage du calcul canonique. Dépend de CDI-002.

### Contrats et domaine déterministe

7. **CDI-007 — `GameStateV1` canonique** : état initial, invariants, reset et
   séparation persistant/transitoire. Dépend de CDI-005 et CDI-006.
8. **CDI-008 — Contrats API et commandes** : unions discriminées, réponses,
   erreurs, révision et idempotence. Dépend de CDI-007.
9. **CDI-009 — Horloge et RNG injectables** : graine persistée, tirages
   reproductibles et absence de `Date.now`/`Math.random` dans le domaine.
   Dépend de CDI-002.
10. **CDI-010 — Domaine ville/citoyens/districts** : ressources, taux,
    bâtiments, allocations, déblocages et immigration. Dépend de CDI-007 et
    CDI-009.
11. **CDI-011 — Domaine héros/recrutement/progression** : génération,
    renommage, confirmation, renvoi, activité, XP et classes. Dépend de CDI-007
    et CDI-009.
12. **CDI-012 — Domaine inventaire/équipement** : piles, modificateurs,
    compatibilité, équiper et déséquiper. Dépend de CDI-007.
13. **CDI-013 — Domaine forge/recyclage** : extraction de la logique UI,
    prévisualisation, finalisation et annulation. Dépend de CDI-009 et CDI-012.
14. **CDI-014 — Domaine progression de donjon** : étages, salles, encounters,
    retraite et récompenses. Dépend de CDI-007, CDI-009 et CDI-011.
15. **CDI-015 — Moteur de combat et transcript** : résolution complète serveur,
    actions détaillées et limite de sécurité. Dépend de CDI-009, CDI-011,
    CDI-012 et CDI-014.
16. **CDI-016 — Moteur idle plafonné** : ville, citoyens et récupération des
    héros uniquement. Dépend de CDI-009, CDI-010 et CDI-011.

### Backend Supabase

17. **CDI-017 — Socle Supabase local** : CLI, Docker, migrations, seed de test
    et preuve d'import du code partagé. Dépend de CDI-003 et CDI-008.
18. **CDI-018 — Schéma PostgreSQL et RLS** : tables, contraintes, politiques,
    fonctions atomiques et tests pgTAP. Dépend de CDI-007, CDI-008 et CDI-017.
19. **CDI-019 — Google OAuth et allowlist** : deux clients OAuth, hook
    pré-inscription, révocation et script administratif. Dépend de CDI-017 et
    CDI-018.
20. **CDI-020 — Repository de partie et initialisation** : création paresseuse,
    chargement, validation Zod et état initial. Dépend de CDI-018 et CDI-019.
21. **CDI-021 — Dispatcher transactionnel** : révision, empreinte de requête,
    idempotence, limite de 60 commandes/minute et commit atomique. Dépend de
    CDI-008, CDI-009 et CDI-020.
22. **CDI-022 — Edge Function `game-api`** : routes, JWT, CORS strict,
    validation, erreurs et identifiants de requête. Dépend de CDI-021.
23. **CDI-023 — Client Supabase et suppression Firebase** : session Google,
    adaptateur API, suppression de Firebase et abandon de la sauvegarde manuelle.
    Dépend de CDI-019 et CDI-022.
24. **CDI-024 — Bootstrap et cache local sûr** : IndexedDB par utilisateur,
    reprise de session, lecture seule hors connexion et purge du localStorage
    historique. Dépend de CDI-016 et CDI-023.

### Tranches verticales

25. **CDI-025 — Ville autoritaire de bout en bout** : bâtiments, allocations et
    districts via commandes serveur. Dépend de CDI-010, CDI-022 et CDI-024.
26. **CDI-026 — Héros et recrutement autoritaires** : candidat serveur,
    confirmation, renvoi et activité. Dépend de CDI-011, CDI-022 et CDI-024.
27. **CDI-027 — Inventaire et équipement autoritaires** : mutations serveur et
    rafraîchissement canonique. Dépend de CDI-012, CDI-022 et CDI-026.
28. **CDI-028 — Forge et recyclage autoritaires** : états intermédiaires
    persistés et protection contre le reroll. Dépend de CDI-013, CDI-022 et
    CDI-027.
29. **CDI-029 — Donjon et combat autoritaires** : résolution d'encounter,
    replay du transcript, retraite et auto-exploration uniquement en ligne.
    Dépend de CDI-014, CDI-015, CDI-022, CDI-026 et CDI-027.
30. **CDI-030 — Idle et rapport de retour** : traitement sur bootstrap/commande
    et détail des gains. Dépend de CDI-016, CDI-022, CDI-024, CDI-025 et CDI-026.
31. **CDI-031 — UX hors-ligne et conflits** : contrôles verrouillés,
    reconnexion, HTTP `409`, état canonique et indisponibilité Supabase. Dépend
    de CDI-024 à CDI-030.

### Compte, sécurité et livraison

32. **CDI-032 — Reset et suppression définitive** : confirmations, cascades,
    purge des caches et tests de recréation. Dépend de CDI-022 et CDI-023.
33. **CDI-033 — Cheats locaux/staging** : commandes de développement
    authentifiées et allowlistées, absentes du bundle production. Dépend de
    CDI-022 et CDI-025 à CDI-030.
34. **CDI-034 — Hardening et budgets** : RLS hostile, limitation de payload,
    audit des secrets, benchmark combat, error boundary et code splitting.
    Dépend de CDI-031, CDI-032 et CDI-033.
35. **CDI-035 — Staging, production et exploitation** : GitHub Environments,
    déploiements Supabase/Cloudflare, logs sans PII, sauvegarde, rollback, smoke
    tests et ouverture de l'alpha. Dépend de CDI-034.

## 5. Validation et promotion

### 5.1 Commandes obligatoires

Le dépôt final doit exposer au minimum :

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:db`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run build`
- `npm run board:validate`
- `npm audit --omit=dev`

### 5.2 Scénarios bloquants

- Un compte Google allowlisté est accepté ; un email absent ou désactivé est
  refusé avant création.
- Aucun ancien état Firebase/localStorage n'est importé.
- Les calculs restent conformes au prototype hors corrections CDI-005/006.
- Le même `commandId` n'est appliqué qu'une fois ; un payload différent avec la
  même clé est refusé.
- Deux appareils sur la même révision produisent un seul commit ; l'autre reçoit
  HTTP `409`.
- Hors connexion, le cache reste visible mais aucune mutation ni auto-donjon ne
  se produit.
- Après 25 heures d'absence, seules 24 heures de ville, citoyens et récupération
  sont accordées, sans loot ni craft.
- Le transcript reproduit intégralement un combat déterministe.
- Une écriture directe Supabase est impossible malgré un JWT valide.
- Le reset conserve le compte ; la suppression retire compte, données,
  allowlist et cache.
- Aucun cheat, service-role key, email d'allowlist ou configuration staging
  n'apparaît dans le bundle production.

### 5.3 Budgets

- Entrée JavaScript initiale inférieure ou égale à 250 Ko gzip.
- Aucun chunk supérieur à 300 Ko gzip.
- Combat maximal inférieur à 500 ms dans la CI.
- Payload d'événements inférieur ou égal à 128 Ko.
- Limite de 60 commandes par minute et par utilisateur.

### 5.4 Promotion

- Le travail Git CDIdle se fait directement sur `main`, conformément aux
  principes de collaboration spécifiques au projet ; aucune branche par ticket
  n'est créée sauf demande explicite.
- `staging` et `production` désignent des environnements de déploiement, pas
  une obligation de branches Git dédiées.
- Les contrôles et déploiements staging peuvent être exécutés depuis le commit
  validé sur `main`, puis la production exige l'approbation de l'environnement
  GitHub.
- Supabase staging est déployé après les contrôles automatisés.
- Les migrations production sont additives.
- Une sauvegarde manuelle chiffrée et gitignorée précède chaque promotion.
- Le staging est validé pendant 48 heures avec au moins deux comptes et deux
  appareils avant CDI-035.
- Le rollback redéploie l'Edge Function et le build web précédents ; aucune
  migration destructive n'est autorisée dans cette première version.

## 6. Hypothèses et exclusions

- Les deux projets Supabase Free consomment la totalité du quota de deux projets
  actifs et peuvent être mis en pause après une semaine d'inactivité.
- Aucun abonnement payant, add-on, Pages Function ou désactivation de limite ne
  peut être activé sans nouvelle décision utilisateur.
- Les comptes Supabase, Google Cloud et Cloudflare, les emails d'allowlist et
  les secrets sont fournis hors dépôt.
- L'interface française, la direction visuelle et les règles actuelles sont
  conservées.
- La refonte graphique, la bêta publique, le panneau d'administration, la
  migration Firebase et la progression automatique du donjon hors ligne sont
  hors périmètre.
