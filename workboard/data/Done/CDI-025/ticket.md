---
id: CDI-025
title: Ville autoritaire de bout en bout
status: Done
area: vertical
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-010", "CDI-022", "CDI-024"]
blocks: ["CDI-030", "CDI-031", "CDI-033", "CDI-051"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md"]
---

# CDI-025 — Ville autoritaire de bout en bout

## Objectif

Implementer le perimetre Ville autoritaire de bout en bout selon le plan fullstack autoritaire.

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

Ce ticket depend de : ["CDI-010", "CDI-022", "CDI-024"].

La mise en oeuvre peut avancer independamment du smoke local CDI-041. La
validation d'integration Supabase (RLS, RPC, transaction atomique et parcours
HTTP Edge reel) reste toutefois un gate de cloture et demeure bloquee tant que
CDI-041 n'a pas fourni une preuve locale ou staging equivalente.

## Criteres d'acceptation

- [x] Le perimetre est implemente sans regression hors domaine.
- [x] Les invariants sont couverts par des tests reproductibles.
- [x] Les preuves et la documentation locales sont fournies.
- [ ] La validation HTTP Edge/Supabase/RLS/RPC reelle est differee et tracee
      dans `docs/architecture/game-api-followups.md` avec CDI-041.

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

## Progression CDI-025

La tranche raccorde le runtime Edge a un applicateur serveur pour les
commandes `building.upgrade`, `citizens.allocate` et `district.unlock`, avec
depenses atomiques, prerequis, plafonds, refus metier et evenements. Les tests
unitaires dedies sont ajoutes et passent : 10 tests sur 3 fichiers. Le contrat
HTTP UUID est aussi couvert par le test du handler.

Le `typecheck` et le build Vite passent. Le lint reste sans erreur avec les
warnings historiques de l'application.

La preuve HTTP Edge/Supabase/RLS/RPC est volontairement differee : elle sera
realisee avec CDI-041 une fois l'environnement staging/production disponible.
Cette absence de preuve distante n'est pas masquee par le statut `Done` ; elle
reste un ecart trace et planifie.
