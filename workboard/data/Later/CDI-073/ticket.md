---
id: CDI-073
title: Rendre immediatement disponible un citoyen immigre
status: Later
area: fullstack
priority: P2
size: S
risk: medium
source: Retour utilisateur du 2026-08-01
depends_on: []
blocks: []
github_issue: null
related_docs: ["workboard/data/Done/CDI-057/ticket.md", "workboard/data/Done/CDI-061/ticket.md", "workboard/data/Done/CDI-070/ticket.md", "workboard/data/ToDo/CDI-071/ticket.md"]
---

# CDI-073 - Rendre immediatement disponible un citoyen immigre

## Objectif

Rendre un nouveau citoyen affectable des que son immigration est effectivement
terminee et confirmee par le serveur, sans attendre le prochain controle
periodique du bootstrap.

## Resultat utilisateur

Lorsque la jauge d immigration atteint son terme, le villageois rejoint la
population disponible apres une reconciliation canonique immediate. Le joueur
peut alors l affecter sans subir le delai du heartbeat suivant.

## Contexte

La projection frontend montre actuellement la fin de l immigration, mais le
nouveau citoyen reste indisponible tant qu un prochain bootstrap periodique n a
pas applique puis restitue la transition idle canonique. Le comportement est
exact mais donne l impression que la jauge terminee ne produit aucun resultat.

CDI-071 traite la latence generale du bootstrap. CDI-073 reste autonome et ne
couvre que le declenchement cible au franchissement d un seuil d immigration.

## Perimetre autorise

- Detecter le franchissement projete d un ou plusieurs seuils d immigration.
- Demander immediatement une reconciliation canonique au serveur.
- Rendre les citoyens affectables uniquement apres la reponse canonique.
- Dedoublonner cette synchronisation avec un bootstrap ou une commande deja en
  cours.
- Faire declencher la synchronisation par le seul onglet maitre et propager le
  resultat aux observateurs.
- Reprendre proprement la reconciliation apres une coupure reseau.

## Hors perimetre

- Reduire la latence generale ou le poids du bootstrap, sujet de CDI-071.
- Modifier le taux d immigration ou les capacites des batiments.
- Creer, affecter ou persister un citoyen de maniere optimiste cote client.
- Modifier les autres productions idle ou la recuperation des heros.

## Contrat d'implementation

- Le frontend peut anticiper visuellement la progression, jamais la mutation
  canonique de population.
- Le franchissement d un seuil programme au maximum une reconciliation utile
  tant que le snapshot canonique ne l a pas confirme.
- Une operation canonique deja en cours est reutilisee ou suivie, sans lancer
  une tempete de bootstrap.
- Revision, `lastProcessedAt`, capacite, progression residuelle et nombre de
  citoyens restent calcules et committes par le serveur.
- Hors ligne, le citoyen reste une projection non affectable ; le retour en
  ligne applique tout le temps ecoule une seule fois.

## Dependances

Le ticket reutilise l autorite temporelle de CDI-061, la projection idle de
CDI-057 et la file canonique priorisee de CDI-070. Il ne depend pas de
l optimisation generale CDI-071 et ne la bloque pas.

## Criteres d'acceptation

- [ ] La fin d immigration declenche une reconciliation canonique sans attendre
      le heartbeat periodique suivant.
- [ ] Le citoyen devient affectable immediatement apres la reponse serveur.
- [ ] Aucun citoyen canonique n est cree ou affecte localement avant le commit.
- [ ] Un seul appel utile est emis lorsqu un seuil est franchi.
- [ ] Un bootstrap ou une commande concurrente ne provoque ni perte ni double
      immigration.
- [ ] Seul l onglet maitre declenche ; les observateurs recoivent le meme etat.
- [ ] Une coupure reseau conserve la projection puis reconcilie exactement au
      retour.
- [ ] Taux, capacite, progression residuelle, revision et invariants citoyens
      restent inchanges.

## Tests

- Test du franchissement exact et de plusieurs seuils pendant une longue idle.
- Test de deduplication avec bootstrap et commande deja en cours.
- Test multi-onglets maitre/observateur.
- Test hors ligne puis reconnexion.
- Test d invariants population, capacite, progression et revision.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Approcher une immigration de son terme, observer le passage a 100 %, puis
verifier que le citoyen devient affectable apres la reconciliation immediate
sans attendre le prochain heartbeat. Refaire avec deux onglets et une courte
coupure reseau.

## Preservation

- Preserver l autorite serveur et l absence de mutation canonique locale.
- Preserver la file optimiste et la priorite des commandes utilisateur.
- Preserver les taux, capacites et invariants citoyens existants.

## Risques

- Un effet React non dedoublonne pourrait produire une boucle de bootstrap.
- Une disponibilite optimiste permettrait une affectation refusee ou perdue.
- Deux onglets declencheurs pourraient augmenter la charge et les conflits.
- Une reconciliation tardive pourrait appliquer deux fois le meme temps idle.

## Handoff

Fournir la cause mesuree, le declencheur retenu, la preuve de deduplication et
les validations seuil exact, multi-seuils, multi-onglets et reconnexion.
