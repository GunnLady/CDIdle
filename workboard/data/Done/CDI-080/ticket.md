---
id: CDI-080
title: Introduire les migrations d etat versionnees
status: Done
area: backend
priority: P1
size: M
risk: high
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-078"]
blocks: ["CDI-082"]
github_issue: null
related_docs: ["supabase/functions/game-api/state-migrations.ts", "shared/contracts/authoritative.ts", "docs/development/canonical-state-migrations.md"]
---

# CDI-080 - Introduire les migrations d etat versionnees

## Objectif

Remplacer la migration implicite par valeurs par defaut par un pipeline
explicite, versionne, pur et testable pour les sauvegardes canoniques.

## Resultat utilisateur

Les sauvegardes alpha continuent de fonctionner apres les evolutions du jeu,
sans perte silencieuse ni correction manuelle en base.

## Contexte

`migrateTownState` fusionne actuellement le snapshot avec l etat initial puis
le valide. Cette strategie a permis de faire evoluer rapidement le socle, mais
elle ne permet pas d expliquer ou tester precisement chaque transformation
alors que des sauvegardes alpha existent desormais.

## Perimetre autorise

- Definir une version explicite du snapshot canonique.
- Implementer une chaine ordonnee de migrations `vN -> vN+1`.
- Rendre chaque migration pure, deterministe et idempotente.
- Conserver des fixtures anonymisees des formats historiques pertinents.
- Valider le snapshot apres chaque migration complete.
- Definir le comportement pour version absente, future ou invalide.
- Documenter creation, test et retrait d une migration.

## Hors perimetre

- Changer les regles de gameplay sans besoin de migration.
- Modifier les migrations SQL sans necessite de stockage demontree.
- Reparer silencieusement un snapshot impossible a interpreter.
- Refactorer les handlers de commandes, traite par CDI-082.

## Contrat d'implementation

- Une sauvegarde est migree uniquement vers la version suivante connue.
- Une migration ne consomme aucun RNG nouveau et ne depend pas de l heure.
- Reexecuter la migration sur son resultat ne change pas l etat.
- Une version future est refusee avec une erreur diagnostiquable.
- Les sauvegardes historiques restent anonymisees et sans secret.

## Dependances

CDI-078 doit stabiliser le contrat canonique cible avant l introduction du
registre de migrations.

## Criteres d'acceptation

- [x] Le snapshot porte une version canonique explicite.
- [x] Les migrations sont ordonnees et exhaustives entre versions supportees.
- [x] Chaque migration possede une fixture avant et apres.
- [x] Les migrations sont pures, deterministes et idempotentes.
- [x] Les versions absente, invalide et future ont un comportement explicite.
- [x] Les sauvegardes alpha representatives arrivent au contrat courant sans
      perte silencieuse.
- [x] L etat migre passe tous les validateurs canoniques.

## Tests

- Tests golden de chaque paire de fixtures.
- Tests d idempotence et de determinisme.
- Tests des versions absente, future et corrompue.
- Tests de bootstrap et commande apres migration.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:db`
- `npm.cmd run board:validate`

## Validation manuelle

Charger une fixture anonymisee d une sauvegarde alpha ancienne, verifier la
migration, jouer une commande, simuler le rechargement et comparer l etat
persiste. Cette simulation remplace la manipulation manuelle longue.

## Preservation

- Preserver identifiants d instances, RNG, revision et historique utile.
- Ne jamais utiliser une migration pour reequilibrer retroactivement le jeu.
- Conserver une erreur explicite plutot qu une perte de donnees.

## Risques

- Une mauvaise version de depart peut appliquer deux fois une transformation.
- Une migration non deterministe casserait les preuves de replay.
- Des fixtures incompletes peuvent masquer un champ historique rare.

## Handoff

Fournir le registre de versions, les fixtures, les transformations documentees,
les formats refuses et les preuves d idempotence.

## Realisation

- `stateVersion` distingue le format JSON canonique de `games.schema_version`.
- Le registre pur applique explicitement `v0 -> v1` et refuse les versions
  invalides, futures ou sans chemin connu.
- Les anciennes reparations implicites sont encapsulees dans la migration v0 ;
  un snapshot v1 incomplet est refuse sans reparation silencieuse.
- Les fixtures golden, la simulation de compatibilite, le bootstrap persistant,
  les commandes post-migration et la conservation du RNG sont couverts.
- La migration clone aussi ses valeurs par defaut, conserve explicitement
  l historique et refuse les collections legacy malformees sans `TypeError`.
- Les elements `null`, primitifs ou incomplets des collections legacy sont
  refuses avant toute reconciliation metier et aucun objet du resultat ne
  partage de reference avec les valeurs par defaut du pipeline.
- La reconciliation des vocations est isolee dans une autorite metier partagee
  par la migration et les commandes de batiment.
- Validation Codex : typecheck, lint, couverture, Workboard, determinisme,
  secrets, logs, securite des migrations et 580 tests unitaires valides.
- Validation utilisateur : 127 tests DB valides et build frontend reussi.
