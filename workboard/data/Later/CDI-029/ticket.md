---
id: CDI-029
title: Donjon et combat autoritaires
status: Later
area: vertical
priority: P1
size: L
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-014", "CDI-015", "CDI-022", "CDI-026", "CDI-027"]
blocks: ["CDI-031", "CDI-033"]
attack_speed_rng_note: "La resolution serveur du multi-hit attackSpeed + speed utilise le Rng injecte et produit un transcript rejouable, sans Math.random client."
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/dungeon-progression-audit.md", "docs/architecture/zero-rebase-audit.md"]
---

# CDI-029 — Donjon et combat autoritaires

## Objectif

Implementer le perimetre Donjon et combat autoritaires selon le plan fullstack autoritaire.

## Resultat utilisateur

Un composant testable, documente et compatible avec les invariants du plan.

## Contexte

Ce ticket fait partie du catalogue approuve et ses dependants attendent ses contrats.

## Perimetre autorise

- Implementer uniquement le domaine indique.
- Ajouter les tests deterministes et la documentation necessaire.
- Integrer la progression canonique CDI-014 avec les encounters CDI-015 dans
  le flux autoritaire.
- Implementer la retraite, les recompenses/loot, et l'auto-exploration
  uniquement en ligne.
- Mettre en place la migration hybride 2C a court terme : le client peut
  previsualiser le combat, mais le serveur valide les degats, le transcript,
  les recompenses et la progression.
- Livrer ensuite la cible 2B : resolution complete du combat par le serveur,
  le client ne faisant que soumettre les commandes et afficher l'etat signe.

## Hors perimetre

- Ne pas elargir le ticket a un domaine voisin.
- Ne pas introduire de facturation ni de secret client.

## Contrat d'implementation

- Etat canonique, erreurs explicites et mutations idempotentes.
- Validation reproductible sans reseau reel.
- Une commande repetee ne doit ni avancer deux fois la salle ni distribuer deux
  fois les recompenses.
- La resolution serveur 2B doit rester la source d'autorite finale meme
  pendant la phase hybride 2C.

## Dependances

Ce ticket depend de : ["CDI-014", "CDI-015", "CDI-022", "CDI-026", "CDI-027"].

## Criteres d'acceptation

- [ ] Le perimetre est implemente sans regression hors domaine.
- [ ] Les invariants sont couverts par des tests reproductibles.
- [ ] Les preuves et la documentation sont fournies.

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
