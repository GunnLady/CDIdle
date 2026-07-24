---
id: CDI-051
title: Raccordement UI aux commandes autoritaires
status: Paused
area: integration
priority: P1
size: L
risk: high
source: Audit Eclipse CDI-037 du 2026-07-23
depends_on: ["CDI-023", "CDI-025", "CDI-026", "CDI-027", "CDI-028", "CDI-029", "CDI-031", "CDI-041", "CDI-052", "CDI-053"]
blocks: ["CDI-045", "CDI-046", "CDI-048", "CDI-049"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/api-command-contracts.md", "docs/architecture/game-api-followups.md", "docs/development/session-2026-07-24-cdi-051-handoff.md", "src/App.tsx", "src/lib/supabase.ts"]
---

# CDI-051 — Raccordement UI aux commandes autoritaires

## Objectif

Raccorder les actions ville, heros, inventaire, forge et donjon du front aux
commandes typees de `game-api`, puis appliquer uniquement l etat canonique
retourne par le serveur.

## Resultat utilisateur

Les actions visibles sont validees par le serveur, persistent apres rechargement
et ne divergent pas entre cache local, interface et partie canonique.

## Contexte

Le client appelle actuellement `bootstrap` et `reset`, mais aucune mutation UI
n appelle `/commands`. Les hooks locaux continuent donc de produire les
mutations visibles malgre les autorites serveur deja livrees.

La validation navigateur du 2026-07-24 a aussi identifie une regression :
les heros crees par l onboarding autoritaire ne recoivent plus leur equipement
initial. CDI-053 doit corriger cette regression avant la cloture de CDI-051.

## Perimetre autorise

- Construire les enveloppes de commandes avec UUID, idempotence et revision.
- Raccorder les mutations ville, heros, inventaire, forge et donjon.
- Raccorder onboarding, cheats autorises, ticks ville, immigration,
  recuperation et auto-donjon a l autorite serveur.
- Appliquer la reponse canonique et rafraichir le cache local.
- Traiter erreurs metier, conflit 409, replay et indisponibilite reseau.
- Supprimer ou neutraliser les mutations locales qui contournent l autorite.
- Supprimer ou reformuler la fausse synchronisation cloud sans commande.
- Appliquer le reset local uniquement apres le succes de `/reset`.

## Hors perimetre

- Modifier les regles, probabilites ou couts du gameplay.
- Ajouter une file de mutations offline.
- Modifier le schema RNG canonique de CDI-050.

## Contrat d'implementation

- Toute mutation canonique passe par `/game-api/commands`.
- Le client ne remplace jamais le serveur avec un snapshot `save_game`.
- Aucun timer React ne produit de ressources, citoyens, recuperation, loot ou
  progression canonique.
- Hors ligne, aucune commande ni mutation canonique locale n est appliquee.
- Une reponse 409 recharge l etat canonique avant une nouvelle action.
- Les commandes repetees restent idempotentes.
- Le reset attend la reponse serveur avant de modifier l interface et le cache.

## Dependances

- CDI-023, CDI-025, CDI-026, CDI-027, CDI-028, CDI-029, CDI-031, CDI-041 et
  CDI-052.

## Criteres d'acceptation

- [ ] Les actions ville utilisent des commandes typees.
- [ ] Les actions heros, inventaire et forge utilisent des commandes typees.
- [ ] Les actions donjon utilisent des commandes typees.
- [ ] Onboarding, cheats, ticks et auto-donjon ne contournent pas l autorite.
- [ ] L interface applique uniquement l etat canonique retourne.
- [ ] Le cache local suit la revision canonique apres chaque succes.
- [ ] Offline, 409, replay et erreurs metier sont couverts.
- [ ] Un rechargement confirme la persistance des mutations.
- [ ] La sauvegarde manuelle ne pretend pas synchroniser sans commande serveur.
- [ ] Un echec de `/reset` ne reinitialise ni l interface ni le cache.
- [ ] CDI-053 restaure l equipement initial autoritaire et sa persistance.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Avec une session authentifiee, executer une mutation par domaine, recharger,
passer offline puis online et verifier revision, cache et etat canonique.

## Preservation

Conserver l UX existante, les protections offline, les identifiants de commande
et les contrats serveur deja valides.

## Risques

Un raccordement partiel laisserait deux sources d autorite et pourrait dupliquer
ou perdre des mutations.

## Handoff

Fournir la matrice action UI vers commande, les fichiers touches, les tests et
les preuves navigateur. CDI-051 reste bloque par CDI-053 tant que les nouveaux
heros ne recuperent pas leur equipement initial canonique.
