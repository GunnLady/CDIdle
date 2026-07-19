---
id: CDI-041
title: Smoke tests Edge et resilience game-api
status: Paused
area: delivery
priority: P1
size: L
risk: high
source: Audit game-api-followups confirme le 2026-07-19
depends_on: ["CDI-017", "CDI-040"]
blocks: ["CDI-025", "CDI-026", "CDI-032"]
github_issue: null
related_docs: ["docs/architecture/game-api-followups.md", "docs/architecture/game-api-audit.md", "docs/architecture/supabase-local-audit.md"]
---

# CDI-041 — Smoke tests Edge et resilience game-api

## Objectif

Prouver le fonctionnement du handler Edge reel avec Supabase local et lever la
porte de blocage des premieres tranches verticales.

## Resultat utilisateur

Le socle API est executable de bout en bout et echoue proprement avant que les
mutations ville, heros et compte soient raccordees.

## Contexte

Les tests CDI-022 utilisent un handler en memoire. CDI-039 et CDI-040 doivent
etre valides ensemble dans le runtime Edge et la base locale.

## Perimetre autorise

- Demarrer Supabase local et servir la Function `game-api`.
- Tester bootstrap, commands, reset et account sur le chemin HTTP reel.
- Couvrir 401, 403, 409, 503, replay et collision de commande.
- Verifier CORS, `x-request-id`, absence de secrets et nettoyage apres test.
- Produire une commande reproductible pour la CI.

## Hors perimetre

- Ne pas implementer les domaines CDI-025 a CDI-030.
- Ne pas deployer en staging ou production.
- Ne pas accepter un smoke test fonde uniquement sur des services fictifs.

## Contrat d'implementation

- Le smoke test utilise le runtime Edge et Supabase local reels.
- Les donnees de test sont isolees, deterministes et nettoyees.
- Un echec d'infrastructure est distingue d'une regression fonctionnelle.

## Dependances

- CDI-017
- CDI-040

## Criteres d'acceptation

- [ ] Les quatre routes principales passent dans le runtime Edge local. (401 sans JWT valide seulement ; smoke authentifie bloque par l'injection env du CLI.)
- [ ] Les erreurs 401, 403, 409 et 503 sont reproduites et verifiees.
- [x] Replay, collision, CORS, request-id et absence de secrets sont controles au niveau local/injecte.
- [ ] Le smoke test est executable localement et dans la CI.
- [ ] CDI-025, CDI-026 et CDI-032 peuvent etre debloques.

## Tests

- npm test -- --run
- npm run test:db
- npm run typecheck
- npm run lint
- npm run build
- npm run board:validate
- smoke Edge/Supabase local documente par le ticket

## Validation manuelle

Executer le smoke test complet sur une base locale reinitialisee et verifier le
nettoyage des donnees de test.

## Preservation

Conserver l'isolation du workboard, les ports Supabase documentes et les
contrats HTTP valides.

## Risques

Un smoke test qui ne traverse pas le runtime reel laisserait subsister le
blocage sans preuve de fonctionnement.

## Handoff

Fournir la commande unique de smoke, les sorties principales, la matrice des
erreurs et la liste explicite des tickets debloques.

## Blocage trace

Le runtime Edge local demarre et repond `401` sans bearer. L'authentification
ES256 GoTrue est maintenant acceptee par l'authenticator, mais les appels
REST/RPC depuis le worker local renvoient encore `503` selon l'URL reseau
utilisee (`127.0.0.1`, `host.docker.internal` ou `kong`). Reprise : fournir
une URL Supabase joignable depuis le worker Edge local, conserver
`GAME_API_EXPECTED_ISSUER` aligne sur l'issuer du token, puis rejouer le smoke
authentifie. Ce blocage d'infrastructure interdit de declarer le ticket `Done`
et bloque les tranches CDI-025, CDI-026 et CDI-032.
