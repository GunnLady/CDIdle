---
id: CDI-061
title: Rendre l autorite temporelle transactionnelle
status: Done
area: backend
priority: P0
size: L
risk: high
source: Audit general de l autorite temporelle Git, documentation et code du 2026-07-26
depends_on: ["CDI-021", "CDI-030", "CDI-057"]
blocks: ["CDI-051"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/api-command-contracts.md", "docs/architecture/clock-rng.md", "docs/architecture/clock-rng-audit.md", "docs/architecture/idle-engine.md", "docs/architecture/idle-engine-audit.md", "docs/architecture/cdi-030-audit.md", "supabase/functions/game-api/idle-authority.ts", "supabase/functions/game-api/supabase-adapter.ts", "supabase/migrations/20260720000000_idle_commit.sql", "supabase/migrations/20260726010000_temporal_authority.sql", "supabase/tests/database/023_temporal_authority.sql", "scripts/test-temporal-concurrency.mjs", "src/App.tsx", "src/domain/authoritativeTimeProjection.ts", "src/domain/automationLeadership.ts", "src/domain/crossTabAuthority.ts", "src/domain/townProjection.ts", "tests/authoritativeTimeProjection.test.ts", "tests/automationLeadership.test.ts", "tests/crossTabAuthority.test.ts"]
---

# CDI-061 - Rendre l autorite temporelle transactionnelle

## Objectif

Garantir qu idle, commandes, migrations et projections respectent une seule
autorite temporelle, transactionnelle et rejouable, sans perte d etat en
concurrence, temps perdu ni horloge divergente entre workers.

## Resultat utilisateur

La progression de ville, l immigration et la recuperation des heros restent
exactes entre appareils, onglets, commandes rapides, reconnexions et replay.
Aucune commande ou synchronisation concurrente ne peut effacer une mutation
deja validee.

## Contexte

L ancien prototype mutait la partie depuis plusieurs timers React et
sauvegardes concurrentes. Ces moteurs ont ete remplaces par une autorite idle
serveur et des projections UI en lecture seule. L audit du 26 juillet 2026 a
cependant prouve que `commit_idle_state` remplace tout `state` en comparant
uniquement `last_processed_at`, sans participer a `revision`.

Une commande concurrente peut donc etre effacee par idle, ou effacer idle tout
en conservant son timestamp avance. Les fractions inferieures a une seconde
sont aussi perdues, l heure dite serveur provient du worker Edge, la limite de
60 commandes par minute n est pas raccordee au runtime et une commande refusee
peut avoir deja commite idle. Les tests existants couvrent les parcours
nominaux mais aucun interleaving PostgreSQL reel.

## Perimetre autorise

- Concevoir une transition temporelle autoritaire partagee par bootstrap,
  commande et replay.
- Verifier ensemble `revision` et `last_processed_at` avant toute ecriture.
- Faire participer idle, immigration, recuperation et migration persistante a
  la revision canonique.
- Utiliser une heure PostgreSQL comme reference entre workers Edge.
- Conserver les fractions de seconde non encore appliquees.
- Rendre atomiques application idle, validation metier et commit de commande.
- Garantir qu une commande refusee ne modifie ni etat, ni revision, ni temps.
- Raccorder une limite autoritaire et concurrente de 60 commandes par minute
  et par utilisateur au runtime reel.
- Conserver l idempotence des commandes et traiter l avancee idle d un replay
  sans reexecuter la commande metier.
- Ancrer les projections UI sur les timestamps serveur et une mesure locale
  monotone, sans utiliser la projection pour autoriser une depense.
- Ajouter les migrations SQL additives, contrats, documentation et tests de
  concurrence necessaires.

## Hors perimetre

- Modifier les taux de production, immigration ou recuperation.
- Modifier le plafond hors ligne de 24 heures.
- Autoriser donjon, loot, forge ou recrutement hors ligne.
- Ajouter une file de commandes offline.
- Reequilibrer le gameplay ou modifier le RNG canonique.
- Modifier une migration deja deployee au lieu d ajouter une migration.

## Contrat d'implementation

- Une mutation temporelle ne peut etre commitee que si la revision et le
  timestamp lus sont encore courants.
- Chaque nouvel etat canonique possede une nouvelle revision ; deux etats
  differents ne partagent jamais la meme revision.
- Une commande ordinaire calcule idle puis la transition metier depuis le meme
  snapshot et committe etat, revision et temps en une seule operation logique.
- Une commande refusee ne committe aucune partie de cette transition.
- Bootstrap et replay utilisent une transition idle autonome soumise aux memes
  controles optimistes et rechargent proprement apres conflit.
- Le temps de calcul provient de PostgreSQL. Un decalage entre workers Edge ne
  peut ni avancer artificiellement la partie ni produire `CLOCK_ROLLBACK`.
- Le moteur applique uniquement les secondes completes et conserve le reliquat
  inferieur a une seconde. Le surplus au-dela de 24 heures reste definitivement
  ecarte selon la decision produit existante.
- La limite de commandes est verifiee dans une zone autoritaire resistante aux
  appels concurrents et aux requetes HTTP directes.
- `serverTime`, `lastProcessedAt`, revision, etat et rapport idle retournes
  decrivent exactement le commit effectif.
- Le client utilise une horloge monotone pour l animation et se reconcilie
  uniquement depuis les snapshots `game-api`.

## Dependances

CDI-021 fournit le contrat de commande et de revision. CDI-030 fournit le
moteur idle et son rapport. CDI-057 fournit les projections Ville et le
heartbeat. CDI-061 bloque la reprise de CDI-051 tant que le P0 de perte d etat
concurrente n est pas ferme.

## Criteres d'acceptation

- [x] Idle commite apres une commande concurrente sans perdre la commande.
- [x] Une commande commitee apres idle sans perdre production, immigration ou
      recuperation.
- [x] Toute mutation idle ou migration persistante incremente la revision.
- [x] Dix traitements espaces de 200 ms appliquent finalement deux secondes
      completes sans perte du reliquat.
- [x] Deux workers avec des horloges locales decalees utilisent la meme heure
      PostgreSQL et ne produisent pas de rollback artificiel.
- [x] Une commande refusee conserve exactement etat, revision,
      `last_processed_at`, RNG et cache.
- [x] La 61e commande de la meme minute est refusee, y compris par requetes
      directes et concurrentes, sans mutation.
- [x] Un replay ne reexecute jamais la commande et peut avancer idle une seule
      fois avec une revision coherente.
- [x] Deux onglets ou appareils sur le meme snapshot produisent un seul commit
      gagnant et un conflit recuperable, sans fusion ni perte silencieuse.
- [x] Le plafond de 24 heures, le rapport idle, F5, reconnexion et cache offline
      en lecture seule restent conformes.
- [x] Les projections restent coherentes apres changement de l heure Windows
      et se recalent sans saut autoritaire fictif.
- [x] Les audits CDI-030 et CDI-057 sont rectifies avec les nouvelles preuves.

## Tests

- Tests unitaires du reliquat sub-seconde, plafond, rollback et rapport idle.
- Tests adaptateur des deux ordres d interleaving idle/commande.
- Tests PostgreSQL reels des verrous optimistes, revisions et conflits.
- Tests de concurrence de la limite de 60 commandes par minute.
- Tests replay, commande refusee, migration et multi-worker.
- Tests UI des projections avec horloge monotone, `serverTime`, F5 et offline.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run test:db`
- `npm.cmd run test:integration`
- `npm.cmd run check:determinism`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run board:validate`

Preuves finales : 94 tests pgTAP rapportes par l utilisateur, integration
temporelle reelle `duplicate, snapshot race and concurrent 60/min boundary`
rapportee conforme, 298 tests Vitest et typecheck verifies par Codex,
determinisme, migrations additives, secrets, logs et budget bundle conformes.
Le build final est rapporte conforme par l utilisateur.

## Validation manuelle

Avec Docker, Supabase local et deux onglets authentifies sur le meme compte,
declencher simultanement heartbeat idle et commandes Ville/donjon. Verifier
revision, ressources, population, PV/PM, RNG et `last_processed_at` avant et
apres F5. Tester ensuite commandes rapides, commande refusee, replay exact,
passage offline/online et modification de l heure Windows sans perte ni gain
fictif.

Validation realisee : l utilisateur a confirme la synchronisation progressive
entre deux onglets, le mode maitre/observateur, le transfert explicite sans
erreur, la reprise automatique apres fermeture du maitre et la desactivation
de l exploration automatique sans erreur. Les conflits 409 observes ont ete
resynchronises sans perte. F5, replay, persistance et build ont ete confirmes.
La projection independante de l heure murale est couverte automatiquement par
une horloge monotone injectee.

## Preservation

- Preserver les regles gameplay et le plafond idle valides.
- Preserver idempotence, RNG canonique, cache offline et erreur 409.
- Preserver les mutations uniquement serveur et les projections UI en lecture
  seule.
- Preserver les migrations de production existantes ; toute correction SQL
  est additive.
- Ne pas presenter les tests mocks comme preuve de concurrence PostgreSQL.

## Risques

- Une mauvaise frontiere transactionnelle peut perdre ou dupliquer toute
  mutation canonique.
- Incrementer la revision pendant idle modifie les attentes du client et du
  replay ; le protocole doit etre migre de facon coherente.
- Une limite de commandes non atomique reste contournable par concurrence.
- Changer l origine de l heure peut produire des conflits temporaires sur les
  timestamps deja persistants et demande une strategie de compatibilite.
- Les tests multi-appareil sont indispensables : la file React masque les
  courses dans un navigateur unique.

## Handoff

CDI-061 est implemente et audite avant push. La transition temporelle partagee
verifie revision et timestamp, utilise l heure PostgreSQL, committe idle et
commande atomiquement, conserve le reliquat sub-seconde et applique la limite
concurrente de 60 commandes par minute. Le client projette avec une horloge
monotone, partage les snapshots exacts entre onglets et reserve les mutations a
un seul onglet maitre avec transfert et reprise automatique.

Preuves Codex : typecheck, 298 tests Vitest, determinisme, lint cible, securite
des migrations, logs, secrets, workboard et budget bundle conformes. Preuves
utilisateur : 94 tests PostgreSQL, integration de concurrence reelle, parcours
navigateur multi-onglet et build final conformes. Aucun ecart P0 ou P1 ne reste;
les deux ecarts rentables du dernier audit, cache IndexedDB non bloquant et
suppression de compte serialisee, ont ete corriges puis revalides.
