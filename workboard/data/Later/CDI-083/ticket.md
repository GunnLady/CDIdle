---
id: CDI-083
title: Prouver la parite optimiste et autoritaire
status: Later
area: fullstack
priority: P1
size: M
risk: medium
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-081", "CDI-082"]
blocks: ["CDI-084"]
github_issue: null
related_docs: ["src/domain/optimisticStateProjection.ts", "src/lib/optimisticCommandBuffer.ts", "shared/contracts/authoritative.ts", "supabase/functions/game-api"]
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

- [ ] Toutes les commandes optimistes sont listees dans une matrice testee.
- [ ] Chaque succes converge vers le meme etat visible que le backend.
- [ ] Fusion, ordre et limite des clics rapides sont couverts.
- [ ] Refus, conflit, replay et panne ont des assertions explicites.
- [ ] Les champs non projetes sont documentes et justifies.
- [ ] Une commande optimiste non couverte fait echouer la validation.
- [ ] Aucun calcul metier complet n est copie inutilement dans le client.

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
