---
id: CDI-071
title: Reduire la latence du bootstrap canonique
status: Done
area: fullstack
priority: P1
size: M
risk: medium
source: Retour utilisateur sur la latence generale du bootstrap du 2026-07-31
depends_on: []
blocks: ["CDI-081"]
github_issue: null
related_docs: ["docs/architecture/api-command-contracts.md", "src/App.tsx", "src/lib/canonicalOperationQueue.ts", "supabase/functions/game-api/index.ts"]
---

# CDI-071 - Reduire la latence du bootstrap canonique

## Objectif

Mesurer puis reduire la latence du bootstrap canonique, quel que soit son
moment de declenchement, sans affaiblir l autorite serveur ni masquer une
indisponibilite reelle.

## Resultat utilisateur

Le chargement initial, les rafraichissements et les resynchronisations
restituent rapidement une interface utilisable sans alourdir les actions du
joueur.

## Contexte

Les commandes deterministes disposent desormais d un retour optimiste et d
une priorite dans la file canonique. Le `/bootstrap` reste toutefois percu
comme lourd, notamment au F5, et peut etre declenche dans plusieurs autres
situations : heartbeat, reconnexion, conflit ou changement d onglet.

## Perimetre autorise

- Mesurer chaque phase de tous les `/bootstrap` : attente en file, reseau,
  Edge Function, acces base, calcul idle, transfert et application frontend.
- Etablir des baselines locales et sur l alpha distante.
- Identifier les bootstrap redondants, trop frequents ou declenches alors qu
  une information canonique equivalente est deja disponible.
- Reduire leur duree et leur impact sur l interface.
- Traiter demarrage, F5, heartbeat, resynchronisation, reconnexion et
  changement d onglet.
- Exploiter le cache confirme pour accelerer la restitution visuelle lorsque
  cela reste compatible avec l autorite serveur.
- Definir un budget de latence mesurable apres etablissement de la baseline.

## Hors perimetre

- Rendre une projection locale autoritaire.
- Supprimer une resynchronisation necessaire a la coherence canonique.
- Masquer une erreur ou une indisponibilite du backend.
- Refaire l interface generale, traitee par CDI-069.
- Modifier les regles idle ou gameplay pour ameliorer artificiellement les
  mesures.

## Contrat d'implementation

- Revision, idle, cache, conflits et mode observateur restent coherents.
- Les mesures distinguent attente en file, temps reseau et traitement total.
- Une optimisation est retenue uniquement si son gain est prouve par une
  comparaison avant/apres.
- L etat local confirme peut etre affiche pendant la reconciliation, mais ne
  doit pas autoriser une mutation depuis une revision obsolete.
- Les bootstrap periodiques ne doivent pas concurrencer inutilement une
  commande utilisateur.

## Dependances

Le ticket est autonome. Il doit preserver la file canonique et les projections
optimistes livrees par CDI-070.

## Criteres d'acceptation

- [x] Une baseline detaillee existe pour chaque phase du bootstrap.
- [x] Les declencheurs de bootstrap sont inventories et justifies.
- [x] Les appels redondants ou inutilement concurrents sont supprimes.
- [x] Le temps avant interface utilisable et la latence totale sont ameliores
      sur l alpha distante.
- [x] Un budget de latence est defini et verifie automatiquement lorsque cela
      est reproductible.
- [x] F5, demarrage a froid, heartbeat, reconnexion, conflit et changement d
      onglet conservent un etat canonique exact.
- [x] Cache absent, cache disponible et backend lent possedent un comportement
      explicite et teste.
- [x] Aucun affaiblissement de revision, idle, erreurs ou mode observateur n
      est introduit.

## Tests

- Tests des declencheurs et de la deduplication des bootstrap.
- Tests avec cache absent et cache confirme disponible.
- Tests de priorite entre bootstrap et commande utilisateur.
- Mesures locales et alpha avant/apres.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Mesurer puis comparer le chargement initial, F5, heartbeat, reconnexion,
resynchronisation et transfert d onglet sur l alpha distante. Verifier que l
interface reste consultable rapidement et que toute mutation utilise la
revision canonique courante.

## Preservation

- Preserver autorite serveur, revision, atomicite et idle transactionnel.
- Preserver cache confirme, erreurs visibles et mode maitre/observateur.
- Preserver la priorite des commandes utilisateur de CDI-070.
- Toute acquisition du controle doit confirmer la revision serveur avant de
  deverrouiller les mutations ; l age seul d un snapshot ne prouve pas son
  autorite.

## Risques

- Une deduplication trop agressive peut conserver un snapshot obsolete.
- Afficher trop tot un cache pourrait laisser croire que la connexion est
  etablie ou permettre une mutation invalide.
- Une mesure uniquement locale peut masquer la latence Edge ou base distante.

## Handoff

Validation alpha du 2026-08-05 : cache confirme utilisable en 21,5 ms pour un
budget de 100 ms, attente de file 0,2 ms, application frontend 4,7 ms, reseau
516,5 ms et traitement serveur 106,4 ms (chargement 54,7 ms, idle 0,7 ms,
commit 50,9 ms). Le cache rend donc l interface consultable avant la fin du
bootstrap sans deverrouiller les mutations. Les simulations, la suite complete
de 535 tests, les seuils de couverture, le garde deterministe, le lint, le
typecheck et le build utilisateur sont valides. Backend et frontend alpha ont
ete deployes par l utilisateur.
