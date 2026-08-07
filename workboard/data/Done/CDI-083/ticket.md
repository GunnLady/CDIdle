---
id: CDI-083
title: Prouver la parite optimiste et autoritaire
status: Done
area: fullstack
priority: P1
size: M
risk: medium
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-081", "CDI-082"]
blocks: ["CDI-084"]
github_issue: null
related_docs: ["docs/development/optimistic-authoritative-parity.md", "src/domain/optimisticStateProjection.ts", "src/lib/optimisticCommandBuffer.ts", "src/lib/optimisticCommandDispatch.ts", "src/lib/authoritativeCommandDispatch.ts", "shared/contracts/authoritative.ts", "supabase/functions/game-api"]
---

# CDI-083 - Prouver la parite optimiste et autoritaire

## Objectif

Garantir automatiquement que chaque commande appliquee immediatement par le
frontend converge vers le meme etat visible que la transition autoritaire.

## Resultat utilisateur

Les clics restent instantanes sans saut, duplication ou valeur incoherente
lorsque le serveur confirme, refuse ou resynchronise une action.

## Contexte

La projection optimiste reimplemente volontairement une partie limitee des
transitions serveur pour offrir un feedback immediat. Cette duplication est
rentable, mais les tests actuels ne fournissent pas une matrice exhaustive
liant chaque commande optimiste a son resultat backend et a ses chemins
d erreur.

## Perimetre autorise

- Inventorier toutes les commandes possedant une projection optimiste.
- Construire une matrice commande, fusion, succes, refus, conflit et panne.
- Comparer la projection immediate au snapshot autoritaire confirme.
- Couvrir les commandes rapides fusionnees de meme nature.
- Verifier rollback cible, rechargement canonique et rejeu encore valide.
- Detecter une nouvelle commande optimiste sans scenario de parite.
- Documenter les champs volontairement non projetes.

## Hors perimetre

- Dupliquer toute la logique serveur dans le frontend.
- Rendre le frontend autoritaire.
- Ajouter une projection optimiste a une commande non rentable.
- Refactorer a nouveau les runtimes de CDI-081 ou handlers de CDI-082.

## Contrat d'implementation

- Une projection ne couvre que les champs necessaires au feedback immediat.
- Le snapshot serveur remplace toujours la projection apres confirmation.
- Un refus annule uniquement les effets locaux concernes.
- Un conflit recharge silencieusement le canonique et rejoue les commandes
  encore valides.
- Une panne revient au dernier snapshot confirme et informe l utilisateur.

## Dependances

CDI-081 stabilise le runtime optimiste et CDI-082 stabilise les handlers
autoritaires compares.

## Criteres d'acceptation

- [x] Toutes les commandes optimistes sont listees dans une matrice testee.
- [x] Chaque succes converge vers le meme etat visible que le backend.
- [x] Fusion, ordre et limite des clics rapides sont couverts.
- [x] Refus, conflit, replay et panne ont des assertions explicites.
- [x] Les champs non projetes sont documentes et justifies.
- [x] Une commande optimiste non couverte fait echouer la validation.
- [x] Aucun calcul metier complet n est copie inutilement dans le client.

## Tests

- Tests parametrises frontend/backend pour chaque commande optimiste.
- Tests des lots fusionnes et revisions successives.
- Tests refus, conflit, replay, timeout et reconnexion.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:integration`
- `npm.cmd run test:e2e`
- `npm.cmd run board:validate`

## Validation manuelle

Executer des clics rapides en ville, equiper un objet, changer d etage et
basculer l auto-donjon, puis simuler refus, conflit et panne du backend.

## Preservation

- Preserver le feedback immediat sans bandeau de succes.
- Preserver les informations utilisateur en cas d erreur ou de panne.
- Preserver revision canonique et ordre des commandes.

## Risques

- Une comparaison trop large peut echouer sur des champs temporels legitimes.
- Un test couple aux details d implementation peut bloquer un refactor sain.
- Une projection trop ambitieuse reproduirait le moteur serveur.

## Handoff

Fournir la matrice, les commandes non optimistes justifiees, les scenarios
d erreur et les preuves de convergence.

## Realisation

- Les sept commandes optimistes sont declarees dans une politique typee qui
  associe types, champs visibles et projecteurs.
- Le buffer et le hook n acceptent plus une commande hors de cette politique.
- Une matrice parametree compare chaque projection aux champs visibles produits
  par `applyTownCommand`.
- Le retry apres conflit est isole et teste : un seul rejeu apres
  resynchronisation, aucun retry pour refus, panne, timeout ou commande deja en
  cours.
- Le rollback cible conserve les autres commandes encore en attente et le
  rechargement canonique reprojette les intentions toujours valides.
- La matrice a detecte puis corrige l ecart d equipement sur le ratio PV/mana et
  la representation des slots retires. Le helper de ratio est partage entre
  frontend et backend.
- Les champs non projetes et les commandes volontairement autoritaires sont
  documentes dans `docs/development/optimistic-authoritative-parity.md`.
- La strategie de fusion est maintenant choisie par un registre exhaustif dans
  le buffer ; les composants ne peuvent plus fournir une fusion incoherente.
- Les reponses autoritaires nouvelles et rejouees traversent une frontiere
  commune testee, et les messages de refus ou de panne sont produits par une
  presentation pure couverte par tests.
- La presentation conserve le message generique historique pour une panne non
  qualifiee et ne montre le detail que pour une erreur API connue.
- La parite d equipement couvre aussi les ratios PV/mana et la liberation de la
  main gauche lors de l equipement d une arme a deux mains.

## Validation locale Codex

- `npm.cmd run typecheck` : OK.
- `npm.cmd run lint` : OK.
- `npm.cmd run check:determinism` : OK.
- `npm.cmd test -- --run` : 79 fichiers, 635 tests, OK.
- Tests cibles apres audit : 5 fichiers, 39 tests, OK.
- Preuve utilisateur `npm.cmd run test:e2e` : 1 fichier, 3 tests, OK.
- Preuve utilisateur `npm.cmd run check:coverage` : seuils domain et game-api
  respectes.
- Preuve utilisateur `npm.cmd run build` : build Vite de production OK ;
  avertissement informatif sur le chunk vendor, budget controle separement.
- Preuve utilisateur `npm.cmd run check:bundle` : 251283 B gzip JS, plus gros
  chunk 163929 B, budget OK.
- `test:integration` reste differe a cause du blocage local DNS/HTTP 503 deja
  identifie.
