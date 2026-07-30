---
id: CDI-055
title: Migration controlee vers npm 12 sous Node LTS
status: Doing
area: tooling
priority: P2
size: M
risk: high
source: Notice npm 12 et decision LTS du 2026-07-25
depends_on: []
blocks: []
github_issue: null
related_docs: ["package.json", "package-lock.json", ".github/workflows/ci.yml", ".github/workflows/deploy.yml", ".github/workflows/rollback.yml", "docs/development/npm-12-migration.md"]
---

# CDI-055 - Migration controlee vers npm 12 sous Node LTS

## Objectif

Migrer le projet de npm 11 vers npm 12 sans quitter une version Node LTS,
apres inventaire et traitement explicite des changements cassants et des
impacts sur les installations locales et CI.

## Resultat utilisateur

Les installations, tests, builds et deploiements restent reproductibles et
securises avec la meme version npm sur Windows et dans GitHub Actions.

## Contexte

Le poste local utilise Node 24.18.0 LTS et npm 11.16.0. npm 12.0.1 est
disponible et compatible avec Node 24 a partir de 24.15.0, mais introduit des
changements cassants. La politique projet impose de rester sur une branche
Node LTS ; Node 26 Current est exclu jusqu a son passage en LTS.

## Perimetre autorise

- Epingler une version exacte de npm 12 dans le projet et la CI.
- Formaliser la politique Node LTS et verifier la compatibilite runtime.
- Inventorier les changements cassants npm 12 applicables au depot.
- Auditer les scripts npm, `.npmrc`, workflows et usages de `npx`.
- Definir une politique minimale pour les scripts d installation.
- Regenerer et auditer `package-lock.json`.
- Documenter migration, validation et rollback.

## Hors perimetre

- Migrer vers une branche Node Current.
- Mettre a niveau Supabase JS ou les dependances gameplay.
- Modifier une fonctionnalite applicative.
- Autoriser globalement tous les scripts ou toutes les sources distantes.

## Contrat d'implementation

- Node doit rester en Active LTS ou Maintenance LTS.
- La version npm doit etre explicite et identique en local, CI, deploy et
  rollback.
- `npm ci` doit rester la commande d installation canonique.
- Les options inconnues et abreviations refusees par npm 12 doivent etre
  retirees ou corrigees.
- Les valeurs `allow-git`, `allow-remote` et `allowScripts` doivent etre
  minimales et justifiees.
- Aucun changement de lockfile non explique ne doit etre accepte.

## Dependances

Aucune. Ce ticket de socle est volontairement independant des tickets
fonctionnels.

## Criteres d'acceptation

- [x] Node utilise une version LTS compatible avec npm 12.
- [x] `packageManager` epingle exactement la version npm retenue.
- [x] Local, CI, deploy et rollback utilisent cette meme version.
- [x] Les breaking changes npm 12 sont inventories dans une matrice.
- [x] `.npmrc`, scripts et workflows ne contiennent aucune option devenue
      invalide.
- [x] Les dependances Git, URL et tarballs sont inventoriees.
- [x] La politique `allow-git` et `allow-remote` est explicite.
- [x] Les scripts de esbuild, Supabase CLI, Lightning CSS et Tailwind/Oxide
      sont testes et autorises uniquement si necessaire.
- [x] Les binaires locaux sont executes par `npm run` ou
      `npm exec --offline`, sans telechargement implicite par `npx`.
- [x] Deux `npm ci` consecutifs ne modifient pas le lockfile.
- [x] L installation propre passe sous Windows.
- [ ] L installation propre passe sous Ubuntu dans la CI publiee.
- [x] Audit, tests, tests DB, build et budget bundle passent.
- [x] Le rollback vers npm 11 est documente et teste.

## Tests

- `node --version`
- `npm.cmd --version`
- `npm.cmd ci`
- `npm.cmd run check`
- `npm.cmd run test:db`
- `npm.cmd audit --omit=dev --audit-level=high`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`

## Validation manuelle

Sur Windows, repartir d une installation propre, executer les commandes
locales et Supabase epinglees, puis verifier que la CI Ubuntu reproduit le
meme graphe de dependances et tous les controles.

## Preservation

- Conserver Node LTS.
- Conserver les commandes PowerShell `npm.cmd`.
- Conserver le lockfile et les audits de securite.
- Conserver les workflows de CI, deploy et rollback fonctionnels.

## Risques

- Un lockfile regenere par une autre version npm peut produire un diff large.
- Une politique de scripts trop stricte peut bloquer les binaires natifs.
- Une politique trop large peut executer du code de dependance non necessaire.
- Les changements de resolution `npx` peuvent affecter Supabase CLI.

## Handoff

Fournir la matrice des impacts npm 12, les versions exactes Node/npm, le diff
du lockfile, les decisions de scripts, les preuves Windows/CI et la procedure
de rollback.

## Validation du 2026-07-30

- Preuve Codex : npm `12.0.1` a regenere un lockfile stable; le second passage
  conserve exactement son empreinte SHA-256.
- Preuve Codex : le lockfile contient 0 source Git, 0 URL directe et 0 source
  fichier; `allow-git=none`, `allow-remote=none` et
  `strict-allow-scripts=true` sont effectivement lus par npm 12.
- Preuve utilisateur : installation Windows propre, second `npm.cmd ci`, liste
  de scripts en attente vide et `esbuild@0.25.12` fonctionnel.
- Preuve utilisateur : `npm.cmd run check` passe avec 327 tests Vitest, les
  seuils de couverture, 94 tests DB, le build et le budget bundle.
- Preuve utilisateur : `npm.cmd run test:integration` passe avec le binaire
  Supabase local execute via `npm exec --offline`.
- Preuve utilisateur : `npm.cmd audit --omit=dev --audit-level=high` rapporte
  0 vulnerabilite.
- Preuve utilisateur : rollback global `12.0.1 -> 11.16.0 -> 12.0.1` reussi.
- Preuve encore requise : execution Ubuntu de la CI sur le commit publie.
