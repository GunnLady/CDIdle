---
id: CDI-081
title: Extraire le runtime canonique de App
status: Done
area: frontend
priority: P1
size: L
risk: high
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-078", "CDI-071"]
blocks: ["CDI-077", "CDI-083"]
github_issue: null
related_docs: ["src/App.tsx", "src/hooks/useCanonicalSnapshot.ts", "src/hooks/useCanonicalSessionBootstrap.ts", "src/hooks/useCanonicalOperations.ts", "src/hooks/useAutomationLeadership.ts", "src/hooks/useCrossTabAuthority.ts", "src/hooks/useDungeonAutomation.ts", "src/hooks/useEncounterPlayback.ts", "src/hooks/useOptimisticCommands.ts", "src/lib/canonicalOperationQueue.ts", "src/domain/optimisticStateProjection.ts", "workboard/data/Done/CDI-071/ticket.md"]
---

# CDI-081 - Extraire le runtime canonique de App

## Objectif

Reduire `App.tsx` a la composition et a la navigation en extrayant les
responsabilites de session, snapshot canonique, commandes, multi-onglets,
automatisation et lecture du donjon dans des modules testables.

## Resultat utilisateur

Les actions instantanees, resynchronisations, changements d onglet et combats
restent fiables pendant que l interface devient plus simple a faire evoluer.

## Contexte

`App.tsx` concentre pres de deux mille lignes et coordonne authentification,
bootstrap, cache, nombreux etats React, file optimiste, conflits, controle
multi-onglets, auto-donjon et transcripts. Le snapshot projete est distribue
par de nombreux setters independants, ce qui augmente le risque de regression
et de rendu intermediaire incoherent.

## Perimetre autorise

- Extraire un module de session : auth, bootstrap et cache confirme.
- Introduire un store ou reducer pour snapshot confirme et projection
  optimiste.
- Extraire la file de commandes, fusion, conflit, rollback et panne.
- Extraire le controle multi-onglets et le leadership d automatisation.
- Extraire la lecture et l annulation des transcripts de donjon.
- Fournir aux panels des donnees et callbacks simples et types.
- Migrer par lots conservant un build et des tests passants.

## Hors perimetre

- Refaire le design des ecrans, traite par CDI-069, CDI-076 et CDI-077.
- Modifier les regles serveur ou les contrats de commandes.
- Remplacer React ou introduire une dependance d etat sans gain demontre.
- Reprendre l optimisation du bootstrap de CDI-071.
- Reecrire tout `App.tsx` en une seule livraison.

## Contrat d'implementation

- Le snapshot confirme possede une representation atomique unique.
- La projection optimiste reste derivee et ne devient jamais autoritaire.
- Les commandes, replays et conflits conservent revision et ordre canoniques.
- Le mode observateur ne peut pas muter la partie sans prise de controle.
- Chaque extraction conserve le comportement avant de supprimer l ancien code.

## Dependances

CDI-078 fournit les types canoniques. CDI-071 stabilise et optimise les chemins
de bootstrap afin d eviter deux refactors concurrents de la meme orchestration.

## Criteres d'acceptation

- [x] `App.tsx` ne porte plus les details de session, file, leadership et
      transcript.
- [x] Le snapshot canonique est applique atomiquement a la projection client.
- [x] Les panels consomment des contrats de presentation types.
- [x] Optimisme, rollback, panne et conflit restent conformes.
- [x] Le controle multi-onglets et l auto-donjon restent deterministes.
- [x] Le cache demeure non autoritaire et lie au bon utilisateur.
- [x] Aucun comportement UI ou gameplay ne change sans critere explicite.

## Tests

- Tests unitaires des runtimes extraits.
- Tests d integration snapshot confirme plus projection optimiste.
- Tests multi-onglets, conflit, replay, panne et reconnexion.
- Tests du transcript et de l auto-donjon.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run test:e2e`
- `npm.cmd run test:coverage`
- `npm.cmd run check:coverage`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`

## Validation manuelle

Les parcours longs sont remplaces par les simulations Vitest des runtimes :
session et cache, snapshot confirme plus projection optimiste, file de
commandes, leadership et pont multi-onglets, auto-donjon, repli et transcript.
Le smoke utilisateur restant se limite a une connexion, un F5 et au build de
production ; aucun bearer ni replay manuel n est requis.

## Preservation

- Preserver la sensation de clic instantane validee.
- Preserver les erreurs utilisateur uniquement lorsque utiles.
- Preserver l ordre du transcript et l attente avant le combat automatique
  suivant.

## Risques

- Une extraction peut dupliquer temporairement une source d etat.
- Un store mal borne peut recreer un composant monolithique ailleurs.
- Le multi-onglets et l automation sont sensibles aux changements d effets.

## Handoff

### Carte des runtimes

- `useCanonicalSessionBootstrap` : abonnement auth, cache rapide non
  autoritaire, bootstrap et protection contre les reponses obsoletes.
- `useCanonicalSnapshot` : representation atomique du confirme, revision,
  ancre temporelle, projection optimiste derivee, cache et verrou de
  suppression.
- `useCanonicalOperations` et `useOptimisticCommands` : serialisation,
  coalescence, compteur d activite, buffer, rollback et retry de conflit.
- `useAutomationLeadership` et `useCrossTabAuthority` : bail de controle,
  mode observateur, transfert et diffusion des snapshots entre onglets.
- `useDungeonAutomation` et `useEncounterPlayback` : sequence de commandes,
  repli, temporisation automatique, lecture et annulation des transcripts.

`App.tsx` conserve la composition des hooks, les cas d usage utilisateur et
la navigation. La projection atomique de `useCanonicalSnapshot` est consommee
directement puis transmise aux contrats des panels ; `useTownSystem` et
`useDungeonSystem` sont des projections de presentation controlees et ne
dupliquent plus le canonique. Le mapping historique par setters a ete supprime.

### Preuves locales

- Suite Vitest complete : 75 fichiers et 604 tests passes.
- E2E autoritaire : 1 fichier et 3 tests passes.
- Typecheck, lint et validation Workboard passes sans avertissement.
- Simulations dediees : cache gagnant/perdant, conflit puis reconnexion,
  panne reseau, etat canonique invalide, snapshot inter-onglets, timer
  auto-donjon, rencontre existante et repli pendant exploration.
- Couverture rapportee par l utilisateur : seuils `domain` et `game-api`
  passes. Ces perimetres ne sont pas modifies par la correction finale du
  hook de leadership.
- Le rapport de couverture a revele puis permis de corriger la perte immediate
  de l indicateur de transfert de controle. Acquisition Web Locks et demande
  explicite sont maintenant simulees.
- Build de production rapporte par l utilisateur sur l etat final : passe en
  3,32 s.
- Budget bundle rapporte par l utilisateur : 250769 B gzip JavaScript, plus
  gros chunk 163929 B, budget passe.
