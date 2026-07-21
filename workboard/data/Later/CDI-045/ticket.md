---
id: CDI-045
title: Auditer offline, cache et conflits de r�vision
status: Later
area: frontend
priority: P1
size: M
risk: high
source: CDI-031
depends_on: []
blocks: []
github_issue: null
related_docs: ["src/App.tsx","src/lib/supabase.ts"]
---

# CDI-045 — Auditer offline, cache et conflits de r�vision

## Objectif

Auditer et corriger le comportement offline, cache et conflits 409.

## Resultat utilisateur

Aucune mutation hors ligne et rechargement canonique apr�s conflit.

## Contexte

CDI-031 impl�mente la premi�re protection r�seau et la r�vision serveur.

## Perimetre autorise

- Banni�re offline\n- Mutateurs ville/h�ros/inventaire/donjon\n- Cache\n- 409

## Hors perimetre

- Nouveau syst�me de synchronisation offline

## Contrat d'implementation

- V�rifier �tat, cache, ticks, auto-donjon et reprise online.

## Dependances

Aucune.

## Criteres d'acceptation

- [ ] Crit�res offline couverts\n- [ ] Conflit 409 recharge l'�tat canonique

## Tests

- npm.cmd test -- --run\n- npm.cmd run typecheck

## Validation manuelle

Test DevTools Offline avec session authentifi�e.

## Preservation

- Ne pas muter le cache hors ligne.

## Risques

- Session authentifi�e indisponible.

## Handoff

Fournir r�sultats et �carts r�siduels.
