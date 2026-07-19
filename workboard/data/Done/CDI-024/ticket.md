---
id: CDI-024
title: Bootstrap et cache local sur
status: Done
area: backend
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-016", "CDI-023"]
blocks: ["CDI-025", "CDI-026", "CDI-030", "CDI-031"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md"]
---

# CDI-024 — Bootstrap et cache local sur

## Objectif

Implementer le perimetre Bootstrap et cache local sur selon le plan fullstack autoritaire.

## Resultat utilisateur

Un composant testable, documente et compatible avec les invariants du plan.

## Contexte

Ce ticket fait partie du catalogue approuve et ses dependants attendent ses contrats.

## Perimetre autorise

- Implementer uniquement le domaine indique.
- Ajouter les tests deterministes et la documentation necessaire.

## Hors perimetre

- Ne pas elargir le ticket a un domaine voisin.
- Ne pas introduire de facturation ni de secret client.

## Contrat d'implementation

- Etat canonique, erreurs explicites et mutations idempotentes.
- Validation reproductible sans reseau reel.

## Dependances

Ce ticket depend de : ["CDI-016", "CDI-023"].

## Criteres d'acceptation

- [x] Le perimetre est implemente sans regression hors domaine.
- [x] Les invariants sont couverts par des tests reproductibles.
- [x] Les preuves et la documentation sont fournies.

## Tests

- npm test -- --run
- npm run lint
- npm run build
- npm run board:validate

## Validation manuelle

Relire le resultat contre le plan et verifier les parcours nominaux et d'erreur.

## Preservation

Preserver les contrats valides, les identifiants persistants et les tests verts.

## Risques

Une implementation trop large creerait des dependances implicites.

## Handoff

Fournir fichiers, commandes, resultats, risques residuels et decisions a transmettre.

## Preuves de réalisation

- Cache IndexedDB par utilisateur ajouté avec reprise hors connexion en lecture
  seule et purge de la clé `localStorage` historique.
- Typecheck, 62 tests, lint, build et validation du workboard exécutés.
- Audit détaillé : `docs/architecture/supabase-cache-audit.md`.
- Docker Desktop n'est pas démarré ; `test:db` n'est pas applicable au périmètre
  de ce ticket et reste couvert par la CI distante.
