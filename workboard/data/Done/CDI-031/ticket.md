---
id: CDI-031
title: UX hors-ligne et conflits
status: Done
area: vertical
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-024", "CDI-025", "CDI-026", "CDI-027", "CDI-028", "CDI-029", "CDI-030"]
blocks: ["CDI-034", "CDI-051"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/zero-rebase-audit.md", "workboard/data/Later/CDI-044/ticket.md", "workboard/data/Later/CDI-045/ticket.md", "workboard/data/Paused/CDI-047/ticket.md", "workboard/data/Later/CDI-048/ticket.md", "workboard/data/Later/CDI-049/ticket.md"]
---

# CDI-031 — UX hors-ligne et conflits

## Objectif

Implementer le perimetre UX hors-ligne et conflits selon le plan fullstack autoritaire.

## Resultat utilisateur

Un composant testable, documente et compatible avec les invariants du plan.

## Contexte

Ce ticket fait partie du catalogue approuve. Suites: CDI-044 OAuth, CDI-045 audit offline, CDI-047 smoke distant, CDI-048 tests front, CDI-049 readiness.

## Perimetre autorise

- Implementer uniquement le domaine indique.
- Ajouter les tests deterministes et la documentation necessaire.
- Verrouiller toute mutation de combat, loot et progression hors ligne.
- Permettre la reprise d'une commande interrompue via idempotence et revision
  attendue, sans double application ni perte de transcript.

## Hors perimetre

- Ne pas elargir le ticket a un domaine voisin.
- Ne pas introduire de facturation ni de secret client.

## Contrat d'implementation

- Etat canonique, erreurs explicites et mutations idempotentes.
- Validation reproductible sans reseau reel.

## Dependances

Ce ticket depend de : ["CDI-024", "CDI-025", "CDI-026", "CDI-027", "CDI-028", "CDI-029", "CDI-030"].

## Criteres d'acceptation

- [ ] Le perimetre est implemente sans regression hors domaine.
- [ ] Les invariants sont couverts par des tests reproductibles.
- [ ] Les preuves et la documentation sont fournies.

## Tests

- `npm.cmd run typecheck` ? OK
- `npm.cmd test -- --run` ? 13 fichiers, 97 tests OK
- `npm.cmd run lint` ? 0 erreur, 132 warnings historiques
- `npm.cmd run build` ? OK; avertissement chunk JS > 500 kB
- `npm.cmd run board:validate` ? 49 tickets, 0 erreur
## Validation manuelle

La validation navigateur est deleguee a CDI-048; OAuth et smoke distant sont traces dans CDI-044 et CDI-047.
## Preservation

Preserver les contrats valides, les identifiants persistants et les tests verts.

## Risques

Une implementation trop large creerait des dependances implicites.

## Handoff

Fournir fichiers, commandes, resultats et risques residuels. Reporter les preuves manuelles a CDI-048 et la decision finale a CDI-049.
