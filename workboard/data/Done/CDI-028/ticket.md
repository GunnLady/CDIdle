---
id: CDI-028
title: Forge et recyclage autoritaires
status: Done
area: vertical
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-013", "CDI-022", "CDI-027"]
blocks: ["CDI-031", "CDI-033"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/zero-rebase-audit.md"]
---

# CDI-028 — Forge et recyclage autoritaires

## Objectif

Implementer le perimetre Forge et recyclage autoritaires selon le plan fullstack autoritaire.

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

Ce ticket depend de : ["CDI-013", "CDI-022", "CDI-027"].

## Criteres d'acceptation

- [x] Le perimetre est implemente sans regression hors domaine.
- [x] Les invariants sont couverts par des tests reproductibles.
- [x] Les preuves et la documentation locales sont fournies.
- [ ] La validation HTTP Edge/Supabase/RLS/RPC reelle est differee vers
      CDI-041/staging et n'est pas presentee comme acquise ici.

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

## Progression

Le serveur autoritaire gere le demarrage, l'aperçu, la finalisation, l'annulation
et le recyclage. Le proc RNG avancé reste différé vers CDI-037.

Le catalogue serveur couvre les sept recettes de base et la compatibilité des
modificateurs est vérifiée côté serveur. Le test ciblé utilisateur passe à 6/6.

