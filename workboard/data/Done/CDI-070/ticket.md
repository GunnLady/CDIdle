---
id: CDI-070
title: Prioriser les commandes utilisateur dans la file canonique
status: Done
area: frontend
priority: P1
size: L
risk: high
source: Retour utilisateur sur la latence du frontend web du 2026-07-30
depends_on: []
blocks: []
github_issue: null
related_docs: ["docs/architecture/api-command-contracts.md", "src/App.tsx", "src/lib/canonicalOperationQueue.ts", "src/lib/optimisticCommandBuffer.ts", "src/domain/optimisticStateProjection.ts", "shared/contracts/authoritative.ts"]
---

# CDI-070 - Prioriser les commandes utilisateur dans la file canonique

## Objectif

Rendre les mutations deterministes du frontend immediatement perceptibles,
prioriser les commandes utilisateur et condenser les clics rapides, sans
affaiblir l autorite serveur ni creer une seconde revision du jeu.

## Resultat utilisateur

Un clic compatible modifie immediatement l affichage. Le serveur confirme en
arriere-plan sans message de succes. Un refus ou une panne restaure l etat
confirme et informe le joueur. Ville et donjon restent coherents avec la meme
revision canonique.

## Contexte

Les appels sont asynchrones, mais un clic rejoint actuellement une file FIFO
partagee avec les `/bootstrap` periodiques. Aucun retour visuel significatif n
apparait avant la reponse distante complete, ce qui donne l impression que l
interface bloque.

## Perimetre autorise

- Conserver une seule file canonique et une seule revision du jeu.
- Donner une priorite non preemptive aux commandes utilisateur.
- Ne pas mettre en file un rafraichissement periodique lorsque la file est
  deja occupee.
- Projeter localement les mutations deterministes compatibles : citoyens,
  batiments, activite et equipement des heros, etage et auto-donjon.
- Limiter chaque famille a cinq clics par seconde et condenser deltas,
  selections et interrupteurs compatibles.
- Conserver une requete en vol et au plus un lot suivant par famille.
- Restaurer l etat confirme sur refus ou panne et rejouer silencieusement les
  mutations encore valides apres un conflit de revision.
- Etendre `building.upgrade` avec un lot atomique `levels` borne de 1 a 5.
- Empecher les doubles clics involontaires sans verrouiller les consultations.
- Isoler l ordonnancement dans un module testable si cela reste rentable.
- Mesurer separement attente en file et latence reseau.

## Hors perimetre

- Separer les revisions de la ville et du donjon.
- Inventer localement un resultat aleatoire de combat, butin, recrutement ou
  forge.
- Persister ou diffuser une projection optimiste aux onglets observateurs.
- Refaire l interface complete, traite par CDI-069.
- Masquer une panne ou une latence serveur reelle.

## Contrat d'implementation

- Une commande utilisateur deja demarree reste atomique et n est jamais
  interrompue.
- Un rafraichissement en cours n est pas annule brutalement ; la priorite est
  appliquee aux operations qui ne sont pas encore demarrees.
- Les commandes restent serialisees selon leur revision attendue.
- Le retour visuel commence avant le premier `await` du chemin utilisateur.
- Une erreur retire la projection concernee et permet une nouvelle tentative.
- `REVISION_CONFLICT` recharge l etat puis retente une seule fois la mutation.
  `COMMAND_IN_PROGRESS` recharge seulement l etat et n est jamais rejoue.
- Un lot de batiment valide tous ses couts, prerequis et plafonds avant commit ;
  un echec annule le lot entier.
- Un changement d etage attend la fin du combat et du transcript courant avant
  l envoi de `dungeon.select_floor`.

## Dependances

Le correctif est autonome. Il doit preserver les changements locaux en cours
sur le repli du donjon et rester compatible avec le futur cadrage UI/UX de
CDI-069.

## Criteres d'acceptation

- [x] Un clic produit un retour visuel immediat avant la reponse distante.
- [x] Une rafale compatible produit au plus cinq mutations par seconde et un
      lot backend borne a cinq niveaux.
- [x] Un succes est silencieux ; refus et panne restaurent l etat confirme et
      informent le joueur.
- [x] Un conflit de revision est rejoue une fois ; une commande deja en cours
      ne l est jamais.
- [x] Une commande utilisateur en attente passe avant tout rafraichissement
      periodique non demarre.
- [x] Aucun `/bootstrap` periodique n est ajoute lorsque la file est occupee.
- [x] Deux commandes incompatibles ne s executent jamais en parallele.
- [x] Ville et donjon partagent toujours la meme revision canonique.
- [x] Les erreurs, conflits et pertes de connexion liberent correctement l UI.
- [x] L auto-donjon conserve l attente de fin du transcript avant le combat
      suivant.
- [x] Les onglets observateurs restent non mutables.
- [x] Les projections optimistes ne sont ni mises en cache ni diffusees.
- [x] Le changement d etage fonctionne pendant et apres un transcript.

## Tests

- Test de serialisation des commandes utilisateur.
- Test de priorite sur un rafraichissement encore en attente.
- Test d abandon d un rafraichissement periodique quand la file est occupee.
- Test de liberation de l etat visuel apres succes et erreur.
- Tests de condensation, limite par seconde, lot suivant borne, rollback et
  distinction `REVISION_CONFLICT` / `COMMAND_IN_PROGRESS`.
- Tests de projection citoyens, batiments, heros, equipement, etage et auto.
- Test backend du lot de batiment atomique et de sa validation 1 a 5.
- Tests de non-regression auto-donjon et autorite multi-onglets.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Sur l alpha distante, effectuer plusieurs actions en ville et dans le donjon
pendant les rafraichissements periodiques. Verifier le retour immediat, l ordre
des requetes dans Network, l absence de double mutation et la persistance apres
F5. Confirmer aussi l auto-donjon et le mode observateur avec deux onglets.

## Preservation

- Preserver revision, atomicite, idempotence et rejeu canonique.
- Preserver la file unique entre ville et donjon.
- Preserver la separation entre file canonique et animation du transcript.
- Preserver les modifications locales non liees au ticket.

## Risques

- Une priorite preemptive pourrait interrompre une mutation deja envoyee.
- Des files separees produiraient davantage de conflits de revision.
- Un retour optimiste mal limite pourrait afficher un etat ensuite refuse.
- Un verrou visuel global pourrait rendre la consultation inutilement lourde.

## Handoff

Implementation et audit pre-push termines. Preuves Codex : typecheck, lint et
333 tests Vitest conformes ; `git diff --check` sans erreur. Preuves
utilisateur : build conforme et parcours alpha valides pour citoyens,
batiments condenses, activite et equipement des heros, auto-donjon, changement
d etage immediat et selection differee jusqu a la fin du transcript. Les
succes restent silencieux et aucune erreur 400 ou 409 n a ete observee sur les
parcours finaux. La latence generale du bootstrap est suivie separement par
CDI-071.
