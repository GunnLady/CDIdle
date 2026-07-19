---
id: CDI-026
title: Heros et recrutement autoritaires
status: Done
area: vertical
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-011", "CDI-022", "CDI-024"]
blocks: ["CDI-027", "CDI-029", "CDI-030", "CDI-031", "CDI-033"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md"]
---

# CDI-026 — Heros et recrutement autoritaires

## Objectif

Implementer le perimetre Heros et recrutement autoritaires selon le plan fullstack autoritaire.

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

Ce ticket depend de : ["CDI-011", "CDI-022", "CDI-024"].

## Criteres d'acceptation

- [x] Le perimetre est implemente sans regression hors domaine.
- [x] Les invariants sont couverts par des tests reproductibles.
- [x] Les preuves et la documentation locales sont fournies.
- [ ] La validation HTTP Edge/Supabase/RLS/RPC reelle est differee et tracee
      dans `docs/architecture/game-api-followups.md` avec CDI-041.

## Progression

Le ticket peut avancer sur l implementation locale. La preuve Edge/Supabase
reelle est volontairement differee vers CDI-041/staging et ne sera pas
presentee comme acquise ici.

La mutation `recruitHero` est maintenant atomique et deterministe via une
fabrique de heros injectee ; les invariants cout, guilde et capacite sont
reutilises depuis `recruitmentEligibility`.

La mutation `setHeroActivity` couvre l activation, le renvoi a l inactivite,
la sante minimale et la limite de quatre heros actifs.

Le dispatcher Edge raccorde egalement `hero.recruit`, `hero.dismiss` et
`hero.activity` avec un identifiant de recrutement derive du `commandId`.

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
