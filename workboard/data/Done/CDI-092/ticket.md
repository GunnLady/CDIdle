---
id: CDI-092
title: Remplacer le polling temporel par une planification metier
status: Done
area: architecture
priority: P0
size: M
risk: high
source: Alerte Supabase egress du 2026-08-20
depends_on: ["CDI-091"]
blocks: ["CDI-095"]
github_issue: null
related_docs: ["workboard/data/Done/CDI-091/ticket.md", "workboard/data/Doing/CDI-095/ticket.md", "src/hooks/useTownAuthorityReconciliation.ts", "src/hooks/useImmigrationReconciliation.ts", "src/domain/townAuthoritySchedule.ts", "shared/contracts/authoritative.ts", "supabase/functions/game-api/idle-authority.ts"]
---

# CDI-092 - Remplacer le polling temporel par une planification metier

## Objectif

Supprimer le polling canonique periodique de la ville et ne contacter le
serveur qu a une echeance metier utile, une reprise de session ou une action du
joueur.

## Resultat utilisateur

La production idle, l immigration et la recuperation restent exactes, mais une
partie simplement ouverte ne recharge plus son snapshot complet a intervalle
fixe.

## Contexte

CDI-091 reduit provisoirement la frequence du heartbeat et le suspend lorsque
l onglet est masque. Cette protection ne supprime pas la cause structurelle :
`shouldRefreshTownAuthority` indique qu une activite est possible, puis le
frontend interroge le serveur periodiquement sans connaitre la prochaine
transition significative. Le serveur sait deja appliquer le temps ecoule lors
d un bootstrap ou d une commande.

## Perimetre autorise

- Modeliser dans le domaine partage les prochaines echeances significatives de
  production, immigration et recuperation.
- Planifier un reveil sur l echeance la plus proche au lieu d un intervalle
  fixe.
- Ne pas emettre de requete lorsqu aucune transition canonique visible ou
  necessaire n est attendue.
- Recalculer l echeance apres snapshot, commande, changement de taux,
  immigration, recuperation, reconnexion et reprise visible.
- Borner et revalider une minuterie longue apres throttling navigateur ou saut
  d horloge.
- Conserver une reconciliation de securite rare uniquement si son besoin est
  documente et compatible avec le budget.
- Ajouter un moteur de test deterministe des echeances et documenter son
  fonctionnement.

## Hors perimetre

- Deplacer l autorite temporelle dans le navigateur.
- Faire confiance a la projection locale pour valider une mutation.
- Modifier les taux de production, capacites, soins ou regles d immigration.
- Optimiser les retours PostgREST des commits, traite par CDI-093.
- Regrouper les commandes de donjon, traite par CDI-094.

## Contrat d'implementation

- Les calculs d echeance restent purs, partages et testables hors React.
- L heure serveur et `lastProcessedAt` restent les ancres canoniques.
- Le frontend ne persiste jamais une projection comme etat autoritaire.
- Toute minuterie est annulee et recalculee quand ses entrees changent.
- Un retard de minuterie produit un seul rattrapage, jamais une rafale d appels.
- Les commandes utilisateur gardent la priorite sur une reconciliation de fond.
- La logique issue de CDI-091 reste un filet de securite jusqu a preuve que la
  nouvelle planification la remplace proprement.

## Dependances

- CDI-091 fournit le garde de visibilite, la reprise coalescee et la mesure
  conservatoire a remplacer.

Le ticket bloque CDI-095, qui doit mesurer la consommation du mecanisme final
en production.

## Criteres d'acceptation

- [x] Aucun `setInterval` de reconciliation canonique ne subsiste.
- [x] Une partie sans echeance metier ne genere aucun trafic temporel.
- [x] Immigration et recuperation sont reconcilees a la premiere echeance
      pertinente, avec la tolerance explicitement documentee.
- [x] Une production continue reste projetee localement et canonisee lors de
      la prochaine action ou echeance necessaire.
- [x] Reconnexion, retour visible et leadership declenchent au plus un
      rattrapage.
- [x] Les sauts d horloge et timers throttles ne provoquent ni perte ni rafale.
- [x] Les resultats sont identiques a l application autoritaire du meme temps
      ecoule.
- [x] Le nombre maximal theorique d appels temporels par jour est documente
      pour chaque scenario.

## Tests

- Tests de calcul de la prochaine echeance pour chaque ressource et capacite.
- Tests immigration disponible, bloquee puis debloquee.
- Tests de recuperation HP et mana avec plusieurs heros.
- Tests sans production, changement de taux et echeances simultanees.
- Tests de reprise tardive, horloge serveur, visibility et leadership.
- Tests d integration avec la file canonique et commandes concurrentes.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`
- `git diff --check`

## Validation manuelle

Sur le frontend local controle par l utilisateur, laisser une ville produire,
masquer puis restaurer l onglet, observer une immigration et une recuperation,
et confirmer dans Network l absence de polling fixe. Les commandes et objectifs
seront fournis au moment du controle.

Preuve utilisateur du 20 aout 2026 : aucun trafic temporel pendant deux minutes
masquees, un unique rattrapage au retour visible, aucune rafale et une projection
de ressources coherente. Les echeances immigration et recuperation sont en plus
couvertes par les tests deterministes du domaine et du hook.

## Preservation

- Preserver les formules et arrondis du domaine partage.
- Preserver l heure serveur, la revision et le verrouillage optimiste.
- Preserver le rattrapage idle apres fermeture complete du navigateur.
- Preserver la coalescence, le leadership et le mode observateur.
- Ne pas introduire de logique metier dans un composant React.

## Risques

- Une echeance calculee trop tard peut retarder un evenement visible.
- Une echeance trop frequente recréerait le polling sous un autre nom.
- Les ressources continues et seuils d immigration peuvent combiner plusieurs
  arrondis qu il faut aligner avec le serveur.
- Un timer navigateur n est pas une preuve d heure canonique et doit etre
  revalide au reveil.

## Handoff

Fournir le modele d echeances, les invariants temporels, le tableau des appels
maximaux par scenario, la suppression du polling, les preuves de parite avec le
serveur et les donnees attendues par CDI-095.
