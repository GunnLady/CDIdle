---
id: CDI-079
title: Retablir les frontieres du domaine partage
status: Done
area: architecture
priority: P1
size: L
risk: high
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-078", "CDI-060"]
blocks: ["CDI-082"]
github_issue: null
related_docs: ["docs/architecture/shared-domain-boundaries.md", "shared/contracts", "shared/data", "shared/domain", "supabase/functions/game-api", "tests/supabase-shared-import.test.ts"]
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

L audit initial a mesure huit imports directs du backend vers sept modules
sous `src`, et vingt-trois fichiers `src` atteignables transitivement depuis
les Edge Functions. Le repertoire `shared` contenait deja les contrats
canoniques, le catalogue d objets et plusieurs regles pures, mais pas encore
les donnees ni le moteur autoritaire complet.

## Realisation

- Direction `frontend -> shared <- backend` appliquee sans import Edge vers
  `src`.
- Modeles neutres regroupes dans `shared/contracts` ; les anciens contrats
  redondants sont des alias des contrats canoniques.
- Catalogues de classes, competences, monstres, batiments et vocations
  regroupes dans `shared/data`.
- Moteur de donjon, combat tactique, progression, transitions, validations et
  calculs purs regroupes dans `shared/domain`.
- Catalogue d objets CDI-060 conserve comme source unique sous
  `shared/domain/items` sans changement de valeur.
- Facades sous `src` conservant les imports frontend historiques ; seuls les
  adaptateurs navigateur y fournissent encore un RNG local par defaut.
- RNG, temps et dependances runtime injectes dans le domaine partage.
- Garde transitive couvrant toutes les Edge Functions et tous les modules
  partages.
- Gardes de determinisme, logs et couverture mises a jour pour analyser
  reellement `shared` et echouer sur un groupe de couverture vide.
- Architecture et conventions documentees dans
  `docs/architecture/shared-domain-boundaries.md`.

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

- [x] Aucun fichier de l Edge Function n importe un module sous `src`.
- [x] Les contrats, regles pures et donnees communes ont un proprietaire
      explicite dans `shared`.
- [x] Frontend et backend consomment la meme source pour chaque regle partagee.
- [x] Le catalogue de CDI-060 est reutilise sans duplication.
- [x] Les modules partages ne dependent pas de React, du DOM ou d un secret.
- [x] Les comportements et tirages deterministes restent identiques.
- [x] L architecture cible et les conventions d import sont documentees.

## Tests

- Test interdisant les imports `supabase/functions -> src`.
- Tests de determinisme avant et apres deplacement.
- Tests d import sous les runtimes utilises.
- `npm.cmd run check:determinism`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Preuves de validation

- Equivalence controlee des dix-neuf modules deplaces : seuls les chemins d
  import et les adaptateurs RNG ont change ; aucune formule ou valeur de
  gameplay n a diverge.
- Graphe Edge : zero import direct ou transitif vers `src`.
- `npm.cmd run typecheck` et `npm.cmd run lint` : succes.
- `npm.cmd run check:determinism` : succes sur `src/domain`, `shared/domain`
  et les autorites backend.
- `npm.cmd run check:logs` : 142 fichiers suivis et non suivis analyses.
- `npm.cmd test -- --run` : 66 fichiers et 573 tests reussis.
- E2E canonique : 3 tests reussis.
- Couverture rapportee par l utilisateur : domaine 88,18 % statements,
  80,92 % branches, 97,90 % fonctions et 93,77 % lignes ; game-api 87,53 %,
  77,37 %, 93,17 % et 93,77 %.
- Build rapporte par l utilisateur : succes en 3,20 s.
- Budget bundle rapporte par l utilisateur : 249788 octets gzip au total,
  plus gros chunk 163929 octets.
- `npm.cmd run board:validate` et `git diff --check` : succes.

## Validation manuelle

Les parcours ville, combat, equipement, forge, loot, F5, cache et replay sont
couverts par la suite de regression et l E2E canonique. Le deploiement
Supabase final reste une etape de publication apres le push, pas une mutation
du domaine.

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

La carte et les conventions sont dans
`docs/architecture/shared-domain-boundaries.md`. La garde automatisee interdit
les retours vers `src`, React, DOM, secrets runtime et RNG implicite. CDI-082
peut maintenant decouper les handlers backend sans importer le frontend.
