---
id: CDI-070
title: Prioriser les commandes utilisateur dans la file canonique
status: Doing
area: frontend
priority: P1
size: M
risk: medium
source: Retour utilisateur sur la latence du frontend web du 2026-07-30
depends_on: []
blocks: []
github_issue: null
related_docs: ["docs/architecture/api-command-contracts.md", "src/App.tsx", "src/lib/supabase.ts"]
---

# CDI-070 - Prioriser les commandes utilisateur dans la file canonique

## Objectif

Rendre les clics du frontend web immediatement perceptibles et empecher les
rafraichissements periodiques de retarder inutilement les commandes
utilisateur, sans affaiblir l autorite serveur.

## Resultat utilisateur

Chaque action affiche un retour visuel immediat et part avant les travaux d
arriere-plan encore differables. La ville et le donjon restent coherents avec
la meme revision canonique.

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
- Afficher immediatement un etat visuel pendant une commande utilisateur.
- Empecher les doubles clics involontaires sans verrouiller les consultations.
- Isoler l ordonnancement dans un module testable si cela reste rentable.
- Mesurer separement attente en file et latence reseau.

## Hors perimetre

- Separer les revisions de la ville et du donjon.
- Appliquer un etat metier optimiste generalise avec rollback.
- Modifier les contrats ou mutations du backend.
- Refaire l interface complete, traite par CDI-069.
- Masquer une panne ou une latence serveur reelle.

## Contrat d'implementation

- Une commande utilisateur deja demarree reste atomique et n est jamais
  interrompue.
- Un rafraichissement en cours n est pas annule brutalement ; la priorite est
  appliquee aux operations qui ne sont pas encore demarrees.
- Les commandes restent serialisees selon leur revision attendue.
- Le retour visuel commence avant le premier `await` du chemin utilisateur.
- Une erreur retire toujours l etat en cours et permet une nouvelle tentative.

## Dependances

Le correctif est autonome. Il doit preserver les changements locaux en cours
sur le repli du donjon et rester compatible avec le futur cadrage UI/UX de
CDI-069.

## Criteres d'acceptation

- [ ] Un clic produit un retour visuel immediat avant la reponse distante.
- [ ] Une commande utilisateur en attente passe avant tout rafraichissement
      periodique non demarre.
- [ ] Aucun `/bootstrap` periodique n est ajoute lorsque la file est occupee.
- [ ] Deux commandes incompatibles ne s executent jamais en parallele.
- [ ] Ville et donjon partagent toujours la meme revision canonique.
- [ ] Les erreurs, conflits et pertes de connexion liberent correctement l UI.
- [ ] L auto-donjon conserve l attente de fin du transcript avant le combat
      suivant.
- [ ] Les onglets observateurs restent non mutables.

## Tests

- Test de serialisation des commandes utilisateur.
- Test de priorite sur un rafraichissement encore en attente.
- Test d abandon d un rafraichissement periodique quand la file est occupee.
- Test de liberation de l etat visuel apres succes et erreur.
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

Fournir les mesures avant/apres, les preuves d ordre de file, les tests de
serialisation et d erreur, ainsi que les validations ville, donjon, auto-donjon
et multi-onglets.
