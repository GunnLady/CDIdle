---
id: CDI-081
title: Extraire le runtime canonique de App
status: Later
area: frontend
priority: P1
size: L
risk: high
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-078", "CDI-071"]
blocks: ["CDI-077", "CDI-083"]
github_issue: null
related_docs: ["src/App.tsx", "src/lib/canonicalOperationQueue.ts", "src/domain/optimisticStateProjection.ts", "workboard/data/ToDo/CDI-071/ticket.md"]
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

- [ ] `App.tsx` ne porte plus les details de session, file, leadership et
      transcript.
- [ ] Le snapshot canonique est applique atomiquement a la projection client.
- [ ] Les panels consomment des contrats de presentation types.
- [ ] Optimisme, rollback, panne et conflit restent conformes.
- [ ] Le controle multi-onglets et l auto-donjon restent deterministes.
- [ ] Le cache demeure non autoritaire et lie au bon utilisateur.
- [ ] Aucun comportement UI ou gameplay ne change sans critere explicite.

## Tests

- Tests unitaires des runtimes extraits.
- Tests d integration snapshot confirme plus projection optimiste.
- Tests multi-onglets, conflit, replay, panne et reconnexion.
- Tests du transcript et de l auto-donjon.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run test:e2e`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Rejouer connexion, F5, actions rapides en ville, changement d etage, auto
donjon, repli, conflit entre deux onglets et reconnexion.

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

Fournir la carte des runtimes, leurs interfaces, les responsabilites restantes
de `App.tsx`, les preuves multi-onglets et les points prets pour CDI-077.
