---
id: CDI-091
title: Freiner immediatement l egress des onglets CDIdle
status: Done
area: frontend
priority: P0
size: M
risk: medium
source: Alerte Supabase egress du 2026-08-20
depends_on: []
blocks: ["CDI-092"]
github_issue: null
related_docs: ["src/hooks/useTownAuthorityReconciliation.ts", "src/hooks/useCanonicalSessionBootstrap.ts", "src/hooks/useAutomationLeadership.ts", "src/hooks/useCrossTabGameSynchronization.ts", "src/domain/townAuthoritySchedule.ts", "workboard/data/Done/CDI-092/ticket.md"]
---

# CDI-091 - Freiner immediatement l egress des onglets CDIdle

## Objectif

Reduire immediatement les appels canoniques periodiques inutiles afin de stopper
la hausse de l egress Supabase, sans affaiblir l autorite serveur, la reprise
apres absence ni l exclusivite multi-onglets.

## Resultat utilisateur

Une partie ouverte consomme nettement moins de bande passante, en particulier
quand son onglet est masque, tout en retrouvant un etat canonique a jour des que
le joueur revient.

## Contexte

Le 20 aout 2026, l organisation Free a consomme 8,03 GB pour un quota de 5 GB.
Le detail du 4 aout attribue 64,9 % du volume a PostgREST, 29,0 % aux Edge
Functions et 6,1 % a Auth. Le heartbeat de ville peut appeler `/bootstrap`
toutes les 30 secondes tant qu une production, une immigration ou une
recuperation est possible, soit jusqu a 2 880 appels par jour pour un onglet
leader continuellement ouvert. Aucun garde explicite ne suspend ce trafic
lorsque le document est masque.

CDI-091 et CDI-092 sont livres dans le meme lot final : la mesure conservatoire
de 120 secondes est directement remplacee par une planification sans intervalle
fixe, plus economique et sans etat intermediaire a maintenir.

## Perimetre autorise

- Suspendre le heartbeat canonique lorsque `document.visibilityState` n est pas
  `visible`.
- Declencher une unique reconciliation canonique au retour visible si la
  session est prete, en ligne et toujours leader.
- Supprimer l intervalle fixe dans l etat final livre avec CDI-092.
- Coalescer retour visible, reconnexion, acquisition de leadership et commande
  deja en cours par la file canonique existante.
- Conserver une seule autorite d automation entre les onglets.
- Ajouter les tests deterministes des transitions visible/masque, du nettoyage
  des listeners et de l absence de doublon.
- Documenter le calcul de reduction theorique et ses limites.

## Hors perimetre

- Modifier les formules de production, immigration ou recuperation.
- Suspendre silencieusement l auto-exploration du donjon ; sa reduction est
  traitee par CDI-094.
- Remplacer definitivement le polling temporel ; ce travail appartient a
  CDI-092.
- Modifier les contrats PostgREST ou les RPC de commit.
- Introduire un second store, une seconde file ou une nouvelle source d
  autorite.

## Contrat d'implementation

- Le domaine partage reste la source des conditions de reconciliation.
- Le hook React gere uniquement le cycle de vie du document, les minuteries et
  l orchestration de la file existante.
- Un onglet masque ne lance aucun heartbeat periodique.
- Un retour visible lance au plus une reconciliation, sans concurrencer une
  commande utilisateur ni un bootstrap deja coalesce.
- La projection locale continue d afficher la progression pendant les periodes
  ou aucune reconciliation reseau n est necessaire.
- Les listeners et minuteries sont retires au demontage et lors des changements
  de session ou de leadership.

## Dependances

Aucune dependance de code bloquante. Le ticket bloque CDI-092, qui remplacera
la mesure conservatoire par une planification temporelle durable.

## Criteres d'acceptation

- [x] Aucun intervalle canonique fixe ne subsiste ; la mesure provisoire de
      120 secondes est supersedee par CDI-092 dans le meme lot.
- [x] Aucun heartbeat n est emis par un document masque.
- [x] Le retour visible provoque au plus un bootstrap canonique coalesce.
- [x] Un onglet observateur ne devient pas emetteur a cause du changement de
      visibilite.
- [x] Reconnexion, transfert de controle et retour visible ne creent pas de
      requetes concurrentes.
- [x] Production, immigration et recuperation sont correctement rattrapees par
      l autorite serveur au retour.
- [x] Les tests prouvent le nettoyage des timers et listeners.
- [x] La suppression du polling reduit de 100 % le trafic periodique a duree
      d ouverture egale.
- [x] Aucun changement de gameplay du donjon n est introduit par CDI-091.

## Tests

- Tests unitaires de `useTownAuthorityReconciliation` avec horloge simulee.
- Tests des transitions visible vers masque puis visible.
- Tests leader, observateur, reconnexion et operation canonique deja occupee.
- Tests de `shouldRefreshTownAuthority` inchanges ou ajustes sans changement de
  regle metier.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run board:validate`
- `git diff --check`

## Validation manuelle

Dans un navigateur local ouvert par l utilisateur, verifier via l onglet
Network qu aucun `/bootstrap` periodique ne part quand l onglet est masque,
qu un seul part au retour et que les ressources affichees se recalent. Codex
fournira la commande, le terminal et l objectif exacts avant ce controle.

Preuve utilisateur du 20 aout 2026 : pendant deux minutes masquees, aucun
`/bootstrap` ni `/commands` ; au retour visible, exactement un `/bootstrap`,
aucune rafale et des ressources affichees coherentes.

## Preservation

- Preserver l autorite serveur, la revision et le rattrapage idle.
- Preserver la priorite des commandes utilisateur et la coalescence de fond.
- Preserver le verrou multi-onglets et la diffusion du snapshot confirme.
- Preserver le fonctionnement hors connexion et le cache local en lecture
  seule.
- Preserver les modifications utilisateur presentes dans le worktree.

## Risques

- Une reprise visible mal coalescee peut doubler un bootstrap de reconnexion.
- Un listener capturant une ancienne session peut appliquer un snapshot au
  mauvais utilisateur.
- L intervalle de 2 minutes peut retarder une immigration ou une recuperation
  visible tant que CDI-092 n est pas livre.

## Handoff

Fournir les appels avant/apres par heure active et masquee, les tests de cycle
de vie, la preuve d absence de requete observateur, les limites temporaires de
l intervalle de 2 minutes et le point de depart de CDI-092.
