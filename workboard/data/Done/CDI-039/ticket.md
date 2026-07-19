---
id: CDI-039
title: Authentification runtime JWT et allowlist game-api
status: Done
area: backend
priority: P1
size: L
risk: high
source: Audit game-api-followups confirme le 2026-07-19
depends_on: ["CDI-019", "CDI-022"]
blocks: ["CDI-040"]
github_issue: null
related_docs: ["docs/architecture/game-api-followups.md", "docs/architecture/game-api-audit.md", "docs/architecture/google-oauth-audit.md"]
---

# CDI-039 — Authentification runtime JWT et allowlist game-api

## Objectif

Brancher une authentification Supabase runtime reelle devant toutes les routes de
`game-api`, avec verification cryptographique du JWT et controle actif de
l'allowlist.

## Resultat utilisateur

Seuls les comptes authentifies, autorises et non revoques peuvent charger ou
modifier une partie, sans exposition de secret serveur.

## Contexte

CDI-022 a livre le contrat HTTP avec une dependance `authenticate` injectee,
mais aucune implementation runtime ne verifie encore les jetons Supabase.

## Perimetre autorise

- Verifier signature, `sub`, expiration, issuer et audience du JWT.
- Verifier l'utilisateur Auth et l'entree active dans `alpha_allowlist`.
- Refuser les utilisateurs supprimes ou revoques sur bootstrap et mutations.
- Normaliser les erreurs d'authentification sans journaliser JWT, email ou secret.
- Ajouter les tests unitaires et d'integration locale necessaires.

## Hors perimetre

- Ne pas implementer les commandes metier CDI-025 a CDI-030.
- Ne pas deployer staging ou production.
- Ne pas exposer la cle `service_role` au navigateur.

## Contrat d'implementation

- Toute route protegee derive l'utilisateur exclusivement d'un JWT verifie.
- Un compte absent de l'allowlist active est refuse de facon deterministe.
- Les erreurs restent structurees et sans information sensible.

## Dependances

- CDI-019
- CDI-022

## Criteres d'acceptation

- [x] Les JWT valides, absents, expires, mal signes et mal emis sont couverts.
- [x] Les comptes supprimes, revoques ou hors allowlist sont refuses.
- [x] Aucune donnee sensible n'apparait dans les reponses ou les logs de test.
- [x] L'implementation est importable par Vitest et l'Edge Runtime.

## Tests

- npm test -- --run
- npm run test:db
- npm run typecheck
- npm run lint
- npm run build
- npm run board:validate

## Validation manuelle

Verifier un bootstrap autorise puis les refus d'un jeton expire et d'un compte
revoque contre Supabase local.

## Preservation

Conserver CORS, les erreurs structurees et les identifiants de requete de
CDI-022, ainsi que les invariants d'allowlist de CDI-019.

## Risques

Une verification partielle du JWT ou une utilisation incorrecte de
`service_role` ouvrirait l'acces aux donnees de partie.

## Handoff

Fournir les fichiers modifies, les scenarios JWT couverts, les commandes de
validation et les risques residuels avant CDI-040.
