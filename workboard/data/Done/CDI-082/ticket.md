---
id: CDI-082
title: Decouper l autorite backend par handlers
status: Done
area: backend
priority: P2
size: L
risk: medium
source: Audit d architecture logiciel front et back du 2026-08-01
depends_on: ["CDI-079", "CDI-080"]
blocks: ["CDI-083"]
github_issue: null
related_docs: ["docs/development/authoritative-command-handlers.md", "supabase/functions/game-api/town-authority.ts", "supabase/functions/game-api/town-state.ts", "supabase/functions/game-api/command-handler.ts", "supabase/functions/game-api/town-command-registry.ts", "supabase/functions/game-api/index.ts", "supabase/functions/game-api/dungeon-authority.ts", "supabase/functions/game-api/forge-authority.ts"]
---

# CDI-082 - Decouper l autorite backend par handlers

## Objectif

Transformer `applyTownCommand` en dispatcher leger et organiser les mutations
autoritaires par domaines independants, sans modifier leurs resultats.

## Resultat utilisateur

Les futures classes et mecaniques peuvent etre ajoutees avec moins de risques
de casser une commande sans rapport.

## Contexte

Le fichier `town-authority.ts` contient l etat initial, la migration, la
reconciliation et un dispatcher qui applique aussi de nombreuses mutations
de ville et de heros avant de deleguer forge, inventaire et donjon. Cette
concentration reste fonctionnelle mais grandira avec les classes T2 a T4.

## Perimetre autorise

- Definir une interface commune de handler autoritaire.
- Creer des handlers par famille : ville, citoyens, heros/vocations,
  inventaire, forge et donjon.
- Conserver un dispatcher exhaustif et leger.
- Separer initialisation, migration, validation et application de commandes.
- Standardiser erreurs metier et emission d evenements.
- Conserver les chemins d injection utilises par les tests.
- Migrer les commandes par lots avec golden tests inchanges.

## Hors perimetre

- Modifier le contrat reseau ou les identifiants de commandes.
- Reequilibrer couts, statistiques ou recompenses.
- Changer la transaction Postgres ou les garanties de revision.
- Introduire un framework de commande externe.
- Refaire les migrations versionnees de CDI-080.

## Contrat d'implementation

- Chaque type de commande possede exactement un handler.
- Le dispatcher refuse toute commande inconnue et reste exhaustif.
- Les handlers restent purs vis-a-vis de l etat fourni et du RNG canonique.
- Evenements, erreurs et consommation RNG restent identiques pour une meme
  entree.
- La transaction et le commit restent geres par l adaptateur Supabase.

## Dependances

CDI-079 fournit les modules partages dans la bonne couche. CDI-080 retire la
responsabilite de migration implicite du dispatcher actuel.

## Criteres d'acceptation

- [x] `applyTownCommand` ne contient plus les implementations detaillees des
      domaines.
- [x] Ville, citoyens, heros, inventaire, forge et donjon ont des handlers
      clairement proprietaires.
- [x] Toute commande du contrat est mappee une seule fois.
- [x] Erreurs et evenements gardent leur forme publique.
- [x] Les golden tests prouvent l identite des transitions et du RNG.
- [x] Revision, claim, replay, rate limit et idle restent inchanges.
- [x] L ajout futur d une famille de commandes est documente.

## Tests

- Golden tests avant/apres pour chaque famille.
- Test d exhaustivite du registre de handlers.
- Tests RNG, replay, revision et erreur metier.
- `npm.cmd run check:determinism`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:integration`
- `npm.cmd run test:db`
- `npm.cmd run board:validate`

## Validation manuelle

Rejouer les parcours principaux ville, recrutement/vocation, coffre,
equipement, forge et donjon sur le backend local.

## Preservation

- Preserver strictement commandes, evenements, RNG et snapshots produits.
- Preserver les garanties transactionnelles de l adaptateur et de Postgres.
- Ne pas transformer le refactor en changement fonctionnel.

## Risques

- Un ordre de handler different peut modifier la consommation RNG.
- Une erreur remappee differemment peut casser le feedback frontend.
- Une abstraction excessive augmenterait le code sans gain.

## Handoff

Fournir le registre des handlers, leurs responsabilites, les invariants
preserves, les golden tests et la procedure d ajout d une commande.

## Realisation

- `town-authority.ts` est reduit a la migration/validation deleguee, la
  restauration du RNG, la construction du contexte et le dispatch.
- `town-state.ts` isole initialisation, migration et validation sans casser les
  exports historiques de `town-authority.ts`.
- `forge-blueprints.ts` isole les donnees initiales afin que l etat et les
  migrations ne dependent plus du moteur de commandes forge.
- Les 25 commandes canoniques sont cablees explicitement et exactement une fois
  dans `town-command-registry.ts`, avec exhaustivite TypeScript et runtime.
- Les moteurs de forge, inventaire et donjon restent inchanges et sont appeles
  par des adaptateurs de handlers minces.
- L ajout d une commande et les invariants RNG/evenements/erreurs sont decrits
  dans `docs/development/authoritative-command-handlers.md`.

## Validation locale Codex

- `npm.cmd run typecheck` : OK.
- `npm.cmd run lint` : OK.
- `npm.cmd run check:determinism` : OK.
- `npm.cmd test -- --run` : 76 fichiers, 606 tests, OK apres corrections
  d audit.
- Apres correction d audit, suite ciblee registre/ville/forge/migrations/RNG :
  5 fichiers, 87 tests, OK, dont le refus explicite d une commande inconnue.
- `npm.cmd run test:integration`, preuve utilisateur : inconclusif sur
  `POST /bootstrap`, HTTP 503 `name resolution failed`. Le symptome correspond
  au blocage local Edge vers Kong/PostgREST deja documente dans
  `docs/architecture/game-api-followups.md`; aucune regression metier CDI-082
  n est demontree par ce resultat.
- `npm.cmd run board:validate` : 88 tickets, 0 erreur.
- `npm.cmd run test:db`, preuve utilisateur : 8 fichiers, 127 tests, PASS.
- `npm.cmd run test:coverage`, preuve utilisateur : 76 fichiers, 606 tests,
  OK.
- `npm.cmd run check:coverage`, preuve utilisateur : seuils `domain` et
  `game-api` respectes.
- `npm.cmd run build`, preuve utilisateur : build Vite reussi en 3.75 s.
- `npm.cmd run check:bundle`, preuve utilisateur : 250769 B gzip JS, plus gros
  chunk 163929 B, budget respecte.
