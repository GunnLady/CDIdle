---
id: CDI-094
title: Regrouper les commandes d auto-exploration du donjon
status: Done
area: gameplay
priority: P1
size: M
risk: high
source: Alerte Supabase egress du 2026-08-20
depends_on: []
blocks: ["CDI-095"]
github_issue: null
related_docs: ["workboard/data/Doing/CDI-095/ticket.md", "src/hooks/useDungeonAutomation.ts", "src/hooks/useAuthoritativeCommandDispatch.ts", "shared/domain/authoritative-dungeon.ts", "supabase/functions/game-api/dungeon-command-handlers.ts", "supabase/functions/game-api/dungeon-authority.ts", "shared/contracts/authoritative.ts"]
---

# CDI-094 - Regrouper les commandes d auto-exploration du donjon

## Objectif

Reduire le nombre d appels et de snapshots de l auto-exploration en executant
l exploration et la resolution automatique dans une seule transition
autoritaire idempotente.

## Resultat utilisateur

L auto-exploration conserve les memes rencontres, resultats, recompenses et
animations, tout en consommant environ deux fois moins de commandes reseau par
cycle nominal.

## Contexte

`useDungeonAutomation` envoie actuellement `dungeon.explore`, attend son
snapshot complet, puis envoie `dungeon.resolve` et attend un second snapshot.
Quand `autoExplore` est actif, la boucle peut recommencer une seconde plus tard.
Chaque etape traverse le chargement et le commit PostgREST puis renvoie un etat
complet par l Edge Function. Les commandes manuelles separees restent utiles
pour les interactions et le repli.

## Perimetre autorise

- Ajouter une commande autoritaire composite reservee au parcours automatique.
- Executer exploration puis resolution dans une seule application atomique de
  commande.
- Produire les evenements necessaires au transcript, au journal et aux
  recompenses dans leur ordre actuel.
- Conserver les commandes manuelles `dungeon.explore`, `dungeon.resolve` et
  `dungeon.retreat` tant que leurs usages reels existent.
- Brancher uniquement l auto-exploration sur la commande composite.
- Comparer la consommation RNG et l etat final avec la sequence historique.
- Mesurer appels, revisions et octets par rencontre avant/apres.

## Hors perimetre

- Accelerer ou modifier les formules de combat.
- Changer les chances de rencontre, monstres, recompenses ou progression.
- Resoudre plusieurs salles dans une seule commande non bornee.
- Executer l auto-exploration cote client sans validation serveur.
- Supprimer une commande historique avant verification de tous ses usages.
- Modifier la presentation du donjon.

## Contrat d'implementation

- Une enveloppe composite possede un seul `commandId` et reste rejouable sans
  duplication.
- La transition est atomique : aucun etat intermediaire explore mais non resolu
  n est persiste en cas d echec interne.
- Le nombre et l ordre des tirages RNG sont soit strictement identiques a la
  sequence nominale, soit tout ecart est refuse.
- Les evenements conservent assez d information pour le transcript et les
  journaux existants.
- Le repli et l exploration manuelle conservent leurs contrats separes.
- La file canonique, le leadership et le mode observateur restent inchanges.

## Dependances

Aucune dependance de code bloquante. Le ticket bloque CDI-095, qui doit mesurer
le gain Functions et PostgREST sur un scenario d auto-exploration representatif.

## Criteres d'acceptation

- [x] Un cycle automatique nominal utilise une seule invocation Edge au lieu de
      deux.
- [x] L etat final est identique a la sequence explore puis resolve pour le meme
      etat et le meme RNG.
- [x] Rencontres, recompenses, blessures, progression et historique restent
      identiques.
- [x] Le replay de la commande composite ne duplique aucun effet.
- [x] Un echec ne persiste aucun etat intermediaire.
- [x] Transcript, journal et animation restent complets et ordonnes.
- [x] Exploration manuelle et repli restent fonctionnels.
- [x] Les anciens helpers devenus morts sont recherches puis supprimes avec
      leurs tests obsoletes.
- [x] Les appels, revisions et octets avant/apres sont documentes.

## Tests

- Golden tests de parite composite contre sequence historique.
- Tests RNG, replay, idempotence, revision et echec atomique.
- Tests victoire, defaite, boss, butin, progression et heros indisponible.
- Tests du hook d automation, leadership, blocage et arret.
- Tests du transcript et de l ordre des evenements.
- Recherche des usages des commandes et helpers historiques avec `rg`.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`
- `git diff --check`

## Validation manuelle

Sur une partie locale controlee par l utilisateur, activer l auto-exploration,
observer plusieurs victoires et une defaite ou un blocage, puis verifier dans
Network une invocation par rencontre et la restitution complete du transcript.
Codex fournira la commande et l objectif exacts.

Preuve utilisateur du 20 aout 2026 : une invocation `dungeon.auto_advance` HTTP
200 par rencontre, aucun doublon, transcript, recompenses et progression
conformes. Pendant trente secondes masquees, aucune commande ; reprise sans
rafale et toujours une invocation par rencontre au retour visible.

## Preservation

- Preserver le RNG canonique, les replays et les sauvegardes existantes.
- Preserver toutes les regles de combat et de recompense.
- Preserver les commandes manuelles et le repli.
- Preserver le leadership unique et la file canonique.
- Preserver la compatibilite des rencontres deja serialisees.

## Risques

- Fusionner deux revisions peut modifier des attentes implicites du frontend.
- Un evenement intermediaire omis peut casser le transcript sans changer l etat
  final.
- Une difference de tirage RNG changerait durablement les resultats.
- Une commande composite trop large pourrait depasser les limites de temps de
  l Edge Function.

## Handoff

Fournir le contrat de commande, la preuve d atomicite et de parite RNG, les
evenements produits, les appels et octets avant/apres, les usages historiques
conserves ou supprimes et le scenario de mesure CDI-095.
