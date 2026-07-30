# CDI-035 - Runbook de deploiement et rollback

## Separation des livraisons

Le backend Supabase et le frontend Cloudflare sont deux livraisons
independantes :

- `CDIdle backend deploy` applique les migrations, deploie `game-api` et lance
  le smoke backend authentifie ;
- `CDIdle frontend alpha deploy` construit et publie uniquement le site Vite ;
- les deux workflows de rollback suivent la meme separation ;
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
