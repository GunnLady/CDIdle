---
id: CDI-078
title: Unifier le contrat d etat canonique
status: Done
area: fullstack
priority: P1
size: M
risk: high
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: []
blocks: ["CDI-079", "CDI-080", "CDI-081"]
github_issue: null
related_docs: ["shared/contracts/authoritative.ts", "src/types.ts", "src/domain/commands.ts", "supabase/functions/game-api/town-authority.ts", "docs/development/canonical-state-simulation.md"]
---

# CDI-078 - Unifier le contrat d etat canonique

## Objectif

Faire de `CanonicalGameState` la source de verite typee de l etat persistant,
separer explicitement cet etat des projections UI et retirer les modeles
historiques concurrents.

## Resultat utilisateur

Les evolutions du jeu conservent un etat coherent entre le frontend, le
backend, le cache et les sauvegardes, sans champ oublie ou interpretation
divergente.

## Contexte

L audit a confirme trois representations chevauchantes : `GameState` cote
client, `CanonicalGameState` dans le contrat partage et `TownState` cote
backend. `GameState` expose encore les anciens champs `combatTimer`,
`battleLogs` et `currentMonster`, alors que le contrat canonique utilise
`currentEncounter` et `encounterHistory`. Plusieurs sous-objets canoniques
restent des `Record<string, unknown>` et certaines frontieres frontend
utilisent `any`.

## Perimetre autorise

- Designer `CanonicalGameState` comme contrat source du snapshot persistant.
- Typer precisement les heros, objets, rencontres, transitions et etats en
  attente deja presents.
- Distinguer types persistants, enveloppes API, projections UI et cache.
- Migrer les usages generiques de l ancien `GameState`.
- Retirer les champs obsoletes lorsqu aucun consommateur ne subsiste.
- Remplacer les `any` des frontieres principales par des types valides.
- Conserver et completer la validation runtime du contrat canonique.

## Hors perimetre

- Deplacer les modules entre `src`, `shared` et `supabase`, traite par CDI-079.
- Modifier les regles de gameplay ou l equilibrage.
- Introduire les migrations versionnees de sauvegarde, traitees par CDI-080.
- Refactorer globalement `App.tsx`, traite par CDI-081.

## Contrat d'implementation

- Un seul type decrit le snapshot canonique complet.
- Les projections UI ne deviennent jamais des types persistants implicites.
- Les validateurs runtime et les types TypeScript couvrent les memes champs
  obligatoires.
- Tout retrait de champ est precede d une recherche de consommateurs et d une
  preuve de compatibilite des sauvegardes.
- Le cache reste une copie non autoritaire du snapshot confirme.

## Dependances

Le ticket est autonome et fournit la fondation de CDI-079, CDI-080 et CDI-081.

## Criteres d'acceptation

- [x] `CanonicalGameState` est la source de verite typee du snapshot.
- [x] Heros, objets, rencontres et transitions ne sont plus des records
      opaques dans le contrat principal.
- [x] L ancien `GameState` est supprime ou limite a un role distinct explicite.
- [x] `combatTimer`, `battleLogs` et `currentMonster` ne subsistent pas sans
      consommateur justifie.
- [x] Les enveloppes API, le cache et les projections UI utilisent des types
      compatibles et distincts lorsque necessaire.
- [x] Les validateurs signalent tout champ obligatoire absent ou invalide.
- [x] Aucun comportement de jeu ni format de sauvegarde n est modifie sans
      migration explicite.

## Tests

- Tests de validation du contrat complet et de ses sous-objets.
- Tests de projection canonique vers React et vers le cache.
- Tests TypeScript prouvant les unions exhaustives utiles.
- `npm.cmd run test:state-simulation`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

La longue validation manuelle de sauvegarde est remplacee par la simulation
documentee dans `docs/development/canonical-state-simulation.md` :

```powershell
npm.cmd run test:state-simulation
```

Elle traverse migration, validation runtime, projection React, commande
autoritaire, cache IndexedDB et synchronisation inter-onglets sans demarrer
Vite, Supabase ou un navigateur.

## Preservation

- Preserver le format canonique actuellement accepte par la production.
- Preserver revision, replay, cache et projections optimistes.
- Ne pas supprimer un champ sur la seule base de son nom.

## Risques

- Un type trop strict sans migration peut refuser une sauvegarde valide.
- Une confusion entre champ optionnel et absent peut changer une projection.
- Une migration massive en une fois rendrait les regressions difficiles a
  isoler.

## Handoff

Fournir le contrat final, la liste des anciens types retires, les champs
optionnels justifies, les validateurs et les preuves de compatibilite du cache
et des sauvegardes.
