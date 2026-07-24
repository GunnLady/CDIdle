---
id: CDI-050
title: Persistance RNG canonique
status: Done
area: backend
priority: P1
size: L
risk: high
source: Audit Eclipse CDI-037 du 2026-07-23
depends_on: ["CDI-037", "CDI-052"]
blocks: ["CDI-046", "CDI-049", "CDI-054"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/clock-rng.md", "docs/architecture/clock-rng-audit.md", "docs/architecture/game-state-v1.md", "docs/architecture/authoritative-rng.md"]
---

# CDI-050 — Persistance RNG canonique

## Objectif

Persister la graine et l etat du generateur pseudo-aleatoire dans la partie
canonique, puis les avancer atomiquement avec chaque mutation autoritaire.

## Resultat utilisateur

Une meme partie et une meme suite de commandes produisent les memes tirages,
sans duplication ni divergence apres replay, conflit ou reconnexion.

## Contexte

Le plan autoritaire exige une graine conservee dans `GameStateV1`. CDI-009 a
livre le contrat `Rng`, mais la persistance et l avancement serveur ne sont pas
implementes. CDI-037 fournit la migration des autorites vers le RNG injectable.

## Perimetre autorise

- Ajouter la graine et l etat RNG au schema canonique versionne.
- Definir une valeur initiale et une migration pour les parties existantes.
- Restaurer puis avancer le RNG dans les commandes serveur.
- Committer et persister l etat RNG avec la mutation metier.
- Couvrir replay, collision, conflit de revision et reprise apres bootstrap.

## Hors perimetre

- Modifier les probabilites ou l economie du gameplay.
- Raccorder les composants React aux commandes autoritaires.
- Introduire un service externe de generation aleatoire.

## Contrat d'implementation

- L etat RNG fait partie de la transaction canonique.
- Un replay idempotent ne consomme aucun tirage supplementaire.
- Une commande rejetee ou en conflit ne modifie pas l etat RNG.
- Les anciennes sauvegardes recoivent un etat initial deterministe.
- Aucun secret ni graine sensible n est exposee comme credential.

## Dependances

- CDI-037 — migration RNG/Clock, autorites serveur et garde CI.
- CDI-052 — contrat `GameStateV1` partage, versionne et valide.

## Criteres d'acceptation

- [x] `GameStateV1` contient un etat RNG versionne et valide.
- [x] Les parties existantes migrent vers une valeur initiale deterministe.
- [x] L etat RNG avance atomiquement avec une commande acceptee.
- [x] Replay, conflit et commande rejetee ne consomment pas deux fois les tirages.
- [x] Une meme graine et une meme sequence de commandes reproduisent le meme etat.
- [x] Les tests domaine, adaptateur et base couvrent la persistance.
- [x] Un bootstrap apres mutation restitue exactement le meme `rngState`.

## Tests

- `npm.cmd run check:determinism`
- `npm.cmd run check:migrations`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:db`
- `npm.cmd run board:validate`

## Validation manuelle

Executer une mutation stochastique locale, relever `rngState`, recharger par
bootstrap puis verifier que graine, etat et compteur de tirages sont
strictement identiques. La reproductibilite a graine identique est couverte
par les fixtures automatisees, car deux comptes distincts doivent utiliser
des graines distinctes.

## Preservation

Conserver les probabilites, les revisions, l idempotence et la compatibilite
des sauvegardes existantes.

## Risques

Une avancee RNG hors transaction peut rendre les combats et recompenses
impossibles a rejouer ou distribuer deux fois un resultat.

## Handoff

Fournir schema, migration, contrat d avancement, tests de replay et preuve de
reproductibilite.

## Realisation

- `CanonicalGameState.rngState` versionne `xorshift32`, graine, etat et nombre
  de tirages du flux maitre.
- `authoritative-rng.ts` restaure, avance et instantane la sequence.
- `forkCanonicalRng` attribue une sous-sequence distincte a chaque bloc
  aleatoire atomique : novice ou resolution complete de rencontre.
- `applyTownCommand` injecte obligatoirement ce RNG dans la resolution de
  donjon, l onboarding et le recrutement, puis ne publie le nouvel instantane
  qu avec la transition acceptee.
- La migration SQL complete les anciennes sauvegardes ; la migration a la
  lecture couvre les deploiements progressifs.
- La graine initiale est derivee du `userId` pour separer les sequences des
  comptes. Une version inconnue ou un etat corrompu bloque au lieu de reset.
- Une contrainte SQL validee interdit la persistance d un `rngState`
  non canonique.
- Le RPC atomique existant persiste sans nouvelle colonne le RNG avec l etat,
  la revision, les evenements et la commande.
- Tests unitaires : contrat, migration, reproductibilite, avancement, rejet,
  replay et conflit.
- Test pgTAP : persistance atomique et absence de double tirage au replay.
- Test pgTAP : un conflit tardif du RPC ne persiste ni mutation ni tirage.
- L adaptateur traduit aussi ce conflit tardif en `REVISION_CONFLICT` et
  recharge la revision canonique.
- La CI execute explicitement la garde de determinisme et l audit de securite
  des migrations.
- Un test adaptateur couvre mutation, persistance puis bootstrap et compare
  strictement le `rngState` restitue.

## Preuves au 2026-07-24

- `npm.cmd run typecheck` : PASS Codex apres ajout du traitement
  `INVALID_GAME_STATE`.
- Tests cibles RNG/contrats/donjon/adaptateur/ville : 5 fichiers, 47 tests,
  PASS.
- `npm.cmd run test:db`, suite Vitest complete et build : PASS rapportes par
  l utilisateur avant le traitement explicite de `INVALID_GAME_STATE`.
- Test golden TypeScript/SQL ajoute pour la graine `652989193`.
- Le backend retourne et journalise `INVALID_GAME_STATE`; le frontend
  verrouille les mutations sans afficher un faux mode hors ligne. Le reset et
  la suppression du compte restent disponibles.
- Test composant ajoute pour la banniere incompatible, l absence de faux mode
  hors ligne, l acces a l onglet Compte et la confirmation du reset.
- Tests cibles API/client/RNG, suite complete et build : PASS rapportes par
  l utilisateur apres le traitement explicite de `INVALID_GAME_STATE`.
- Test composant de recuperation inclus dans la suite complete : PASS rapporte
  par l utilisateur.
- `npm.cmd run test:db` : 5 fichiers, 68 tests, PASS rapporte par
  l utilisateur apres les invariants de graine par compte.
- Tests RNG/contrats/API/adaptateur puis suite Vitest complete : PASS rapportes
  par l utilisateur apres la correction du controle de graine explicite.
- Test adaptateur mutation-bootstrap et suite Vitest complete : PASS rapportes
  par l utilisateur apres l audit final.
- `npm.cmd run typecheck`, `npm.cmd run check:determinism`,
  `npm.cmd run check:migrations`, `npm.cmd run board:validate` et
  `git diff --check` : PASS Codex lors de l audit final.
- Validation navigateur locale : PASS rapporte par l utilisateur. Apres
  `dungeon.resolve`, la reponse `commands` et le bootstrap suivant restituent
  exactement `seed = 4182162423`, `state = 3912356235` et `draws = 1`.
