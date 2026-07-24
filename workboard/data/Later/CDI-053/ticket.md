---
id: CDI-053
title: Restaurer l equipement initial autoritaire des heros
status: Later
area: integration
priority: P1
size: M
risk: high
source: Regression observee pendant la validation navigateur CDI-051 du 2026-07-24
depends_on: ["CDI-026", "CDI-027", "CDI-052"]
blocks: ["CDI-051"]
github_issue: null
related_docs: ["docs/development/session-2026-07-24-cdi-051-handoff.md", "docs/architecture/hero-domain.md", "docs/architecture/inventory-domain.md", "supabase/functions/game-api/town-authority.ts", "src/utils/gameCalculations.ts"]
---

# CDI-053 — Restaurer l equipement initial autoritaire des heros

## Objectif

Restaurer la generation de l equipement de novice lors de la creation des heros
sans reintroduire une autorite RNG ou inventaire cote client.

## Resultat utilisateur

Un heros nouvellement cree possede son equipement initial, conserve cet
equipement apres rechargement et permet de tester les parcours equipement et
inventaire.

## Contexte

La migration de l onboarding vers `onboarding.start` reconstruit actuellement
les heros cote serveur avec des emplacements d equipement vides. La validation
navigateur CDI-051 a confirme la regression et un coffre vide.

## Perimetre autorise

- Generer l equipement initial dans l autorite serveur.
- Utiliser exclusivement le catalogue canonique.
- Garantir une generation deterministe et rejouable sans choix RNG client.
- Persister atomiquement heros, equipement et eventuels objets associes.
- Ajouter les tests d autorite et de non-regression.

## Hors perimetre

- Modifier les probabilites, statistiques ou couts du gameplay.
- Refaire le systeme general de progression RNG de CDI-050.
- Ajouter une mutation locale de secours.
- Reconcevoir l interface d onboarding.

## Contrat d'implementation

- Le client ne fournit aucun objet, rarete, modificateur ou statistique
  d equipement faisant autorite.
- Les identifiants d objets proviennent du catalogue canonique.
- Un replay de la meme commande ne cree aucun doublon.
- L equipement fait partie de l etat canonique retourne et mis en cache.
- Une erreur serveur ne cree aucun equipement local.

## Dependances

- CDI-026 pour l autorite heros.
- CDI-027 pour l autorite inventaire et equipement.
- CDI-052 pour les contrats partages.

## Criteres d'acceptation

- [ ] Chaque heros initial recoit l equipement novice attendu.
- [ ] Les objets proviennent du catalogue canonique.
- [ ] Aucun choix RNG ou objet canonique n est accepte depuis le client.
- [ ] Le replay est idempotent et ne duplique aucun objet.
- [ ] L equipement persiste apres `F5` et nouveau bootstrap.
- [ ] Le parcours inventaire/equipement redevient testable.
- [ ] Les tests serveur couvrent creation, persistance, replay et rejet des
      donnees client non autorisees.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run tests/townAuthority.test.ts tests/authoritativeContracts.test.ts`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Reinitialiser une partie ou utiliser un nouveau compte, terminer l onboarding,
verifier l equipement des heros, faire `F5`, puis equiper ou recycler un objet
via les commandes autoritaires.

## Preservation

Conserver le parcours visuel d onboarding, les noms et identites selectionnes,
les regles d equipement novice et les contrats de commande existants.

## Risques

Une generation partiellement locale recreerait deux sources d autorite. Une
persistance non atomique pourrait dupliquer ou perdre des objets au replay.

## Handoff

Fournir la matrice heros vers equipement genere, les fichiers modifies, les
tests automatises et la preuve navigateur apres rechargement.
