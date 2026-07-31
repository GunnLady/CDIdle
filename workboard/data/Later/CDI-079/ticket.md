---
id: CDI-079
title: Retablir les frontieres du domaine partage
status: Later
area: architecture
priority: P1
size: L
risk: high
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-078", "CDI-060"]
blocks: ["CDI-082"]
github_issue: null
related_docs: ["shared", "src/domain", "src/data", "supabase/functions/game-api", "workboard/data/ToDo/CDI-060/ticket.md"]
---

# CDI-079 - Retablir les frontieres du domaine partage

## Objectif

Supprimer la dependance du backend envers l arborescence frontend et etablir
une couche partagee, neutre au runtime, pour les contrats, donnees et regles
pures utilises par les deux extremites.

## Resultat utilisateur

Les evolutions du frontend et du backend peuvent progresser sans casser
accidentellement l autre partie, tout en conservant exactement les memes
regles de jeu.

## Contexte

L Edge Function importe directement des modules sous `src/domain`, `src/data`
et `src/types`. Les fonctions concernees sont souvent pures, mais leur
emplacement inverse la direction architecturale attendue. CDI-060 possede deja
la responsabilite du catalogue autoritaire des objets et doit fournir sa
source unique dans la couche partagee.

## Perimetre autorise

- Definir les sous-couches `shared/contracts`, `shared/domain` et
  `shared/data` utiles au projet.
- Deplacer progressivement les regles pures et types reellement partages.
- Faire dependre frontend et backend de ces modules neutres.
- Eliminer tous les imports de `supabase/functions` vers `src`.
- Mettre a jour les imports, tests et documentation d architecture.
- Verifier que les modules partages n accedent ni au DOM ni aux variables
  propres a un runtime.
- Integrer la source unique du catalogue produite par CDI-060 sans la
  redefinir.

## Hors perimetre

- Redefinir le catalogue d objets ou les tables de loot de CDI-060.
- Modifier les regles ou valeurs de gameplay pendant les deplacements.
- Deplacer des composants React dans `shared`.
- Reorganiser le backend par handlers, traite par CDI-082.
- Faire une reecriture globale plutot qu une migration par modules.

## Contrat d'implementation

- La direction cible est `frontend -> shared <- backend`.
- Un module partage reste pur, deterministe et executable sous Node, Deno et
  navigateur lorsque son usage l exige.
- Aucun identifiant, catalogue ou calcul canonique n acquiert une seconde
  definition pendant la migration.
- Chaque deplacement conserve les exports publics necessaires jusqu a la
  migration de ses consommateurs.
- Le bundling de l Edge Function et du frontend reste verifie apres chaque lot.

## Dependances

CDI-078 fournit les contrats cibles. CDI-060 fournit la source unique du
catalogue d objets afin d eviter une relocalisation concurrente.

## Criteres d'acceptation

- [ ] Aucun fichier de l Edge Function n importe un module sous `src`.
- [ ] Les contrats, regles pures et donnees communes ont un proprietaire
      explicite dans `shared`.
- [ ] Frontend et backend consomment la meme source pour chaque regle partagee.
- [ ] Le catalogue de CDI-060 est reutilise sans duplication.
- [ ] Les modules partages ne dependent pas de React, du DOM ou d un secret.
- [ ] Les comportements et tirages deterministes restent identiques.
- [ ] L architecture cible et les conventions d import sont documentees.

## Tests

- Test interdisant les imports `supabase/functions -> src`.
- Tests de determinisme avant et apres deplacement.
- Tests d import sous les runtimes utilises.
- `npm.cmd run check:determinism`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Rejouer un parcours de ville, un combat, un equipement, une forge et un loot,
puis verifier F5 et replay autoritaire.

## Preservation

- Preserver tous les identifiants persistants et contrats reseau.
- Preserver RNG, statistiques et ordre des mutations.
- Ne pas melanger relocalisation architecturale et reequilibrage.

## Risques

- Un deplacement peut modifier involontairement l ordre des imports ou le
  bundling Deno.
- Deux sources temporaires non synchronisees creeraient une divergence.
- Une migration trop large compliquerait la recherche de regression.

## Handoff

Fournir la carte finale des modules, les imports interdits, les compatibilites
runtime, les duplications retirees et les preuves de determinisme.
