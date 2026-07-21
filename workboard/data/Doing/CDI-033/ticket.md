---
id: CDI-033
title: Cheats locaux/staging
status: Doing
area: delivery
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-022", "CDI-025", "CDI-026", "CDI-027", "CDI-028", "CDI-029", "CDI-030"]
blocks: ["CDI-034"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md"]
---

# CDI-033 — Cheats locaux/staging

## Objectif

Implementer le perimetre Cheats locaux/staging selon le plan fullstack autoritaire.

## Resultat utilisateur

Un composant testable, documente et compatible avec les invariants du plan.

## Contexte

Ce ticket fait partie du catalogue approuve et ses dependants attendent ses contrats.

## Perimetre autorise

- Implementer uniquement le domaine indique.
- Ajouter les tests deterministes et la documentation necessaire.

## Hors perimetre

- Ne pas elargir le ticket a un domaine voisin.
- Ne pas introduire de facturation ni de secret client.

## Contrat d'implementation

- Etat canonique, erreurs explicites et mutations idempotentes.
- Validation reproductible sans reseau reel.

## Dependances

Ce ticket depend de : ["CDI-022", "CDI-025", "CDI-026", "CDI-027", "CDI-028", "CDI-029", "CDI-030"].

## Criteres d'acceptation

- [ ] Le perimetre est implemente sans regression hors domaine.
- [ ] Les invariants sont couverts par des tests reproductibles.
- [ ] Les preuves et la documentation sont fournies.

## Tests

- `npm.cmd run typecheck` ? OK
- `npm.cmd test -- --run` ? 13 fichiers, 97 tests OK
- `npm.cmd run build` ? OK; cheats absents du bundle production
- `npm.cmd run build -- --mode staging` ? OK; cheats pr?sents dans le bundle staging
- `npm.cmd run board:validate` ? 49 tickets, 0 erreur

## Audits

- Audit p?rim?tre/plan : OK.
- Audit s?curit? : OK; activation limit?e au dev/staging et utilisateur Google autoris? par `alpha_allowlist`; aucun secret client.
- Audit offline : OK; les cheats sont bloqu?s hors ligne.
- Audit serveur : OK; l'allowlist est revalid?e par l'API runtime.
- Audit pr?-push : OK.
- Audit post-push : commit `a404fdd` v?rifi?; l'?cart `save_game` a ensuite ?t? corrig? dans `12ccece`.

## Validation manuelle

- Local : OK; utilisateur Google autoris?, `G 100` fonctionne.
- Staging navigateur : ? faire.
- Production : OK par build; les cheats sont absents du bundle.
## Preservation

Preserver les contrats valides, les identifiants persistants et les tests verts.

## Risques

Une implementation trop large creerait des dependances implicites.

## Handoff

Fournir fichiers, commandes, resultats, risques residuels et decisions a transmettre.
