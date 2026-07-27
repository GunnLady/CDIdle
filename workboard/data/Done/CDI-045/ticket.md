---
id: CDI-045
title: Auditer offline, cache et conflits de r�vision
status: Done
area: frontend
priority: P1
size: M
risk: high
source: CDI-031
depends_on: ["CDI-051"]
blocks: ["CDI-046", "CDI-049"]
github_issue: null
related_docs: ["src/App.tsx", "src/lib/supabase.ts", "src/lib/gameCache.ts", "docs/fullstack-authoritative-plan.md"]
---

# CDI-045 — Auditer offline, cache et conflits de r�vision

## Objectif

Auditer et corriger le comportement offline, cache et conflits 409.

## Resultat utilisateur

Aucune mutation hors ligne et rechargement canonique apr�s conflit.

## Contexte

CDI-031 impl�mente la premi�re protection r�seau et la r�vision serveur.

## Perimetre autorise

- Banni�re offline
- Mutateurs ville/h�ros/inventaire/donjon
- Cache
- 409
- Ajouter une suppression ciblee du cache IndexedDB par utilisateur.
- Purger ou remplacer le cache apres reset et suppression definitive.
- Verifier l isolation de deux utilisateurs et l absence de resurrection d une
  ancienne partie.

## Hors perimetre

- Nouveau syst�me de synchronisation offline

## Contrat d'implementation

- V�rifier �tat, cache, ticks, auto-donjon et reprise online.
- `deleteGameCache(userId)` retire le snapshot IndexedDB concerne.
- Un reset reussit cote serveur avant de remplacer et recacher l etat local.
- Une suppression definitive ne laisse aucun snapshot du compte supprime.

## Dependances

- CDI-051 — raccordement complet de l interface a l autorite serveur.

## Criteres d'acceptation

- [x] Crit�res offline couverts
- [x] Conflit 409 recharge l'�tat canonique
- [x] Le reset remplace le cache par l etat canonique initial.
- [x] La suppression de compte purge le snapshot IndexedDB de l utilisateur.
- [x] Deux utilisateurs ne peuvent ni lire ni restaurer le cache de l autre.
- [x] Une panne reseau ne ressuscite pas une partie reinitialisee ou supprimee.

## Tests

- `npm.cmd test -- --run`
- `npm.cmd run typecheck`

## Validation manuelle

Test DevTools Offline avec session authentifi�e.

## Preservation

- Ne pas muter le cache hors ligne.

## Risques

- Session authentifi�e indisponible.

## Handoff

Fournir r�sultats et �carts r�siduels.

Cloture du 2026-07-27 :

- protections offline et resynchronisation 409 validees pendant CDI-051 ;
- reset hors ligne refuse sans alteration des heros ni des ressources ;
- cache IndexedDB strictement isole par utilisateur et hydrate en lecture seule ;
- ecritures monotones par revision et confirmees a la fin de transaction ;
- reset protege contre la resurrection d un ancien snapshot ;
- suppression de compte purgee et propagee aux autres onglets ;
- bootstraps obsoletes ignores lors d un changement de compte ;
- tests complets : 304/304 PASS ;
- typecheck PASS ;
- lint : 0 erreur, 49 avertissements preexistants hors perimetre ;
- determinisme et securite des logs PASS ;
- workboard : 61 tickets, 0 erreur ;
- build final PASS, rapporte par l utilisateur.
