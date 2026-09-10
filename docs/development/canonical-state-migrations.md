# Migrations de l'état canonique

Le JSON persistant porte `stateVersion`. Cette version décrit uniquement le
format du snapshot de jeu ; elle est distincte de `games.schema_version`, qui
versionne l'enveloppe SQL/API.

## Exécution

`migrateCanonicalState` lit la version, applique successivement chaque étape
`vN -> vN+1`, puis `migrateTownState` exécute les validateurs canoniques et les
contrôles du catalogue. Une version absente désigne le format alpha `v0`. Une
version invalide ou supérieure à la version supportée est refusée avec un code
d'erreur diagnostiquable.

Les migrations doivent être pures : elles clonent leur entrée, ne lisent ni
l'heure ni un service externe et ne consomment aucun tirage RNG. Un snapshot à
la version courante n'est jamais complété silencieusement.

## Ajouter une version

1. Incrémenter `CURRENT_CANONICAL_STATE_VERSION` dans le contrat partagé.
2. Ajouter exactement une transformation `vN -> vN+1` dans
   `CANONICAL_STATE_MIGRATIONS` ; ne jamais sauter une version.
3. Ajouter une paire de fixtures anonymisées avant/après et son test golden.
4. Prouver pureté, déterminisme, idempotence, conservation des identifiants,
   de l'historique et de l'état RNG.
5. Tester le bootstrap, une commande après migration et le rejet des états
   impossibles à interpréter.

Une migration adapte un format, pas l'équilibrage du jeu. Toute valeur perdue
ou ambiguë doit provoquer une erreur explicite.

## Version du modèle de progression

Depuis l'état canonique v2, `heroProgressionModelId` identifie séparément le
modèle d'équilibrage. La migration structurelle `v1 -> v2` marque les snapshots
existants avec `legacy-global-v1`; elle ne change pas leur XP.

`migrateTownState` valide d'abord ce format, puis
`upgradeCanonicalHeroProgression` convertit explicitement l'ancien modèle vers
`harmonized-level-bands-v2`. Le modèle publié `harmonized-t0-t1-v1`, dont les
bandes dépendaient encore du tier de classe, suit la même conversion. Pour
chaque héros, candidat d'onboarding et recrutement en attente, la conversion
conserve `xp / xpNeeded`, arrondit vers le bas et ne consomme aucun tirage RNG.
L'identifiant rend cette conversion idempotente.

Les modèles de récompenses donjon `level-aligned-v2` et de difficulté des défis
`undercity-two-profiles-v3` ne sont pas persistés dans le snapshot. Leur
activation ne déclenche donc aucune migration et ne réécrit jamais l'XP déjà
acquise. Un replay retourne le résultat de commande persisté au lieu de
recalculer les récompenses avec la politique courante.

## Version des objets

Depuis l'état canonique v3, toute instance d'objet persistée porte
`itemLevel` et `powerModelId`. La migration `v2 -> v3` couvre les objets du
coffre, tous les équipements de héros, les candidats d'onboarding, la recrue
en attente, la preview de forge et les objets de l'historique de rencontres.
Elle conserve `instanceId`, `itemId`, rareté et modificateurs, ne consomme aucun
RNG, puis réconcilie les prières de vocation comme les migrations historiques.

Les 131 modèles existants sont marqués `legacy-fixed-v1` à leur niveau requis
historique. Cela inclut les starters de recrutement niveau 1 et les cadeaux de
rank-up T1 niveau 10. Les 48 nouvelles bases utilisent `level-bands-v1` et
gardent leur niveau d'instance compris entre 1 et 40.

Le backfill SQL
`20260904010000_item_level_progression_v3.sql` applique la même résolution aux
snapshots déjà stockés dans `public.games`. Il préserve la révision, l'ordre
des tableaux, les métadonnées déjà valides et les champs inconnus. Il ne
promeut que les snapshots structurels v2 vers v3 : les versions v0/v1 restent
inchangées afin que le runtime exécute encore leurs migrations intermédiaires.
Le test pgTAP `026_item_level_progression_v3.sql` couvre notamment les objets
de recrutement niveau 1, les cadeaux de rank-up niveau 10, la forge,
l'historique, les droits des helpers et l'idempotence.

