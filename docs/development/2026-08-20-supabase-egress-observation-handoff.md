# Handoff — observation Supabase egress après optimisation

- Date d'arrêt : 2026-08-20
- Date de reprise visée : 2026-08-31
- Ticket actif : [`CDI-095`](../../workboard/data/Doing/CDI-095/ticket.md)

## Statut au départ

Le travail produit est publié et validé. Le ticket `CDI-095` reste volontairement
en `Doing` : il manque une fenêtre distante post-déploiement suffisamment longue
et représentative pour confirmer la projection à `<= 4,5 GB` par cycle.

Le goal est donc arrêté sur une attente de mesure, pas déclaré terminé. Aucun
changement produit n'est attendu pendant les vacances.

## État publié

- Branche distante : `main`.
- Dernier commit distant : `d29dee9ef7ea9956ce21d21f9c4985813909a7b9`
  (`docs(egress): record production baseline`).
- Commit produit déployé : `1a72890b5089e870d7390da09a33e7ef21eab9b3`
  (`feat(egress): reduce Supabase traffic`).
- Commit responsive précédent : `51dd97c`
  (`test(ui): align responsive contracts with current layouts`).
- Migration distante appliquée :
  [`20260820010000_compact_transition_commits.sql`](../../supabase/migrations/20260820010000_compact_transition_commits.sql).
- Edge Function `game-api` : active, version 27, JWT vérifié.
- Frontend alpha : workflow GitHub Actions `32390128060` réussi sur le SHA
  `1a72890b5089e870d7390da09a33e7ef21eab9b3`.
- URL immuable contrôlée : `https://8d0335ce.cdidle-alpha.pages.dev`.
- Le commit documentaire `d29dee9` n'exige pas de redéploiement frontend.

CI vérifiée :

- run qualité produit `32386802401` : réussi ;
- run qualité documentaire `32392070606` : réussi ;
- toutes les validations de ce dernier run sont vertes, dont workboard,
  audits, typecheck, lint, tests, couverture, base, smoke navigateur, build et
  budget du bundle.

## Preuves fonctionnelles acquises

Validation utilisateur sur la version en ligne :

- connexion et chargement de la ville : OK ;
- `/bootstrap` : HTTP 200 et en-tête `x-response-bytes` présent ;
- rencontre automatique : une seule requête `dungeon.auto_advance`, HTTP 200 ;
- progression et récompenses cohérentes ;
- onglet masqué pendant 30 secondes : aucune commande ;
- retour sur l'onglet : reprise sans rafale.

Les contrôles locaux précédents ont aussi validé l'absence de rafale, la
cohérence des ressources, les affectations sous le bâtiment, la navigation non
sticky et l'absence de débordement horizontal de la page Héros.

## Point de départ T0

Valeurs relevées par l'utilisateur dans Supabase :

| Jour | Auth | PostgREST | Functions | Total calculé | Remarque |
| --- | ---: | ---: | ---: | ---: | --- |
| 2026-08-19 | 3,802 MB | 42,379 MB | 17,651 MB | 63,832 MB | journée complète avant déploiement |
| 2026-08-20 | 234,566 KB | 2,79 MB | 1,31 MB | environ 4,335 MB | journée partielle et mixte pré/post-déploiement |

Pour le 19 août, la répartition calculée est d'environ 6,0 % Auth, 66,4 %
PostgREST et 27,6 % Functions. Une extrapolation brute de cette journée donne
environ `1,98 GB` sur 31 jours ; ce n'est pas encore la preuve post-déploiement
requise.

Le graphe ne montrait pas de valeur positive identifiable pour le cached
egress. Il est considéré à zéro pour le calcul T0, sans preuve numérique
indépendante. Cette réserve doit être conservée tant qu'une valeur explicite
n'est pas disponible.

Le déploiement a fini le 20 août vers 18 h 08, heure de Paris. La fenêtre
strictement post-déploiement commence donc le 21 août. Les alphatesteurs ont
volontairement réduit leur activité pour protéger le plan gratuit : la période
peut prouver l'absence de fuite ou de consommation au repos, mais pas forcément
une charge normale représentative.

