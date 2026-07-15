---
id: CDI-003
title: CI et commandes standardisees
status: Later
area: tooling
priority: P0
size: M
risk: low
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-002"]
blocks: ["CDI-004"]
github_issue: "https://github.com/mathrondot-collab/CDIdle/issues/3"
related_docs: ["docs/development/eclipse-workflow.md", "workboard/README.md"]
---

# CDI-003 — CI et commandes standardisees

## Objectif

Donner au depot une commande locale et une CI GitHub uniques qui detectent rapidement les regressions avant delegation ou integration.

## Resultat utilisateur

Chaque ticket futur produit un resultat verifiable de la meme maniere, quel que soit le poste ou le modele qui l'implemente.

## Contexte

Le script `lint` actuel execute uniquement `tsc --noEmit`. Il n'existe ni ESLint ni workflow GitHub Actions, et les controles du Workboard ne sont pas encore integres a la qualite du depot.

## Perimetre autorise

- Renommer le controle TypeScript en script `typecheck`.
- Ajouter ESLint avec les regles TypeScript, React Hooks et React Refresh appropriees au projet.
- Ajouter `check` pour enchainer validation Workboard, typecheck, lint, tests et build.
- Creer un workflow GitHub Actions pour les PR vers `staging` ou `main` et les pushes sur ces branches.
- Utiliser Node 20, `npm ci` et le cache npm natif de `setup-node`.

## Hors perimetre

- Aucun deploiement Supabase ou Cloudflare.
- Aucun secret GitHub Environment.
- Aucun formatage massif du code existant.
- Aucun changement fonctionnel ou correction de warning par des exceptions globales.

## Contrat d'implementation

- Les scripts finaux doivent exposer `typecheck`, `lint`, `test`, `build`, `board:validate` et `check`.
- La CI execute dans cet ordre : installation, validation Workboard, typecheck, lint, tests unitaires, build, puis `npm audit --omit=dev --audit-level=high`.
- Une vulnerabilite high/critical de production bloque la CI ; les avis dev restent visibles sans contournement silencieux.
- Le workflow utilise les permissions GitHub minimales `contents: read` et n'accepte aucun secret.
- Toute suppression de warning doit etre locale et justifiee ; pas de desactivation globale d'une famille de regles.

## Dependances

CDI-002 doit etre `Done` pour que la CI dispose deja d'une suite de tests reelle.

## Criteres d'acceptation

- [ ] `npm run check` reproduit localement les controles principaux de la CI.
- [ ] Le workflow s'execute sur PR vers `staging` et `main` ainsi que sur push vers ces branches.
- [ ] ESLint inspecte les fichiers TypeScript/TSX sans reformater le depot.
- [ ] Les permissions du workflow sont en lecture seule.
- [ ] Le build produit toujours l'application actuelle.

## Tests

- `npm ci`
- `npm run check`
- `npm audit --omit=dev --audit-level=high`
- `git diff --check`

## Validation manuelle

- Introduire localement une erreur TypeScript temporaire et verifier que `check` s'arrete, puis annuler cette modification.
- Inspecter le YAML pour confirmer l'absence de secret et de permission d'ecriture.

## Preservation

- Conserver les scripts `dev`, `preview`, `board`, `board:validate` et `board:sync` fonctionnels.

## Risques

- Une configuration ESLint trop stricte provoquerait un chantier hors scope. Commencer par les erreurs de correction et traiter les avertissements historiques explicitement.

## Handoff

Fournir les scripts finaux, la version Node, les controles executes, le lien du run CI et toute dette de lint volontairement conservee.