Les contrats TypeScript de l'état v3 rendent `itemLevel` et `powerModelId`
obligatoires pour les objets stockés, équipés, forgés en attente et présents
dans l'historique de loot. Le validateur runtime refuse également un snapshot
v3 qui omet l'un de ces champs. La compatibilité avec les objets incomplets
reste exclusivement dans la migration `v2 -> v3`.

## Version de la Forge

L’état canonique v4 remplace `pendingForge.upgradeProc` par
`pendingForge.offeredRarity`. `none` devient la rareté minimale de la recette ;
`uncommon` et `rare` sont conservés. Les 131 identifiants historiques de plans
deviennent leurs 48 bases `progression_*`; les doublons fusionnent avec
`unlocked=true` dès qu’une occurrence était ouverte. Une liste absente ou vide
reçoit les six plans évolutifs.

La migration corrective additive
`20260904030000_legacy_blueprint_evolution_catalog.sql` reprend également les
états déjà passés en v4 avant l'extension du mapping. Elle ne modifie que
`itemBlueprints`, conserve les champs adjacents et reste idempotente.

La migration TypeScript `v3 -> v4` reste pure et ne modifie ni inventaire,
équipement, recrutement, rank-up, historique, révision ou RNG. Le backfill SQL
additif `20260904020000_forge_progression_v4.sql` applique la même
transformation dans `public.games` sans réécrire la migration v3. Le test pgTAP
`027_forge_progression_v4.sql` prouve la correspondance des raretés minimales,
la déduplication, la conservation des previews et l’idempotence.

Le test de catalogue lit la zone `ITEM_CATALOG_SYNC_START/END` de la migration
SQL et vérifie que ses 179 références figées sont uniques et toujours
résolubles par le catalogue TypeScript. Ce nombre décrit l'instantané v3, pas
la taille éternelle du catalogue : un futur objet s'ajoute dans une nouvelle
évolution sans réécrire cette migration historique.

## Reprise des anciennes instances d'objet

La migration additive `20260909010000_item_instance_id_recovery.sql` reprend
les anciens objets qui portent `id` au lieu de `itemId`, génère un
`instanceId` déterministe lorsqu'il manque et développe les anciennes piles
`count` en instances distinctes. Elle traite le coffre, les équipements, les
candidats et la recrue en attente sans modifier la révision canonique.

La reprise est également appliquée au bootstrap et avant un déséquipement afin
qu'un objet historique ne soit jamais supprimé au moment où son slot est
vidé. Le coffre projette ces formes historiques au lieu de les filtrer
silencieusement. Le test pgTAP `028_item_instance_id_recovery.sql` couvre la
conversion, l'unicité des instances, les droits des helpers et l'idempotence.

## Extension des acteurs initiaux de rencontre

CDI-098 ajoute `encounterHistory[].initialActors` comme extension facultative,
interne au record et versionnée par `initialActors.v`. Cette évolution ne
change pas les invariants obligatoires de l'état canonique : un record ancien
sans extension reste valide et consultable, tandis qu'un nouveau record v1 est
validé puis conservé tel quel par les migrations courantes. Il n'y a donc ni
incrément de `stateVersion` ni backfill SQL ; inventer les acteurs perdus d'une
ancienne rencontre serait moins fidèle qu'une absence explicite.

La preuve couvre la migration TypeScript idempotente et le pipeline Supabase
local : persistance JSONB, bootstrap et replay de la commande renvoient la même
extension structurelle. PostgreSQL peut réordonner les clés JSONB ; l'égalité
porte sur les données, jamais sur l'ordre textuel des propriétés.

## Retirer une migration

Une étape ne peut être retirée qu'après preuve qu'aucun snapshot persistant ne
porte encore sa version d'entrée. Cette preuve doit couvrir la production et
les sauvegardes restaurables. Les fixtures historiques restent conservées pour
documenter le format et prévenir les régressions de compatibilité.

## Validation

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run test:db
npm.cmd run board:validate
```

Codex CLI exécute directement le test DB et les validations Supabase locales.
Le terminal PowerShell utilisateur n'est requis que si Docker, Supabase local
ou une autre capacité interactive est réellement indisponible dans la session.
