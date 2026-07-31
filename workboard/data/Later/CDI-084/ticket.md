---
id: CDI-084
title: Ajouter un smoke E2E navigateur reel
status: Later
area: quality
priority: P2
size: M
risk: low
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-083"]
blocks: []
github_issue: null
related_docs: ["tests/authoritativePipeline.e2e.test.tsx", "scripts/test-temporal-concurrency.mjs", "supabase/functions/game-api"]
---

# CDI-084 - Ajouter un smoke E2E navigateur reel

## Objectif

Completer les tests Vitest injectes par un petit parcours navigateur contre
la pile Supabase locale reelle, sans automatiser tout le jeu.

## Resultat utilisateur

Une rupture entre le frontend construit, le reseau, l Edge Function et la
persistance est detectee avant le deploiement alpha.

## Contexte

Le test nomme `test:e2e` monte React et traverse le handler API avec des
services injectes. Il prouve utilement le pipeline logique et le cache, mais
ne lance ni navigateur reel, ni reseau local, ni Edge Function et base
effectives.

## Perimetre autorise

- Choisir un outil navigateur minimal compatible avec la CI et Windows.
- Demarrer ou cibler la pile locale selon une procedure explicite.
- Fournir une authentification locale de test sans bearer personnel.
- Couvrir bootstrap, une commande, F5, persistance et une erreur visible.
- Capturer des diagnostics utiles en cas d echec.
- Garder le parcours court, deterministe et independant des donnees alpha.
- Documenter execution locale et CI.

## Hors perimetre

- Automatiser tous les ecrans ou combats du jeu.
- Utiliser un compte Google ou token utilisateur reel.
- Tester directement la production dans la CI.
- Remplacer les tests unitaires, DB ou integration existants.
- Ajouter une infrastructure externe payante.

## Contrat d'implementation

- Le test utilise uniquement des identifiants et secrets locaux jetables.
- Il echoue sur erreur console inattendue, reponse API invalide ou persistance
  absente.
- Le nettoyage cible uniquement les donnees de test identifiees.
- Le parcours reste suffisamment court pour etre execute regulierement.
- Les echecs produisent une trace exploitable sans exposer de secret.

## Dependances

CDI-083 doit stabiliser les scenarios de commande, succes et erreur a couvrir
dans le smoke navigateur.

## Criteres d'acceptation

- [ ] Un navigateur reel charge le frontend contre Supabase local.
- [ ] L authentification de test ne demande aucun bearer personnel.
- [ ] Bootstrap, commande, F5 et persistance sont verifies.
- [ ] Une erreur backend produit le feedback utilisateur attendu.
- [ ] Les donnees de test sont isolees et nettoyables.
- [ ] Le test fournit captures ou traces diagnostiques en cas d echec.
- [ ] Le test est documente et executable localement puis en CI.
- [ ] Les suites Vitest, DB et integration existantes restent conservees.

## Tests

- Execution du nouveau smoke navigateur sur pile locale propre.
- Execution apres redemarrage du frontend et de l Edge Function.
- Verification du chemin d erreur et des diagnostics.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:integration`
- `npm.cmd run test:db`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Lancer une fois la procedure documentee dans PowerShell, observer le navigateur
et confirmer que le test ne demande ni connexion Google ni token personnel.

## Preservation

- Preserver les tests existants et leur rapidite.
- Preserver les donnees locales non liees au test.
- Ne jamais enregistrer de secret ou session reelle dans les artefacts.

## Risques

- Le demarrage de la pile locale peut rendre le test sensible aux processus.
- Un test trop large deviendrait lent et instable.
- Un nettoyage mal borne pourrait toucher des donnees de developpement.

## Handoff

Fournir la commande, les prerequis, le parcours, la strategie d auth locale,
les diagnostics, la duree et le comportement de nettoyage.
