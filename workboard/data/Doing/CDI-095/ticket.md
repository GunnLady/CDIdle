---
id: CDI-095
title: Valider durablement le budget Supabase de 5 GB
status: Doing
area: operations
priority: P0
size: M
risk: medium
source: Alerte Supabase egress du 2026-08-20
depends_on: ["CDI-092", "CDI-093", "CDI-094"]
blocks: []
github_issue: null
related_docs: ["workboard/data/Done/CDI-092/ticket.md", "workboard/data/Done/CDI-093/ticket.md", "workboard/data/Done/CDI-094/ticket.md", "workboard/data/Later/CDI-096/ticket.md", "docs/development/supabase-egress-budget.md", "src/lib/supabase.ts", "supabase/functions/game-api/supabase-adapter.ts", "shared/contracts/authoritative.ts", "supabase/functions/game-api/dungeon-authority.ts"]
---

# CDI-095 - Valider durablement le budget Supabase de 5 GB

## Objectif

Prouver apres livraison des optimisations que CDIdle reste durablement sous le
quota Free de 5 GB d egress par cycle, avec une marge mesurable et des alertes
actionnables si le profil change.

## Resultat utilisateur

Le service reste disponible sur le plan Free dans les scenarios d usage alpha
representatifs, sans surprise de restriction liee a l egress et sans sacrifier
les fonctions de jeu validees.

## Contexte

Le cycle observe a atteint 8,03 GB, dont 3,03 GB au-dessus du quota. Un retour
sous 5 GB exige au moins 38 % de reduction, mais viser exactement la limite ne
laisse aucune marge a la croissance des sauvegardes ou du nombre de joueurs.
Le detail disponible montre PostgREST majoritaire, Functions secondaire, Auth a
6,1 % sur la journee inspectee et aucun cached egress. CDI-092, CDI-093 et
CDI-094 traitent respectivement la cadence temporelle, les retours de commit et
l auto-exploration.

L historique canonique de rencontres est deja borne a 15 entrees. La taille du
snapshot peut toutefois varier avec les heros, objets, modificateurs et contenu
futur ; elle doit donc etre mesuree plutot que supposee constante.

## Perimetre autorise

- Etablir les compteurs d appels et octets par route sans journaliser les
  snapshots, tokens ou donnees personnelles.
- Mesurer des sauvegardes petites, medianes et volumineuses, notamment
  inventaire, heros, rencontre active et historique borne.
- Construire un scenario representatif couvrant session active, onglet masque,
  reprise, production, immigration, recuperation, commandes manuelles et
  auto-exploration.
- Comparer PostgREST, Functions et Auth avant/apres dans Supabase.
- Projeter la moyenne journaliere sur la duree reelle du cycle.
- Viser au plus 4,5 GB projetes par cycle et documenter la marge jusqu a 5 GB.
- Definir les seuils d alerte, la procedure d investigation et les criteres de
  creation d un ticket de regression.
- Examiner Auth seulement s il devient materiel pour le budget ou depasse le
  seuil documente.
- Tracer toute croissance non bornee du snapshot dans un ticket dedie avant de
  declarer ce ticket termine.

## Hors perimetre

- Declarer le quota respecte uniquement a partir de simulations locales.
- Masquer une fonctionnalite ou supprimer des donnees joueur pour atteindre le
  chiffre sans decision produit.
- Journaliser le contenu canonique ou des secrets.
- Acheter un plan payant comme substitut a l optimisation demandee.
- Optimiser Auth tant que sa contribution reste faible et que le budget est
  respecte.
- Confondre invocation, egress PostgREST, egress Functions et cached egress.

## Contrat d'implementation

- Les mesures locales expliquent le mecanisme ; les donnees Supabase apres
  deploiement constituent la preuve reelle d egress.
- Les octets sont mesures sur le JSON effectivement renvoye par route avec une
  methode stable et documentee.
- Les scenarios indiquent duree, nombre d utilisateurs, commandes et temps d
  onglet visible ou masque.
- Une projection mensuelle utilise la duree reelle du cycle et conserve une
  marge minimale de 0,5 GB.
- Toute mesure distante distingue ce que Codex a verifie de ce que l utilisateur
  rapporte.
- Commit, push et deploiement exigent leurs confirmations explicites propres.
- Apres deploiement, la CI est surveillee avec le skill projet prevu.

## Dependances

- CDI-092 supprime le polling temporel fixe.
- CDI-093 supprime les retours de snapshot PostgREST redondants.
- CDI-094 reduit les invocations de l auto-exploration.

Les trois tickets doivent etre Done avant le passage de CDI-095 en ToDo ou
Doing.

## Criteres d'acceptation

- [x] Les appels et octets par route sont mesures sans contenu sensible.
- [x] Les tailles petite, mediane et haute du snapshot sont documentees.
- [x] Aucune collection canonique ne croit sans borne sans justification et
      seuil explicite ; tout ecart possede un ticket reference.
- [x] Le scenario actif et le scenario masque respectent leurs plafonds d
      appels documentes.
