# RNG canonique autoritaire

## Contrat

`GameStateV1.rngState` persiste un generateur versionne :

```json
{
  "algorithm": "xorshift32",
  "version": 1,
  "seed": 1831565813,
  "state": 1831565813,
  "draws": 0
}
```

- `seed` identifie la sequence initiale.
- `state` permet de reprendre exactement au prochain tirage.
- `draws` compte les tirages du flux RNG maitre et fournit une trace
  d avancement auditable.
- `algorithm` et `version` interdisent une reinterpretation silencieuse apres
  une evolution du generateur.

Ces cinq champs sont conserves volontairement. `state` suffirait seulement a
continuer une sequence opaque ; sans `seed`, la sequence ne serait plus
reproductible depuis son origine, sans `draws` son avancement ne serait plus
auditable, et sans `algorithm`/`version` un changement d implementation
pourrait reinterpreter silencieusement une sauvegarde.

La graine n est pas un secret et ne doit jamais etre utilisee comme
credential.

La validation garantit la structure, les bornes, la version et l appartenance
de la graine au compte. Elle ne recalcule pas mathematiquement toute la
sequence `seed -> state` depuis `draws` : les ecritures sont deja reservees au
backend et contraintes transactionnellement, tandis qu une telle verification
dupliquerait un mecanisme de saut RNG complexe en TypeScript et PostgreSQL.

`draws` accepte les entiers de `0` a `Number.MAX_SAFE_INTEGER`, inclus. Un
instantane a cette borne reste lisible et auditable, mais toute nouvelle
consommation est refusee explicitement avec `RNG_EXHAUSTED` avant de modifier
le flux.

## Cycle d une commande

1. Le backend restaure le generateur depuis `rngState`.
2. L autorite metier consomme les tirages necessaires.
3. Le nouvel instantane RNG est ajoute a l etat produit.
4. `commit_game_command` persiste dans la meme transaction l etat metier, le
   RNG, la revision, la commande et les evenements.

Un conflit est detecte avant l autorite metier. Un replay retourne l etat deja
committe sans rappeler l autorite. Une commande rejetee ne fournit aucun etat
a committer. Ces trois chemins ne consomment donc aucun tirage persiste.

Chaque bloc aleatoire atomique consomme un tirage du flux maitre afin de
produire sa propre sous-graine. Cela couvre actuellement chaque novice et
chaque resolution complete de rencontre.

Le generateur historique du novice utilise sa sous-graine pour le sexe, les
statistiques, les competences et l equipement. Le moteur de rencontre utilise
la sienne pour tous ses rolls, son loot et son transcript.

Ainsi, `draws: 5` apres une offre d onboarding signifie cinq sous-graines
canoniques, pas cinq decisions aleatoires internes. Le resultat complet du
novice est produit et persiste atomiquement ; aucune reprise intermediaire
n est necessaire. Cette frontiere conserve les probabilites historiques et
evite de coupler le flux global aux boucles internes du generateur.

De meme, une rencontre courte ou longue consomme un seul tirage maitre. Ses
rolls internes avancent uniquement sa sous-sequence locale et son resultat
complet est commite atomiquement.

## Compatibilite

- Les nouvelles parties, les resets et les sauvegardes anciennes utilisent une
  graine deterministe derivee du `userId`. Deux comptes ne partagent donc pas
  volontairement la meme sequence initiale.
- La migration `20260724010000_canonical_rng_state.sql` ajoute l instantane
  initial aux sauvegardes qui ne le possedent pas.
- `20260724020000_user_scoped_rng_state.sql` derive la graine FNV-1a depuis
  l identifiant du compte, refuse les versions inconnues ou corrompues et
  installe une contrainte SQL validee sur `games.state`.
- Pendant cette migration uniquement, un instantane cree avec l ancienne
  graine provisoire est reinitialise a la graine du compte avec `state = seed`
  et `draws = 0`. L etat de jeu, la revision et les commandes restent
  inchanges. Ce reensemencement unique remplace une sequence non propre au
  compte avant que le contrat RNG canonique devienne normatif.
- `20260724030000_rng_user_invariant.sql` impose ensuite en base
  `rngState.seed = canonical_rng_seed(user_id)`. Le chargement runtime applique
  la meme verification et refuse `RNG_SEED_USER_MISMATCH`; une graine valide
  d un autre compte n est ni acceptee ni reinitialisee silencieusement.
- `migrateTownState` fournit la meme migration deterministe a la lecture, afin
  de tolerer une sauvegarde ancienne pendant un deploiement progressif.
- Un etat RNG absent est complete avec la graine du compte.
- Un etat RNG present mais invalide ou d une version inconnue bloque la
  migration ou la commande avec `INVALID_GAME_STATE`. Il n est jamais
  reinitialise silencieusement.
- L API retourne ce code avec un `requestId` et journalise cote serveur une
  raison interne sure (`algorithm`, `version`, `seed`, `state`, `draws` ou
  appartenance au compte), sans exposer le contenu de la sauvegarde. Le client
  ne le confond pas avec une panne reseau : il conserve le transport en ligne,
  verrouille les mutations canoniques et fournit un acces direct au reset et a
  la suppression du compte.

## Frontieres

`authoritative-rng.ts` est la seule implementation RNG persistable du backend.
Les UUID de requete et effets visuels locaux restent hors etat canonique.
CDI-054 doit injecter ce meme flux dans le moteur de donjon de parite, sans
changer l ordre historique des rolls.
