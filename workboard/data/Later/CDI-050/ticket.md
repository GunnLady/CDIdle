---
id: CDI-050
title: Persistance RNG canonique
status: Later
area: backend
priority: P1
size: L
risk: high
source: Audit Eclipse CDI-037 du 2026-07-23
depends_on: ["CDI-037"]
blocks: ["CDI-049"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/clock-rng.md", "docs/architecture/clock-rng-audit.md", "docs/architecture/game-state-v1.md"]
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

## Criteres d'acceptation

- [ ] `GameStateV1` contient un etat RNG versionne et valide.
- [ ] Les parties existantes migrent vers une valeur initiale deterministe.
- [ ] L etat RNG avance atomiquement avec une commande acceptee.
- [ ] Replay, conflit et commande rejetee ne consomment pas deux fois les tirages.
- [ ] Une meme graine et une meme sequence de commandes reproduisent le meme etat.
- [ ] Les tests domaine, adaptateur et base couvrent la persistance.

## Tests

- `npm.cmd run check:determinism`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:db`
- `npm.cmd run board:validate`

## Validation manuelle

Executer deux parties locales avec la meme graine et la meme sequence de
commandes, puis comparer etats, revisions et transcripts.

## Preservation

Conserver les probabilites, les revisions, l idempotence et la compatibilite
des sauvegardes existantes.

## Risques

Une avancee RNG hors transaction peut rendre les combats et recompenses
impossibles a rejouer ou distribuer deux fois un resultat.

## Handoff

Fournir schema, migration, contrat d avancement, tests de replay et preuve de
reproductibilite.