Le modèle détaillé, les enveloppes mesurées et la formule de budget sont dans
[`supabase-egress-budget.md`](supabase-egress-budget.md).

## Relevé à demander le 31 août

Dans le même écran Supabase Usage que pour T0, relever ou capturer :

1. les dates exactes du cycle affiché et la période sélectionnée ;
2. le total egress du cycle ;
3. Auth, PostgREST et Functions ;
4. cached egress, même s'il vaut zéro ou n'est pas affiché ;
5. si possible, les valeurs quotidiennes du 21 au 30 août ;
6. le contexte d'activité : nombre approximatif de testeurs actifs et jours
   réellement joués.

Conserver une capture complète avec les unités visibles. Ne pas modifier la
charge des alphatesteurs avant ce premier relevé.

## Calcul de reprise

Pour une fenêtre post-déploiement de `N` jours :

```text
egress post-déploiement = somme des catégories sur la fenêtre
moyenne quotidienne = egress post-déploiement / N
projection du cycle = moyenne quotidienne × nombre réel de jours du cycle
projection prudente = projection du cycle × 1,10
```

La clôture demande une projection prudente `<= 4,5 GB` et, idéalement, une
marge d'au moins `0,5 GB` sous la limite gratuite de `5 GB`.

Si la période a été presque inactive, ne pas présenter sa projection comme une
charge représentative. Faire ensuite une courte session contrôlée d'activité
normale, relever le nombre de commandes et les octets, puis normaliser par
session ou par utilisateur actif.

## Décision à la reprise

- Projection `<= 4,5 GB` avec activité représentative et ventilation datée :
  compléter les deux critères restants de `CDI-095`, déplacer le ticket en
  `Done`, valider le workboard, puis demander l'autorisation explicite avant
  commit et push.
- Projection `<= 4,5 GB` mais activité trop faible : garder `CDI-095` en
  `Doing` et réaliser la session contrôlée.
- Projection `> 4,5 GB` : garder `CDI-095` en `Doing`, comparer volumes et
  fréquence par route, identifier la régression et créer un ticket correctif
  si nécessaire.

Les deux critères encore ouverts au départ sont :

- fenêtre distante représentative projetée à `<= 4,5 GB` par cycle ;
- ventilation datée PostgREST / Functions / Auth / cached egress.

## Checklist technique de reprise

Depuis PowerShell, à la racine `D:\codex\CDIdle` :

```powershell
git status --short
git rev-parse HEAD
git ls-remote origin refs/heads/main
npm.cmd run board:validate
```

Avant toute modification, préserver le travail UI local déjà présent et sans
rapport avec `CDI-095`. Au moment de cet arrêt, le worktree contient notamment
des modifications Héros/UI, des images non suivies, `tmp/` et le handoff
`2026-08-20-hero-panel-nine-slice-surfaces-handoff.md`. Rien de ce périmètre ne
doit être inclus dans un commit egress.

## Points d'exploitation connus

- Sous Windows, le bundling Docker de `supabase functions deploy` a provoqué un
  crash Bun 1.3.13 avec les CLI testées. Le déploiement `--use-api` a réussi,
  malgré un crash de la CLI après la réponse ; l'état distant a ensuite été
  vérifié indépendamment. Pour un futur déploiement backend, préférer
  `--use-api` et toujours contrôler la version distante après coup.
- L'environnement GitHub `production` ne disposait pas des secrets nécessaires
  au déploiement backend automatisé. Le backend a donc été déployé directement.
  Ce point d'infrastructure reste distinct de la mesure egress.
- Une sauvegarde de schéma pré-déploiement avait été créée dans le répertoire
  temporaire local sous le nom
  `cdidle-production-predeploy-20260820-1a72890.sql`. Un fichier temporaire ne
  doit pas être considéré comme une sauvegarde pérenne.
- Aucun token, secret ou bearer n'est consigné dans ce document.
