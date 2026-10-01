# CDI-035 - Runbook de deploiement et rollback

## Separation des livraisons

Le backend Supabase et le frontend Cloudflare sont deux livraisons
independantes :

- la voie CLI backend prevue par `AGENTS.md` est retenue ; les anciens workflows
  manuels `CDIdle backend deploy` et `CDIdle backend rollback` restent a reparer
  avant reutilisation (decision confirmee le 1er octobre 2026) ;
- `CDIdle frontend alpha deploy` construit et publie uniquement le site Vite ;
- les retours arriere suivent la meme separation ;
- aucune migration n'est annulee destructivement.

Le detail du frontend alpha, de ses variables et de son smoke se trouve dans
[`cloudflare-pages-alpha.md`](cloudflare-pages-alpha.md).

## Backend Supabase

Secrets de l'environnement GitHub concerne :

- `SUPABASE_ACCESS_TOKEN` ;
- `SUPABASE_PROJECT_REF` ;
- `GAME_API_BASE_URL` ;
- `GAME_API_TOKEN`, reserve au compte synthetique de smoke.

Avant une livraison backend, executer les validations, conserver une sauvegarde
chiffree hors Git, puis appliquer uniquement les migrations additives et
deployer `game-api`. Le rollback redeploie une Edge Function precedente ; une
migration de compensation additive est requise si le schema doit evoluer.

## Note historique du 10 septembre 2026

Synthese conservee lors du nettoyage documentaire du 1er octobre 2026.
Le compte rendu supprimé rapportait quatre migrations appliquees, `game-api`
v28 actif et le [frontend publie par le run 34489833401](https://github.com/GunnLady/CDIdle/actions/runs/34489833401)
au commit `24be0dbc20d1615348b667a7cadff1edd40b361c`. Ces preuves historiques
ne sont pas une verification de la production actuelle. Le smoke distant
authentifie et les validations visuelles/fonctionnelles utilisateur y restaient
ouverts ; leur cloture ulterieure n'a pas ete etablie lors de ce nettoyage.

La sauvegarde rapportee se trouve hors depot dans
`D:\codex\CDIdle-backups\2026-09-10_24be0db` : neuf lignes `public.games` et
quatorze versions de migrations, chiffrees AES-256-CBC avec HMAC-SHA256,
cle protegee par DPAPI CurrentUser. Une restauration PostgreSQL isolee etait
consignee. Ce snapshot cible n'est pas une sauvegarde complete ; son acces
depend du profil Windows d'origine. Presence et restauration non reverifiees
le 1er octobre. Apres persistance d'un etat v6, un retour au backend v1 seul
est incompatible : prevoir un correctif compatible ou une restauration
coherente explicitement autorisee.

Defauts encore visibles dans les workflows backend lors de la lecture locale
du 1er octobre, a traiter avant leur reutilisation manuelle : `deploy.yml` et
`rollback.yml` lancent `npm run check` sans
preparer Supabase local et les navigateurs requis ; `deploy.yml` place le dump
avant l'installation explicite de la CLI, sans `--data-only` ni chiffrement
explicite avant archivage. Leur remise en etat reste a faire. Dependances :
secrets de l'environnement, services de test, CLI et commandes de dump
compatibles, chiffrement et compte synthetique. Cloture : execution sur cible
non productive, sauvegarde restaurable, smoke authentifie et etat terminal
verifies. Utiliser la voie CLI prevue par `AGENTS.md` apres autorisation
explicite ; ce nettoyage n'autorise aucun deploiement.

Ces defauts ne concernent pas le workflow automatique `CDIdle quality`.
La [separation qualite/simulations du 5 septembre](../development/ci-quality.md)
reste applicable : calibrations couteuses sur demande, tests avec couverture
une seule fois et controles essentiels conserves. Leur reintroduction dans
la CI courante ne fait pas partie de la remise en etat du deploiement backend.

## Identite du build

`VITE_BUILD_SHA` n'est pas un secret. Le workflow frontend le calcule depuis le
commit reellement checkout. Le client envoie `git-<SHA complet>` dans chaque
commande et affiche `git-<12 caracteres>` dans le footer. Sans injection, la
valeur est `local-dev`.

## Journaux et donnees sensibles

Les sauvegardes restent chiffrees et hors depot. Les logs de livraison ne
doivent contenir ni JWT, cle, email, payload de jeu ou etat canonique ; seuls
les codes techniques, statuts et identifiants de requete non sensibles sont
admis.
