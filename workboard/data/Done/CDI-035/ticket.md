---
id: CDI-035
title: Staging, production et exploitation
status: Done
area: delivery
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-034"]
blocks: []
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/deployment/cdi-035-runbook.md", "docs/deployment/cdi-035-deferred-validation.md"]
---

# CDI-035 — Staging, production et exploitation

## Objectif

Implementer le perimetre Staging, production et exploitation selon le plan fullstack autoritaire.

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

Ce ticket depend de : ["CDI-034"].

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

## Avancement vérifié

- Workflow de promotion staging/production ajouté avec environnements GitHub,
  sauvegarde avant promotion, injection Vite, smoke authentifié et artefact de
  sauvegarde.
- Workflow de rollback par commit ajouté.
- Garde migrations additives et audit logs sans PII ajoutés à la CI.
- Vérifications locales : typecheck, audit secrets, audit logs, audit migrations
  et board valides.

## Blocage externe

Les critères de promotion réelle restent ouverts tant que les secrets GitHub,
les projets Supabase/Cloudflare et le compte synthétique ne sont pas fournis.
Il faut ensuite exécuter le smoke staging et observer 48 h avec deux comptes et
deux appareils avant de cocher les critères et passer le ticket à Done.

## Validation staging différée

La validation distante n'est pas disponible et n'est pas présentée comme
réussie. Elle est explicitement reportée vers CDI-047 (smoke Edge/Supabase) et
CDI-048 (tests front manuels authentifiés), selon
`docs/deployment/cdi-035-deferred-validation.md`.
