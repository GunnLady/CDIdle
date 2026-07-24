---
id: CDI-048
title: Tests front manuels authentifi�s
status: Later
area: frontend
priority: P1
size: M
risk: medium
source: audit global
depends_on: ["CDI-046", "CDI-051", "CDI-054"]
blocks: ["CDI-049"]
github_issue: null
related_docs: ["src/App.tsx"]
---

# CDI-048 — Tests front manuels authentifi�s

## Objectif

Ex�cuter les sc�narios front manuels avec une session authentifi�e.

## Resultat utilisateur

R�sultat observ� pour ville, h�ros, inventaire, donjon et reprise r�seau.

## Contexte

Les tests n�cessitent un navigateur et une authentification fonctionnelle.

## Perimetre autorise

- Parcours UI principal\n- R�seau online/offline\n- Rechargement

## Hors perimetre

- Tests de charge

## Contrat d'implementation

- Suivre la checklist et capturer les observations.

## Dependances

- CDI-046 — matrice automatisee locale.
- CDI-051 — raccordement UI aux commandes autoritaires.

## Criteres d'acceptation

- [ ] Online valid�\n- [ ] Offline valid�\n- [ ] Reprise valid�e

## Tests

- Checklist navigateur

## Validation manuelle

DevTools Network Offline puis Online.

## Preservation

- Ne pas modifier l'�tat de production.

## Risques

- OAuth Google bloquant.

## Handoff

Reporter le r�sultat observ� et les preuves.
