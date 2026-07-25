---
id: CDI-055
title: Migration controlee vers npm 12 sous Node LTS
status: Later
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

- [ ] Node utilise une version LTS compatible avec npm 12.
- [ ] `packageManager` epingle exactement la version npm retenue.
- [ ] Local, CI, deploy et rollback utilisent cette meme version.
- [ ] Les breaking changes npm 12 sont inventories dans une matrice.
- [ ] `.npmrc`, scripts et workflows ne contiennent aucune option devenue
      invalide.
- [ ] Les dependances Git, URL et tarballs sont inventoriees.
- [ ] La politique `allow-git` et `allow-remote` est explicite.
- [ ] Les scripts de esbuild, Supabase CLI, Lightning CSS et Tailwind/Oxide
      sont testes et autorises uniquement si necessaire.
- [ ] `npx` execute bien les binaires locaux epingles attendus.
- [ ] Deux `npm ci` consecutifs ne modifient pas le lockfile.
- [ ] L installation propre passe sous Windows et Ubuntu.
- [ ] Audit, tests, tests DB, build et budget bundle passent.
- [ ] Le rollback vers npm 11 est documente et teste.

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
