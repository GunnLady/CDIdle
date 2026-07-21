---
id: CDI-047
title: Smoke r�el Edge et Supabase authentifi�
status: Paused
area: integration
priority: P1
size: M
risk: high
source: audit global
depends_on: []
blocks: []
github_issue: null
related_docs: ["supabase"]
---

# CDI-047 — Smoke r�el Edge et Supabase authentifi�

## Objectif

Valider le parcours r�el Edge/Supabase avec une session authentifi�e.

## Resultat utilisateur

Preuve de fonctionnement distant ou blocage explicitement trac�.

## Contexte

Le test d�pend de services et credentials r�els.

## Perimetre autorise

- Navigateur Edge\n- Supabase distant\n- API game

## Hors perimetre

- Modification de donn�es de production non contr�l�e

## Contrat d'implementation

- Utiliser un compte de test et consigner requ�tes, statuts et erreurs.

## Dependances

Aucune.

## Criteres d'acceptation

- [ ] Session �tablie\n- [ ] Bootstrap et mutation contr�l�e valid�s

## Tests

- Smoke navigateur r�el

## Validation manuelle

� ex�cuter par le propri�taire avec acc�s distant.

## Preservation

- Ne pas exposer de secrets.

## Risques

- Acc�s externe indisponible.

## Handoff

Reprendre le ticket apr�s d�blocage.