- [x] Auto-exploration utilise une invocation nominale par rencontre.
- [x] Les commits nominaux ne renvoient plus un snapshot PostgREST redondant.
- [ ] Une fenetre distante representative permet une projection inferieure ou
      egale a 4,5 GB par cycle.
- [ ] La ventilation PostgREST, Functions, Auth et cached egress est conservee
      comme preuve datee.
- [x] Auth n est optimise que s il depasse 10 % de l egress ou menace la marge.
- [x] Les seuils d alerte et la procedure de regression sont documentes.
- [x] Aucune restriction de service liee a l egress ne reste non traitee.
- [x] Les validations fonctionnelles des trois optimisations restent vertes.

## Tests

- Harness deterministe de cadence par scenario et par route.
- Mesures de taille d enveloppe sur plusieurs profils de sauvegarde.
- Tests de non-journalisation des snapshots et secrets.
- Suites exigees par CDI-092, CDI-093 et CDI-094.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`
- `git diff --check`

## Validation manuelle

Apres confirmations explicites de commit, push et deploiement, relever dans le
Dashboard Supabase la courbe et la ventilation sur une fenetre representative.
L utilisateur realise les controles visuels et interactifs demandes ; Codex
controle Git, le connecteur et la CI puis consigne la date et la nature de
chaque preuve.

Preuve locale utilisateur du 20 aout 2026 : `x-response-bytes` est present sur
la reponse `/commands`, l auto-exploration utilise une invocation par rencontre
et les scenarios visible et masque respectent leurs plafonds documentes. Cette
preuve locale ne remplace pas la fenetre distante, la ventilation datee ni le
controle des restrictions egress, qui restent ouverts.

Preuve de deploiement verifiee par Codex le 20 aout 2026 : le SHA
`1a72890b5089e870d7390da09a33e7ef21eab9b3` est publie, la migration
`20260820010000_compact_transition_commits.sql` est enregistree a distance,
`game-api` est `ACTIVE` en version 27 et le workflow frontend
`32390128060` est `completed / success`. Le bundle Cloudflare immuable repond
`HTTP 200` et contient le SHA attendu.

Preuve fonctionnelle en production rapportee par l utilisateur le 20 aout
2026 : connexion et chargement de la ville OK, `/bootstrap` en `HTTP 200`,
`x-response-bytes` present, une seule commande `dungeon.auto_advance` en
`HTTP 200` par rencontre, progression et recompenses coherentes, aucune
commande pendant 30 secondes d onglet masque et reprise sans rafale au retour.
Aucune restriction de service n a ete observee pendant ce controle.

Restent ouverts avant passage en `Done` : une fenetre Supabase distante
representative projetee a au plus 4,5 GB par cycle et sa ventilation datee
PostgREST, Functions, Auth et cached egress.

Point T0 Supabase rapporte par l utilisateur le 20 aout 2026 :

- 19 aout, journee complete : Auth 3,802 MB, PostgREST 42,379 MB et
  Functions 17,651 MB, soit 63,832 MB observes. La ventilation calculee est
  6,0 % Auth, 66,4 % PostgREST et 27,6 % Functions. Une extrapolation brute
  de ce seul jour donne environ 1,98 GB sur 31 jours.
- 20 aout, journee partielle : Auth 234,566 KB, PostgREST 2,79 MB et
  Functions 1,31 MB, soit environ 4,335 MB observes. Cette journee melange
  ancien et nouveau fonctionnement, le deploiement ayant termine vers 18 h 08
  heure de Paris.
- Cached egress : aucune valeur positive n est affichee dans le graphique,
  selon l utilisateur. La valeur est consideree nulle pour le calcul T0, sans
  preuve numerique independante.

Les alpha-testeurs ont volontairement reduit leur activite pour preserver le
quota gratuit. Ce T0 prouve la ventilation et fournit un repere de securite,
mais ne constitue pas seul une fenetre representative d activite normale. La
fenetre strictement post-deploiement commence le 21 aout 2026 ; elle sera
comparee au retour de l utilisateur le 31 aout, puis completee si necessaire
par une courte session controlee a activite normale.

## Preservation

- Preserver toutes les regles de jeu, le RNG et l autorite serveur.
- Preserver revision, idempotence, replay, conflits et rate limits.
- Preserver les donnees joueur et la compatibilite des sauvegardes.
- Preserver l isolation multi-onglets et le fonctionnement hors connexion.
- Ne jamais stocker de secret, bearer ou snapshot utilisateur dans Git ou les
  logs de mesure.

## Risques

- Une courte fenetre calme peut sous-estimer l auto-exploration ou les reprises.
- La taille du snapshot peut augmenter avec l inventaire et les fonctionnalites
  futures.
- La ventilation d un seul jour ne represente pas necessairement le cycle.
- Une optimisation locale peut ne pas reduire la categorie d egress attendue
  dans la metrologie Supabase.
- Une croissance du nombre d utilisateurs peut consommer la marge restante.

## Handoff

Fournir le protocole reproductible, les tailles de snapshot, les appels par
scenario, les courbes Supabase datees, la projection de cycle, la marge sous
5 GB, les limites connues, les seuils d alerte et tous les tickets de regression
encore ouverts.
