---
id: CDI-065
title: Collecter et analyser les erreurs alpha
status: Later
area: observability
priority: P1
size: M
risk: high
source: Audit de preparation alpha du 2026-07-30
depends_on: ["CDI-064"]
blocks: ["CDI-066"]
github_issue: null
related_docs: ["src/components/AppErrorBoundary.tsx", "src/lib/supabase.ts", "supabase/functions/game-api/index.ts", "docs/deployment/cdi-035-runbook.md"]
---

# CDI-065 — Collecter et analyser les erreurs alpha

## Objectif

Collecter les erreurs techniques inattendues du frontend alpha dans Supabase
avec leur version et leur identifiant de requête, afin de pouvoir les analyser
sans plateforme d observabilité externe.

## Resultat utilisateur

Lorsqu un testeur rencontre un crash ou une erreur serveur inattendue, le
propriétaire dispose d un rapport minimal permettant d identifier la version,
la catégorie et la requête concernées sans demander le contenu de la partie.

## Contexte

L Error Boundary journalise seulement dans la console du navigateur. Une fois
le frontend hébergé, ces informations disparaissent avec la session du testeur.
Le projet possède déjà Supabase, une authentification et des `requestId`, ce qui
permet une collecte limitée sans ajouter de service tiers.

## Perimetre autorise

- Capturer les erreurs React via l Error Boundary.
- Capturer les erreurs JavaScript globales et promesses rejetées non gérées.
- Capturer les timeouts et réponses API 5xx inattendues.
- Définir un rapport versionné, validé, limité en taille et nettoyé.
- Ajouter une route authentifiée et un stockage Supabase dédiés aux rapports.
- Limiter le débit et empêcher toute lecture par les rôles navigateur.
- Fournir une requête SQL simple pour l analyse par version, catégorie,
  `requestId` et période.
- Documenter une purge simple des anciens rapports.

## Hors perimetre

- Ajouter un dashboard, une alerte ou un monitoring d uptime.
- Collecter des analytics de comportement ou de performance utilisateur.
- Installer Sentry ou une autre plateforme externe.
- Capturer les erreurs attendues de validation métier ou les conflits 409
  normaux.
- Construire un système de support ou de feedback intégré.

## Contrat d'implementation

- Un rapport peut contenir uniquement : version du build, date serveur,
  catégorie, message nettoyé, stack nettoyée et bornée, `requestId`, surface UI
  et contexte technique minimal explicitement autorisé.
- JWT, email, identifiant Google, état de partie, ressources, héros, inventaire,
  transcript et payload de commande sont interdits.
- La date autoritaire du rapport est attribuée côté serveur.
- La route exige une session valide, applique validation, limite de taille et
  rate limit, puis écrit avec l autorité serveur.
- Les rôles `anon` et `authenticated` ne peuvent ni lire ni modifier directement
  les rapports.
- Une panne de collecte ne bloque jamais le jeu et ne provoque pas de boucle de
  rapports.
- La version provient exclusivement du mécanisme CDI-064.

## Dependances

- CDI-064 — identité stable et traçable du build.

## Criteres d'acceptation

- [ ] Une erreur React contrôlée crée un rapport unique et analysable.
- [ ] Une erreur globale et une promesse rejetée sont capturées sans doublon.
- [ ] Un timeout et une réponse 5xx conservent leur catégorie et `requestId`
  lorsqu il existe.
- [ ] Les erreurs métier attendues et les 409 ne sont pas reportés.
- [ ] Les champs interdits sont supprimés ou provoquent un refus explicite.
- [ ] Taille, fréquence et accès SQL sont bornés et testés.
- [ ] Une panne du collecteur ne masque pas l erreur initiale et ne bloque pas
  l application.
- [ ] La requête d analyse permet de regrouper les erreurs par version.

## Tests

- Tests React Error Boundary, `error` et `unhandledrejection`.
- Tests client des timeouts, 5xx, déduplication et échec silencieux du rapport.
- Tests Edge de validation, authentification, taille et rate limit.
- Tests pgTAP de RLS et privilèges de la table de rapports.
- Test de sécurité avec JWT, email et payload de jeu factices.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:db`
- `npm.cmd run check:secrets`
- `npm.cmd run check:logs`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Sur une partie alpha contrôlée, déclencher une erreur d affichage de test puis
une réponse 5xx contrôlée. Vérifier par SQL que version, catégorie et
`requestId` sont exploitables, qu aucune donnée interdite n est stockée et que
le jeu reste utilisable si l envoi du rapport échoue.

## Preservation

- Préserver la confidentialité des sauvegardes, sessions et utilisateurs.
- Préserver les logs sans PII et les erreurs UI existantes.
- Préserver la disponibilité du jeu lorsque Supabase refuse le rapport.
- Utiliser une migration additive et un rollback non destructif.

## Risques

- Une stack ou un message brut peut contenir une donnée sensible.
- Un gestionnaire global mal protégé peut créer une boucle de rapports.
- Une route non limitée peut être utilisée pour remplir la base.
- Une collecte trop large deviendrait une analytics non souhaitée.

## Handoff

Fournir le schéma des rapports, la migration, les protections RLS/rate limit,
les surfaces capturées, les champs exclus, la requête SQL d analyse, les preuves
de déduplication et de panne du collecteur ainsi que les résultats des audits de
secrets et de logs.
