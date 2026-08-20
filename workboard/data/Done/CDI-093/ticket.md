---
id: CDI-093
title: Supprimer les snapshots PostgREST redondants des commits
status: Done
area: backend
priority: P1
size: M
risk: high
source: Alerte Supabase egress du 2026-08-20
depends_on: []
blocks: ["CDI-095"]
github_issue: null
related_docs: ["workboard/data/Doing/CDI-095/ticket.md", "supabase/functions/game-api/supabase-adapter.ts", "supabase/functions/game-api/index.ts", "supabase/migrations/20260726010000_temporal_authority.sql", "shared/contracts/authoritative.ts", "tests/supabaseAdapter.test.ts"]
---

# CDI-093 - Supprimer les snapshots PostgREST redondants des commits

## Objectif

Reduire le volume PostgREST en evitant que chaque RPC de commit renvoie au
game-api le snapshot complet que l Edge Function vient deja de calculer et de
transmettre a PostgreSQL.

## Resultat utilisateur

Les commandes et reconciliations conservent leur resultat autoritaire, mais
transmettent moins de donnees entre PostgreSQL, l Edge Function et le navigateur.

## Contexte

Le detail Supabase attribue la majorite de l egress a PostgREST. Dans
`supabase-adapter`, une commande charge l etat complet, calcule le nouvel etat,
l envoie a `commit_game_transition`, recupere une ligne contenant encore l etat
complet, puis renvoie cet etat par l Edge Function. Le chemin idle suit le meme
schema. Le ratio observe, environ deux volumes PostgREST pour un volume
Functions, est coherent avec ces copies successives, sans suffire seul comme
preuve causale.

## Perimetre autorise

- Mesurer la taille JSON des reponses RPC et des enveloppes Edge sur des
  sauvegardes representatives sans journaliser leur contenu.
- Faire retourner aux commits uniquement les metadonnees necessaires, notamment
  schema, revision, temps serveur et `last_processed_at`.
- Reutiliser `transition.state` apres un commit de commande reussi.
- Reutiliser `idle.state` apres un commit idle reussi.
- Conserver un chargement complet pour bootstrap, replay, reset et resolution
  de conflit lorsqu il est reellement necessaire.
- Ajouter une migration additive et les grants minimaux requis.
- Prouver que l etat renvoye correspond exactement a l etat persiste.

## Hors perimetre

- Supprimer le chargement initial requis par l Edge Function sans nouvelle
  architecture autoritaire.
- Faire confiance a un etat client comme source de verite.
- Exposer directement les tables de jeu au role `authenticated`.
- Modifier les regles metier, le RNG, l idempotence ou la revision.
- Ajouter des logs contenant snapshots, tokens ou donnees personnelles.
- Compresser arbitrairement des reponses sans verifier le comportement de la
  plateforme et la mesure d egress.

## Contrat d'implementation

- PostgreSQL reste le point de commit atomique et refuse revisions obsoletes,
  commandes reutilisees et etats invalides.
- L Edge Function ne renvoie son etat calcule qu apres confirmation explicite
  du commit.
- Les valeurs generees ou normalisees par PostgreSQL sont retournees comme
  metadonnees et appliquees a l enveloppe.
- Les chemins de conflit et replay rechargent la ligne persistante lorsque
  necessaire.
- La migration ne casse ni les appels en vol ni les environnements locaux.
- Les mesures enregistrent uniquement route, categorie et nombre d octets.

## Dependances

Aucune dependance fonctionnelle bloquante. Le ticket bloque CDI-095, qui doit
verifier le gain PostgREST apres deploiement.

## Criteres d'acceptation

- [x] Les RPC de commit nominales ne retournent plus le champ `state` complet.
- [x] Le game-api renvoie le meme nouvel etat fonctionnel au navigateur apres
      confirmation du commit.
- [x] Bootstrap, reset, replay et conflits disposent encore d un snapshot
      persiste lorsque leur contrat l exige.
- [x] Revision, `lastProcessedAt`, idempotence et rate limiting restent
      inchanges.
- [x] Une reponse de commit nominale a une taille bornee independante de la
      taille du snapshot.
- [x] Les tests prouvent l egalite entre etat calcule, etat persiste et etat
      renvoye.
- [x] Les permissions RLS et service role restent minimales.
- [x] Le gain theorique et les tailles avant/apres sont documentes.

## Tests

- Tests unitaires de l adaptateur Supabase pour commande et idle.
- Tests de contrat des nouvelles reponses RPC.
- Tests de revision conflictuelle, replay, commande en cours et rate limit.
- Tests database de commit atomique, etat persiste et permissions.
- Tests de migration locale et de compatibilite du runtime Edge.
- Mesure automatisee des octets JSON avant/apres sur petits et gros snapshots.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- Tests Supabase locaux etablis par le projet.
- `npm.cmd run check:determinism`
- `npm.cmd run board:validate`
- `git diff --check`

## Validation manuelle

Apres validation locale automatisee, rejouer une commande autoritaire depuis le
frontend local et verifier resultat, revision et replay. L utilisateur execute
la procedure interactive fournie par Codex ; aucun bearer n est copie dans les
commandes ou la documentation.

## Preservation

- Preserver atomicite, idempotence, rate limit et RLS.
- Preserver le replay autoritaire documente par le projet.
- Preserver les migrations d etat et les normalisations PostgreSQL.
- Preserver les erreurs structurees et identifiants de requete.
- Ne jamais exposer ni journaliser le service role ou un bearer utilisateur.

## Risques

- Une fonction SQL peut normaliser une valeur que l Edge croit deja finale.
- Retourner l etat calcule avant confirmation rendrait un echec de commit
  invisible.
- Une migration de signature RPC mal ordonnee peut casser un deploiement
  progressif.
- Les gains locaux ne prouvent pas seuls la classification d egress Supabase.

## Handoff

Fournir les signatures RPC avant/apres, les octets mesures, la preuve d egalite
des etats, les tests de panne et replay, l ordre de deploiement backend et les
metriques a verifier dans CDI-095.
