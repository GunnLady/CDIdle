---
id: CDI-056
title: Mettre a niveau Supabase JS vers 2.110.8
status: Done
area: frontend/integration
priority: P1
size: L
risk: high
source: Audit versions Supabase du 2026-07-25
depends_on: []
blocks: []
github_issue: null
related_docs: ["package.json", "package-lock.json", "src/lib/supabase.ts", "src/App.tsx", "docs/architecture/api-command-contracts.md", "docs/development/supabase-js-2.110-migration.md"]
---

# CDI-056 - Mettre a niveau Supabase JS vers 2.110.8

## Objectif

Mettre a niveau et epingler `@supabase/supabase-js` de 2.53.0 vers 2.110.8
apres inventaire des changements et validation exhaustive des parcours Auth,
Functions, erreurs reseau et persistance de session.

## Resultat utilisateur

La connexion Google, la partie autoritaire, le mode hors ligne et les actions
de compte conservent leur comportement tout en beneficiant des corrections
recentes du SDK Supabase.

## Contexte

Le lockfile installe `@supabase/supabase-js@2.53.0` alors que la derniere
version stable verifiee le 2026-07-25 est 2.110.8. L ecart couvre de nombreuses
versions mineures touchant notamment Auth, Functions, Storage, erreurs fetch,
AbortSignal et compatibilite runtime. La montee reste independante des tickets
fonctionnels et prouve elle-meme l absence de regression.

## Perimetre autorise

- Mettre a niveau et epingler `@supabase/supabase-js@2.110.8`.
- Inventorier les changelogs applicables depuis 2.53.0.
- Auditer les dependances transitives et le poids du bundle.
- Adapter uniquement les integrations rendues incompatibles par le SDK.
- Couvrir Auth Google, session, Functions, offline et actions de compte.
- Documenter impacts, preuves et rollback.

## Hors perimetre

- Mettre a niveau Supabase CLI ou les images locales.
- Modifier le projet Supabase heberge, son schema ou ses secrets.
- Reconcevoir les parcours Auth ou offline.
- Modifier les regles gameplay ou le contrat game-api sans incompatibilite
  SDK demontree.

## Contrat d'implementation

- Le SDK est epingle exactement pour eviter une montee implicite.
- Le client Supabase reste unique par contexte navigateur.
- Les tokens et sessions ne sont jamais journalises.
- Les headers JWT, CORS et erreurs structurees game-api restent inchanges.
- Une erreur reseau reste distincte d un etat canonique invalide.
- Aucun nouveau calcul canonique ne doit etre deplace dans le client.

## Dependances

Aucune. Ce ticket de socle est volontairement independant des tickets
fonctionnels et porte ses propres tests de regression.

## Criteres d'acceptation

- [x] `@supabase/supabase-js@2.110.8` est epingle et installe.
- [x] Les changements applicables depuis 2.53.0 sont inventories.
- [x] Google OAuth et son callback fonctionnent.
- [x] La session est restauree apres F5 sans faux mode hors ligne.
- [x] Deconnexion, reset, suppression et recreation de compte fonctionnent.
- [x] L allowlist locale conserve son comportement.
- [x] Aucune instance `GoTrueClient` concurrente non justifiee ne subsiste.
- [x] Les appels game-api conservent JWT, codes et requestId.
- [x] Les appels Functions conservent leurs erreurs structurees.
- [x] AbortSignal et erreurs fetch transitoires sont correctement classes.
- [x] Offline, cache en lecture seule et reconnexion restent fonctionnels.
- [x] Les conflits de revision et l etat canonique invalide restent distincts.
- [x] Les impacts Storage et Realtime sont inventories, meme s ils ne sont
      pas utilises directement.
- [x] TypeScript, tests, audit, build et budget bundle passent.
- [x] Les tests navigateur authentifies couvrent les regressions probables.
- [x] Le rollback vers 2.53.0 est documente.

## Tests

- `npm.cmd test -- --run tests/supabaseClient.test.ts`
- `npm.cmd test -- --run tests/gameApiAuth.test.ts`
- `npm.cmd test -- --run tests/login.smoke.test.tsx`
- `npm.cmd test -- --run tests/canonicalStateRecovery.test.tsx`
- `npm.cmd test -- --run`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd audit --omit=dev --audit-level=high`
- `npm.cmd run board:validate`

## Validation manuelle

Avec Supabase local et Google OAuth :

1. se connecter puis recharger la page ;
2. executer une mutation game-api ;
3. passer offline puis online ;
4. verifier cache, reprise et revision ;
5. se deconnecter ;
6. supprimer puis recreer le compte ;
7. verifier la console, le reseau et l absence de token journalise.

## Preservation

- Conserver Google OAuth, allowlist et session locale.
- Conserver l autorite serveur et les codes game-api.
- Conserver le cache offline et les actions de recuperation.
- Conserver la compatibilite Node LTS et navigateurs modernes.

## Risques

- Les changements Auth peuvent modifier le stockage ou les verrous de session.
- Les changements fetch peuvent modifier la classification offline.
- Les types plus stricts peuvent reveler des contrats historiques incomplets.
- Les dependances transitives peuvent modifier le bundle.

## Handoff

- SDK et sous-clients Supabase epingles en `2.110.8`; un seul `createClient`.
- Matrice, impacts transitifs et rollback documentes dans
  `docs/development/supabase-js-2.110-migration.md`.
- Preuves Codex : 37 fichiers/315 tests, E2E 3/3, typecheck, lint cible,
  determinisme, secrets, logs, audit npm hors ligne, Workboard et diff verts.
- Preuves utilisateur : TI concurrence, 94 tests DB, build, budget bundle,
  OAuth/F5, mutation, multi-onglet, offline, reconnexion, reset et suppression/
  recreation du compte valides.
- Bundle utilisateur : 238713 B gzip JS, plus gros chunk 164013 B.
- L'installation npm reseau a rapporte 0 vulnerabilite; l'audit autonome
  Codex est reste hors ligne afin de ne pas transmettre les metadonnees du
  projet sans autorisation supplementaire.
