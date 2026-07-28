---
id: CDI-048
title: Tests front manuels authentifiés
status: Done
area: frontend
priority: P1
size: M
risk: medium
source: audit global
depends_on: ["CDI-046", "CDI-051", "CDI-054"]
blocks: ["CDI-049"]
github_issue: null
related_docs: ["src/App.tsx", "workboard/data/Done/CDI-045/ticket.md", "workboard/data/Done/CDI-051/ticket.md", "workboard/data/Done/CDI-054/ticket.md", "workboard/data/Done/CDI-057/ticket.md", "workboard/data/Done/CDI-059/ticket.md", "workboard/data/Done/CDI-061/ticket.md"]
---

# CDI-048 — Tests front manuels authentifiés

## Objectif

Exécuter les scénarios front manuels avec une session authentifiée.

## Resultat utilisateur

Résultat observé pour ville, héros, inventaire, donjon et reprise réseau.

## Contexte

Les tests nécessitent un navigateur et une authentification fonctionnelle.

## Perimetre autorise

- Parcours UI principal
- Réseau online/offline
- Rechargement

## Hors perimetre

- Tests de charge

## Contrat d'implementation

- Suivre la checklist et capturer les observations.

## Dependances

- CDI-046 — matrice automatisee locale.
- CDI-051 — raccordement UI aux commandes autoritaires.

## Criteres d'acceptation

- [x] Online validé
- [x] Offline validé
- [x] Reprise validée

## Tests

- Checklist navigateur

## Validation manuelle

DevTools Network Offline puis Online.

## Preservation

- Ne pas modifier l'état de production.

## Risques

- OAuth Google bloquant.

## Handoff

Clôture par consolidation du 2026-07-28 :

- aucun nouveau parcours n'a été rejoué, car les trois critères étaient déjà
  prouvés par les validations navigateur authentifiées des tickets dépendants ;
- online : mutations ville, héros, inventaire, forge et donjon, état canonique,
  transcript et persistance après F5 validés dans CDI-051, CDI-054, CDI-057 et
  CDI-059 ;
- offline : contrôles mutateurs verrouillés, reset refusé sans altération des
  héros ou ressources, cache en lecture seule validés dans CDI-045 et CDI-051 ;
- reprise : retour online, bootstrap, conflits 409, replay, multi-onglets,
  transfert/reprise du maître et F5 validés dans CDI-051 et CDI-061 ;
- les validations ont utilisé une session Google authentifiée sur Supabase
  local ; aucun état de production n'a été modifié.
