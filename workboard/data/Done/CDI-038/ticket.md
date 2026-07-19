---
id: CDI-038
title: Decision differee des Novices et poids de convergence
status: Done
area: domain
priority: P2
size: M
risk: medium
source: Extension utilisateur hors tickets P1
depends_on: ["CDI-011"]
blocks: []
github_issue: null
tags: ["analyse"]
related_docs: ["docs/architecture/hero-domain.md"]
---

# CDI-038 — Decision differee des Novices et poids de convergence

## Objectif

Definir puis implementer une mecanique de decision garantissant qu un Novice
ne reste pas indefiniment sans classe lorsque plusieurs choix restent proches
ou qu une affinite est insuffisante au niveau 10.

## Resultat utilisateur

Un Novice peut attendre lorsque la decision est ambigue, mais converge vers une
classe admissible apres un depassement raisonnable du niveau 10.

## Contexte

La logique actuelle retente la decision a chaque level-up, avec un seuil fixe
de score et d ecart. Elle ne contient pas encore de poids croissant selon le
depassement du niveau 10.

## Perimetre autorise

- Comparer des formules de poids lineaire, par paliers ou de baisse de seuil.
- Conserver les contraintes de batiments et l affinite de profil.
- Garantir une decision eventuale si au moins une classe admissible existe.
- Ajouter des tests deterministes de niveaux 10, 11, 12 et de convergence.

## Hors perimetre

- Ne pas modifier les classes, batiments ou statistiques de base.
- Ne pas bloquer les tickets P1.

## Contrat d'implementation

- La formule choisie est documentee et deterministe.
- Aucun Novice n est force vers une classe indisponible.
- L ambiguite est autorisee au niveau 10 mais ne peut pas etre infinie.

## Dependances

CDI-011 doit etre termine. Ce ticket est additionnel et ne bloque pas les tickets P1.

## Criteres d'acceptation

- [x] Une formule de poids ou de seuil est choisie et justifiee.
- [x] Les cas sans classe admissible restent en attente sans erreur.
- [x] Les cas ambigus convergent dans une borne de niveaux documentee.
- [x] Les tests couvrent les scores proches et les niveaux au-dessus de 10.

## Tests

- npm test -- --run
- npm run typecheck
- npm run board:validate

## Validation manuelle

Verifier qu un Novice reste en attente au niveau 10 si le choix est ambigu,
puis qu il finit par choisir une classe admissible selon la formule retenue.

## Preservation

Preserver le seuil actuel et la regle d ecart tant qu ils ne sont pas remplaces
par une decision explicitement documentee.

## Risques

Un poids trop fort pourrait choisir une classe inadaptee ; un poids trop faible
laisserait le Novice bloqué trop longtemps.

## Handoff

Fournir la formule, les exemples de scores, la borne de convergence et les
tests associes.

## Progression

Formule implementee : 55/6 au niveau 10, 45/4 au niveau 11, 30/2 au niveau
12, puis choix force au niveau 13. La decision reste en attente sans classe
admissible. La formule est documentee dans
`docs/architecture/novice-convergence.md` et couverte par des tests.
